import prisma from "../../utils/prisma";

const getAllAIAgents = async (filter: any) => {
  let whereClause: any = {};

  if (filter?.callType) {
    if (filter.callType !== "outbound" || filter.callType !== "inbound") {
      throw new Error("Call type must be either 'outbound' or 'inbound'");
    }
    whereClause.callType = filter?.callType;
  }

  const result = await prisma.aIAgent.findMany({
    where: {
      ...whereClause
    },
    include: {
      service: true
    },
  });

  const total = await prisma.aIAgent.count({ where: whereClause });

  return {
    meta: {
      total,
    },
    data: result,
  };
};

export const AIAgentService = {
  getAllAIAgents,
};
