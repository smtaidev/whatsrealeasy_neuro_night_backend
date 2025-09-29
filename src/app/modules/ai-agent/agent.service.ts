import prisma from "../../utils/prisma";

const getAllAIAgents = async (
) => {

  let whereClause: any = {
    callType: 'outbound'
  };

  const result = await prisma.aIAgent.findMany({
    where: whereClause,
    include: {
      service: {
        select: {
          id: true,
          serviceName: true,
          voiceName: true,
          phoneNumber: true,
          requires_verification: true,
          createdAt: true
        }
      }
    }
  });

  const total = await prisma.aIAgent.count({ where: whereClause });

  return {
    meta: {
      total
    },
    data: result,
  };
};

export const AIAgentService = {
    getAllAIAgents,
}