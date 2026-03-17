const express = require("express");
const documentsRouter = express.Router();
const documentsController = require("../controllers/documents-controller");

// Mount sub-routers gawa ni Shaun
const signaturesRouter = require("./signatures-route");
documentsRouter.use("/", signaturesRouter);

const annotationsRouter = require("./annotations-route");
documentsRouter.use("/", annotationsRouter);

const routingRouter = require("./routing-route");
documentsRouter.use("/", routingRouter);

const coreRouter = require("./core-route");
documentsRouter.use("/", coreRouter);

// Set up controller logic
documentsRouter.put("/manualSignPNPKI/:id", documentsController.manualSignPNPKI);
documentsRouter.put("/premiumSignPdf/:id", documentsController.premiumSignPdf);
documentsRouter.put("/premiumInitializeDocument/:id", documentsController.premiumInitializeDocument);
documentsRouter.put("/signDocument/:id", documentsController.signDocument);
documentsRouter.put("/initializeDocument/:id", documentsController.initializeDocument);
documentsRouter.put("/autoSignPNPKI/:id", documentsController.autoSignPNPKI);
documentsRouter.put("/undoLastDocumentAction/:id", documentsController.undoLastDocumentAction);
documentsRouter.get("/system-settings", documentsController.getSystemSettings);
documentsRouter.put("/system-settings/:key", documentsController.updateSystemSetting);

module.exports = documentsRouter;
