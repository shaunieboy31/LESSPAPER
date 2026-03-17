const docuService = require("../services/documents-service");
const { setCutoffEnabled } = require("../../../../lib/utils/settingsState");

const manualSignPNPKI = async (req, res) => {
  try {
    const docuId = parseInt(req.params.id, 10);
    const signedFile = await docuService.manualSignPNPKI(docuId, req.body);
    res.status(200).json(signedFile);
  } catch (error) {
    console.log(error);
    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || "Internal server error";
    res.status(statusCode).json({ error: errorMessage });
  }
};

const premiumSignPdf = async (req, res) => {
  try {
    const docuId = parseInt(req.params.id, 10);
    const data = req.body;
    const signedFile = await docuService.premiumSignPdf(docuId, data);
    res.status(200).json(signedFile);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || "Internal server error";
    res.status(statusCode).json({ error: errorMessage });
  }
};

const premiumInitializeDocument = async (req, res) => {
  try {
    const docuId = parseInt(req.params.id, 10);
    const data = req.body;
    const initializedFile = await docuService.premiumInitializeDocument(
      docuId,
      data,
    );
    res.status(200).json(initializedFile);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || "Internal server error";
    res.status(statusCode).json({ error: errorMessage });
  }
};

const signDocument = async (req, res) => {
  try {
    const docuId = parseInt(req.params.id, 10);
    const { titles, ...otherDetails } = req.body;
    const titlesToCheck = titles.map((title) => title.split(" ")[0]);
    const signedFile = await docuService.signPdf(docuId, {
      ...otherDetails,
      titlesToCheck,
    });
    res.status(200).json(signedFile);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || "Internal server error";
    res.status(statusCode).json({ error: errorMessage });
  }
};

const initializeDocument = async (req, res) => {
  try {
    const docuId = parseInt(req.params.id, 10);
    const { titles, ...otherDetails } = req.body;
    const titlesToCheck = titles.map((title) => title.split(" ")[0]);
    const initializedFile = await docuService.initializePdf(docuId, {
      ...otherDetails,
      titlesToCheck,
    });
    res.status(200).json(initializedFile);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || "Internal server error";
    res.status(statusCode).json({ error: errorMessage });
  }
};

const autoSignPNPKI = async (req, res) => {
  try {
    const docuId = parseInt(req.params.id, 10);
    const { titles, ...otherDetails } = req.body;
    const titlesToCheck = titles.map((title) => title.split(" ")[0]);
    const signedFile = await docuService.autoSignPNPKI(docuId, {
      ...otherDetails,
      titlesToCheck,
    });
    res.status(200).json(signedFile);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || "Internal server error";
    res.status(statusCode).json({ error: errorMessage });
  }
};

const undoLastDocumentAction = async (req, res) => {
  try {
    const docuId = parseInt(req.params.id, 10);
    const unsignDocu = await docuService.undoLastDocumentAction(
      docuId,
      req.body,
    );
    res.json(unsignDocu);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || "Internal server error";
    res.status(statusCode).json({ error: errorMessage });
  }
};

const getSystemSettings = async (req, res) => {
  try {
    const settings = await docuService.getAllSystemSettings();
    const cutoffSetting = settings.find((s) => s.key === "cutoffEnabled");
    if (cutoffSetting) {
      setCutoffEnabled(JSON.parse(cutoffSetting.value));
    }
    res.json(settings);
  } catch (error) {
    console.error("Controller: Error getting system settings:", error);
    res.status(500).json({ error: error.message });
  }
};

const updateSystemSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value, updatedBy } = req.body;
    if (value === undefined) {
      return res.status(400).json({ error: "Value is required" });
    }
    const updatedSetting = await docuService.updateSystemSetting(
      key,
      value,
      updatedBy || "system",
    );
    if (key === "cutoffEnabled") {
      setCutoffEnabled(JSON.parse(value));
    }
    res.json(updatedSetting);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || "Internal server error";
    console.error("Controller: Error updating system setting:", error);
    res.status(statusCode).json({ error: errorMessage });
  }
};

module.exports = {
  manualSignPNPKI,
  premiumSignPdf,
  premiumInitializeDocument,
  signDocument,
  initializeDocument,
  autoSignPNPKI,
  undoLastDocumentAction,
  getSystemSettings,
  updateSystemSetting
};

