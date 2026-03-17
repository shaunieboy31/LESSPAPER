const express = require("express");
const documentsRouter = require("../app/documents/documents-controller");
const librariesRouter = require("../app/libraries/libraries-controller");
const usersRouter = require("../UserAuth/user-controller");
const feedbackRouter = require("../app/system-feedback/feedback-controller");

const Routes = (app) => {
  const router = express.Router();
  router.use("/user", usersRouter);

  router.use("/documents", documentsRouter);
  router.use("/libraries", librariesRouter);
  router.use("/feedbacks", feedbackRouter);

  app.use("/", router);

  router.use((req, res) => {
    res.status(404).send("Route not found");
  });

  router.use((req, res) => {
    console.error(err.stack);
    res.status(500).send("Something went wrong!");
  });
};

module.exports = Routes;
