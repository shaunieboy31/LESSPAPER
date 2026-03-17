const express = require("express");
const routingRouter = express.Router();
const docuService = require("./documents-service");

routingRouter.patch("/routeDocuments", async (req, res) => {
    try {
        const { documents, updateFields } = req.body;

        const routedDocs = await docuService.routeDocuments(
            documents,
            updateFields,
        );

        res.status(200).json(routedDocs);
    } catch (error) {
        const statusCode = error.statusCode || 500;
        const errorMessage = error.message || "Internal server error";

        res.status(statusCode).json({ error: errorMessage });
    }
});

routingRouter.patch("/acceptDocs", async (req, res) => {
    try {
        const { documents, updateFields } = req.body;

        const acceptedDocuments = await docuService.acceptDocuments(
            documents,
            updateFields,
        );

        res.status(200).json(acceptedDocuments);
    } catch (error) {
        const statusCode = error.statusCode || 500;
        const errorMessage = error.message || "Internal server error";

        res.status(statusCode).json({ error: errorMessage });
    }
});

routingRouter.put("/holdDocument", async (req, res) => {
    try {
        const { documents, remarks } = req.body;

        const onholdDocuments = await docuService.holdDocument(documents, remarks);

        res.status(200).json(onholdDocuments);
    } catch (error) {
        console.log(error);
        const statusCode = error.statusCode || 500;
        const errorMessage = error.message || "Internal server error";

        res.status(statusCode).json({ error: errorMessage });
    }
});

routingRouter.put("/rerouteDocuments", async (req, res) => {
    try {
        const { documents, updateFields } = req.body;

        const reroutedDoc = await docuService.rerouteDocument(
            documents,
            updateFields,
        );

        res.status(200).json(reroutedDoc);
    } catch (error) {
        console.log(error);
        const statusCode = error.statusCode || 500;
        const errorMessage = error.message || "Internal server error";

        res.status(statusCode).json({ error: errorMessage });
    }
});

routingRouter.put("/saveDocument", async (req, res) => {
    try {
        const { documents, updateFields } = req.body;

        const savedDoc = await docuService.saveDocument(documents, updateFields);

        res.status(200).json(savedDoc);
    } catch (error) {
        console.log(error);
        const statusCode = error.statusCode || 500;
        const errorMessage = error.message || "Internal server error";

        res.status(statusCode).json({ error: errorMessage });
    }
});

routingRouter.patch("/transmitDocs", async (req, res) => {
    try {
        const io = req.app.get("socketio");

        const { documents, updateFields } = req.body;

        const transmittedDocs = await docuService.transmitDocs(
            documents,
            updateFields,
        );

        const { destinations } = updateFields;

        // Emit notifications for each recipient
        destinations.forEach((dest) => {
            const roomName = dest?.destination; // Ensure unitId corresponds to the room naming
            io.to(roomName).emit("documentNotif", {
                message: `${updateFields?.lastSource?.destination} transmitted ${documents.length
                    } ${documents.length > 1 ? "documents" : "document"} to your unit.`,
                documentId: documents.map((doc) => doc?.id),
                sender: updateFields?.lastSource?.destination,
                recipient: dest?.destination,
            });
        });

        res.status(200).json(transmittedDocs);
    } catch (error) {
        const statusCode = error.statusCode || 500;
        const errorMessage = error.message || "Internal server error";

        res.status(statusCode).json({ error: errorMessage });
    }
});

routingRouter.patch("/returnDocs", async (req, res) => {
    try {
        const io = req.app.get("socketio");

        const { documents, updateFields } = req.body;

        const transmittedDocs = await docuService.returnDocs(
            documents,
            updateFields,
        );

        const { destinations } = updateFields;

        // Emit notifications for each recipient
        destinations.forEach((dest) => {
            const roomName = dest?.destination; // Ensure unitId corresponds to the room naming
            io.to(roomName).emit("documentNotif", {
                message: `${updateFields?.lastSource?.destination} returned ${documents.length
                    } ${documents.length > 1 ? "documents" : "document"} to your unit.`,
                documentId: documents.map((doc) => doc?.id),
                sender: updateFields?.lastSource?.destination,
                recipient: dest?.destination,
            });
        });

        res.status(200).json(transmittedDocs);
    } catch (error) {
        const statusCode = error.statusCode || 500;
        const errorMessage = error.message || "Internal server error";

        res.status(statusCode).json({ error: errorMessage });
    }
});

module.exports = routingRouter;
