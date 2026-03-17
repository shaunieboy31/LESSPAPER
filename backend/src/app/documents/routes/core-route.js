const express = require("express");
const coreRouter = express.Router();
const coreController = require("../controllers/core-controller");
const uploadFile = require("../../../middlewares/multer");

coreRouter.get("/documentsCount", coreController.getDocumentsCount);
coreRouter.get("/allDocumentsCount", coreController.getAllDocumentsCount);
coreRouter.get("/allAdminDetailsCount", coreController.allAdminDetailsCount);
coreRouter.put("/reviseDocument/:id", uploadFile, coreController.reviseDocument);
coreRouter.put("/attachDocument/:id", uploadFile, coreController.attachDocument);
coreRouter.post("/validateDocument", uploadFile, coreController.validateDocument);
coreRouter.patch("/markAsDone", coreController.markAsDone);
coreRouter.post("/addDocument", uploadFile, coreController.addDocument);
coreRouter.get("/getAllDocuments", coreController.getAllDocuments);
coreRouter.get("/getSpecificDocuments", coreController.getSpecificDocuments);
coreRouter.get("/getDocuById/:id", coreController.getDocuById);
coreRouter.get("/displayDocumentAsBlob", coreController.displayDocumentAsBlob);
coreRouter.put("/updateDocument/:id", coreController.updateDocument);
coreRouter.patch("/patchUpdate", coreController.patchUpdateDocuments);
coreRouter.post("/deleteDocuments", coreController.deleteDocuments);
coreRouter.get("/filterDocLogs", coreController.filterDocLogs);
coreRouter.get("/recentDocuments", coreController.recentDocuments);
coreRouter.put("/revertDocument/:id", coreController.revertDocument);

module.exports = coreRouter;
