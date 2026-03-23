const docuDao = require("../daos/documents-dao");
const workflowDao = require("../daos/document-workflow-dao-write");
const { PDFDocument } = require("pdf-lib");
const fs = require("fs");
const fspromises = require("fs").promises;
const path = require("path");
const { formatToPHTime } = require("../../../middlewares/phtimezone");
const { updateDocument } = require("../utils/doc-utils");
const { getTextContentFromPage, getTimesDetected, pdfjsLib } = require("../utils/pdf-utils");

async function holdDocument(documents, remarks) {
  try {
    const onHoldPromises = documents.map(async (data) => {
      const { id } = data;

      const onHoldDocument = await updateDocument(id, {
        status: 5,
        remarks,
      });

      if (!onHoldDocument) {
        const error = new Error("Error saving the document.");
        error.statusCode = 400;
        throw error;
      }

      return onHoldDocument;
    });

    const onHoldDocuments = await Promise.all(onHoldPromises);

    return onHoldDocuments;
  } catch (error) {
    console.error("Service: Error returning document:", error);
    throw error;
  }
}

async function rerouteDocument(documents, updateFields) {
  try {
    const reroutePromises = documents.map(async (data) => {
      const { id } = data;

      const reroutedDocument = await updateDocument(id, {
        ...updateFields,
        status: 3,
      });

      if (!reroutedDocument) {
        const error = new Error("Error rerouting the document.");
        error.statusCode = 400;
        throw error;
      }

      return reroutedDocument;
    });

    const reroutedDocuments = await Promise.all(reroutePromises);

    return reroutedDocuments;
  } catch (error) {
    console.error("Service: Error saving documents:", error);
    throw error;
  }
}

async function saveDocument(documents, updateFields) {
  try {
    const savePromises = documents.map(async (data) => {
      const { id } = data;

      const savedDocument = await updateDocument(id, {
        ...updateFields,
        status: 4,
      });

      if (!savedDocument) {
        const error = new Error("Error saving the document.");
        error.statusCode = 400;
        throw error;
      }

      return savedDocument;
    });

    const savedDocuments = await Promise.all(savePromises);

    return savedDocuments;
  } catch (error) {
    console.error("Service: Error saving documents:", error);
    throw error;
  }
}

async function transmitDocs(documents, updateFields) {
  try {
    const transmittedPromises = documents.map(async (data) => {
      const { id, seqNo } = data;

      const transmittedDocs = await updateDocument(id, {
        ...updateFields,
        acceptStatus: 0,
        seqNo: seqNo + 1,
      });

      if (!transmittedDocs) {
        const error = new Error("Error transmitting the document.");
        error.statusCode = 400;
        throw error;
      }

      return transmittedDocs;
    });

    const transmittedDocuments = await Promise.all(transmittedPromises);

    return transmittedDocuments;
  } catch (error) {
    console.error("Service: Error transmitting document: ", error);
    throw error;
  }
}

async function returnDocs(documents, updateFields) {
  try {
    const transmittedPromises = documents.map(async (data) => {
      const { id, classification, seqNo } = data;

      const transmittedDocs = await updateDocument(id, {
        ...updateFields,
        acceptStatus: 0,
        seqNo: seqNo + 1,
        classification:
          (classification === 3 || classification === 4) &&
            updateFields?.destinations?.some(
              (dest) => dest.id === 1 || dest.id === 2,
            )
            ? 2
            : classification,
      });

      if (!transmittedDocs) {
        const error = new Error("Error returning the document.");
        error.statusCode = 400;
        throw error;
      }

      return transmittedDocs;
    });

    const transmittedDocuments = await Promise.all(transmittedPromises);

    return transmittedDocuments;
  } catch (error) {
    console.error("Service: Error returning document: ", error);
    throw error;
  }
}

async function revertDocument(docuId, data, remarks) {
  try {
    const revertedDocument = await workflowDao.revertDocument(
      docuId,
      data,
      remarks,
    );

    return revertedDocument;
  } catch (error) {
    console.error("Service: Error reverting document", error);
    throw error;
  }
}

async function attachDocument(docuId, newFile, data) {
  try {
    const {
      files,
      newFileName,
      uploader,
      documentPlacement,
      isReadable,
      remarks,
    } = data;

    const oldDocDetails = await docuDao.getDocumentById(docuId);

    const primarySources = oldDocDetails.primarySources || null;

    let newPrimarySources = primarySources || [];

    const newUploader = uploader || null;

    // If there are fewer than 3 primary sources, add the new one
    const uploaderExists = newPrimarySources.some(
      (prim) => prim.id === newUploader.id && prim.type === newUploader.type,
    );

    if (!uploaderExists) {
      if (newPrimarySources.length < 2) {
        newPrimarySources.push(newUploader);
      } else {
        newPrimarySources.shift();
        newPrimarySources.push(newUploader);
      }
    }

    const fileDocuments = files ? (Array.isArray(files) ? files : [files]) : [];

    const latestFile = fileDocuments?.some((files) => files !== "")
      ? fileDocuments[fileDocuments.length - 1]
      : null;

    if (latestFile) {
      const prevFilePath = path.join(
        __dirname,
        "..",
        "..",
        "..",
        "uploads",
        latestFile,
      );

      if (!fs.existsSync(prevFilePath)) {
        throw new Error(
          `Previous file ${newFileName} not found in uploads directory.`,
        );
      }

      const existingPdfBytes = fs.readFileSync(prevFilePath); // Read the PDF file from the uploads directory

      const existingPdfDoc = await PDFDocument.load(existingPdfBytes);

      const newFilePath = newFile.path;
      if (!fs.existsSync(newFilePath)) {
        throw new Error(`Uploaded file does not exist at path: ${newFilePath}`);
      }
      const newPdfBytes = fs.readFileSync(newFilePath);
      const newPdfDoc = await PDFDocument.load(newPdfBytes);

      const newPdfPages = await existingPdfDoc.copyPages(
        newPdfDoc,
        newPdfDoc.getPageIndices(),
      );

      if (documentPlacement === "first") {
        // Insert each page at the beginning
        newPdfPages
          .reverse()
          .forEach((page) => existingPdfDoc.insertPage(0, page));
      } else {
        newPdfPages.forEach((page) => existingPdfDoc.addPage(page));
      }

      const mergedPdfBytes = await existingPdfDoc.save();

      const formattedNewFileName = `${Date.now()}-${newFileName}`;

      const uploadPath = path.join(__dirname, "..", "..", "..", "uploads");
      fs.mkdirSync(uploadPath, { recursive: true });
      const filePath = path.join(uploadPath, formattedNewFileName);
      fs.writeFileSync(filePath, mergedPdfBytes);

      const replacedDocument = await updateDocument(docuId, {
        primarySources: newPrimarySources,
        files: [formattedNewFileName],
        autoInitials: null,
        manualInitials: null,
        signedDateTime: null,
        isReadable,
        remarks,
      });

      return replacedDocument;
    } else {
      const newFilePath = newFile.path;
      const newFileName = newFile.filename;

      if (!fs.existsSync(newFilePath)) {
        throw new Error(`File does not exist at path: ${newFilePath}`);
      }

      fileDocuments.forEach((file) => {
        if (file) {
          const filePath = path.join(__dirname, `../../../uploads/${file}`); 

          try {
            fs.unlinkSync(filePath);
          } catch (err) {
            if (err.code !== "ENOENT") {
              throw err;
            }
          }
        }
      });

      const replacedDocument = await updateDocument(docuId, {
        files: [newFileName],
        isReadable,
      });

      return replacedDocument;
    }
  } catch (error) {
    console.error("Service: Error replacing document:", error);
    throw error;
  }
}

async function validateDocument(file, classification) {
  try {
    const filePath = path.resolve(file.path);

    if (!fs.existsSync(filePath)) {
      throw new Error(`File does not exist at path: ${filePath}`);
    }

    const fileBuffer = await fspromises.readFile(filePath);

    const loadingTask = pdfjsLib.getDocument({ data: fileBuffer });

    const pdfDoc = await loadingTask.promise;

    if (pdfDoc.numPages === 0) {
      throw new Error("Invalid PDF file.");
    }

    let isReadable = false;
    let hasSDSName = false;

    for (let x = 0; x < pdfDoc.numPages; x++) {
      const textContent = await getTextContentFromPage(pdfDoc, x);

      let nameToDetect = "";
      let timesDetected = 0;

      if (timesDetected === 0) {
        try {
          const sdsUser = await docuDao.getSDSUser();
          nameToDetect = sdsUser.uppercasedName;
          timesDetected = await getTimesDetected(textContent, nameToDetect);
        } catch (error) {
          console.error("Error getting SDS user:", error);
          nameToDetect = "HOMER N. MENDOZA";
          timesDetected = await getTimesDetected(textContent, nameToDetect);
        }
      }

      if (timesDetected === 0) {
        try {
          const sdsUser = await docuDao.getSDSUser();
          nameToDetect = sdsUser.fullName;
          timesDetected = await getTimesDetected(textContent, nameToDetect);
        } catch (error) {
          console.error("Error getting SDS user:", error);
          nameToDetect = "Homer N. Mendoza";
          timesDetected = await getTimesDetected(textContent, nameToDetect);
        }
      }

      if (textContent?.items?.length > 0 && timesDetected > 0) {
        isReadable = true;
        hasSDSName = true;
      }
    }

    const restrictDocsWithoutSDS = await getSystemSetting(
      "restrictDocsWithoutSDS",
      false,
    );

    if (
      !isReadable &&
      classification === 1 &&
      restrictDocsWithoutSDS &&
      !hasSDSName
    ) {
      throw new Error(
        "FOR SIGNATURE: The superintendent's name was not found in the document. Please upload a different PDF file",
      );
    }

    fs.unlinkSync(filePath);

    return { isReadable, hasSDSName };
  } catch (error) {
    console.error(`Service: Error validating file: ${error.message}`);
    throw error;
  }
}

async function getSystemSetting(key, defaultValue = null) {
  try {
    const setting = await docuDao.getSystemSetting(key);

    if (!setting || !setting.isActive) return defaultValue;

    try {
      return JSON.parse(setting.value);
    } catch {
      return setting.value;
    }
  } catch (error) {
    console.error(`Error getting setting ${key}:`, error);
    return defaultValue;
  }
}

async function updateSystemSetting(key, value, updatedBy) {
  try {
    const stringValue =
      typeof value === "object" ? JSON.stringify(value) : String(value);

    return await docuDao.updateSystemSetting(key, stringValue, updatedBy);
  } catch (error) {
    console.error(`Error updating setting ${key}:`, error);
    throw error;
  }
}

async function getAllSystemSettings() {
  try {
    return await docuDao.getAllSystemSettings();
  } catch (error) {
    console.error("Error getting all system settings:", error);
    throw error;
  }
}

async function markAsDone(data) {
  try {
    const { documents, lastSource, remarks } = data;

    const transmittedPromises = documents.map(async (docData) => {
      const { id, complied } = docData;

      const unitComplied = complied || [];

      let newCompliedUnits = [...unitComplied];

      if (
        newCompliedUnits
          .map((compliedUnit) => compliedUnit.id)
          .includes(lastSource.id)
      ) {
        newCompliedUnits = newCompliedUnits.filter(
          (compliedUnit) => compliedUnit.id !== lastSource.id,
        );
      } else {
        newCompliedUnits = [...newCompliedUnits, { ...lastSource }];
      }

      const markedDocs = await updateDocument(id, {
        complied: newCompliedUnits,
        remarks,
      });

      if (!markedDocs) {
        const error = new Error("Error transmitting the document.");
        error.statusCode = 400;
        throw error;
      }

      return markedDocs;
    });

    const transmittedDocuments = await Promise.all(transmittedPromises);

    return transmittedDocuments;
  } catch (error) {
    console.error("Service: Error transmitting document: ", error);
    throw error;
  }
}

module.exports = {
  holdDocument,
  rerouteDocument,
  saveDocument,
  returnDocs,
  revertDocument,
  attachDocument,
  validateDocument,
  getSystemSetting,
  updateSystemSetting,
  getAllSystemSettings,
  markAsDone,
};
