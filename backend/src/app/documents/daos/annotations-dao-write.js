const { PrismaClient } = require("@prisma/client");
const { formatToPHTime } = require("../../../middlewares/phtimezone");

const prisma = new PrismaClient();

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

module.exports = {
  annotateDocument,
  updateAnnotation,
  deleteAnnotation,
};
