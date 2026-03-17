const express = require("express");
const signaturesRouter = express.Router();
const signaturesController = require("../controllers/signatures-controller");

signaturesRouter.put("/signWithCoordinates/:id", signaturesController.signWithCoordinates);

module.exports = signaturesRouter;
