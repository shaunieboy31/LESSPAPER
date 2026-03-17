const express = require("express");
const routingRouter = express.Router();
const routingController = require("../controllers/routing-controller");

routingRouter.patch("/routeDocuments", routingController.routeDocuments);
routingRouter.patch("/acceptDocs", routingController.acceptDocs);
routingRouter.put("/holdDocument", routingController.holdDocument);
routingRouter.put("/rerouteDocuments", routingController.rerouteDocuments);
routingRouter.put("/saveDocument", routingController.saveDocument);
routingRouter.patch("/transmitDocs", routingController.transmitDocs);
routingRouter.patch("/returnDocs", routingController.returnDocs);

module.exports = routingRouter;
