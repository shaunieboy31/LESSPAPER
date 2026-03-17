const cron = require("node-cron");
const { runDBBackup } = require("./cronjobs");

// --- Monthly Leave Balance Update ---
cron.schedule("0 0 1 * *", () => {
  console.log("Running database backup...");
  runDBBackup();
});
