const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const fs = require("fs");
const path = require("path");
const { formatToPHTime } = require("../../../middlewares/phtimezone");

const SDSSecIds = [4];
const ASDSSecIds = [7];

async function addDocument(data) {
  try {
    const { annotation, ...otherData } = data;

    const newDocument = await prisma.documents.create({
      data: { ...otherData, createdAtDateTime: formatToPHTime(new Date()) },
    });

    const { id, ...otherDetails } = newDocument;

    if (annotation?.annotation) {
      await prisma.annotations.create({
        data: {
          ...annotation,
          docuId: id,
          createdAt: formatToPHTime(new Date()),
        },
      });
    }

    await prisma.doclogs.create({
      data: {
        ...otherDetails,
        docuId: id,
      },
    });

    return newDocument;
  } catch (error) {
    console.error("DAO: Error creating Document", error);
    throw new Error(error);
  }
}

async function updateDocument(docId, data) {
  try {
    const { annotation, ...otherData } = data;

    const updatedDocument = await prisma.documents.update({
      where: {
        id: docId,
      },
      data: {
        ...otherData,
        lastUpdateDateTime: formatToPHTime(new Date()),
      },
    });

    const { id, ...otherDetails } = updatedDocument;

    if (annotation?.annotation) {
      await prisma.annotations.create({
        data: {
          ...annotation,
          docuId: id,
          createdAt: formatToPHTime(new Date()),
        },
      });
    }

    await prisma.doclogs.create({
      data: {
        ...otherDetails,
        docuId: id,
      },
    });

    return updatedDocument;
  } catch (error) {
    console.error("DAO: Error updating Document", error);
    throw new Error(error);
  }
}

async function revertDocument(docId, data, remarks) {
  try {
    const revertedDocument = await prisma.documents.update({
      where: {
        id: docId,
      },
      data,
    });

    const { id, ...otherDetails } = revertedDocument;

    await prisma.doclogs.create({
      data: {
        ...otherDetails,
        docuId: id,
        lastUpdateDateTime: formatToPHTime(new Date()),
        remarks,
      },
    });

    return revertedDocument;
  } catch (error) {
    console.error("DAO: Error reverted Document", error);
    throw new Error(error);
  }
}

async function deleteDocuments(documents) {
  try {
    const deletedDocuments = await prisma.$transaction(async (prisma) => {
      const deletedDocs = await Promise.all(
        documents.map(async (doc) => {
          const parsedFiles = doc.files || [];

          // Delete the existing files in parsedFiles
          parsedFiles.forEach((file) => {
            if (file) {
              const filePath = path.join(__dirname, `../../uploads/${file}`); // Ensure correct path
              try {
                fs.unlinkSync(filePath);
              } catch (err) {
                if (err.code !== "ENOENT") {
                  // If the error is something other than "file not found", rethrow the error
                  throw err;
                }
                // If file is not found (ENOENT), do nothing
              }
            }
          });

          const deletedDoc = await prisma.documents.delete({
            where: {
              id: doc?.id,
            },
          });

          await prisma.annotations.deleteMany({
            where: {
              docuId: doc.id,
            },
          });

          const { id: docuId, ...otherDetails } = deletedDoc;

          await prisma.doclogs.create({
            data: {
              ...otherDetails,
              docuId,
              status: 0,
            },
          });

          return deletedDoc;
        }),
      );

      return deletedDocs;
    });

    return deletedDocuments;
  } catch (error) {
    console.error("DAO: Error deleting Document", error);
    throw new Error(error);
  }
}

async function annotateDocument(docId, data) {
  try {
    const { annotation, remarks } = data;

    const annotatedDocument = await prisma.documents.update({
      where: {
        id: docId,
      },
      data: { remarks, lastUpdateDateTime: formatToPHTime(new Date()) },
    });

    const { id, ...otherDetails } = annotatedDocument;

    await prisma.annotations.create({
      data: {
        annotation: annotation.annotation,
        annotatedBy: annotation.annotatedBy,
        annotatedByUid: annotation.annotatedByUid ?? null,
        docuId: id,
        createdAt: formatToPHTime(new Date()),
      },
    });

    await prisma.doclogs.create({
      data: {
        ...otherDetails,
        docuId: id,
      },
    });

    return annotatedDocument;
  } catch (error) {
    console.error("DAO: Error annotating document", error);
    throw new Error(error);
  }
}

async function updateAnnotation(docId, data) {
  try {
    const { annotation, remarks } = data;

    const annotatedDocument = await prisma.documents.update({
      where: {
        id: docId,
      },
      data: { remarks },
    });

    const { id, ...otherDetails } = annotatedDocument;

    const updatedAnnotation = await prisma.annotations.update({
      where: {
        id: annotation.id,
      },
      data: {
        ...annotation,
        dateUpdated: formatToPHTime(new Date()),
      },
    });

    await prisma.doclogs.create({
      data: {
        ...otherDetails,
        docuId: id,
      },
    });

    return updatedAnnotation;
  } catch (error) {
    console.error("DAO: Error annotating document", error);
    throw new Error(error);
  }
}

async function deleteAnnotation(annotationId) {
  try {
    const deletedAnnotation = await prisma.annotations.delete({
      where: {
        id: annotationId,
      },
    });

    return deletedAnnotation;
  } catch (error) {
    console.error("DAO: Error annotating document", error);
    throw new Error(error);
  }
}

async function transmitDocs(documents, updateFields) {
  try {
    const ids = documents.map((data) => data.id);
    const [annotation, ...otherDetails] = updateFields;

    // Use a single transaction to update documents and create logs
    const transmittedDocuments = await prisma.$transaction(async (prisma) => {
      // Update the documents

      const transmittedDocs = await prisma.documents.updateMany({
        where: {
          id: {
            in: ids,
          },
        },
        data: {
          ...otherDetails,
          status: 1,
          lastUpdateDateTime: formatToPHTime(new Date()),
        },
      });

      if (annotation?.annotation) {
        const annotationPromises = transmittedDocs.map(async (doc) => {
          return await prisma.annotations.create({
            data: {
              ...annotation,
              docuId: doc.id,
              createdAt: formatToPHTime(new Date()),
            },
          });
        });

        await Promise.all(annotationPromises);
      }

      // Retrieve the updated documents to get their details
      const updatedDocs = await prisma.documents.findMany({
        where: {
          id: {
            in: ids,
          },
        },
      });

      // Create log entries for each updated document
      const logPromises = updatedDocs.map(async (doc) => {
        const { id, ...otherDetails } = doc;
        return prisma.doclogs.create({
          data: {
            ...otherDetails,
            docuId: id,
          },
        });
      });

      await Promise.all(logPromises);

      return transmittedDocs;
    });

    return transmittedDocuments;
  } catch (error) {
    console.error(`DAO: Error transmitting documents: ${error.message}`);
    throw error;
  }
}

async function acceptDocuments(documents, updateFields) {
  try {
    const acceptedDocuments = await prisma.$transaction(async (prisma) => {
      const updatedDocs = await Promise.all(
        documents.map(async (doc) => {
          const dataToUpdate = {
            ...updateFields,
            ...(!updateFields?.status && {
              status:
                doc.classification === 1
                  ? 7
                  : doc.classification === 2
                    ? 8
                    : doc.classification === 4
                      ? 3
                      : 3,
            }),
            acceptStatus: 1,
            lastUpdateDateTime: formatToPHTime(new Date()),
            lastAcceptedDateTime: formatToPHTime(new Date()),
          };

          if (!doc.firstAcceptedDateTime) {
            dataToUpdate.firstAcceptedDateTime = formatToPHTime(new Date());
          }

          const updatedDoc = await prisma.documents.update({
            where: { id: doc.id },
            data: dataToUpdate,
          });

          const { id: docuId, ...otherDetails } = updatedDoc;

          await prisma.doclogs.create({
            data: {
              ...otherDetails,
              docuId,
            },
          });

          return updatedDoc;
        }),
      );

      return updatedDocs;
    });

    return acceptedDocuments;
  } catch (error) {
    console.error(`DAO: Error accepting documents: ${error.message}`);
    throw error;
  }
}

module.exports = {
  addDocument,
  updateDocument,
  revertDocument,
  deleteDocuments,
  annotateDocument,
  updateAnnotation,
  deleteAnnotation,
  transmitDocs,
  acceptDocuments
};
