const feedbackDao = require("./feedback-dao");

async function submitFeedback(data) {
  try {
    // Call the DAO layer function to add form data
    const formData = await feedbackDao.submitFeedback(data);

    return formData;
  } catch (error) {
    throw error;
  }
}

async function getAllFeedbacks() {
  try {
    const fetchedFeedbacks = await feedbackDao.getAllFeedbacks();

    return fetchedFeedbacks;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  submitFeedback,
  getAllFeedbacks,
};
