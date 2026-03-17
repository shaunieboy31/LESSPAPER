const express = require("express");
const feedbackRouter = express.Router();
const feedbackService = require("./feedback-service");

feedbackRouter.post("/submitFeedback", async (req, res) => {
  try {
    const data = req.body;

    const submittedFeedback = await feedbackService.submitFeedback(data);

    res.status(201).json(submittedFeedback);
  } catch (error) {
    console.log(error);

    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || "Internal server error";

    res.status(statusCode).json({ error: errorMessage });
  }
});

feedbackRouter.get("/getAllFeedbacks", async (req, res) => {
  try {
    const fetchedFeedbacks = await feedbackService.getAllFeedbacks();

    res.json(fetchedFeedbacks);
  } catch (error) {
    console.log(error);

    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || "Internal server error";

    res.status(statusCode).json({ error: errorMessage });
  }
});

feedbackRouter.get("/getDataByResultId/:feedbackId", async (req, res) => {
  try {
    const feedbackId = parseInt(req.params.feedbackId, 10);

    const feedbackData = await melcService.getEncodedDataByResultId(feedbackId);

    res.json(feedbackData);
  } catch (error) {
    console.error("Error in getting data by feedbackId:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

feedbackRouter.delete("/deleteFeedback/:id", async (req, res) => {
  try {
    const resId = parseInt(req.params.id, 10);

    const deletedFeedback = await melcService.deleteFeedbackById(resId);

    res.json(deletedFeedback);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = feedbackRouter;
