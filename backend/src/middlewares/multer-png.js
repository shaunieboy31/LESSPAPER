const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configure Multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Determine the folder based on the field name
    let folderName;
    if (file.fieldname === "sign") {
      folderName = "signatures";
    } else if (file.fieldname === "initial") {
      folderName = "initials";
    } else if (file.fieldname === "pnpkicert") {
      folderName = "pnpkicert";
    } else {
      return cb(new Error("Invalid file field"), null);
    }

    const uploadPath = path.join(__dirname, "..", "eSignatures", folderName);

    // Ensure the upload directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// File filter to accept only PNG files
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (
    (file.fieldname === "sign" || file.fieldname === "initial") &&
    ext === ".png"
  ) {
    cb(null, true);
  } else if (file.fieldname === "pnpkicert" && ext === ".p12") {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 100, // 100 MB file size limit
  },
});

// Middleware to handle both 'sign' and 'initial' files
const uploadFiles = (req, res, next) => {
  upload.fields([
    { name: "sign", maxCount: 1 }, // Signature file
    { name: "initial", maxCount: 1 }, // Initials file
    { name: "pnpkicert", maxCount: 1 }, // PNPKICert file
  ])(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).send({ error: err.message });
    } else if (err) {
      return res.status(400).send({ error: err.message });
    }
    next();
  });
};

module.exports = uploadFiles;
