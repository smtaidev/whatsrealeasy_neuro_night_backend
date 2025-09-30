import {
  IPaginationOptions,
  paginationHelper,
} from "../../utils/paginationHelpers";
import prisma from "../../utils/prisma";

const getAllAIAgents = async (
  options: IPaginationOptions,
  callType?: string,
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  let whereClause: any = {};

  if (callType) {
    // if (filter.callType !== "outbound" || filter.callType !== "inbound") {
    //   throw new Error("Call type must be either 'outbound' or 'inbound'");
    // }
    whereClause.callType = callType;
  }

  const result = await prisma.aIAgent.findMany({
    where: {
      ...whereClause,
    },
    include: {
      service: true,
    },

    orderBy: { [sortBy]: sortOrder },
    skip: skip,
    take: limit,
  });

  const total = await prisma.aIAgent.count({ where: whereClause });

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: result,
  };
};

export const AIAgentService = {
  getAllAIAgents,
};
