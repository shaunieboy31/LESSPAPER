const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const fs = require("fs");
const path = require("path");
const { formatToPHTime } = require("../../../middlewares/phtimezone");

const SDSSecIds = [4];
const ASDSSecIds = [7];

async function getSystemSetting(key) {
  try {
    const setting = await prisma.systemsettings.findUnique({
      where: { key },
    });

    return setting;
  } catch (error) {
    console.error("DAO: Error getting system setting:", error);
    throw error;
  }
}

async function updateSystemSetting(key, value, updatedBy) {
  try {
    const setting = await prisma.systemsettings.upsert({
      where: { key },
      update: {
        value,
        updatedBy,
        updatedAt: new Date(),
      },
      create: {
        key,
        value,
        updatedBy,
        category: "documents",
        description: "System setting for document validation",
      },
    });

    return setting;
  } catch (error) {
    console.error("DAO: Error updating system setting:", error);
    throw error;
  }
}

async function getAllSystemSettings() {
  try {
    const settings = await prisma.systemsettings.findMany({
      where: { isActive: true },
      orderBy: [{ category: "asc" }, { key: "asc" }],
    });

    return settings;
  } catch (error) {
    console.error("DAO: Error getting all system settings:", error);
    throw error;
  }
}

module.exports = {
  getSystemSetting,
  updateSystemSetting,
  getAllSystemSettings
};
