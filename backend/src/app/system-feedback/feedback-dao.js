const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function submitFeedback(data) {
  try {
    const { answers, comments, designation, divisionId, systemId, name } = data;

    const results = await prisma.$transaction(async (trans) => {
      const feedbackData = await prisma.feedbacks.create({
        data: {
          name,
          designation,
          divisionId,
          systemId,
          comments,
        },
      });

      await prisma.feedbackanswers.createMany({
        data: answers.map((answer) => ({
          ...answer,
          feedbackId: feedbackData.id,
        })),
      });

      return feedbackData;
    });

    return results;
  } catch (error) {
    throw error;
  }
}

async function getAllFeedbacks() {
  try {
    const allFeedbacks = await prisma.feedbacks.findMany({
      include: {
        division: true,
        system: true,
      },
    });

    return allFeedbacks;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  submitFeedback,
  getAllFeedbacks,
};
