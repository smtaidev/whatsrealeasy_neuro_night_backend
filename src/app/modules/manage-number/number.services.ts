// src/services/number.service.ts
import status from "http-status";
import XLSX from 'xlsx';
import fs from 'fs';
import prisma from "../../utils/prisma";
import ApiError from "../../errors/AppError";
import { PhoneNumberStatus, Role, User } from "@prisma/client";
import QueryBuilder from "../../builder/QueryBuilder";

const processExcelFile = async (filePath: string) => {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    const data = XLSX.utils.sheet_to_json(worksheet, {
      raw: false,
      defval: ""
    });
    
    const phoneNumbers = extractPhoneNumbers(data);
    
    if (phoneNumbers.length === 0) {
      throw new ApiError(status.BAD_REQUEST, 'No valid phone numbers found in the Excel file');
    }
    
    return phoneNumbers;
  } catch (error) {
    throw new ApiError(status.INTERNAL_SERVER_ERROR, 'Failed to process Excel file');
  } finally {
    // Clean up uploaded file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
};

const extractPhoneNumbers = (data: any[]) => {
  const phoneNumbers: string[] = [];
  
  data.forEach((row) => {
    // Check all values in the row for phone numbers
    for (const key in row) {
      const value = String(row[key]);
      if (isValidPhoneNumber(value)) {
        const normalizedPhone = normalizePhoneNumber(value);
        phoneNumbers.push(normalizedPhone);
        break; // Only take one phone number per row
      }
    }
  });
  
  return phoneNumbers;
};

const isValidPhoneNumber = (phone: string): boolean => {
  if (!phone || typeof phone !== 'string') return false;
  
  const cleaned = phone.replace(/[^\d+]/g, '');
  const digitCount = cleaned.replace(/\D/g, '').length;
  return digitCount >= 8;
};

const normalizePhoneNumber = (phone: string): string => {
  if (!phone || typeof phone !== 'string') return '';
  
  let normalized = phone.replace(/\.0$/, '');
  normalized = normalized.replace(/[^\d+]/g, '');
  
  // Handle scientific notation
  if (normalized.includes('e') || normalized.includes('E')) {
    try {
      const num = parseFloat(phone);
      if (!isNaN(num)) {
        normalized = num.toFixed(0);
      }
    } catch (e) {
      console.warn('Could not convert scientific notation:', phone);
    }
  }
  
  return normalized;
};

const createNumberListIntoDB = async (user: User, payload: any, file: Express.Multer.File) => {
  const { name, description } = payload;
  
  // Process the Excel file
  const phoneNumbers = await processExcelFile(file.path);
  
  // Create the number list with all phone numbers
  const numberList = await prisma.numberList.create({
    data: {
      name: name || file.originalname,
      description,
      totalNumbers: phoneNumbers.length,
      uploadedBy: user.id,
      phoneNumbers: {
        create: phoneNumbers.map(phoneNumber => ({
          phoneNumber,
          status: PhoneNumberStatus.PENDING,
        })),
      },
    },
    include: {
      phoneNumbers: true,
    },
  });
  
  return numberList;
};

const getAllNumberListsFromDB = async (query: Record<string, unknown>, user: User) => {
  let whereCondition: any = {};
  
  // Regular users can only see their own lists
  if (user.role === Role.USER) {
    whereCondition.uploadedBy = user.id;
  }
  
  const numberListQuery = new QueryBuilder(prisma.numberList, query)
    .search(["name", "description"])
    .filter()
    .select([
      "id",
      "name",
      "description",
      "totalNumbers",
      "uploadedAt",
      "uploadedBy",
    ])
    .paginate()
    .sort();

  const [result, meta] = await Promise.all([
    numberListQuery.execute(),
    numberListQuery.countTotal(),
  ]);

  if (!result.length) {
    throw new ApiError(status.NOT_FOUND, "No number lists found!");
  }

  return {
    meta,
    data: result,
  };
};

const getSingleNumberListFromDB = async (listId: string, user: User) => {
  let whereCondition: any = { id: listId };
  
  // Regular users can only see their own lists
  if (user.role === Role.USER) {
    whereCondition.uploadedBy = user.id;
  }
  
  const numberList = await prisma.numberList.findFirst({
    where: whereCondition,
    include: {
      uploadedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        }
      },
      phoneNumbers: {
        select: {
          id: true,
          phoneNumber: true,
          status: true,
          callAttempts: true,
          lastCalledAt: true,
        }
      }
    }
  });

  if (!numberList) {
    throw new ApiError(status.NOT_FOUND, "Number list not found!");
  }

  return numberList;
};

const deleteNumberListFromDB = async (listId: string, user: User) => {
  let whereCondition: any = { id: listId };
  
  // Regular users can only delete their own lists
  if (user.role === Role.USER) {
    whereCondition.uploadedBy = user.id;
  }
  
  const numberList = await prisma.numberList.findFirst({
    where: whereCondition,
  });

  if (!numberList) {
    throw new ApiError(status.NOT_FOUND, "Number list not found!");
  }

  await prisma.numberList.delete({
    where: { id: listId },
  });

  return null;
};

export const NumberService = {
  createNumberListIntoDB,
  getAllNumberListsFromDB,
  getSingleNumberListFromDB,
  deleteNumberListFromDB,
};