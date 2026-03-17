const docuService = require("../services/documents-service");

const signWithCoordinates = async (req, res) => {
  try {
    const docuId = parseInt(req.params.id, 10);
    const signedFile = await docuService.signWithCoordinates(docuId, req.body);
    res.status(200).json(signedFile);
  } catch (error) {
    console.log(error);
    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || "Internal server error";
    res.status(statusCode).json({ error: errorMessage });
  }
};

module.exports = {
  signWithCoordinates,
};
