const docuService = require("../services/documents-service");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const annotateDocument = async (req, res) => {
    try {
        const annotatedDoc = await docuService.annotateDocument(req.body);
        res.status(200).json(annotatedDoc);
    } catch (error) {
        console.log(error);
        const statusCode = error.statusCode || 500;
        const errorMessage = error.message || "Internal server error";
        res.status(statusCode).json({ error: errorMessage });
    }
};

const updateAnnotation = async (req, res) => {
    try {
        const { annotation, currentUserUid, ...rest } = req.body;

        // Ownership check: fetch annotation to verify creator
        const existingAnnotation = await prisma.annotations.findFirst({
            where: { id: annotation.id },
        });

        if (!existingAnnotation) {
            return res.status(404).json({ error: "Annotation not found." });
        }

        // If annotatedByUid is set, only that user can edit
        // Parse both as integers to avoid type mismatch (string vs int)
        const storedUid = existingAnnotation.annotatedByUid !== null
            ? parseInt(existingAnnotation.annotatedByUid, 10)
            : null;
        const requestUid = currentUserUid !== null && currentUserUid !== undefined
            ? parseInt(currentUserUid, 10)
            : null;

        if (storedUid !== null && storedUid !== requestUid) {
            // Use 400 instead of 403 to avoid triggering the axios token refresh interceptor
            return res.status(400).json({ error: "You are not allowed to edit this annotation." });
        }

        const updatedAnnotation = await docuService.updateAnnotation({ annotation, ...rest });
        res.status(200).json(updatedAnnotation);
    } catch (error) {
        console.log(error);
        const statusCode = error.statusCode || 500;
        const errorMessage = error.message || "Internal server error";
        res.status(statusCode).json({ error: errorMessage });
    }
};

const deleteAnnotation = async (req, res) => {
    try {
        const { annotationId, currentUserUid } = req.query;
        const parsedAnnotationId = parseInt(annotationId, 10);

        // Ownership check: fetch annotation to verify creator
        const existingAnnotation = await prisma.annotations.findFirst({
            where: { id: parsedAnnotationId },
        });

        if (!existingAnnotation) {
            return res.status(404).json({ error: "Annotation not found." });
        }

        // Parse both as integers to avoid type mismatch (string vs int)
        const storedUid = existingAnnotation.annotatedByUid !== null
            ? parseInt(existingAnnotation.annotatedByUid, 10)
            : null;
        const requestUid = currentUserUid !== null && currentUserUid !== undefined
            ? parseInt(currentUserUid, 10)
            : null;

        if (storedUid !== null && storedUid !== requestUid) {
            // Use 400 instead of 403 to avoid triggering the axios token refresh interceptor
            return res.status(400).json({ error: "You are not allowed to delete this annotation." });
        }

        const deletedAnnotation = await docuService.deleteAnnotation(parsedAnnotationId);
        res.status(200).json(deletedAnnotation);
    } catch (error) {
        console.log(error);
        const statusCode = error.statusCode || 500;
        const errorMessage = error.message || "Internal server error";
        res.status(statusCode).json({ error: errorMessage });
    }
};

module.exports = {
    annotateDocument,
    updateAnnotation,
    deleteAnnotation
};
