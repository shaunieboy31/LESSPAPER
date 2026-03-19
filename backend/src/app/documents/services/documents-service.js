const docuDao = require("../daos/documents-dao");
const { PDFDocument } = require("pdf-lib");
const fs = require("fs");
const fspromises = require("fs").promises;
const path = require("path");
const { formatToPHTime } = require("../../../middlewares/phtimezone");
const {
  signWithCoordinates,
  manualSignPNPKI,
  premiumSignPdf,
  premiumInitializeDocument,
  signPdf,
  initializePdf,
  autoSignPNPKI,
  undoLastDocumentAction
} = require("./document-signing-service");
const {
  generateLPSNo,
  updateDocument
} = require("../utils/doc-utils");
const { getTextContentFromPage, getTimesDetected, pdfjsLib } = require("../utils/pdf-utils");

// Helper functions moved to utils/pdf-utils.js and utils/doc-utils.js

// Manual Signing
/*
async function signWithCoordinates(docuId, updateFields) {
  try {
    const {
      fileName,
      page,
      signaturePosition,
      signedBy,
      signPath,
      status,
      destinations,
      lastSource,
      remarks,
    } = updateFields;

    const selectedDocument = await docuDao.getDocumentById(docuId);

    let newInitialSignatories =
      selectedDocument?.manualInitials &&
      selectedDocument?.manualInitials !== "null"
        ? selectedDocument?.manualInitials
        : [];
    newInitialSignatories.push(signedBy);

    const filePath = path.join(__dirname, "..", "..", "..", "uploads", fileName);

    if (!fs.existsSync(filePath)) {
      throw new Error(`PDF file ${fileName} not found in uploads folder.`);
    }

    const existingPdfBytes = fs.readFileSync(filePath); // Read the PDF file from the uploads directory

    // Load PDF with pdf-lib for modifications
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    // Load the signature image
    const imgPath = path.resolve(__dirname, `../../..${signPath}`);
    if (!fs.existsSync(imgPath)) {
      throw new Error(
        `Signature/Initial for ${uppercasedName} not found: ${signPath}`,
      );
    }

    // const imgPath = path.resolve(__dirname, "../../../images/sds-esign.png");
    const imgBytes = fs.readFileSync(imgPath);
    const signImage = await pdfDoc.embedPng(imgBytes);

    const pageToSign = pdfDoc.getPage(page - 1);

    const pageHeight = pageToSign.getHeight();

    const { x, y, width, height } = signaturePosition;

    const pdfOffset = (input) => input / 8;

    console.log({
      x: x - pdfOffset(width),
      y: pageHeight - y - height + pdfOffset(height), // PDF coordinates are bottom-left origin
      width,
      height,
    });

    // Add signature to PDF
    pageToSign.drawImage(signImage, {
      x: x - pdfOffset(width),
      y: pageHeight - y - height + pdfOffset(height), // PDF coordinates are bottom-left origin
      width,
      height,
    });

    const signedPdfBytes = await pdfDoc.save();

    // Parse the file name to get the name and extension separately
    const parsedPath = path.parse(fileName);

    // Remove any numbers at the beginning of the original file name
    const cleanedFileName = parsedPath.name.replace(/^\d+/, "");

    // Use a new identifier or timestamp
    const newIdentifier = Date.now(); // You can also use a UUID or other custom logic here

    // Create the new file name
    const fileNameWithNewIdentifier = `${newIdentifier}${cleanedFileName}${parsedPath.ext}`;

    // Define the full path for the signed PDF
    const signedPdfPath = path.join(
      __dirname,
      `../../../uploads/${fileNameWithNewIdentifier}`,
    );

    // Save the signed PDF file
    fs.writeFileSync(signedPdfPath, signedPdfBytes);

    // Parse existing files from the document
    const fileDocuments = selectedDocument?.files?.some((files) => files !== "")
      ? selectedDocument.files
      : [];

    let newFileDocs = fileDocuments || [];

    // If there are fewer than 3 files, add the new one
    if (newFileDocs.length < 3) {
      newFileDocs.push(fileNameWithNewIdentifier);
    } else {
      // Remove the oldest file if there are already 3 files
      const oldestFilePath = path.join(
        __dirname,
        `../../../uploads/${newFileDocs[0]}`,
      );

      try {
        fs.unlinkSync(oldestFilePath); // Delete the oldest file
      } catch (err) {
        if (err.code !== "ENOENT") {
          throw err; // Only throw if the error is something other than "file not found"
        }
      }

      newFileDocs.shift(); // Remove the oldest file from the array
      newFileDocs.push(fileNameWithNewIdentifier); // Add the new file
    }

    // Update the document record in the database
    const signedDocument = await updateDocument(docuId, {
      files: newFileDocs,
      status,
      ...(lastSource &&
        (lastSource.id === 1 || lastSource.id === 2) && { acceptStatus: 0 }),
      manualInitials: newInitialSignatories.length
        ? newInitialSignatories
        : null,
      ...(destinations && { destinations }),
      ...(lastSource && { lastSource }),
      ...(signedBy.id === 1 && { signedDateTime: formatToPHTime(new Date()) }),
      remarks,
    });

    return signedDocument;
  } catch (error) {
    console.error("Service: Error signing the PDF:", error);
    throw error;
  }
}

// Custom signature positioning for PNPKI
async function manualSignPNPKI(documentId, updateFields) {
  try {
    const {
      fileName,
      page,
      signatureImage,
      signaturePosition,
      signedBy,
      signPath,
      status,
      destinations,
      lastSource,
      remarks,
    } = updateFields;

    // Get document details
    const selectedDocument = await docuDao.getDocumentById(documentId);
    if (!selectedDocument) {
      throw new Error("Document not found");
    }

    let newInitialSignatories =
      selectedDocument?.manualInitials &&
      selectedDocument?.manualInitials !== "null"
        ? selectedDocument?.manualInitials
        : [];
    newInitialSignatories.push(signedBy);

    const filePath = path.join(__dirname, "..", "..", "..", "uploads", fileName);
    if (!fs.existsSync(filePath)) {
      throw new Error(`PDF file ${fileName} not found in uploads folder.`);
    }

    // Read existing PDF
    const existingPdfBytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    const pageToSign = pdfDoc.getPage(page - 1);

    const pageHeight = pageToSign.getHeight();

    // Load the signature image
    const signImgPath = path.resolve(__dirname, `../../..${signPath}`);
    if (!fs.existsSync(signImgPath)) {
      throw new Error(`Signature/Initial not found: ${signPath}`);
    }

    // const imgPath = path.resolve(__dirname, "../../../images/sds-esign.png");
    const imgBytes = fs.readFileSync(signImgPath);
    const signImage = await pdfDoc.embedPng(imgBytes);
    const { width: signWidth, height: signHeight } = signImage.scale(0.1);

    console.log(signaturePosition);

    if (signatureImage) {
      try {
        // Validate base64 data
        if (!signatureImage || typeof signatureImage !== "string") {
          throw new Error("Invalid signature image data");
        }

        // Calculate the actual width of the signature image
        const imageBuffer = Buffer.from(signatureImage, "base64");

        // Validate that the buffer contains valid image data
        if (imageBuffer.length === 0) {
          throw new Error("Empty signature image data");
        }

        const signaturePdfImage = await pdfDoc.embedPng(imageBuffer);
        // const { width: signatureWidth } = signaturePdfImage.scale(1);

        const { x, y, width, height } = signaturePosition;

        // Add signature to PDF
        pageToSign.drawImage(signaturePdfImage, {
          x: x,
          y: pageHeight - y - height + 10, // PDF coordinates are bottom-left origin
          width,
          height,
        });

        // Add a text field for the CMS signature (completely invisible, validation-only)
        const form = pdfDoc.getForm();
        const timestamp = Date.now();
        const signatureField = form.createTextField(
          `pki_cms_signature_${timestamp}`,
        );
        signatureField.setText(updateFields.signature || ""); // Use signature data if available
        signatureField.addToPage(pageToSign, {
          x: x + 1, // Slightly offset to avoid covering visual signature
          y: pageHeight - y - height + 11, // Slightly offset to avoid covering visual signature
          width: 0.1, // Minimal size - just enough for validation
          height: 0.1, // Minimal size - just enough for validation
        });
        signatureField.enableReadOnly();
      } catch (imageError) {
        throw new Error(
          `Error embedding signature image: ${imageError.message || imageError}`,
        );
      }
    }

    const signedPdfBytes = await pdfDoc.save();

    // Parse the file name to get the name and extension separately
    const parsedPath = path.parse(fileName);

    // Remove any numbers at the beginning of the original file name
    const cleanedFileName = parsedPath.name.replace(/^\d+/, "");

    // Use a new identifier or timestamp
    const newIdentifier = Date.now(); // You can also use a UUID or other custom logic here

    // Create the new file name
    const fileNameWithNewIdentifier = `${newIdentifier}${cleanedFileName}${parsedPath.ext}`;

    // Define the full path for the signed PDF
    const signedPdfPath = path.join(
      __dirname,
      `../../../uploads/${fileNameWithNewIdentifier}`,
    );

    // Save the signed PDF file
    fs.writeFileSync(signedPdfPath, signedPdfBytes);

    // Parse existing files from the document
    const fileDocuments = selectedDocument?.files?.some((files) => files !== "")
      ? selectedDocument.files
      : [];

    let newFileDocs = fileDocuments || [];

    // If there are fewer than 3 files, add the new one
    if (newFileDocs.length < 3) {
      newFileDocs.push(fileNameWithNewIdentifier);
    } else {
      // Remove the oldest file if there are already 3 files
      const oldestFilePath = path.join(
        __dirname,
        `../../../uploads/${newFileDocs[0]}`,
      );

      try {
        fs.unlinkSync(oldestFilePath); // Delete the oldest file
      } catch (err) {
        if (err.code !== "ENOENT") {
          throw err; // Only throw if the error is something other than "file not found"
        }
      }

      newFileDocs.shift(); // Remove the oldest file from the array
      newFileDocs.push(fileNameWithNewIdentifier); // Add the new file
    }

    // Update the document record in the database
    const signedDocument = await updateDocument(documentId, {
      files: newFileDocs,
      status,
      ...(lastSource &&
        (lastSource.id === 1 || lastSource.id === 2) && { acceptStatus: 0 }),
      manualInitials: newInitialSignatories.length
        ? newInitialSignatories
        : null,
      ...(destinations && { destinations }),
      ...(lastSource && { lastSource }),
      ...(signedBy.id === 1 && { signedDateTime: formatToPHTime(new Date()) }),
      remarks,
    });

    return signedDocument;
  } catch (error) {
    console.error("Error in signWithCustomPosition:", error);
    throw error;
  }
}

// Auto-detect Premium Signing (exclusive to SDS for he has a code)
async function premiumSignPdf(docuId, updateFields) {
  try {
    const {
      fileName,
      page,
      fullName,
      coordinates,
      // titlesToCheck,
      signedBy,
      signPath,
      status,
      destinations,
      lastSource,
      remarks,
    } = updateFields;

    const selectedDocument = await docuDao.getDocumentById(docuId);

    let newInitialSignatories =
      selectedDocument?.autoInitials &&
      selectedDocument?.autoInitials !== "null"
        ? selectedDocument?.autoInitials
        : [];
    newInitialSignatories.push(signedBy);

    const filePath = path.join(__dirname, "..", "..", "..", "uploads", fileName);

    if (!fs.existsSync(filePath)) {
      throw new Error(`PDF file ${fileName} not found in uploads folder.`);
    }

    const existingPdfBytes = fs.readFileSync(filePath); // Read the PDF file from the uploads directory

    // Load PDF with pdf-lib for modifications
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    // Load the signature image
    const imgPath = path.resolve(__dirname, `../../..${signPath}`);
    if (!fs.existsSync(imgPath)) {
      throw new Error(`Signature for ${fullName} not found: ${signPath}`);
    }

    const imgBytes = fs.readFileSync(imgPath);
    const signImage = await pdfDoc.embedPng(imgBytes);
    const { width: signWidth, height: signHeight } = signImage.scale(0.1);

    const pageToSign = pdfDoc.getPage(page - 1);
    const pageHeight = pageToSign.getHeight();

    console.log({
      ...coordinates,
      pageHeight,
      x: (coordinates?.x + 20) / 2,
      y: (pageHeight * 2 - coordinates?.y - 30) / 2,
    });

    try {
      pageToSign.drawImage(signImage, {
        x: (coordinates?.x + 20) / 2,
        y: (pageHeight * 2 - coordinates?.y - 30) / 2,
        width: signWidth,
        height: signHeight,
        opacity: 1,
      });
    } catch (error) {
      throw new Error(
        `Cannot detect the name ${coordinates?.str} on the PDF Document.`,
        error,
      );
    }

    const signedPdfBytes = await pdfDoc.save();

    // Parse the file name to get the name and extension separately
    const parsedPath = path.parse(fileName);

    // Remove any numbers at the beginning of the original file name
    const cleanedFileName = parsedPath.name.replace(/^\d+/, "");

    // Use a new identifier or timestamp
    const newIdentifier = Date.now(); // You can also use a UUID or other custom logic here

    // Create the new file name
    const fileNameWithNewIdentifier = `${newIdentifier}${cleanedFileName}${parsedPath.ext}`;

    // Define the full path for the signed PDF
    const signedPdfPath = path.join(
      __dirname,
      `../../../uploads/${fileNameWithNewIdentifier}`,
    );

    // Save the signed PDF file
    fs.writeFileSync(signedPdfPath, signedPdfBytes);

    // Parse existing files from the document
    const fileDocuments = selectedDocument?.files?.some((files) => files !== "")
      ? selectedDocument.files
      : [];

    let newFileDocs = fileDocuments || [];

    // If there are fewer than 3 files, add the new one
    if (newFileDocs.length < 3) {
      newFileDocs.push(fileNameWithNewIdentifier);
    } else {
      // Remove the oldest file if there are already 3 files
      const oldestFilePath = path.join(
        __dirname,
        `../../../uploads/${newFileDocs[0]}`,
      );

      try {
        fs.unlinkSync(oldestFilePath); // Delete the oldest file
      } catch (err) {
        if (err.code !== "ENOENT") {
          throw err; // Only throw if the error is something other than "file not found"
        }
      }

      newFileDocs.shift(); // Remove the oldest file from the array
      newFileDocs.push(fileNameWithNewIdentifier); // Add the new file
    }

    // Update the document record in the database
    const signedDocument = await updateDocument(docuId, {
      files: newFileDocs,
      status,
      ...(lastSource &&
        (lastSource.id === 1 || lastSource.id === 2) && { acceptStatus: 0 }),
      autoInitials: newInitialSignatories.length ? newInitialSignatories : null,
      signedDateTime: formatToPHTime(new Date()),
      ...(destinations && { destinations }),
      ...(lastSource && { lastSource }),
      remarks,
    });

    return signedDocument;
  } catch (error) {
    console.error("Service: Error signing the PDF:", error);
    throw error;
  }
}

async function premiumInitializeDocument(docuId, updateFields) {
  try {
    const {
      fileName,
      page,
      fullName,
      coordinates,
      initialBy,
      signPath,
      status,
      destinations,
      lastSource,
      remarks,
    } = updateFields;

    const selectedDocument = await docuDao.getDocumentById(docuId);

    let newInitialSignatories =
      selectedDocument?.autoInitials &&
      selectedDocument?.autoInitials !== "null"
        ? selectedDocument?.autoInitials
        : [];
    newInitialSignatories.push(initialBy);

    const filePath = path.join(__dirname, "..", "..", "..", "uploads", fileName);

    if (!fs.existsSync(filePath)) {
      throw new Error(`PDF file ${fileName} not found in uploads folder.`);
    }

    const existingPdfBytes = fs.readFileSync(filePath); // Read the PDF file from the uploads directory

    // Load PDF with pdf-lib for modifications
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    // Load the signature image
    const imgPath = path.resolve(__dirname, `../../..${signPath}`);
    if (!fs.existsSync(imgPath)) {
      throw new Error(`Signature for ${fullName} not found: ${signPath}`);
    }

    const imgBytes = fs.readFileSync(imgPath);
    const signImage = await pdfDoc.embedPng(imgBytes);
    const { width: signWidth, height: signHeight } = signImage.scale(0.1);

    const pageToSign = pdfDoc.getPage(page - 1);
    const pageHeight = pageToSign.getHeight();

    const docDestinations = selectedDocument.destinations;

    const ASDSIncludedInDestinations = docDestinations.some(
      (dest) => dest.id === 2,
    );

    const CIDIncludedInDestinations = docDestinations.some(
      (dest) => dest.id === 13,
    );

    const SGODIncludedInDestinations = docDestinations.some(
      (dest) => dest.id === 21,
    );

    let addedXValue = 0;
    let addedYValue = 0;

    // if (signType === "initial") {
    // }
    if (ASDSIncludedInDestinations) {
      addedXValue = 200;
      addedYValue = 60;
    } else if (CIDIncludedInDestinations) {
      addedXValue = 300;
      addedYValue = 90;
    } else if (SGODIncludedInDestinations) {
      addedXValue = 320;
      addedYValue = 140;
    } else {
      addedXValue = -150;
      addedYValue = 160;

      if (newInitialSignatories.length >= 1) {
        amountToMoveRight =
          (signWidth - 5) * (newInitialSignatories.length - 1);
      }

      addedXValue += amountToMoveRight;
    }

    console.log({
      ...coordinates,
      pageHeight,
      x: (coordinates?.x + addedXValue) / 2,
      y: (pageHeight * 2 - coordinates?.y - addedYValue) / 2,
    });

    try {
      pageToSign.drawImage(signImage, {
        x: (coordinates?.x + addedXValue) / 2,
        y: (pageHeight * 2 - coordinates?.y - addedYValue) / 2,
        width: signWidth,
        height: signHeight,
        opacity: 1,
      });
    } catch (error) {
      throw new Error(
        `Cannot detect the name ${coordinates?.str} on the PDF Document.`,
        error,
      );
    }

    const signedPdfBytes = await pdfDoc.save();

    // Parse the file name to get the name and extension separately
    const parsedPath = path.parse(fileName);

    // Remove any numbers at the beginning of the original file name
    const cleanedFileName = parsedPath.name.replace(/^\d+/, "");

    // Use a new identifier or timestamp
    const newIdentifier = Date.now(); // You can also use a UUID or other custom logic here

    // Create the new file name
    const fileNameWithNewIdentifier = `${newIdentifier}${cleanedFileName}${parsedPath.ext}`;

    // Define the full path for the signed PDF
    const signedPdfPath = path.join(
      __dirname,
      `../../../uploads/${fileNameWithNewIdentifier}`,
    );

    // Save the signed PDF file
    fs.writeFileSync(signedPdfPath, signedPdfBytes);

    // Parse existing files from the document
    const fileDocuments = selectedDocument?.files?.some((files) => files !== "")
      ? selectedDocument.files
      : [];

    let newFileDocs = fileDocuments || [];

    // If there are fewer than 3 files, add the new one
    if (newFileDocs.length < 3) {
      newFileDocs.push(fileNameWithNewIdentifier);
    } else {
      // Remove the oldest file if there are already 3 files
      const oldestFilePath = path.join(
        __dirname,
        `../../../uploads/${newFileDocs[0]}`,
      );

      try {
        fs.unlinkSync(oldestFilePath); // Delete the oldest file
      } catch (err) {
        if (err.code !== "ENOENT") {
          throw err; // Only throw if the error is something other than "file not found"
        }
      }

      newFileDocs.shift(); // Remove the oldest file from the array
      newFileDocs.push(fileNameWithNewIdentifier); // Add the new file
    }

    // Update the document record in the database
    const signedDocument = await updateDocument(docuId, {
      files: newFileDocs,
      status,
      ...(lastSource &&
        (lastSource.id === 1 || lastSource.id === 2) && { acceptStatus: 0 }),
      autoInitials: newInitialSignatories.length ? newInitialSignatories : null,
      ...(destinations && { destinations }),
      ...(lastSource && { lastSource }),
      remarks,
    });

    return signedDocument;
  } catch (error) {
    console.error("Service: Error signing the PDF:", error);
    throw error;
  }
}
*/

// Auto-detect Signing (exclusive to SDS for he has a code)

/*
async function signPdf(docuId, updateFields) {
  try {
    const {
      fileName,
      page,
      fullName,
      titlesToCheck,
      signedBy,
      signPath,
      status,
      destinations,
      lastSource,
      remarks,
    } = updateFields;

    const uppercasedName = fullName.toUpperCase();
    const selectedDocument = await docuDao.getDocumentById(docuId);

    let newInitialSignatories =
      selectedDocument?.autoInitials &&
      selectedDocument?.autoInitials !== "null"
        ? selectedDocument?.autoInitials
        : [];
    newInitialSignatories.push(signedBy);

    const filePath = path.join(__dirname, "..", "..", "..", "uploads", fileName);

    if (!fs.existsSync(filePath)) {
      throw new Error(`PDF file ${fileName} not found in uploads folder.`);
    }

    const existingPdfBytes = fs.readFileSync(filePath); // Read the PDF file from the uploads directory

    const loadingTask = pdfjsLib.getDocument({
      data: existingPdfBytes,
      standardFontDataUrl,
    });

    // Load PDF with pdfjs-dist for text extraction
    const pdfDocument = await loadingTask.promise;

    // Load PDF with pdf-lib for modifications
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    // Load the signature image
    const imgPath = path.resolve(__dirname, `../../..${signPath}`);
    if (!fs.existsSync(imgPath)) {
      throw new Error(`Signature for ${uppercasedName} not found: ${signPath}`);
    }

    // const imgPath = path.resolve(__dirname, "../../../images/sds-esign.png");
    const imgBytes = fs.readFileSync(imgPath);
    const signImage = await pdfDoc.embedPng(imgBytes);
    const { width: signWidth, height: signHeight } = signImage.scale(0.1);

    console.log(signWidth);

    const pageToSign = pdfDoc.getPage(page - 1);
    const pageWidth = pageToSign.getWidth();
    const textContent = await getTextContentFromPage(pdfDocument, page - 1);

    // Check if name will be detected on either the original name or the capitalized version
    let nameToDetect = uppercasedName;

    let timesDetected = await getTimesDetected(textContent, nameToDetect);

    if (timesDetected === 0) {
      nameToDetect = fullName;
      timesDetected = await getTimesDetected(textContent, nameToDetect);
    }

    if (timesDetected === 0) {
      throw new Error(
        `PDF not signed: Name ${nameToDetect} is not detected on the page`,
      );
    }

    const isNameWithTitle = await isNameFollowedByTitle(
      textContent,
      nameToDetect,
      timesDetected,
      titlesToCheck,
    );

    let position = { x: null, y: null, nameWidth: 0 };

    if (isNameWithTitle) {
      position = await findTextPosition(
        textContent,
        nameToDetect,
        timesDetected,
      );
    } else {
      throw new Error(`Name ${uppercasedName} not followed by titles`);
    }
    // 071025-087
    let addedValue = 80;

    if (position.nameWidth < 0 || position.nameWidth > pageWidth) {
      if (position.nameWidth > 12000) {
        throw new Error(`Name ${nameToDetect} incorrectly detected`);
      }
      position.nameWidth = 229;
    }

    if (
      timesDetected !== 0 ||
      position.x !== null ||
      position.y !== null ||
      position.x !== 0 ||
      position.y !== 0
    ) {
      const centeredX = await calculateCenteredX(
        pageWidth,
        position.x,
        position.nameWidth,
        signWidth,
      );

      console.log({
        x: centeredX - 100,
        y: position.y - signHeight + addedValue - 40,
      });

      pageToSign.drawImage(signImage, {
        x: centeredX - 100,
        y: position.y - signHeight + addedValue - 40, // 45
        width: signWidth,
        height: signHeight,
        opacity: 1,
      });
    } else {
      throw new Error(
        `There's a problem detecting ${nameToDetect} in the PDF.`,
      );
    }

    const signedPdfBytes = await pdfDoc.save();

    // Parse the file name to get the name and extension separately
    const parsedPath = path.parse(fileName);

    // Remove any numbers at the beginning of the original file name
    const cleanedFileName = parsedPath.name.replace(/^\d+/, "");

    // Use a new identifier or timestamp
    const newIdentifier = Date.now(); // You can also use a UUID or other custom logic here

    // Create the new file name
    const fileNameWithNewIdentifier = `${newIdentifier}${cleanedFileName}${parsedPath.ext}`;

    // Define the full path for the signed PDF
    const signedPdfPath = path.join(
      __dirname,
      `../../../uploads/${fileNameWithNewIdentifier}`,
    );

    // Save the signed PDF file
    fs.writeFileSync(signedPdfPath, signedPdfBytes);

    // Parse existing files from the document
    const fileDocuments = selectedDocument?.files?.some((files) => files !== "")
      ? selectedDocument.files
      : [];

    let newFileDocs = fileDocuments || [];

    // If there are fewer than 3 files, add the new one
    if (newFileDocs.length < 3) {
      newFileDocs.push(fileNameWithNewIdentifier);
    } else {
      // Remove the oldest file if there are already 3 files
      const oldestFilePath = path.join(
        __dirname,
        `../../../uploads/${newFileDocs[0]}`,
      );

      try {
        fs.unlinkSync(oldestFilePath); // Delete the oldest file
      } catch (err) {
        if (err.code !== "ENOENT") {
          throw err; // Only throw if the error is something other than "file not found"
        }
      }

      newFileDocs.shift(); // Remove the oldest file from the array
      newFileDocs.push(fileNameWithNewIdentifier); // Add the new file
    }

    // Update the document record in the database
    const signedDocument = await updateDocument(docuId, {
      files: newFileDocs,
      status,
      autoInitials: newInitialSignatories.length ? newInitialSignatories : null,
      signedDateTime: formatToPHTime(new Date()),
      ...(destinations && { destinations }),
      ...(lastSource && { lastSource }),
      // NOTE: This is for acceptStatus
      ...(lastSource &&
        (lastSource.id === 1 || lastSource.id === 2) && { acceptStatus: 0 }),
      remarks,
    });

    return signedDocument;
  } catch (error) {
    console.error("Service: Error signing the PDF:", error);
    throw error;
  }
}
*/

// Auto-detect Signing/Initializing
/*
async function initializePdf(docuId, updateFields) {
  try {
    const {
      fileName,
      page,
      fullName,
      titlesToCheck,
      initialBy,
      signPath,
      signType,
      status,
      destinations,
      lastSource,
      remarks,
    } = updateFields;

    const uppercasedName = fullName.toUpperCase();
    const selectedDocument = await docuDao.getDocumentById(docuId);

    let newInitialSignatories =
      selectedDocument?.autoInitials &&
      selectedDocument?.autoInitials !== "null"
        ? selectedDocument?.autoInitials
        : [];
    newInitialSignatories.push(initialBy);

    const filePath = path.join(__dirname, "..", "..", "..", "uploads", fileName);

    if (!fs.existsSync(filePath)) {
      throw new Error(`PDF file ${fileName} not found in uploads folder.`);
    }

    const existingPdfBytes = fs.readFileSync(filePath); // Read the PDF file from the uploads directory

    const loadingTask = pdfjsLib.getDocument({
      data: existingPdfBytes,
      standardFontDataUrl,
    });

    // Load PDF with pdfjs-dist for text extraction
    const pdfDocument = await loadingTask.promise;

    // Load PDF with pdf-lib for modifications
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    const imgPath = path.resolve(__dirname, `../../..${signPath}`);
    if (!fs.existsSync(imgPath)) {
      throw new Error(`Initial for ${uppercasedName} not found: ${signPath}`);
    }

    const imgBytes = fs.readFileSync(imgPath);
    const signImage = await pdfDoc.embedPng(imgBytes);

    let nameDetected = false;

    const pageToSign = pdfDoc.getPage(page - 1);
    const pageWidth = pageToSign.getWidth();

    const textContent = await getTextContentFromPage(pdfDocument, page - 1);

    let nameToDetect = uppercasedName;
    let titles = titlesToCheck;

    let timesDetected = await getTimesDetected(textContent, nameToDetect);

    if (timesDetected === 0) {
      nameToDetect = fullName;
      timesDetected = await getTimesDetected(textContent, nameToDetect);
    }

    const sdsUser = await docuDao.getSDSUser();
    titles = sdsUser?.positions?.map((title) => title.split(" ")[0]);

    if (timesDetected === 0) {
      try {
        nameToDetect = sdsUser.uppercasedName;
        timesDetected = await getTimesDetected(textContent, nameToDetect);
      } catch (error) {
        console.error("Error getting SDS user:", error);
        // Fallback to hardcoded name if SDS user not found
        nameToDetect = "HOMER N. MENDOZA";
        timesDetected = await getTimesDetected(textContent, nameToDetect);
      }
    }

    if (timesDetected === 0) {
      try {
        nameToDetect = sdsUser.fullName;
        timesDetected = await getTimesDetected(textContent, nameToDetect);
      } catch (error) {
        console.error("Error getting SDS user:", error);
        // Fallback to hardcoded name if SDS user not found
        nameToDetect = "Homer N. Mendoza";
        timesDetected = await getTimesDetected(textContent, nameToDetect);
      }
    }

    if (timesDetected !== 0) {
      nameDetected = true;
    }

    if (timesDetected === 0) {
      try {
        const sdsUser = await docuDao.getSDSUser();
        console.log(
          `Name ${sdsUser.uppercasedName} nor ${uppercasedName} was not found in the PDF.`,
        );
      } catch (error) {
        console.log(`Name ${uppercasedName} was not found in the PDF.`);
      }
    }

    const isNameWithTitle = await isNameFollowedByTitle(
      textContent,
      nameToDetect,
      timesDetected,
      titles,
    );

    let position = { x: null, y: null, nameWidth: 0 };

    if (isNameWithTitle) {
      position = await findTextPosition(
        textContent,
        nameToDetect,
        timesDetected,
      );
    }

    if (position.nameWidth < 50 || position.nameWidth > pageWidth) {
      if (position.nameWidth > 12000) {
        throw new Error(`Name ${nameToDetect} incorrectly detected`);
      }
      position.nameWidth = 229;
    }

    const { width: signWidth, height: signHeight } = signImage.scale(
      nameToDetect === uppercasedName ? 0.1 : 0.05,
    );

    if (timesDetected !== 0 && position.x && position.y) {
      const centeredX = await calculateCenteredX(
        pageWidth,
        position.x,
        position.nameWidth,
        signWidth,
      );

      const docDestinations = selectedDocument.destinations;

      const ASDSIncludedInDestinations = docDestinations.some(
        (dest) => dest.id === 2,
      );

      const CIDIncludedInDestinations = docDestinations.some(
        (dest) => dest.id === 13,
      );

      const SGODIncludedInDestinations = docDestinations.some(
        (dest) => dest.id === 21,
      );

      let xValue = centeredX; // + 70
      let yValue = position.y - signHeight; // + 25
      let amountToMoveRight = 0;

      if (signType === "initial") {
        if (ASDSIncludedInDestinations) {
          yValue += 10;
        } else if (CIDIncludedInDestinations) {
          yValue -= 10; // - 15
          xValue += 40;
        } else if (SGODIncludedInDestinations) {
          yValue -= 35; // - 15
          xValue += 53;
        } else {
          yValue -= 40; // - 15
          xValue -= position.nameWidth - 50; // - 30

          if (newInitialSignatories.length >= 1) {
            amountToMoveRight =
              (signWidth - 5) * (newInitialSignatories.length - 1);
          }

          xValue += amountToMoveRight;
        }
      }

      if (nameToDetect === uppercasedName) {
        const signOccupiedSpace = (nameToDetect?.length + 10) * 2 + 10;

        xValue = centeredX - signOccupiedSpace; // make 40 a dynamic value by multiplying the number of letters on the user's name and add 8
        yValue = position.y - signHeight + 40; // 80 is just an addedValue
      }
      // if (nameToDetect === uppercasedName) {
      //   xValue = centeredX - 40; // make 40 a dynamic value by multiplying the number of letters on the user's name and add 8
      //   yValue = position.y - signHeight + 40; // 80 is just an addedValue
      // }

      console.log({
        xValue,
        yValue,
        position,
        nameToDetect,
      });

      pageToSign.drawImage(signImage, {
        x: xValue,
        y: yValue,
        width: signWidth,
        height: signHeight,
        opacity: 1,
      });

      // Doubled to make it look thicker
      pageToSign.drawImage(signImage, {
        x: xValue,
        y: yValue,
        width: signWidth,
        height: signHeight,
        opacity: 1,
      });
    } else {
      throw new Error(
        `Something went wrong with detecting the text ${nameToDetect}. `,
      );
    }

    if (!nameDetected) {
      throw new Error(`Could not find the text: ${uppercasedName} in the PDF.`);
    }

    // ===========================================================

    const signedPdfBytes = await pdfDoc.save();

    // Parse the file name to get the name and extension separately
    const parsedPath = path.parse(fileName);

    // Remove any numbers at the beginning of the original file name
    const cleanedFileName = parsedPath.name.replace(/^\d+/, "");

    // Use a new identifier or timestamp
    const newIdentifier = Date.now(); // You can also use a UUID or other custom logic here

    // Create the new file name
    const fileNameWithNewIdentifier = `${newIdentifier}${cleanedFileName}${parsedPath.ext}`;

    // Define the full path for the signed PDF
    const signedPdfPath = path.join(
      __dirname,
      `../../../uploads/${fileNameWithNewIdentifier}`,
    );

    // Save the signed PDF file
    fs.writeFileSync(signedPdfPath, signedPdfBytes);

    // Parse existing files from the document
    const fileDocuments = selectedDocument?.files?.some((files) => files !== "")
      ? selectedDocument.files
      : [];

    let newFileDocs = fileDocuments || [];

    // If there are fewer than 3 files, add the new one
    if (newFileDocs.length < 3) {
      newFileDocs.push(fileNameWithNewIdentifier);
    } else {
      // Remove the oldest file if there are already 3 files
      const oldestFilePath = path.join(
        __dirname,
        `../../../uploads/${newFileDocs[0]}`,
      );

      try {
        fs.unlinkSync(oldestFilePath); // Delete the oldest file
      } catch (err) {
        if (err.code !== "ENOENT") {
          throw err; // Only throw if the error is something other than "file not found"
        }
      }

      newFileDocs.shift(); // Remove the oldest file from the array
      newFileDocs.push(fileNameWithNewIdentifier); // Add the new file
    }

    // Update the document record in the database
    const signedDocument = await updateDocument(docuId, {
      files: newFileDocs,
      autoInitials: newInitialSignatories.length ? newInitialSignatories : null,
      status,
      ...(lastSource &&
        (lastSource.id === 1 || lastSource.id === 2) && { acceptStatus: 0 }),
      ...(destinations && { destinations }),
      ...(lastSource && { lastSource }),
      remarks,
    });

    return signedDocument;
  } catch (error) {
    console.error("Service: Error initializing the PDF:", error);
    throw error;
  }
}
*/

/*
async function autoSignPNPKI(docuId, data) {
  try {
    const {
      fileName,
      page,
      fullName,
      titlesToCheck,
      signedBy,
      signature,
      signatureImage, // Base64 encoded signature image
      certificateInfo,
      status,
      destinations,
      lastSource,
      remarks,
    } = data;

    const uppercasedName = fullName.toUpperCase();
    const selectedDocument = await docuDao.getDocumentById(docuId);

    let newInitialSignatories =
      selectedDocument?.autoInitials &&
      selectedDocument?.autoInitials !== "null"
        ? selectedDocument?.autoInitials
        : [];
    newInitialSignatories.push(signedBy);

    const filePath = path.join(__dirname, "..", "..", "..", "uploads", fileName);

    if (!fs.existsSync(filePath)) {
      throw new Error(`PDF file ${fileName} not found in uploads folder.`);
    }

    const existingPdfBytes = fs.readFileSync(filePath);

    const loadingTask = pdfjsLib.getDocument({
      data: existingPdfBytes,
      standardFontDataUrl,
    });
    const pdfDocument = await loadingTask.promise;
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const pageToSign = pdfDoc.getPage(page - 1);
    const { width: pageWidth, height } = pageToSign.getSize();

    const textContent = await getTextContentFromPage(pdfDocument, page - 1);

    // Check if name will be detected on either the original name or the capitalized version
    let nameToDetect = uppercasedName;

    let timesDetected = await getTimesDetected(textContent, nameToDetect);

    if (timesDetected === 0) {
      nameToDetect = fullName;
      timesDetected = await getTimesDetected(textContent, nameToDetect);
    }

    if (timesDetected === 0) {
      throw new Error(
        `PDF not signed: Name ${nameToDetect} is not detected on the page`,
      );
    }

    const isNameWithTitle = await isNameFollowedByTitle(
      textContent,
      nameToDetect,
      timesDetected,
      titlesToCheck,
    );

    // console.log(textContent);

    let position = { x: null, y: null, nameWidth: 0 };

    if (isNameWithTitle) {
      position = await findTextPosition(
        textContent,
        nameToDetect,
        timesDetected,
      );
    } else {
      throw new Error(`Name ${uppercasedName} not followed by titles`);
    }

    const addedValue = 80;

    if (position.nameWidth < 0 || position.nameWidth > pageWidth) {
      if (position.nameWidth > 12000) {
        throw new Error(`Name ${nameToDetect} incorrectly detected`);
      }
      position.nameWidth = 229;
    }

    // Convert base64 signature image to PDFImage
    if (signatureImage) {
      try {
        // Calculate the actual width of the signature image
        const imageBuffer = Buffer.from(signatureImage, "base64");
        const signaturePdfImage = await pdfDoc.embedPng(imageBuffer);
        const { width: signatureWidth } = signaturePdfImage.scale(1);

        console.log({ signatureWidth });

        const centeredX = await calculateCenteredX(
          pageWidth,
          position.x - position.nameWidth / 2 + 20,
          position.nameWidth,
          signatureWidth,
        );
        // { signatureWidth: 800 }
        // { x: 258.24, y: 129.38, width: 179, height: 60 }
        console.log({
          x: centeredX,
          y: position.y,
          width: position.nameWidth - 50,
          height: 60,
        });

        // Draw the signature image on the page
        pageToSign.drawImage(signaturePdfImage, {
          x: centeredX,
          y: position.y,
          width: position.nameWidth - 50,
          height: 60,
        });

        // Add a text field for the CMS signature (completely invisible, validation-only)
        const form = pdfDoc.getForm();
        const timestamp = Date.now();
        const signatureField = form.createTextField(
          `pki_cms_signature_${timestamp}`,
        );
        signatureField.setText(signature);
        signatureField.addToPage(pageToSign, {
          x: centeredX + 1, // Slightly offset to avoid covering visual signature
          y: position.y + 11, // Slightly offset to avoid covering visual signature
          width: 0.1, // Minimal size - just enough for validation
          height: 0.1, // Minimal size - just enough for validation
        });

        signatureField.enableReadOnly();

        // console.log({
        //   a: "ugh2",
        //   x: centeredX,
        //   y: position.y - 50 + addedValue,
        //   width: position.width,
        //   height: 50,
        // });
      } catch (imageError) {
        console.error("Error embedding signature image:", imageError);
        // No fallback text needed - visual signature should handle display
        throw new Error(
          `Failed to embed signature image: ${imageError.message}`,
        );
      }
    }

    const signedPdfBytes = await pdfDoc.save();

    const parsedPath = path.parse(fileName);
    const cleanedFileName = parsedPath.name.replace(/^\d+/, "");
    const newIdentifier = Date.now();
    const fileNameWithNewIdentifier = `${newIdentifier}${cleanedFileName}${parsedPath.ext}`;

    const signedPdfPath = path.join(
      __dirname,
      `../../../uploads/${fileNameWithNewIdentifier}`,
    );

    fs.writeFileSync(signedPdfPath, signedPdfBytes);

    // Parse existing files from the document
    const fileDocuments = selectedDocument?.files?.some((files) => files !== "")
      ? selectedDocument.files
      : [];

    let newFileDocs = fileDocuments || [];

    // If there are fewer than 3 files, add the new one
    if (newFileDocs.length < 3) {
      newFileDocs.push(fileNameWithNewIdentifier);
    } else {
      // Remove the oldest file if there are already 3 files
      const oldestFilePath = path.join(
        __dirname,
        `../../../uploads/${newFileDocs[0]}`,
      );

      try {
        fs.unlinkSync(oldestFilePath); // Delete the oldest file
      } catch (err) {
        if (err.code !== "ENOENT") {
          throw err; // Only throw if the error is something other than "file not found"
        }
      }

      newFileDocs.shift(); // Remove the oldest file from the array
      newFileDocs.push(fileNameWithNewIdentifier); // Add the new file
    }

    const signedDocument = await updateDocument(docuId, {
      files: newFileDocs,
      status,
      ...(destinations && { destinations }),
      ...(lastSource && { lastSource }),
      autoInitials: newInitialSignatories,
      signedDateTime: formatToPHTime(new Date()),
      remarks,
    });

    return signedDocument;
  } catch (error) {
    console.error("Service: Error signing the PDF with PKI:", error);
    throw error;
  }
}
*/

/*
async function undoLastDocumentAction(docuId, data) {
  try {
    const {
      files = [],
      autoInitials = [],
      manualInitials = [],
    } = await docuDao.getDocumentById(docuId);

    // Remove last file if exists
    const lastFile = files.pop();

    if (lastFile) {
      const lastFilePath = path.join(__dirname, `../../../uploads/${lastFile}`);
      try {
        fs.unlinkSync(lastFilePath);
      } catch (err) {
        console.error(`Service: Error removing file ${lastFile}:`, err);
      }
    }

    // Remove unitId from autoInitials or manualInitials
    const updateInitials = (initials) =>
      initials.filter((signatory) => signatory.id !== data?.actionBy?.id);

    const unitExists = autoInitials?.some(
      (signatory) => signatory.id === data?.actionBy?.id,
    )
      ? "auto"
      : manualInitials?.some((signatory) => signatory.id === data?.actionBy?.id)
        ? "manual"
        : null;

    // Update document based on the initials type
    const updatedDocument = await docuDao.updateDocument(docuId, {
      files,
      currentOwner: [
        {
          id: 0,
          destination: 0,
          type: 0,
        },
      ],
      status: 1,
      acceptStatus: 0,
      ...(unitExists === "auto" && {
        autoInitials: updateInitials(autoInitials),
      }),
      ...(unitExists === "manual" && {
        manualInitials: updateInitials(manualInitials),
      }),
      ...(data?.actionBy?.id === 1 && {
        destinations: [data?.actionBy],
        signedDateTime: null,
      }),
      remarks: data?.remarks,
    });

    return updatedDocument;
  } catch (error) {
    console.error("Service: Error!", error);
    throw error;
  }
}
*/


async function reviseDocument(docuId, file, data) {
  try {
    let newFileName;

    const oldDocDetails = await docuDao.getDocumentById(docuId);

    if (file) {
      const docFileDocuments = oldDocDetails?.files.some((file) => file !== "")
        ? oldDocDetails.files
        : [];

      newFileName = file?.filename;

      // Delete the existing files in docFileDocuments
      docFileDocuments.forEach((file, index) => {
        if (file && index !== docFileDocuments.length - 1) {
          const filePath = path.join(__dirname, `../../../uploads/${file}`); // Ensure correct path

          try {
            fs.unlinkSync(filePath);
          } catch (err) {
            if (err.code !== "ENOENT") {
              // If the error is something other than "file not found", rethrow the error
              throw err;
            }
            // If file is not found (ENOENT), do nothing
          }
        }
      });
    }

    if (data.file) {
      delete data.file;
    }

    let removeAttachment = false;
    let changeFileOnly = false;

    if (data.removeAttachment || data.changeFileOnly) {
      if (data.removeAttachment === "true") {
        removeAttachment = true;
      }
      if (data.changeFileOnly) {
        changeFileOnly = true;
      }
      delete data.removeAttachment;
      delete data.changeFileOnly;
    }

    const revisedDocument = await updateDocument(docuId, {
      ...data,
      ...((removeAttachment || newFileName) && {
        files: [removeAttachment ? "" : newFileName],
        autoInitials: changeFileOnly ? oldDocDetails?.autoInitials : null,
        manualInitials: changeFileOnly ? oldDocDetails?.manualInitials : null,
        signedDateTime: changeFileOnly ? oldDocDetails?.signedDateTime : null,
      }),
      ...(data.isReadable && {
        isReadable: parseInt(data?.isReadable, 10),
      }),
      // ...(annotation && { annotation }),
    });

    if (!revisedDocument) {
      const error = new Error("Error revising the document.");
      error.statusCode = 400;
      throw error;
    }

    return revisedDocument;
  } catch (error) {
    console.error("Service: Error revising document:", error);
    throw error;
  }
}

async function routeDocuments(documents, updateFields) {
  try {
    const routedPromises = documents.map(async (data) => {
      const { id } = data;

      const routedDocs = await updateDocument(id, {
        ...updateFields,
        acceptStatus: 0,
        routedBy: [updateFields?.lastSource],

        // ...(updateFields.classification === 3 && {
        //   routedBy: JSON.stringify([updateFields?.lastSource]),
        // }),
      });

      if (!routedDocs) {
        const error = new Error("Error routing the document.");
        error.statusCode = 400;
        throw error;
      }

      return routedDocs;
    });

    const routedDocuments = await Promise.all(routedPromises);

    return routedDocuments;
  } catch (error) {
    console.error("Service: Error transmitting document: ", error);
    throw error;
  }
}

async function acceptDocuments(documents, updateFields) {
  try {
    const acceptedDocuments = await docuDao.acceptDocuments(
      documents,
      updateFields,
    );

    return acceptedDocuments;
  } catch (error) {
    console.error(`Service: Error accepting documents: ${error.message}`);
    throw error;
  }
}

/*
// --- REVERT BACKUP: ANNOTATIONS by Shaun DEV ---
// The following functions were moved to annotations-service.js

async function annotateDocument(data) {
  try {
    const { docuId, annotation, ...otherDetails } = data;

    if (!docuId || !annotation) {
      const error = new Error(
        "Missing required parameters: docuId or annotation",
      );
      error.statusCode = 400;
      throw error;
    }

    const annotatedDoc = await docuDao.annotateDocument(docuId, {
      ...otherDetails,
      annotation,
    });

    if (!annotatedDoc) {
      const error = new Error("Error annotating the document.");
      error.statusCode = 400;
      throw error;
    }

    return annotatedDoc;
  } catch (error) {
    console.error("Service: Error adding document:", error);
    throw error;
  }
}

async function updateAnnotation(data) {
  try {
    const { docuId, annotation, ...otherDetails } = data;

    if (!annotation) {
      const error = new Error(
        "Missing required parameters: docuId or annotation",
      );
      error.statusCode = 400;
      throw error;
    }

    const updatedAnnotation = await docuDao.updateAnnotation(docuId, {
      ...otherDetails,
      annotation,
    });

    if (!updatedAnnotation) {
      const error = new Error("Error updating the annotation.");
      error.statusCode = 400;
      throw error;
    }

    return updatedAnnotation;
  } catch (error) {
    console.error("Service: Error updating annotation:", error);
    throw error;
  }
}

async function deleteAnnotation(annotationId) {
  try {
    const deletedAnnotation = await docuDao.deleteAnnotation(annotationId);

    if (!deletedAnnotation) {
      const error = new Error("Error deleting the annotation.");
      error.statusCode = 400;
      throw error;
    }

    return deletedAnnotation;
  } catch (error) {
    console.error("Service: Error deleting annotation:", error);
    throw error;
  }
}
*/

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

// async function returnDocument(data) {
//   try {
//     const { docuId, annotation, seqNo, ...otherDetails } = data;

//     if (!docuId || !annotation?.annotation) {
//       const error = new Error(
//         "Missing required parameters: docuId or annotation"
//       );
//       error.statusCode = 400;
//       throw error;
//     }

//     const returnedDocument = await updateDocument(docuId, {
//       ...otherDetails,
//       annotation,
//       seqNo: seqNo - 1,
//       ...(data.lastSource && { lastSource: data.lastSource }),
//     });

//     if (!returnedDocument) {
//       const error = new Error("Error returning the document.");
//       error.statusCode = 400;
//       throw error;
//     }

//     return returnedDocument;
//   } catch (error) {
//     console.error("Service: Error returning document:", error);
//     throw error;
//   }
// }

async function revertDocument(docuId, data, remarks) {
  try {
    const revertedDocument = await docuDao.revertDocument(
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
        // ...otherDetails,
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

      // Check if the new file exists before proceeding
      if (!fs.existsSync(newFilePath)) {
        throw new Error(`File does not exist at path: ${newFilePath}`);
      }

      // Delete the existing files in parsedFiles
      fileDocuments.forEach((file) => {
        if (file) {
          const filePath = path.join(__dirname, `../../../uploads/${file}`); // Ensure correct path

          try {
            fs.unlinkSync(filePath);
          } catch (err) {
            if (err.code !== "ENOENT") {
              // If the error is something other than "file not found", rethrow the error
              throw err;
            }
            // If file is not found (ENOENT), do nothing
          }
        }
      });

      // Update the document in the database
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

    // Check if file exists before proceeding
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
          // Fallback to hardcoded name if SDS user not found
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
          // Fallback to hardcoded name if SDS user not found
          nameToDetect = "Homer N. Mendoza";
          timesDetected = await getTimesDetected(textContent, nameToDetect);
        }
      }

      if (textContent?.items?.length > 0 && timesDetected > 0) {
        isReadable = true;
        hasSDSName = true;
      }
    }

    // Check system setting for accepting documents without SDS name
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

// System settings functions
async function getSystemSetting(key, defaultValue = null) {
  try {
    const setting = await docuDao.getSystemSetting(key);

    if (!setting || !setting.isActive) return defaultValue;

    // Try to parse as JSON, fallback to string
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

async function addDocument(file, data) {
  const fileName = file ? file.filename : "";
  const filePath = file ? file.path : "";

  try {
    if (data.file) {
      delete data.file;
    }

    const parsedComplexity = parseInt(data.complexity, 10);

    const lpsNo = await generateLPSNo();

    const createdDocu = await docuDao.addDocument({
      ...data,
      files: [fileName],
      lpsNo,
      primarySources: data?.primarySources,
      complexity: parsedComplexity,
      ...(data.acceptStatus && {
        acceptStatus: parseInt(data.acceptStatus, 10),
      }),
    });

    return createdDocu;
  } catch (error) {
    console.error(`Service: Error adding document: ${error.message}`);

    // If there's an error, delete the uploaded file
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath); // Synchronously delete the file
      }
    } catch (fileDeleteError) {
      console.error(`Service: Error deleting file: ${fileDeleteError.message}`);
    }

    throw error; // Re-throw the error to handle it further upstream if needed
  }
}

async function getDocumentsCount(auth) {
  try {
    const docsCount = await docuDao.getDocumentsCount(auth);

    return docsCount;
  } catch (error) {
    console.error("Service: Error getting documents count", error);
    throw error;
  }
}

async function getAllDocumentsCount() {
  try {
    const allDocsCount = await docuDao.getAllDocumentsCount();

    return allDocsCount;
  } catch (error) {
    console.error("Service: Error getting all documents count", error);
    throw error;
  }
}

async function allAdminDetailsCount() {
  try {
    const allAdminsCount = await docuDao.allAdminDetailsCount();

    return allAdminsCount;
  } catch (error) {
    console.error("Service: Error getting all admins count", error);
    throw error;
  }
}

async function getAllDocuments() {
  try {
    const documents = await docuDao.getAllDocuments();

    return documents;
  } catch (error) {
    console.error("Service: Error fetching documents", error);
    throw error;
  }
}

async function getSpecificDocuments(auth, category) {
  try {
    const documents = await docuDao.getSpecificDocuments(auth, category);

    return documents;
  } catch (error) {
    console.error("Service: Error fetching documents", error);
    throw error;
  }
}

async function getDocumentById(docuId) {
  try {
    const fetchedDocument = await docuDao.getDocumentById(docuId);

    return fetchedDocument;
  } catch (error) {
    console.error("Service: Error fetching document", error);
    throw error;
  }
}

/*
async function updateDocument(docuId, data) {
  try {
    const oldDocDetails = await docuDao.getDocumentById(docuId);

    const oldLastSource = oldDocDetails.lastSource;

    let newLastSource = [...oldDocDetails.lastSource];

    if (oldLastSource.length === 1) {
      newLastSource.push(data?.lastSource);
    } else {
      newLastSource = newLastSource.slice(1);

      newLastSource.push(data?.lastSource);
    }

    const updateObject = {
      ...data,
      ...(data.lastSource && { lastSource: newLastSource }),
    };

    const updatedDocument = await docuDao.updateDocument(docuId, updateObject);

    return updatedDocument;
  } catch (error) {
    console.error("Service: Error updating document", error);
    throw error;
  }
}
*/


async function patchUpdateDocuments(documents, updateFields) {
  try {
    const updatedDocsPromises = documents.map(async (data) => {
      const { id } = data;

      const updatedDocs = await updateDocument(id, updateFields);

      if (!updatedDocs) {
        const error = new Error("Error patch updating documents.");
        error.statusCode = 400;
        throw error;
      }

      return updatedDocs;
    });

    const updatedDocuments = await Promise.all(updatedDocsPromises);

    return updatedDocuments;
  } catch (error) {
    console.error("Service: Error patch updating document: ", error);
    throw error;
  }
}

async function deleteDocuments(data) {
  try {
    const { documents } = data;

    const deletedDocument = await docuDao.deleteDocuments(documents);

    return deletedDocument;
  } catch (error) {
    console.error("Service: Error deleting documents", error);
    throw error;
  }
}

async function filterDocLogs(filters) {
  try {
    const documents = await docuDao.filterDocLogs(filters);

    return documents;
  } catch (error) {
    console.error("Service: Error fetching document logs", error);
    throw error;
  }
}

async function recentDocuments() {
  try {
    const fetchedDocus = await docuDao.recentDocuments();

    return fetchedDocus;
  } catch (error) {
    console.error("Service: Error fetching document logs", error);
    throw error;
  }
}

module.exports = {
  signWithCoordinates,
  manualSignPNPKI,
  premiumSignPdf,
  premiumInitializeDocument,
  signPdf,
  initializePdf,
  autoSignPNPKI,
  undoLastDocumentAction,
  reviseDocument,
  transmitDocs,
  routeDocuments,
  acceptDocuments,
  // annotateDocument,
  // updateAnnotation,
  // deleteAnnotation,
  holdDocument,
  rerouteDocument,
  saveDocument,
  returnDocs,
  revertDocument,
  attachDocument,
  validateDocument,
  markAsDone,
  getSystemSetting,
  updateSystemSetting,
  getAllSystemSettings,

  addDocument,
  getDocumentsCount,
  getAllDocumentsCount,
  getAllDocuments,
  getSpecificDocuments,
  allAdminDetailsCount,
  getDocumentById,
  updateDocument,
  patchUpdateDocuments,
  deleteDocuments,

  filterDocLogs,
  recentDocuments,
};
