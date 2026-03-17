const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function getUserByUsername(username) {
  try {
    const fetcheduser = await prisma.users.findUnique({
      where: {
        username: username,
      },
    });

    return fetcheduser;
  } catch (error) {
    console.error("Error Authentication", error);
    throw new Error(error);
  }
}

async function getOfficeByID(officeId) {
  try {
    const fetchedOffice = await prisma.offices.findUnique({
      where: {
        id: officeId,
      },
    });
    return fetchedOffice;
  } catch (error) {
    console.error("Error Fetching Office", error);
    throw new Error(error);
  }
}

async function getUnitByID(unitId) {
  try {
    const fetchedUnit = await prisma.units.findUnique({
      where: {
        id: unitId,
      },
    });
    return fetchedUnit;
  } catch (error) {
    console.error("Error Fetching Office", error);
    throw new Error(error);
  }
}

async function createUser(data) {
  try {
    const createdUser = await prisma.users.create({
      data,
    });
    return createdUser;
  } catch (error) {
    console.error("Error creating user", error);
    throw new Error(error);
  }
}

async function uploadUserSignature(id, data) {
  try {
    const updatedUser = await prisma.users.update({
      where: {
        uid: id,
      },
      data,
    });

    return updatedUser;
  } catch (error) {
    console.error("Error Updating User Signature", error);
    throw new Error(error);
  }
}

async function updateUser(id, data, officeInfo, unitInfo) {
  try {
    if (data.editor) {
      delete data.editor;
    }
    if (data.newPassword) {
      delete data.newPassword;
    }

    if (data.sign) {
      delete data.sign;
    }

    if (data.initial) {
      delete data.initial;
    }
    if (data.pnpkicert) {
      delete data.pnpkicert;
    }
    if (data.pnpkiPassword) {
      delete data.pnpkiPassword;
    }

    const updatedUser = await prisma.users.update({
      where: {
        uid: id,
      },
      data: {
        ...data,
        ...(officeInfo && {
          officeId: officeInfo.id,
          officeName: officeInfo.office,
        }),
        ...(unitInfo
          ? { unitId: unitInfo.id, unitName: unitInfo.unit }
          : { unitId: null, unitName: null }),
      },
    });

    return updatedUser;
  } catch (error) {
    console.error("Error updating user", error);
    throw new Error(error);
  }
}

async function changePassword(id, data) {
  try {
    const { editor, newPassword, changePass, ...otherUserDetails } = data;

    const updatedUser = await prisma.users.update({
      where: {
        uid: id,
      },
      data: {
        ...otherUserDetails,
        ...(changePass !== undefined && { changePass: parseInt(changePass) }),
      },
    });

    return updatedUser;
  } catch (error) {
    console.error("Error updating user", error);
    throw error;
  }
}

async function saveRefreshToken(id, data) {
  try {
    const updatedUser = await prisma.users.update({
      where: {
        uid: id,
      },
      data,
    });

    return updatedUser;
  } catch (error) {
    console.error("Error saving refresh token", error);
    throw new Error(error);
  }
}

async function registerFaceData(uid, data) {
  try {
    const updatedUser = await prisma.users.update({
      where: {
        uid,
      },
      data,
    });

    return updatedUser;
  } catch (error) {
    console.error("Error updating user", error);
    throw new Error(error);
  }
}

async function getAllUsers() {
  try {
    const allUsers = await prisma.users.findMany();

    return allUsers;
  } catch (error) {
    console.error("Error fetching Users' Data", error);
    throw new Error(error);
  }
}

async function getUserById(uid) {
  try {
    const fetchedUser = await prisma.users.findUnique({
      where: {
        uid: parseInt(uid),
      },
    });

    return fetchedUser;
  } catch (error) {
    console.error("Error fetching User's Data", error);
    throw new Error(error);
  }
}

async function deleteUserById(uid) {
  try {
    const deletedUser = await prisma.users.delete({
      where: {
        uid: parseInt(uid),
      },
    });

    return deletedUser;
  } catch (error) {
    console.error("Error deleting Users Data", error);
    throw new Error(error);
  }
}

module.exports = {
  getUserByUsername,
  getOfficeByID,
  getUnitByID,
  createUser,
  uploadUserSignature,
  updateUser,
  changePassword,
  saveRefreshToken,
  registerFaceData,
  getAllUsers,
  getUserById,
  deleteUserById,
};
