console.log("Starting the server...");

const express = require("express");
const { PrismaClient } = require("@prisma/client");
const Routes = require("./src/middlewares/routes-config");
const clear = require("clear");
const fs = require("fs");
const https = require("https");
require("dotenv").config();
const { Server } = require("socket.io");
require("./cron");
const { format } = require("date-fns");
const { getCutoffEnabled } = require("./lib/utils/settingsState");

const app = express();

// Security Packages
const cors = require("cors");
const corsOptions = require("./src/middlewares/corsConfig/corsOptions");
const cookieParser = require("cookie-parser");
const credentials = require("./src/middlewares/corsConfig/credentials");
const path = require("path");
const prisma = new PrismaClient();

// Handle errors from the PrismaClient
prisma.$on("error", (error) => {
  console.error("PrismaClient error:", error);
});

const port = process.env.PORT || 8020;
const host = process.env.HOST || "localhost";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// app.use(helmet()); // Temporarily disabled for testing

// Handle options credentials check - before CORS!
// and fetch cookies credentials requirement
app.use(credentials);

// Cross Origin Resource Sharing
app.use(cors(corsOptions));
app.use(cookieParser());

// Log middleware execution
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    `default-src 'self'; img-src 'self' http://${host}:${port}; script-src 'self'; style-src 'self';`,
  );
  next();
});

// Serve static files from the "eSignatures" directory inside "src"
// const staticFilesPath = path.join(__dirname, "src", "eSignatures\\"); // development
const eSignDirectory = path.join(__dirname, "src", "eSignatures"); // production

const signaturesDir = path.join(__dirname, "src/eSignatures/signatures");
const initialsDir = path.join(__dirname, "src/eSignatures/initials");
const pnpkiCertsDir = path.join(__dirname, "src/eSignatures/pnpkicert");
const uploadsDirectory = path.join(__dirname, "src", "uploads"); //

app.use(
  "/eSignatures",
  (req, res, next) => {
    // Set proper MIME type for .p12 files
    if (req.path.endsWith(".p12")) {
      res.setHeader("Content-Type", "application/x-pkcs12");
    }
    next();
  },
  express.static(eSignDirectory),
);

// app.use(
//   "/signatures",
//   (req, res, next) => {
//     next();
//   },
//   express.static(signaturesDir)
// );
// app.use(
//   "/initials",
//   (req, res, next) => {
//     next();
//   },
//   express.static(initialsDir)
// );

app.use(
  "/pdfUploads",
  (req, res, next) => {
    next();
  },
  express.static(uploadsDirectory),
);

app.get("/eSignatures", (req, res) => {
  try {
    const signatures = fs
      .readdirSync(signaturesDir)
      .map((file) => `/eSignatures/signatures/${file}`);

    const initials = fs
      .readdirSync(initialsDir)
      .map((file) => `/eSignatures/initials/${file}`);

    const pnpkicerts = fs
      .readdirSync(pnpkiCertsDir)
      .map((file) => `/eSignatures/pnpkicert/${file}`);

    res.json([...signatures, ...initials, ...pnpkicerts]);
  } catch (error) {
    res.status(500).json({ error: "Unable to read image directories" });
  }
});

app.delete("/eSignatures/delete", (req, res) => {
  try {
    const { imgFilePath } = req.query;
    if (!imgFilePath) throw new Error("No file specified");

    const filePath = path.join(__dirname, "src", imgFilePath);

    fs.unlink(filePath, (err) => {
      if (err) throw err;
      res.json({ success: true, message: "Signature deleted successfully" });
    });
  } catch (error) {
    res.status(500).json({ error: error.message || "Unexpected error" });
  }
});

app.get("/user/e-signatures", (req, res) => {
  try {
    const signatures = fs
      .readdirSync(signaturesDir)
      .map((file) => `/eSignatures/signatures/${file}`);

    res.json(signatures);
  } catch (error) {
    res.status(500).json({ error: "Unable to read image directories" });
  }
});

app.get("/user/e-initials", (req, res) => {
  try {
    const initials = fs
      .readdirSync(initialsDir)
      .map((file) => `/eSignatures/initials/${file}`);

    res.json(initials);
  } catch (error) {
    res.status(500).json({ error: "Unable to read image directories" });
  }
});

app.use((req, res, next) => {
  req.prisma = prisma;
  next();
});

Routes(app);

let server;

// =========== production ===========
if (process.env.NODE_ENV === "production") {
  const options = {
    key: fs.readFileSync(
      "/etc/letsencrypt/live/lesspaper.depedimuscity.com/privkey.pem",
    ),
    cert: fs.readFileSync(
      "/etc/letsencrypt/live/lesspaper.depedimuscity.com/fullchain.pem",
    ),
  };

  server = https.createServer(options, app);
}

// =========== development ===========
else {
  server = require("http").createServer(app);
}

const io = new Server(server, {
  cors: {
    origin: "*", // Adjust this based on your frontend's origin
  },
});

function getAllRooms() {
  const rooms = io.sockets.adapter.rooms; // All rooms and their users
  const sids = io.sockets.adapter.sids; // Individual socket connections

  const roomData = [];

  for (const [roomName, users] of rooms) {
    // Ignore rooms that are individual socket IDs and those with no users
    if (!sids.has(roomName) && users.size > 0) {
      roomData.push({ roomName, userCount: users.size });
    }
  }

  return roomData;
}

// Socket.IO logic
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  const timer = setInterval(() => {
    const phDate = new Date();

    const formattedDate = format(phDate, "MMM dd, yy");
    const formattedTime = format(phDate, "hh:mm:ss a");

    let isLocked = false;
    if (getCutoffEnabled()) {
      const hours = phDate.getHours();
      const day = phDate.getDay();

      // ✅ Cutoff if weekend OR between 5 PM – 6 AM
      const isWeekend = day === 0 || day === 6;
      const isEveningOrEarlyMorning = hours >= 17 || hours < 6;

      isLocked = isWeekend || isEveningOrEarlyMorning;
    }

    socket.emit("cutOff", {
      serverDateTime: phDate.toString(),
      serverDate: formattedDate,
      serverTime: formattedTime,
      isLocked,
    });
  }, 1000);

  socket.on("joinRoom", (roomName, userId) => {
    socket.join(roomName);

    // Emit updated room data
    const roomData = getAllRooms();
    io.emit("allRoomData", roomData);
  });

  socket.on("leaveRoom", (roomName) => {
    socket.leave(roomName);

    // Emit updated room data
    const roomData = getAllRooms();
    io.emit("allRoomData", roomData);

    // socket.disconnect(true);
  });

  socket.on("allRoomData", () => {
    const roomData = getAllRooms(); // Get current room data
    // console.log("Current Room Data:", roomData);
    socket.emit("allRoomData", roomData);
  });

  socket.on("disconnect", () => {
    clearInterval(timer); // Stop the timer when the client disconnects

    const roomData = getAllRooms(); // Refresh the room data
    // console.log("Updated Room Data:", roomData);
    io.emit("allRoomData", roomData); // Emit the updated room data to all clients
    console.log("Client disconnected:", socket.id);
  });
});

// Attach the Socket.IO instance to the app for later use
app.set("socketio", io);

server.listen(port, () => {
  clear(); // Clear the terminal when the server starts
  console.log(`Server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

module.exports = { prisma };
