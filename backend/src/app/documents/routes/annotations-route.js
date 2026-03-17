const express = require("express");
const annotationsRouter = express.Router();
const annotationsController = require("../controllers/annotations-controller");

annotationsRouter.post("/annotate", annotationsController.annotateDocument);
annotationsRouter.put("/updateAnnotation", annotationsController.updateAnnotation);
annotationsRouter.delete("/deleteAnnotation", annotationsController.deleteAnnotation);

module.exports = annotationsRouter;
