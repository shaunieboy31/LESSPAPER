const { PrismaClient } = require("@prisma/client");
const { formatToPHTime } = require("../../../middlewares/phtimezone");

const prisma = new PrismaClient();

async function revertDocument(docId, data, remarks) {
  try {
    const { docuId, ...otherFields } = data;

    const revertedDocument = await prisma.documents.update({
      where: {
        id: docId,
      },
      data: {
        ...otherFields,
        remarks,
        lastUpdateDateTime: formatToPHTime(new Date()),
      },
    });

    const { id, ...otherDetails } = revertedDocument;

    await prisma.doclogs.create({
      data: {
        ...otherDetails,
        docuId: id,
      },
    });

    return revertedDocument;
  } catch (error) {
    console.error("DAO: Error reverting document", error);
    throw new Error(error);
  }
}

async function transmitDocs(documents, updateFields) {
  try {
    const ids = documents.map((data) => data.id);
    const [annotation, ...otherDetails] = updateFields;

    const transmittedDocuments = await prisma.$transaction(async (prisma) => {
      const transmittedDocs = await prisma.documents.updateMany({
        where: {
          id: {
            in: ids,
          },
        },
        data: {
          ...otherDetails,
          status: 1,
        },
      });

      await Promise.all(
        ids.map(async (id) => {
          const document = await prisma.documents.findUnique({
            where: { id },
          });

          const { id: docId, ...otherFields } = document;

          await prisma.doclogs.create({
            data: {
              ...otherFields,
              docuId: docId,
            },
          });
        }),
      );

      return transmittedDocs;
    });

    return transmittedDocuments;
  } catch (error) {
    console.error(`DAO: Error transmitting documents: ${error.message}`);
    throw error;
  }
}

module.exports = {
  revertDocument,
  transmitDocs,
};
