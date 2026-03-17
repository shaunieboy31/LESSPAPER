const docuService = require("../services/documents-service");

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
        const updatedAnnotation = await docuService.updateAnnotation(req.body);
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
        const { annotationId } = req.query;
        const deletedAnnotation = await docuService.deleteAnnotation(parseInt(annotationId, 10));
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
