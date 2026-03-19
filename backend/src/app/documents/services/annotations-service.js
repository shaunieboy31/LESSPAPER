const annotationsDao = require("../daos/annotations-dao-write");

async function annotateDocument(data) {
  try {
    const { docuId, annotation, ...otherDetails } = data;

    if (!docuId || !annotation) {
      const error = new Error(
        "Missing required parameters: docuId or annotation",
      );
      error.statusCode = 400;
      throw error;
    }

    const annotatedDoc = await annotationsDao.annotateDocument(docuId, {
      ...otherDetails,
      annotation,
    });

    if (!annotatedDoc) {
      const error = new Error("Error annotating the document.");
      error.statusCode = 400;
      throw error;
    }

    return annotatedDoc;
  } catch (error) {
    console.error("Service: Error adding document:", error);
    throw error;
  }
}

async function updateAnnotation(data) {
  try {
    const { docuId, annotation, ...otherDetails } = data;

    if (!annotation) {
      const error = new Error(
        "Missing required parameters: docuId or annotation",
      );
      error.statusCode = 400;
      throw error;
    }

    const updatedAnnotation = await annotationsDao.updateAnnotation(docuId, {
      ...otherDetails,
      annotation,
    });

    if (!updatedAnnotation) {
      const error = new Error("Error updating the annotation.");
      error.statusCode = 400;
      throw error;
    }

    return updatedAnnotation;
  } catch (error) {
    console.error("Service: Error updating annotation:", error);
    throw error;
  }
}

async function deleteAnnotation(annotationId) {
  try {
    const deletedAnnotation = await annotationsDao.deleteAnnotation(annotationId);

    if (!deletedAnnotation) {
      const error = new Error("Error deleting the annotation.");
      error.statusCode = 400;
      throw error;
    }

    return deletedAnnotation;
  } catch (error) {
    console.error("Service: Error deleting annotation:", error);
    throw error;
  }
}

module.exports = {
  annotateDocument,
  updateAnnotation,
  deleteAnnotation,
};
