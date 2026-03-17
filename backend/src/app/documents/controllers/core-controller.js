const docuService = require("../services/documents-service");
const fs = require("fs");
const path = require("path");

const getDocumentsCount = async (req, res) => {
  try {
    const { auth } = req.query;
    const documentsCount = await docuService.getDocumentsCount({
      ...auth,
      id: parseInt(auth.id, 10),
    });
    res.json(documentsCount);
  } catch (error) {
    console.error("Error fetching document count:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getAllDocumentsCount = async (req, res) => {
  try {
    const allDocumentsCount = await docuService.getAllDocumentsCount();
    res.json(allDocumentsCount);
  } catch (error) {
    console.error("Error fetching document count:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const allAdminDetailsCount = async (req, res) => {
  try {
    const allAdminsCount = await docuService.allAdminDetailsCount();
    res.json(allAdminsCount);
  } catch (error) {
    console.error("Error fetching document count:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const reviseDocument = async (req, res) => {
  try {
    const docuId = parseInt(req.params.id, 10);
    let data = {};
    for (const [key, value] of Object.entries(req.body)) {
      if (value) {
        if (
          key === "isReadable" ||
          key === "status" ||
          key === "complexity" ||
          key === "classification" ||
          key === "acceptStatus"
        ) {
          data[key] = parseInt(value, 10);
        } else if (
          key === "action" ||
          key === "primarySources" ||
          key === "lastSource" ||
          key === "destinations" ||
          key === "annotation" ||
          key === "uploadedBy" ||
          key === "currentOwner"
        ) {
          data[key] = JSON.parse(value);
        } else if (key === "changeFileOnly") {
          data[key] = value === "1" ? true : false;
        } else {
          data[key] = value;
        }
      }
    }
    const revisedDocu = await docuService.reviseDocument(docuId, req.file, data);
    res.json(revisedDocu);
  } catch (error) {
    console.log(error);
    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || "Internal server error";
    res.status(statusCode).json({ error: errorMessage });
  }
};

const attachDocument = async (req, res) => {
  try {
    const docuId = parseInt(req.params.id, 10);
    let data = {};
    for (const [key, value] of Object.entries(req.body)) {
      if (value) {
        if (key === "isReadable") {
          data[key] = parseInt(value, 10);
        } else if (key === "uploader" || key === "files") {
          data[key] = JSON.parse(value);
        } else {
          data[key] = value;
        }
      }
    }
    const attachedDocument = await docuService.attachDocument(docuId, req.file, data);
    res.status(200).json(attachedDocument);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const validateDocument = async (req, res) => {
  try {
    const { classification } = req.body;
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const validatedDocument = await docuService.validateDocument(file, parseInt(classification, 10));
    res.json(validatedDocument);
  } catch (error) {
    console.error("Controller: Error validating document:", error);
    res.status(500).json({ error: error.message });
  }
};

const markAsDone = async (req, res) => {
  try {
    const markedDocs = await docuService.markAsDone(req.body);
    res.status(200).json(markedDocs);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || "Internal server error";
    res.status(statusCode).json({ error: errorMessage });
  }
};

const addDocument = async (req, res) => {
  try {
    const io = req.app.get("socketio");
    let data = {};
    for (const [key, value] of Object.entries(req.body)) {
      if (value) {
        if (
          key === "isReadable" ||
          key === "status" ||
          key === "complexity" ||
          key === "classification" ||
          key === "acceptStatus"
        ) {
          data[key] = parseInt(value, 10);
        } else if (
          key === "action" ||
          key === "primarySources" ||
          key === "lastSource" ||
          key === "destinations" ||
          key === "annotation" ||
          key === "currentOwner" ||
          key === "uploadedBy"
        ) {
          data[key] = JSON.parse(value);
        } else {
          data[key] = value;
        }
      }
    }
    const newDocument = await docuService.addDocument(req.file, data);
    const { destinations, lastSource } = data;
    destinations.forEach((dest) => {
      const roomName = `room-${dest?.id}`;
      io.to(roomName).emit("documentNotif", {
        message: `${lastSource[0]?.destination} transmitted a document to your unit.`,
        documentId: newDocument?.id,
        sender: lastSource[0]?.destination,
        recipient: dest?.destination,
      });
    });
    res.status(201).json(newDocument);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getAllDocuments = async (req, res) => {
  try {
    const fetchedDocus = await docuService.getAllDocuments();
    res.json(fetchedDocus);
  } catch (error) {
    console.log(error);
    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || "Internal server error";
    res.status(statusCode).json({ error: errorMessage });
  }
};

const getSpecificDocuments = async (req, res) => {
  try {
    const { auth, category } = req.query;
    const fetchedDocus = await docuService.getSpecificDocuments(
      { ...auth, id: parseInt(auth.id, 10) },
      category,
    );
    res.json(fetchedDocus);
  } catch (error) {
    console.log(error);
    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || "Internal server error";
    res.status(statusCode).json({ error: errorMessage });
  }
};

const getDocuById = async (req, res) => {
  try {
    const docuId = parseInt(req.params.id, 10);
    const fetchedDocu = await docuService.getDocuById(docuId);
    res.json(fetchedDocu);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || "Internal server error";
    res.status(statusCode).json({ error: errorMessage });
  }
};

const updateDocument = async (req, res) => {
  try {
    const docuId = parseInt(req.params.id, 10);
    const updatedDocu = await docuService.updateDocument(docuId, req.body);
    res.json(updatedDocu);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || "Internal server error";
    res.status(statusCode).json({ error: errorMessage });
  }
};

const patchUpdateDocuments = async (req, res) => {
  try {
    const { documents, updateFields } = req.body;
    const updatedDocs = await docuService.patchUpdateDocuments(documents, updateFields);
    res.status(200).json(updatedDocs);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || "Internal server error";
    res.status(statusCode).json({ error: errorMessage });
  }
};

const deleteDocuments = async (req, res) => {
  try {
    const deletedDocu = await docuService.deleteDocuments(req.body);
    res.json(deletedDocu);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || "Internal server error";
    res.status(statusCode).json({ error: errorMessage });
  }
};

const filterDocLogs = async (req, res) => {
  try {
    const filters = {};
    for (const [key, value] of Object.entries(req.query)) {
      if (value) {
        if (key === "docuId" || key === "status") {
          filters[key] = parseInt(value, 10);
        } else {
          filters[key] = value;
        }
      }
    }
    if (Object.keys(filters).length === 0) {
      return res.status(200).json([]);
    }
    const fetchedDocus = await docuService.filterDocLogs(filters);
    res.json(fetchedDocus);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || "Internal server error";
    res.status(statusCode).json({ error: errorMessage });
  }
};

const recentDocuments = async (req, res) => {
  try {
    const { destinations } = req.query;
    const fetchedDocus = await docuService.recentDocuments(destinations);
    res.json(fetchedDocus);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || "Internal server error";
    res.status(statusCode).json({ error: errorMessage });
  }
};

const displayDocumentAsBlob = async (req, res) => {
  try {
    const { fileName } = req.query;
    if (!fileName) {
      return res.status(400).json({ error: "Filename is required" });
    }

    const filePath = path.join(__dirname, "..", "..", "..", "uploads", fileName);

    // Security check to prevent path traversal
    if (!filePath.startsWith(path.resolve(__dirname, "..", "..", "..", "uploads"))) {
      return res.status(400).json({ error: "Invalid file path" });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    const stat = fs.statSync(filePath);
    res.writeHead(200, {
      "Content-Type": "application/pdf",
      "Content-Length": stat.size,
    });

    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || "Internal server error";
    console.error("Controller: Error displaying document blob:", error);
    res.status(statusCode).json({ error: errorMessage });
  }
};

const revertDocument = async (req, res) => {
  try {
    const docuId = parseInt(req.params.id, 10);
    if (isNaN(docuId)) {
      return res.status(400).json({ error: "Invalid document ID" });
    }
    const { document, remarks } = req.body;
    const { id, docuId: docId, annotations, tableSelected, ...documentData } = document;
    const revertedDocu = await docuService.revertDocument(docuId, documentData, remarks);
    return res.status(200).json(revertedDocu);
  } catch (error) {
    console.error("Revert document error:", error);
    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || "Internal server error";
    return res.status(statusCode).json({ error: errorMessage });
  }
};

module.exports = {
  getDocumentsCount,
  getAllDocumentsCount,
  allAdminDetailsCount,
  reviseDocument,
  attachDocument,
  validateDocument,
  markAsDone,
  addDocument,
  getAllDocuments,
  getSpecificDocuments,
  getDocuById,
  updateDocument,
  patchUpdateDocuments,
  deleteDocuments,
  filterDocLogs,
  recentDocuments,
  revertDocument,
  displayDocumentAsBlob
};

