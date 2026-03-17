const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { exec } = require("child_process");
const { formatInTimeZone } = require("date-fns-tz");
const path = require("path");
const fs = require("fs");
const archiver = require("archiver");

// Load DB credentials from environment variables
const { DB_USER, DB_PASS, DB_NAME, NODE_ENV } = process.env;

// --- Run Database Backup ---
async function runDBBackup() {
  const timeZone = "Asia/Manila";
  const date = formatInTimeZone(new Date(), timeZone, "MMddyyyy"); // e.g., 07212025
  const baseBackupDir = path.join(__dirname, "../backups");
  const todayBackupDir = path.join(baseBackupDir, `lpsbackup${date}`);

  // 1. Ensure today's backup folder exists
  try {
    if (!fs.existsSync(todayBackupDir))
      fs.mkdirSync(todayBackupDir, { recursive: true });
  } catch (err) {
    console.error("❌ Failed to create backup directory:", err);
    return;
  }

  // 2. Clean up old backups if more than 5 folders exist
  try {
    const folders = fs
      .readdirSync(baseBackupDir)
      .filter((name) => name.startsWith("lpsbackup"))
      .map((name) => ({
        name,
        time: fs.statSync(path.join(baseBackupDir, name)).mtime.getTime(),
      }))
      .sort((a, b) => a.time - b.time); // oldest first

    if (folders.length >= 5) {
      const oldest = folders[0];
      const toDeletePath = path.join(baseBackupDir, oldest.name);
      fs.rmSync(toDeletePath, { recursive: true, force: true });
      console.log(`🗑️ Deleted oldest backup: ${oldest.name}`);
    }
  } catch (err) {
    console.error("❌ Failed to clean old backups:", err);
    return;
  }

  // 3. Get all tables from the DB
  let tables = [];
  try {
    const result = await prisma.$queryRawUnsafe(`SHOW TABLES`);
    tables = result.map((row) => Object.values(row)[0]);
  } catch (err) {
    console.error("❌ Failed to retrieve table list:", err);
    return;
  }

  // 4. Dump each table
  const dumpPromises = tables.map((table) => {
    return new Promise((resolve, reject) => {
      const outFile = path.join(todayBackupDir, `${table}.sql`);

      let dumpCmd = "";

      if (NODE_ENV === "development") {
        dumpCmd = `"C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe" -u${DB_USER} -p${DB_PASS} ${DB_NAME} ${table} > "${outFile}"`;
      } else if (NODE_ENV === "production") {
        dumpCmd = `mysqldump -u ${DB_USER} -p${DB_PASS} ${DB_NAME} ${table} > "${outFile}"`;
      }

      exec(dumpCmd, (error, stdout, stderr) => {
        if (error) {
          console.error(`❌ Failed to dump table '${table}':`, error.message);
          return reject(error);
        }
        if (stderr) console.log(`ℹ️ mysqldump stderr [${table}]:`, stderr);
        console.log(`✅ Dumped table: ${table}`);
        resolve();
      });
    });
  });

  try {
    await Promise.all(dumpPromises);
  } catch (err) {
    console.error("❌ Error during table dumps:", err);
    return;
  }

  // 5. Zip the folder
  const zipFilePath = `${todayBackupDir}.zip`;
  const output = fs.createWriteStream(zipFilePath);
  const archive = archiver("zip", { zlib: { level: 9 } });

  output.on("close", () => {
    console.log(
      `📦 Backup zipped: ${zipFilePath} (${archive.pointer()} total bytes)`
    );

    // Optional: delete the unzipped folder
    // fs.rmSync(todayBackupDir, { recursive: true, force: true });
    // console.log(`🧹 Deleted folder: ${todayBackupDir}`);
  });

  archive.on("error", (err) => {
    console.error("❌ Failed to create zip:", err);
  });

  archive.pipe(output);
  archive.directory(todayBackupDir, false); // false = don't include parent dir
  archive.finalize();
}

module.exports = {
  runDBBackup,
};
