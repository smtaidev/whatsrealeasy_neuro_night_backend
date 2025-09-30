import {
  IPaginationOptions,
  paginationHelper,
} from "../../utils/paginationHelpers";
import prisma from "../../utils/prisma";

const getDashbaordServices = async (
  options: IPaginationOptions,
  filters: any = {}
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  // Extract filters from request
  const timePeriod = filters?.timePeriod as string; // '1month', '6month', '1year'
  const metric = filters?.metric as string; // 'booking', 'conversation'
  const callType = filters?.callType as string; // 'outgoing', 'incoming', or undefined for all

  // Calculate date range based on time period
  const getDateRange = () => {
    const now = new Date();
    switch (timePeriod) {
      case "1month":
        return new Date(now.setMonth(now.getMonth() - 1));
      case "6month":
        return new Date(now.setMonth(now.getMonth() - 6));
      case "1year":
        return new Date(now.setFullYear(now.getFullYear() - 1));
      default:
        return new Date(0); // Beginning of time if no filter
    }
  };

  const startDate = getDateRange();

  // Base where clause for time filtering
  const timeWhereClause = {
    createdAt: {
      gte: startDate,
    },
  };

  // Add callType filter if provided
  const callTypeWhereClause = callType ? { callType } : {};

  const result = await prisma.service.findMany({
    where: {},
    orderBy: { [sortBy]: sortOrder },
    skip: skip,
    take: limit,
  });

  // Get counts in parallel for all services
  const servicesWithCounts = await Promise.all(
    result.map(async (service) => {
      // First, get call logs for this service that have bookings (with time and callType filters)
      const callLogsWithBookings = await prisma.callLog.findMany({
        where: {
          serviceId: service.id,
          bookings: {
            isNot: null,
          },
          ...timeWhereClause, // Apply time filter
          ...callTypeWhereClause, // Apply callType filter
        },
        select: { id: true },
      });

      const callLogIds = callLogsWithBookings?.map((log) => log.id);

      const [conversations, totalBookings, totalCalls, completedCalls] =
        await Promise.all([
          // Conversations (completed + has transcript) with time and callType filters
          prisma.callLog.count({
            where: {
              serviceId: service.id,
              call_status: "completed",
              call_transcript: { not: null },
              ...timeWhereClause, // Apply time filter
              ...callTypeWhereClause, // Apply callType filter
            },
          }),
          // Bookings count using callLogIds with time filter
          prisma.booking.count({
            where: {
              callLogId: { in: callLogIds },
              ...timeWhereClause, // Apply time filter
            },
          }),
          // Total calls with time and callType filters
          prisma.callLog.count({
            where: {
              serviceId: service.id,
              ...timeWhereClause,
              ...callTypeWhereClause, // Apply callType filter
            },
          }),
          // Completed calls with time and callType filters
          prisma.callLog.count({
            where: {
              serviceId: service.id,
              call_status: "completed",
              ...timeWhereClause,
              ...callTypeWhereClause, // Apply callType filter
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
        totalBookings,
        callType: callType || "all", // Include callType in response for clarity
      };
    })
  );

  // Apply sorting based on selected metric (High to Low)
  let sortedData = [...servicesWithCounts];

  if (metric === "booking") {
    // Sort by totalBookings descending (high to low)
    sortedData.sort((a, b) => b.totalBookings - a.totalBookings);
  } else if (metric === "conversation") {
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
        timePeriod: timePeriod || "all",
        metric: metric || "none",
        callType: callType || "all", // Include callType in meta
      },
    },
    data: sortedData, // Return sorted data
  };
};

// const getDashbaordAnalytics = async (
//   options: IPaginationOptions,
//   filters: any = {}
// ) => {
//   const { page, limit, skip, sortBy, sortOrder } =
//     paginationHelper.calculatePagination(options);

//   // Define call status constants
//   const CALL_STATUS = {
//     COMPLETED: "completed",
//     CANCELED: "canceled",
//     NO_ANSWER: "no-answer",
//     BUSY: "busy",
//     FAILED: "failed",
//     IN_PROGRESS: "in-progress",
//     RINGING: "ringing",
//     INITIATED: "initiated",
//   } as const;

//   // Build date filter based on time range
//   let dateFilter: any = {};
//   const now = new Date();

//   switch (filters.timeRange) {
//     case "Previous day":
//       const yesterday = new Date(now);
//       yesterday.setDate(yesterday.getDate() - 1);
//       dateFilter = {
//         createdAt: {
//           gte: new Date(yesterday.setHours(0, 0, 0, 0)),
//           lt: new Date(yesterday.setHours(23, 59, 59, 999)),
//         },
//       };
//       break;
//     case "Previous 7 days":
//       const sevenDaysAgo = new Date(now);
//       sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
//       dateFilter = {
//         createdAt: {
//           gte: sevenDaysAgo,
//         },
//       };
//       break;
//     case "Last 1 month":
//       const oneMonthAgo = new Date(now);
//       oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
//       dateFilter = {
//         createdAt: {
//           gte: oneMonthAgo,
//         },
//       };
//       break;
//     case "Last 6 months":
//       const sixMonthsAgo = new Date(now);
//       sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
//       dateFilter = {
//         createdAt: {
//           gte: sixMonthsAgo,
//         },
//       };
//       break;
//     case "Last 1 year":
//       const oneYearAgo = new Date(now);
//       oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
//       dateFilter = {
//         createdAt: {
//           gte: oneYearAgo,
//         },
//       };
//       break;
//     case "Custom":
//       if (filters.startDate && filters.endDate) {
//         dateFilter = {
//           createdAt: {
//             gte: new Date(filters.startDate),
//             lte: new Date(filters.endDate),
//           },
//         };
//       }
//       break;
//   }

//   // Build where clause for call logs
//   let callLogWhereClause: any = {
//     ...dateFilter,
//   };

//   // Apply additional filters
//   if (filters.call_status) {
//     callLogWhereClause.call_status = filters.call_status;
//   }

//   if (filters.callType) {
//     callLogWhereClause.callType = filters.callType;
//   }

//   if (filters.serviceId) {
//     callLogWhereClause.serviceId = filters.serviceId;
//   }

//   // Build where clause for bookings
//   let bookingWhereClause: any = {
//     ...dateFilter,
//   };

//   if (filters.bookingStatus) {
//     bookingWhereClause.status = filters.bookingStatus;
//   }

//   // Get call analytics
//   const totalCalls = await prisma.callLog.count({
//     where: callLogWhereClause,
//   });

//   const totalSuccessCalls = await prisma.callLog.count({
//     where: {
//       ...callLogWhereClause,
//       call_status: CALL_STATUS.COMPLETED,
//     },
//   });

//   const totalDropCalls = await prisma.callLog.count({
//     where: {
//       ...callLogWhereClause,
//       call_status: {
//         in: [
//           CALL_STATUS.CANCELED,
//           CALL_STATUS.NO_ANSWER,
//           CALL_STATUS.BUSY,
//           CALL_STATUS.FAILED,
//         ],
//       },
//     },
//   });

//   const totalWaitingCalls = await prisma.callLog.count({
//     where: {
//       ...callLogWhereClause,
//       call_status: {
//         in: [
//           CALL_STATUS.IN_PROGRESS,
//           CALL_STATUS.RINGING,
//           CALL_STATUS.INITIATED,
//         ],
//       },
//     },
//   });

//   // Get booking analytics
//   const totalAppointments = await prisma.booking.count({
//     where: bookingWhereClause,
//   });

//   const totalConfirmedMeetings = await prisma.booking.count({
//     where: {
//       ...bookingWhereClause,
//       status: "confirmed",
//     },
//   });

//   const totalUpcomingAppointments = await prisma.booking.count({
//     where: {
//       ...bookingWhereClause,
//       startTime: {
//         gt: new Date(),
//       },
//       status: {
//         in: ["confirmed", "cancelled", "tentative"],
//       },
//     },
//   });

//   // CORRECTED: Calculate average appointment duration
//   const appointmentsWithDuration = await prisma.booking.findMany({
//     where: {
//       ...bookingWhereClause,
//       AND: [
//         {
//           startTime: {
//             not: { equals: null },
//           },
//         },
//         {
//           endTime: {
//             not: { equals: null },
//           },
//         },
//       ],
//     },
//     select: {
//       startTime: true,
//       endTime: true,
//     },
//   });

//   const totalAppointmentDuration = appointmentsWithDuration.reduce(
//     (total, appointment) => {
//       if (appointment.startTime && appointment.endTime) {
//         const duration =
//           new Date(appointment.endTime).getTime() -
//           new Date(appointment.startTime).getTime();
//         return total + duration;
//       }
//       return total;
//     },
//     0
//   );

//   const avgAppointmentTime =
//     appointmentsWithDuration.length > 0
//       ? totalAppointmentDuration / appointmentsWithDuration.length
//       : 0;

//   // Get paginated call logs for the data section
//   const callLogs = await prisma.callLog.findMany({
//     where: callLogWhereClause,
//     include: {
//       service: {
//         select: {
//           serviceName: true,
//           phoneNumber: true,
//         },
//       },
//       bookings: {
//         select: {
//           id: true,
//           status: true,
//           startTime: true,
//           endTime: true,
//         },
//       },
//     },
//     skip,
//     take: limit,
//     orderBy: {
//       [sortBy]: sortOrder,
//     },
//   });

//   return {
//     meta: {
//       page: Number(page),
//       limit: Number(limit),
//       total: totalCalls,
//       totalPages: Math.ceil(totalCalls / Number(limit)),
//     },
//     analytics: {
//       calls: {
//         total: totalCalls,
//         success: totalSuccessCalls,
//         drop: totalDropCalls,
//         waiting: totalWaitingCalls,
//         successRate:
//           totalCalls > 0 ? (totalSuccessCalls / totalCalls) * 100 : 0,
//       },
//       appointments: {
//         total: totalAppointments,
//         confirmed: totalConfirmedMeetings,
//         upcoming: totalUpcomingAppointments,
//         confirmationRate:
//           totalAppointments > 0
//             ? (totalConfirmedMeetings / totalAppointments) * 100
//             : 0,
//       },
//       averageAppointmentTime: avgAppointmentTime, // in milliseconds
//     },
//     data: callLogs,
//   };
// };

// const getDashboardAnalytics = async (
//   options: IPaginationOptions,
//   filters: any = {}
// ) => {

//   // Define call status constants
//   const CALL_STATUS = {
//     COMPLETED: "completed",
//     CANCELED: "canceled",
//     NO_ANSWER: "no-answer",
//     BUSY: "busy",
//     FAILED: "failed",
//     IN_PROGRESS: "in-progress",
//     RINGING: "ringing",
//     INITIATED: "initiated",
//   } as const;

//   // Build date filter based on time range
//   let dateFilter: any = {};
//   const now = new Date();
//   const currentYear = now.getFullYear();

//   switch (filters.timeRange) {
//     case "PrevDay":
//       const yesterday = new Date(now);
//       yesterday.setDate(yesterday.getDate() - 1);
//       dateFilter = {
//         createdAt: {
//           gte: new Date(yesterday.setHours(0, 0, 0, 0)),
//           lt: new Date(yesterday.setHours(23, 59, 59, 999)),
//         },
//       };
//       break;
//     case "Prev7Days":
//       const sevenDaysAgo = new Date(now);
//       sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
//       dateFilter = {
//         createdAt: {
//           gte: sevenDaysAgo,
//         },
//       };
//       break;
//     case "Last1Month":
//       const oneMonthAgo = new Date(now);
//       oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
//       dateFilter = {
//         createdAt: {
//           gte: oneMonthAgo,
//         },
//       };
//       break;
//     case "Last6Months":
//       const sixMonthsAgo = new Date(now);
//       sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
//       dateFilter = {
//         createdAt: {
//           gte: sixMonthsAgo,
//         },
//       };
//       break;
//     case "Last1Year":
//       const oneYearAgo = new Date(now);
//       oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
//       dateFilter = {
//         createdAt: {
//           gte: oneYearAgo,
//         },
//       };
//       break;
//     case "Custom":
//       if (filters.startDate && filters.endDate) {
//         dateFilter = {
//           createdAt: {
//             gte: new Date(filters.startDate),
//             lte: new Date(filters.endDate),
//           },
//         };
//       }
//       break;
//   }

//   // Build where clauses
//   let callLogWhereClause: any = { ...dateFilter };
//   let bookingWhereClause: any = { ...dateFilter };

//   // Execute all queries in parallel for better performance
//   const [
//     totalCalls,
//     totalSuccessCalls,
//     totalDropCalls,
//     totalWaitingCalls,
//     totalAppointments,
//     totalConfirmedMeetings,
//     totalUpcomingAppointments,
//     allBookingsForTrends
//   ] = await Promise.all([
//     // Call analytics
//     prisma.callLog.count({ where: callLogWhereClause }),
//     prisma.callLog.count({
//       where: { ...callLogWhereClause, call_status: CALL_STATUS.COMPLETED },
//     }),
//     prisma.callLog.count({
//       where: {
//         ...callLogWhereClause,
//         call_status: {
//           in: [CALL_STATUS.CANCELED, CALL_STATUS.NO_ANSWER, CALL_STATUS.BUSY, CALL_STATUS.FAILED],
//         },
//       },
//     }),
//     prisma.callLog.count({
//       where: {
//         ...callLogWhereClause,
//         call_status: {
//           in: [CALL_STATUS.IN_PROGRESS, CALL_STATUS.RINGING, CALL_STATUS.INITIATED],
//         },
//       },
//     }),

//     // Booking analytics
//     prisma.booking.count({ where: bookingWhereClause }),
//     prisma.booking.count({
//       where: { ...bookingWhereClause, status: "confirmed" },
//     }),
//     prisma.booking.count({
//       where: {
//         ...bookingWhereClause,
//         startTime: { gt: new Date() },
//         status: { in: ["confirmed", "cancelled", "tentative"] },
//       },
//     }),

//     // Get all bookings for trends (current year)
//     prisma.booking.findMany({
//       where: {
//         createdAt: {
//           gte: new Date(currentYear, 0, 1),
//           lte: new Date(currentYear, 11, 31, 23, 59, 59, 999),
//         },
//       },
//       include: {
//         callLog: {
//           include: {
//             service: {
//               select: {
//                 id: true,
//                 serviceName: true,
//               },
//             },
//           },
//         },
//       },
//     })
//   ]);

//   // Calculate average appointment duration
//   const appointmentsWithDuration = await prisma.booking.findMany({
//     where: {
//       ...bookingWhereClause,
//       startTime: { not: null },
//       endTime: { not: null },
//     },
//     select: {
//       startTime: true,
//       endTime: true,
//     },
//   });

//   const totalAppointmentDuration = appointmentsWithDuration.reduce(
//     (total, appointment) => {
//       if (appointment.startTime && appointment.endTime) {
//         const duration = new Date(appointment.endTime).getTime() - new Date(appointment.startTime).getTime();
//         return total + duration;
//       }
//       return total;
//     },
//     0
//   );

//   const avgAppointmentTime = appointmentsWithDuration.length > 0
//     ? totalAppointmentDuration / appointmentsWithDuration.length
//     : 0;

//   // Process monthly trends and top services
//   const monthlyData = Array.from({ length: 12 }, (_, monthIndex) => {
//     const monthName = new Date(currentYear, monthIndex).toLocaleString('en-US', { month: 'short' });

//     // Filter bookings for this month
//     const monthBookings = allBookingsForTrends.filter(booking => {
//       return new Date(booking.createdAt).getMonth() === monthIndex;
//     });

//     // Calculate service counts for this month
//     const serviceCounts: { [key: string]: { serviceName: string; count: number } } = {};

//     monthBookings.forEach(booking => {
//       if (booking.callLog?.service) {
//         const serviceId = booking.callLog.service.id;
//         const serviceName = booking.callLog.service.serviceName;

//         if (!serviceCounts[serviceId]) {
//           serviceCounts[serviceId] = { serviceName, count: 0 };
//         }
//         serviceCounts[serviceId].count++;
//       }
//     });

//     // Get top 5 services (only service names)
//     const topServiceNames = Object.values(serviceCounts)
//       .sort((a, b) => b.count - a.count)
//       .slice(0, 5)
//       .map(service => service.serviceName);

//     return {
//       month: monthName,
//       bookings: monthBookings.length,
//       topServices: topServiceNames, // Only service names array
//     };
//   });

//   // Calculate Y-axis range for chart
//   const allBookingCounts = monthlyData.map(month => month.bookings);
//   const maxBookings = Math.max(...allBookingCounts);
//   const minBookings = Math.min(...allBookingCounts);
//   const yAxisPadding = Math.max(1, Math.ceil(maxBookings * 0.1));
//   const yAxisMax = maxBookings + yAxisPadding;
//   const yAxisMin = Math.max(0, minBookings - yAxisPadding);

//   return {
//     analytics: {
//       calls: {
//         total: totalCalls,
//         success: totalSuccessCalls,
//         drop: totalDropCalls,
//         waiting: totalWaitingCalls,
//         successRate: totalCalls > 0 ? (totalSuccessCalls / totalCalls) * 100 : 0,
//       },
//       appointments: {
//         total: totalAppointments,
//         confirmed: totalConfirmedMeetings,
//         upcoming: totalUpcomingAppointments,
//         confirmationRate: totalAppointments > 0 ? (totalConfirmedMeetings / totalAppointments) * 100 : 0,
//       },
//       averageAppointmentTime: avgAppointmentTime,
//     },
//     // Combined monthly data with top services
//     monthlyTrends: monthlyData,
//     chartConfig: {
//       yAxis: {
//         min: yAxisMin,
//         max: yAxisMax,
//         stepSize: Math.ceil((yAxisMax - yAxisMin) / 5),
//       },
//     }
//   };
// };

const getDashboardAnalytics = async (
  options: IPaginationOptions,
  filters: any = {}
) => {
  // Define call status constants
  const CALL_STATUS = {
    COMPLETED: "completed",
    CANCELED: "canceled",
    NO_ANSWER: "no-answer",
    BUSY: "busy",
    FAILED: "failed",
    IN_PROGRESS: "in-progress",
    RINGING: "ringing",
    INITIATED: "initiated",
  } as const;

  // Extract callType filter
  const callType = filters?.callType as string; // 'outgoing', 'incoming', or undefined for all

  // Build date filter based on time range
  let dateFilter: any = {};
  const now = new Date();
  const currentYear = now.getFullYear();

  switch (filters.timeRange) {
    case "PrevDay":
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      dateFilter = {
        createdAt: {
          gte: new Date(yesterday.setHours(0, 0, 0, 0)),
          lt: new Date(yesterday.setHours(23, 59, 59, 999)),
        },
      };
      break;
    case "Prev7Days":
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      dateFilter = {
        createdAt: {
          gte: sevenDaysAgo,
        },
      };
      break;
    case "Last1Month":
      const oneMonthAgo = new Date(now);
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      dateFilter = {
        createdAt: {
          gte: oneMonthAgo,
        },
      };
      break;
    case "Last6Months":
      const sixMonthsAgo = new Date(now);
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      dateFilter = {
        createdAt: {
          gte: sixMonthsAgo,
        },
      };
      break;
    case "Last1Year":
      const oneYearAgo = new Date(now);
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      dateFilter = {
        createdAt: {
          gte: oneYearAgo,
        },
      };
      break;
    case "Custom":
      if (filters.startDate && filters.endDate) {
        dateFilter = {
          createdAt: {
            gte: new Date(filters.startDate),
            lte: new Date(filters.endDate),
          },
        };
      }
      break;
  }

  // Add callType filter if provided
  const callTypeWhereClause = callType ? { callType } : {};

  // Build where clauses with callType filter
  let callLogWhereClause: any = {
    ...dateFilter,
    ...callTypeWhereClause,
  };

  let bookingWhereClause: any = { ...dateFilter };

  // For bookings, we need to filter by callType through the callLog relation
  let bookingCallLogWhereClause: any = {
    ...dateFilter,
    ...callTypeWhereClause,
  };

  // Execute all queries in parallel for better performance
  const [
    totalCalls,
    totalSuccessCalls,
    totalDropCalls,
    totalWaitingCalls,
    totalAppointments,
    totalConfirmedMeetings,
    totalUpcomingAppointments,
    allBookingsForTrends,
  ] = await Promise.all([
    // Call analytics
    prisma.callLog.count({ where: callLogWhereClause }),
    prisma.callLog.count({
      where: {
        ...callLogWhereClause,
        call_status: CALL_STATUS.COMPLETED,
      },
    }),
    prisma.callLog.count({
      where: {
        ...callLogWhereClause,
        call_status: {
          in: [
            CALL_STATUS.CANCELED,
            CALL_STATUS.NO_ANSWER,
            CALL_STATUS.BUSY,
            CALL_STATUS.FAILED,
          ],
        },
      },
    }),
    prisma.callLog.count({
      where: {
        ...callLogWhereClause,
        call_status: {
          in: [
            CALL_STATUS.IN_PROGRESS,
            CALL_STATUS.RINGING,
            CALL_STATUS.INITIATED,
          ],
        },
      },
    }),

    // Booking analytics - filter by callType through callLog relation
    prisma.booking.count({
      where: {
        ...bookingWhereClause,
        callLog: bookingCallLogWhereClause
          ? {
              ...bookingCallLogWhereClause,
            }
          : undefined,
      },
    }),
    prisma.booking.count({
      where: {
        ...bookingWhereClause,
        status: "confirmed",
        callLog: bookingCallLogWhereClause
          ? {
              ...bookingCallLogWhereClause,
            }
          : undefined,
      },
    }),
    prisma.booking.count({
      where: {
        ...bookingWhereClause,
        startTime: { gt: new Date() },
        status: { in: ["confirmed", "cancelled", "tentative"] },
        callLog: bookingCallLogWhereClause
          ? {
              ...bookingCallLogWhereClause,
            }
          : undefined,
      },
    }),

    // Get all bookings for trends (current year) with callType filter
    prisma.booking.findMany({
      where: {
        createdAt: {
          gte: new Date(currentYear, 0, 1),
          lte: new Date(currentYear, 11, 31, 23, 59, 59, 999),
        },
        ...(callType && {
          callLog: bookingCallLogWhereClause,
        }),
      },
      include: {
        callLog: {
          include: {
            service: {
              select: {
                id: true,
                serviceName: true,
              },
            },
          },
        },
      },
    }),
  ]);

  // Calculate average appointment duration with callType filter
  const appointmentsWithDuration = await prisma.booking.findMany({
    where: {
      ...bookingWhereClause,
      startTime: { not: null },
      endTime: { not: null },
      ...(callType && {
        callLog: bookingCallLogWhereClause,
      }),
    },
    select: {
      startTime: true,
      endTime: true,
    },
  });

  // const totalAppointmentDuration = appointmentsWithDuration.reduce(
  //   (total, appointment) => {
  //     if (appointment.startTime && appointment.endTime) {
  //       const duration = new Date(appointment.endTime).getTime() - new Date(appointment.startTime).getTime();
  //       return total + duration;
  //     }
  //     return total;
  //   },
  //   0
  // );

  // const avgAppointmentTime = appointmentsWithDuration.length > 0
  //   ? totalAppointmentDuration / appointmentsWithDuration.length
  //   : 0;
  const totalAppointmentDuration = appointmentsWithDuration.reduce(
    (total, appointment) => {
      if (appointment.startTime && appointment.endTime) {
        const duration =
          new Date(appointment.endTime).getTime() -
          new Date(appointment.startTime).getTime();
        return total + duration;
      }
      return total;
    },
    0
  );
  // console.log("totalAppointmentDuration:", totalAppointmentDuration);
  // console.log(
  //   "appointmentsWithDuration.length:",
  //   appointmentsWithDuration.length
  // );
  const avgAppointmentTime =
    appointmentsWithDuration.length > 0
      ? totalAppointmentDuration / appointmentsWithDuration.length
      : 0;

  // Convert to hours and minutes properly
  const avgDurationInMinutes = Math.floor(avgAppointmentTime / (1000 * 60));
  // console.log("avgDurationInMinutes:", avgDurationInMinutes);
  // const hours = Math.floor(avgDurationInMinutes / 60);
  // const minutes = avgDurationInMinutes % 60;

  // const avgAppointmentTimeFormatted = `${hours}h ${minutes}m`;

  // Process monthly trends and top services
  const monthlyData = Array.from({ length: 12 }, (_, monthIndex) => {
    const monthName = new Date(currentYear, monthIndex).toLocaleString(
      "en-US",
      { month: "short" }
    );

    // Filter bookings for this month
    const monthBookings = allBookingsForTrends.filter((booking) => {
      return new Date(booking.createdAt).getMonth() === monthIndex;
    });

    // Calculate service counts for this month
    const serviceCounts: {
      [key: string]: { serviceName: string; count: number };
    } = {};

    monthBookings.forEach((booking) => {
      if (booking.callLog?.service) {
        const serviceId = booking.callLog.service.id;
        const serviceName = booking.callLog.service.serviceName;

        if (!serviceCounts[serviceId]) {
          serviceCounts[serviceId] = { serviceName, count: 0 };
        }
        serviceCounts[serviceId].count++;
      }
    });

    // Get top 5 services (only service names)
    const topServiceNames = Object.values(serviceCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((service) => service.serviceName);

    return {
      month: monthName,
      bookings: monthBookings.length,
      topServices: topServiceNames, // Only service names array
    };
  });

  // Calculate Y-axis range for chart
  const allBookingCounts = monthlyData.map((month) => month.bookings);
  const maxBookings = Math.max(...allBookingCounts);
  const minBookings = Math.min(...allBookingCounts);
  const yAxisPadding = Math.max(1, Math.ceil(maxBookings * 0.1));
  const yAxisMax = maxBookings + yAxisPadding;
  const yAxisMin = Math.max(0, minBookings - yAxisPadding);

  return {
    analytics: {
      calls: {
        total: totalCalls,
        success: totalSuccessCalls,
        drop: totalDropCalls,
        waiting: totalWaitingCalls,
        successRate:
          totalCalls > 0 ? (totalSuccessCalls / totalCalls) * 100 : 0,
        callType: callType || "all", // Include callType in response
      },
      appointments: {
        total: totalAppointments,
        confirmed: totalConfirmedMeetings,
        upcoming: totalUpcomingAppointments,
        confirmationRate:
          totalAppointments > 0
            ? (totalConfirmedMeetings / totalAppointments) * 100
            : 0,
      },
      averageAppointmentTime: avgDurationInMinutes,
    },
    // Combined monthly data with top services
    monthlyTrends: monthlyData,
    chartConfig: {
      yAxis: {
        min: yAxisMin,
        max: yAxisMax,
        stepSize: Math.ceil((yAxisMax - yAxisMin) / 5),
      },
    },
    filters: {
      timeRange: filters.timeRange || "all",
      callType: callType || "all",
    },
  };
};
export const AnalyticsService = {
  getDashboardAnalytics,
  getDashbaordServices,
};
