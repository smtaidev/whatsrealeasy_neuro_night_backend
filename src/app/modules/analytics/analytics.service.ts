import {
  IPaginationOptions,
  paginationHelper,
} from "../../utils/paginationHelpers";
import prisma from "../../utils/prisma";

const getDashbaordAnalytics = async (
  options: IPaginationOptions,
  filters: any = {}
) => {
  // const call_Status = filters?.call_status as string;
  // const callType = (filters?.callType as string) || "outgoing";

  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  let whereClause: any = {
    // callType: callType,
  };

  // Add await here and use whereClause
  const result = await prisma.service.findMany({
    where: whereClause,
    // select: {
    //   id: true,
    //   call_sid: true,
    //   agent_id: true,
    //   call_recording: true,
    //   // call_started_at: true,
    //   // call_completed_at: true,
    //   // call_duration: true,
    //   // recording_duration: true,
    //   // conversation_id: true,
    //   from_number: true,
    //   to_number: true,
    //   callType: true,
    //   call_status: true,
    //   call_time: true,
    //   call_transcript: true,

    //   name: true,
    //   contact_number: true,
    //   company: true,
    //   area: true,
    //   description: true,

    //   createdAt: true,
    //   updatedAt: true,
    //   service: {
    //     select: {
    //       serviceName: true,
    //       // voiceName: true,
    //     },
    //   },
    //   bookings: {
    //     select: {
    //       title: true,
    //       startTime: true,
    //       endTime: true,
    //       googleEventId: true,
    //       meetLink: true,
    //       calendarLink: true,
    //     },
    //   },
    // },
    orderBy: {
      [sortBy]: sortOrder,
    },
    skip: skip,
    take: limit,
  });

  const total = await prisma.service.count({ where: whereClause });

  return {
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
    data: result,
  };
};
// const getDashbaordServices = async (
//   options: IPaginationOptions,
//   filters: any = {}
// ) => {
//   const { page, limit, skip, sortBy, sortOrder } =
//     paginationHelper.calculatePagination(options);

//   const result = await prisma.service.findMany({
//     where: {},
//     orderBy: { [sortBy]: sortOrder },
//     skip: skip,
//     take: limit,
//   });

//   // Get counts in parallel for all services
//   const servicesWithCounts = await Promise.all(
//     result.map(async (service) => {
//       console.log("Service ID:", service.id);
      
//       // First, get call logs for this service that have bookings
//       const callLogsWithBookings = await prisma.callLog.findMany({
//         where: {
//           serviceId: service.id,
//           bookings: {
//             isNot: null
//           }
//         },
//         select: { id: true  }
//       });

//       console.log("Call Logs with Bookings:", callLogsWithBookings)
      
//       const callLogIds = callLogsWithBookings.map(log => log.id);

//       const [ conversations, totalBookings] =
//         await Promise.all([
//           prisma.callLog.count({
//             where: {
//               serviceId: service.id,
//               call_status: "completed",
//               call_transcript: { not: null },
//             },
//           }),
//           // Bookings count using callLogIds
//           prisma.booking.count({
//             where: {
//               callLogId: { in: callLogIds }
//             },
//           }),
         
//         ]);

//       return {
//         serviceName: service.serviceName,
//         voiceName: service.voiceName,
//         phoneNumber: service.phoneNumber,
//         // totalCalls,
//         // completedCalls,
//         conversations,
//         totalBookings
//       };
//     })
//   );

//   const total = await prisma.service.count();

//   return {
//     meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
//     data: servicesWithCounts,
//   };
// };

const getDashbaordServices = async (
  options: IPaginationOptions,
  filters: any = {}
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  // Extract filters from request
  const timePeriod = filters?.timePeriod as string; // '1month', '6month', '1year'
  const metric = filters?.metric as string; // 'booking', 'conversation'

  // Calculate date range based on time period
  const getDateRange = () => {
    const now = new Date();
    switch (timePeriod) {
      case '1month':
        return new Date(now.setMonth(now.getMonth() - 1));
      case '6month':
        return new Date(now.setMonth(now.getMonth() - 6));
      case '1year':
        return new Date(now.setFullYear(now.getFullYear() - 1));
      default:
        return new Date(0); // Beginning of time if no filter
    }
  };

  const startDate = getDateRange();

  // Base where clause for time filtering
  const timeWhereClause = {
    createdAt: {
      gte: startDate
    }
  };

  const result = await prisma.service.findMany({
    where: {},
    orderBy: { [sortBy]: sortOrder },
    skip: skip,
    take: limit,
  });

  // Get counts in parallel for all services
  const servicesWithCounts = await Promise.all(
    result.map(async (service) => {
      // First, get call logs for this service that have bookings (with time filter)
      const callLogsWithBookings = await prisma.callLog.findMany({
        where: {
          serviceId: service.id,
          bookings: {
            isNot: null
          },
          ...timeWhereClause // Apply time filter
        },
        select: { id: true }
      });

      // console.log("Call Logs with Bookings:", callLogsWithBookings);
      
      const callLogIds = callLogsWithBookings.map(log => log.id);

      const [conversations, totalBookings, totalCalls, completedCalls] = await Promise.all([
        // Conversations (completed + has transcript) with time filter
        prisma.callLog.count({
          where: {
            serviceId: service.id,
            call_status: "completed",
            call_transcript: { not: null },
            ...timeWhereClause // Apply time filter
          },
        }),
        // Bookings count using callLogIds with time filter
        prisma.booking.count({
          where: {
            callLogId: { in: callLogIds },
            ...timeWhereClause // Apply time filter
          },
        }),
        // Total calls with time filter
        prisma.callLog.count({ 
          where: { 
            serviceId: service.id,
            ...timeWhereClause 
          } 
        }),
        // Completed calls with time filter
        prisma.callLog.count({
          where: { 
            serviceId: service.id, 
            call_status: "completed",
            ...timeWhereClause 
          },
        }),
      ]);

      return {
        serviceName: service.serviceName,
        voiceName: service.voiceName,
        phoneNumber: service.phoneNumber,
        totalCalls,
        completedCalls,
        conversations,
        totalBookings
      };
    })
  );

  // Apply sorting based on selected metric (High to Low)
  let sortedData = [...servicesWithCounts];
  
  if (metric === 'booking') {
    // Sort by totalBookings descending (high to low)
    sortedData.sort((a, b) => b.totalBookings - a.totalBookings);
  } else if (metric === 'conversation') {
    // Sort by conversations descending (high to low)
    sortedData.sort((a, b) => b.conversations - a.conversations);
  }

  const total = await prisma.service.count();

  return {
    meta: { 
      page, 
      limit, 
      total, 
      totalPages: Math.ceil(total / limit),
      filters: {
        timePeriod: timePeriod || 'all',
        metric: metric || 'none'
      }
    },
    data: sortedData, // Return sorted data
  };
};
export const AnalyticsService = {
  getDashbaordAnalytics,
  getDashbaordServices,
};
