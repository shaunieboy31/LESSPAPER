const { PDFDocument } = require("pdf-lib");
const fs = require("fs");
const path = require("path");
const docuDao = require("../daos/documents-dao");
const { formatToPHTime } = require("../../../middlewares/phtimezone");
const { 
  getTextContentFromPage, 
  getTimesDetected, 
  isNameFollowedByTitle, 
  findTextPosition, 
  calculateCenteredX 
} = require("../utils/pdf-utils");
const { updateDocument } = require("../utils/doc-utils");

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

    const existingPdfBytes = fs.readFileSync(filePath);

    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    const imgPath = path.resolve(__dirname, `../../..${signPath}`);
    if (!fs.existsSync(imgPath)) {
      throw new Error(
        `Signature/Initial not found: ${signPath}`,
      );
    }

    const imgBytes = fs.readFileSync(imgPath);
    const signImage = await pdfDoc.embedPng(imgBytes);

    const pageToSign = pdfDoc.getPage(page - 1);
    const pageHeight = pageToSign.getHeight();
    const { x, y, width, height } = signaturePosition;
    const pdfOffset = (input) => input / 8;

    pageToSign.drawImage(signImage, {
      x: x - pdfOffset(width),
      y: pageHeight - y - height + pdfOffset(height),
      width,
      height,
    });

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

    const fileDocuments = selectedDocument?.files?.some((files) => files !== "")
      ? selectedDocument.files
      : [];

    let newFileDocs = fileDocuments || [];

    if (newFileDocs.length < 3) {
      newFileDocs.push(fileNameWithNewIdentifier);
    } else {
      const oldestFilePath = path.join(
        __dirname,
        `../../../uploads/${newFileDocs[0]}`,
      );

      try {
        fs.unlinkSync(oldestFilePath);
      } catch (err) {
        if (err.code !== "ENOENT") {
          throw err;
        }
      }

      newFileDocs.shift();
      newFileDocs.push(fileNameWithNewIdentifier);
    }

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
    console.error("Signing Service: Error signing the PDF:", error);
    throw error;
  }
}

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

    const existingPdfBytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const pageToSign = pdfDoc.getPage(page - 1);
    const pageHeight = pageToSign.getHeight();

    const signImgPath = path.resolve(__dirname, `../../..${signPath}`);
    if (!fs.existsSync(signImgPath)) {
      throw new Error(`Signature/Initial not found: ${signPath}`);
    }

    const imgBytes = fs.readFileSync(signImgPath);
    const signImage = await pdfDoc.embedPng(imgBytes);

    if (signatureImage) {
      try {
        if (!signatureImage || typeof signatureImage !== "string") {
          throw new Error("Invalid signature image data");
        }

        const imageBuffer = Buffer.from(signatureImage, "base64");
        if (imageBuffer.length === 0) {
          throw new Error("Empty signature image data");
        }

        const signaturePdfImage = await pdfDoc.embedPng(imageBuffer);
        const { x, y, width, height } = signaturePosition;

        pageToSign.drawImage(signaturePdfImage, {
          x: x,
          y: pageHeight - y - height + 10,
          width,
          height,
        });

        const form = pdfDoc.getForm();
        const timestamp = Date.now();
        const signatureField = form.createTextField(
          `pki_cms_signature_${timestamp}`,
        );
        signatureField.setText(updateFields.signature || "");
        signatureField.addToPage(pageToSign, {
          x: x + 1,
          y: pageHeight - y - height + 11,
          width: 0.1,
          height: 0.1,
        });
        signatureField.enableReadOnly();
      } catch (imageError) {
        throw new Error(
          `Error embedding signature image: ${imageError.message || imageError}`,
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

    const fileDocuments = selectedDocument?.files?.some((files) => files !== "")
      ? selectedDocument.files
      : [];

    let newFileDocs = fileDocuments || [];

    if (newFileDocs.length < 3) {
      newFileDocs.push(fileNameWithNewIdentifier);
    } else {
      const oldestFilePath = path.join(
        __dirname,
        `../../../uploads/${newFileDocs[0]}`,
      );

      try {
        fs.unlinkSync(oldestFilePath);
      } catch (err) {
        if (err.code !== "ENOENT") {
          throw err;
        }
      }

      newFileDocs.shift();
      newFileDocs.push(fileNameWithNewIdentifier);
    }

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
    console.error("Signing Service: Error in manualSignPNPKI:", error);
    throw error;
  }
}

async function premiumSignPdf(docuId, updateFields) {
  try {
    const {
      fileName,
      page,
      fullName,
      coordinates,
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

    const existingPdfBytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    const imgPath = path.resolve(__dirname, `../../..${signPath}`);
    if (!fs.existsSync(imgPath)) {
      throw new Error(`Signature for ${fullName} not found: ${signPath}`);
    }

    const imgBytes = fs.readFileSync(imgPath);
    const signImage = await pdfDoc.embedPng(imgBytes);
    const { width: signWidth, height: signHeight } = signImage.scale(0.1);

    const pageToSign = pdfDoc.getPage(page - 1);
    const pageHeight = pageToSign.getHeight();

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
    const parsedPath = path.parse(fileName);
    const cleanedFileName = parsedPath.name.replace(/^\d+/, "");
    const newIdentifier = Date.now();
    const fileNameWithNewIdentifier = `${newIdentifier}${cleanedFileName}${parsedPath.ext}`;
    const signedPdfPath = path.join(
      __dirname,
      `../../../uploads/${fileNameWithNewIdentifier}`,
    );

    fs.writeFileSync(signedPdfPath, signedPdfBytes);

    const fileDocuments = selectedDocument?.files?.some((files) => files !== "")
      ? selectedDocument.files
      : [];

    let newFileDocs = fileDocuments || [];

    if (newFileDocs.length < 3) {
      newFileDocs.push(fileNameWithNewIdentifier);
    } else {
      const oldestFilePath = path.join(
        __dirname,
        `../../../uploads/${newFileDocs[0]}`,
      );

      try {
        fs.unlinkSync(oldestFilePath);
      } catch (err) {
        if (err.code !== "ENOENT") {
          throw err;
        }
      }

      newFileDocs.shift();
      newFileDocs.push(fileNameWithNewIdentifier);
    }

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
    console.error("Signing Service: Error signing the PDF:", error);
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

    const existingPdfBytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

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
    let amountToMoveRight = 0;

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
    const parsedPath = path.parse(fileName);
    const cleanedFileName = parsedPath.name.replace(/^\d+/, "");
    const newIdentifier = Date.now();
    const fileNameWithNewIdentifier = `${newIdentifier}${cleanedFileName}${parsedPath.ext}`;
    const signedPdfPath = path.join(
      __dirname,
      `../../../uploads/${fileNameWithNewIdentifier}`,
    );

    fs.writeFileSync(signedPdfPath, signedPdfBytes);

    const fileDocuments = selectedDocument?.files?.some((files) => files !== "")
      ? selectedDocument.files
      : [];

    let newFileDocs = fileDocuments || [];

    if (newFileDocs.length < 3) {
      newFileDocs.push(fileNameWithNewIdentifier);
    } else {
      const oldestFilePath = path.join(
        __dirname,
        `../../../uploads/${newFileDocs[0]}`,
      );

      try {
        fs.unlinkSync(oldestFilePath);
      } catch (err) {
        if (err.code !== "ENOENT") {
          throw err;
        }
      }

      newFileDocs.shift();
      newFileDocs.push(fileNameWithNewIdentifier);
    }

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
    console.error("Signing Service: Error signing the PDF:", error);
    throw error;
  }
}

async function signPdf(docuId, updateFields) {
  const pdfjsLib = require("pdfjs-dist/build/pdf.js");
  const { standardFontDataUrl } = require("../utils/pdf-utils");

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

    const existingPdfBytes = fs.readFileSync(filePath);

    const loadingTask = pdfjsLib.getDocument({
      data: existingPdfBytes,
      standardFontDataUrl,
    });

    const pdfDocument = await loadingTask.promise;
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    const imgPath = path.resolve(__dirname, `../../..${signPath}`);
    if (!fs.existsSync(imgPath)) {
      throw new Error(`Signature for ${uppercasedName} not found: ${signPath}`);
    }

    const imgBytes = fs.readFileSync(imgPath);
    const signImage = await pdfDoc.embedPng(imgBytes);
    const { width: signWidth, height: signHeight } = signImage.scale(0.1);

    const pageToSign = pdfDoc.getPage(page - 1);
    const pageWidth = pageToSign.getWidth();
    const textContent = await getTextContentFromPage(pdfDocument, page - 1);

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

      pageToSign.drawImage(signImage, {
        x: centeredX - 100,
        y: position.y - signHeight + addedValue - 40,
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
    const parsedPath = path.parse(fileName);
    const cleanedFileName = parsedPath.name.replace(/^\d+/, "");
    const newIdentifier = Date.now();
    const fileNameWithNewIdentifier = `${newIdentifier}${cleanedFileName}${parsedPath.ext}`;
    const signedPdfPath = path.join(
      __dirname,
      `../../../uploads/${fileNameWithNewIdentifier}`,
    );

    fs.writeFileSync(signedPdfPath, signedPdfBytes);

    const fileDocuments = selectedDocument?.files?.some((files) => files !== "")
      ? selectedDocument.files
      : [];

    let newFileDocs = fileDocuments || [];

    if (newFileDocs.length < 3) {
      newFileDocs.push(fileNameWithNewIdentifier);
    } else {
      const oldestFilePath = path.join(
        __dirname,
        `../../../uploads/${newFileDocs[0]}`,
      );

      try {
        fs.unlinkSync(oldestFilePath);
      } catch (err) {
        if (err.code !== "ENOENT") {
          throw err;
        }
      }

      newFileDocs.shift();
      newFileDocs.push(fileNameWithNewIdentifier);
    }

    const signedDocument = await updateDocument(docuId, {
      files: newFileDocs,
      status,
      autoInitials: newInitialSignatories.length ? newInitialSignatories : null,
      signedDateTime: formatToPHTime(new Date()),
      ...(destinations && { destinations }),
      ...(lastSource && { lastSource }),
      ...(lastSource &&
        (lastSource.id === 1 || lastSource.id === 2) && { acceptStatus: 0 }),
      remarks,
    });

    return signedDocument;
  } catch (error) {
    console.error("Signing Service: Error signing the PDF:", error);
    throw error;
  }
}

async function initializePdf(docuId, updateFields) {
  const pdfjsLib = require("pdfjs-dist/build/pdf.js");
  const { standardFontDataUrl } = require("../utils/pdf-utils");

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

    const existingPdfBytes = fs.readFileSync(filePath);

    const loadingTask = pdfjsLib.getDocument({
      data: existingPdfBytes,
      standardFontDataUrl,
    });

    const pdfDocument = await loadingTask.promise;
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
        nameToDetect = "HOMER N. MENDOZA";
        timesDetected = await getTimesDetected(textContent, nameToDetect);
      }
    }

    if (timesDetected === 0) {
      try {
        nameToDetect = sdsUser.fullName;
        timesDetected = await getTimesDetected(textContent, nameToDetect);
      } catch (error) {
        nameToDetect = "Homer N. Mendoza";
        timesDetected = await getTimesDetected(textContent, nameToDetect);
      }
    }

    if (timesDetected !== 0) {
      nameDetected = true;
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
      const ASDSIncludedInDestinations = docDestinations.some((dest) => dest.id === 2);
      const CIDIncludedInDestinations = docDestinations.some((dest) => dest.id === 13);
      const SGODIncludedInDestinations = docDestinations.some((dest) => dest.id === 21);

      let xValue = centeredX;
      let yValue = position.y - signHeight;
      let amountToMoveRight = 0;

      if (signType === "initial") {
        if (ASDSIncludedInDestinations) {
          yValue += 10;
        } else if (CIDIncludedInDestinations) {
          yValue -= 10;
          xValue += 40;
        } else if (SGODIncludedInDestinations) {
          yValue -= 35;
          xValue += 53;
        } else {
          yValue -= 40;
          xValue -= position.nameWidth - 50;

          if (newInitialSignatories.length >= 1) {
            amountToMoveRight = (signWidth - 5) * (newInitialSignatories.length - 1);
          }
          xValue += amountToMoveRight;
        }
      }

      if (nameToDetect === uppercasedName) {
        const signOccupiedSpace = (nameToDetect?.length + 10) * 2 + 10;
        xValue = centeredX - signOccupiedSpace;
        yValue = position.y - signHeight + 40;
      }

      pageToSign.drawImage(signImage, {
        x: xValue,
        y: yValue,
        width: signWidth,
        height: signHeight,
      });

      pageToSign.drawImage(signImage, {
        x: xValue,
        y: yValue,
        width: signWidth,
        height: signHeight,
      });
    } else {
      throw new Error(`Something went wrong with detecting the text ${nameToDetect}. `);
    }

    if (!nameDetected) {
      throw new Error(`Could not find the text: ${uppercasedName} in the PDF.`);
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

    const fileDocuments = selectedDocument?.files?.some((files) => files !== "")
      ? selectedDocument.files
      : [];

    let newFileDocs = fileDocuments || [];
    if (newFileDocs.length < 3) {
      newFileDocs.push(fileNameWithNewIdentifier);
    } else {
      const oldestFilePath = path.join(__dirname, `../../../uploads/${newFileDocs[0]}`);
      try {
        fs.unlinkSync(oldestFilePath);
      } catch (err) {
        if (err.code !== "ENOENT") throw err;
      }
      newFileDocs.shift();
      newFileDocs.push(fileNameWithNewIdentifier);
    }

    const signedDocument = await updateDocument(docuId, {
      files: newFileDocs,
      autoInitials: newInitialSignatories.length ? newInitialSignatories : null,
      status,
      ...(lastSource && (lastSource.id === 1 || lastSource.id === 2) && { acceptStatus: 0 }),
      ...(destinations && { destinations }),
      ...(lastSource && { lastSource }),
      remarks,
    });

    return signedDocument;
  } catch (error) {
    console.error("Signing Service: Error initializing the PDF:", error);
    throw error;
  }
}

async function autoSignPNPKI(docuId, data) {
  const pdfjsLib = require("pdfjs-dist/build/pdf.js");
  const { standardFontDataUrl } = require("../utils/pdf-utils");

  try {
    const {
      fileName,
      page,
      fullName,
      titlesToCheck,
      signedBy,
      signature,
      signatureImage,
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
    const { width: pageWidth } = pageToSign.getSize();

    const textContent = await getTextContentFromPage(pdfDocument, page - 1);

    let nameToDetect = uppercasedName;
    let timesDetected = await getTimesDetected(textContent, nameToDetect);

    if (timesDetected === 0) {
      nameToDetect = fullName;
      timesDetected = await getTimesDetected(textContent, nameToDetect);
    }

    if (timesDetected === 0) {
      throw new Error(`PDF not signed: Name ${nameToDetect} is not detected on the page`);
    }

    const isNameWithTitle = await isNameFollowedByTitle(
      textContent,
      nameToDetect,
      timesDetected,
      titlesToCheck,
    );

    let position = { x: null, y: null, nameWidth: 0 };
    if (isNameWithTitle) {
      position = await findTextPosition(textContent, nameToDetect, timesDetected);
    } else {
      throw new Error(`Name ${uppercasedName} not followed by titles`);
    }

    if (position.nameWidth < 0 || position.nameWidth > pageWidth) {
      if (position.nameWidth > 12000) throw new Error(`Name ${nameToDetect} incorrectly detected`);
      position.nameWidth = 229;
    }

    if (signatureImage) {
      try {
        const imageBuffer = Buffer.from(signatureImage, "base64");
        const signaturePdfImage = await pdfDoc.embedPng(imageBuffer);
        const { width: signatureWidth } = signaturePdfImage.scale(1);

        const centeredX = await calculateCenteredX(
          pageWidth,
          position.x - position.nameWidth / 2 + 20,
          position.nameWidth,
          signatureWidth,
        );

        pageToSign.drawImage(signaturePdfImage, {
          x: centeredX,
          y: position.y,
          width: position.nameWidth - 50,
          height: 60,
        });

        const form = pdfDoc.getForm();
        const timestamp = Date.now();
        const signatureField = form.createTextField(`pki_cms_signature_${timestamp}`);
        signatureField.setText(signature);
        signatureField.addToPage(pageToSign, {
          x: centeredX + 1,
          y: position.y + 11,
          width: 0.1,
          height: 0.1,
        });
        signatureField.enableReadOnly();
      } catch (imageError) {
        throw new Error(`Failed to embed signature image: ${imageError.message}`);
      }
    }

    const signedPdfBytes = await pdfDoc.save();
    const parsedPath = path.parse(fileName);
    const cleanedFileName = parsedPath.name.replace(/^\d+/, "");
    const newIdentifier = Date.now();
    const fileNameWithNewIdentifier = `${newIdentifier}${cleanedFileName}${parsedPath.ext}`;
    const signedPdfPath = path.join(__dirname, `../../../uploads/${fileNameWithNewIdentifier}`);
    fs.writeFileSync(signedPdfPath, signedPdfBytes);

    const fileDocuments = selectedDocument?.files?.some((files) => files !== "")
      ? selectedDocument.files
      : [];
    let newFileDocs = fileDocuments || [];

    if (newFileDocs.length < 3) {
      newFileDocs.push(fileNameWithNewIdentifier);
    } else {
      const oldestFilePath = path.join(__dirname, `../../../uploads/${newFileDocs[0]}`);
      try {
        fs.unlinkSync(oldestFilePath);
      } catch (err) {
        if (err.code !== "ENOENT") throw err;
      }
      newFileDocs.shift();
      newFileDocs.push(fileNameWithNewIdentifier);
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
    console.error("Signing Service: Error signing the PDF with PKI:", error);
    throw error;
  }
}

async function undoLastDocumentAction(docuId, data) {
  try {
    const {
      files = [],
      autoInitials = [],
      manualInitials = [],
    } = await docuDao.getDocumentById(docuId);

    const lastFile = files.pop();
    if (lastFile) {
      const lastFilePath = path.join(__dirname, `../../../uploads/${lastFile}`);
      try {
        fs.unlinkSync(lastFilePath);
      } catch (err) {
        console.error(`Signing Service: Error removing file ${lastFile}:`, err);
      }
    }

    const updateInitials = (initials) =>
      initials.filter((signatory) => signatory.id !== data?.actionBy?.id);

    const unitExists = autoInitials?.some((signatory) => signatory.id === data?.actionBy?.id)
      ? "auto"
      : manualInitials?.some((signatory) => signatory.id === data?.actionBy?.id)
        ? "manual"
        : null;

    const updatedDocument = await docuDao.updateDocument(docuId, {
      files,
      currentOwner: [{ id: 0, destination: 0, type: 0 }],
      status: 1,
      acceptStatus: 0,
      ...(unitExists === "auto" && { autoInitials: updateInitials(autoInitials) }),
      ...(unitExists === "manual" && { manualInitials: updateInitials(manualInitials) }),
      ...(data?.actionBy?.id === 1 && {
        destinations: [data?.actionBy],
        signedDateTime: null,
      }),
      remarks: data?.remarks,
    });

    return updatedDocument;
  } catch (error) {
    console.error("Signing Service: Error in undo!", error);
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
};
