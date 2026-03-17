const userDao = require("../UserAuth/user-dao");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { Buffer } = require("buffer");
require("dotenv").config();

const keyHex = Buffer.from(process.env.SECRET_KEY, "hex");

function encrypt(text, key) {
  const iv = crypto.randomBytes(16); // Initialization vector
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(key, "hex"),
    iv
  );

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  return iv.toString("hex") + ":" + encrypted; // Include the IV for decryption
}

function decrypt(encryptedText, key) {
  const parts = encryptedText.split(":");
  const iv = Buffer.from(parts[0], "hex");
  const encrypted = parts[1];

  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(key, "hex"),
    iv
  );

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

// Helper function to encrypt signPath data
function encryptSignPath(signPathData) {
  if (!signPathData || signPathData.length === 0) {
    return signPathData;
  }

  try {
    const jsonString = JSON.stringify(signPathData);
    return encrypt(jsonString, process.env.SECRET_KEY);
  } catch (error) {
    console.error("Error encrypting signPath:", error);
    return signPathData; // Return original data if encryption fails
  }
}

// Helper function to decrypt signPath data
function decryptSignPath(encryptedSignPath) {
  if (!encryptedSignPath || typeof encryptedSignPath !== "string") {
    return encryptedSignPath;
  }

  try {
    // Check if the data is encrypted (contains colon separator)
    if (!encryptedSignPath.includes(":")) {
      // If no colon, it might be old unencrypted data, try to parse as JSON
      return JSON.parse(encryptedSignPath);
    }

    const decryptedJson = decrypt(encryptedSignPath, process.env.SECRET_KEY);
    return JSON.parse(decryptedJson);
  } catch (error) {
    console.error("Error decrypting signPath:", error);
    // If decryption fails, try to parse as regular JSON (for backward compatibility)
    try {
      return JSON.parse(encryptedSignPath);
    } catch (parseError) {
      console.error("Error parsing signPath as JSON:", parseError);
      return encryptedSignPath; // Return original data if all parsing fails
    }
  }
}

function generateRandomPassword(length = 10) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    password += chars[randomIndex];
  }
  return password;
}

// =====================================================

async function authenticateUser(username, password) {
  try {
    const user = await userDao.getUserByUsername(username);
    if (!user) {
      const error = new Error("Username not found");
      error.statusCode = 404;
      throw error;
    }

    // const decryptedPassword = decrypt(user.password, keyHex);

    // console.log({ password, decryptedPassword });

    // const validPassword = password === decryptedPassword;
    // const validPassword = password === user.password;
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      const error = new Error("Invalid password");
      error.statusCode = 401;
      throw error;
    }

    // const accessToken = jwt.sign(
    //   {
    //     UserInfo: {
    //       username: user.username,
    //       role: user.role,
    //     },
    //   },
    //   process.env.ACCESS_TOKEN_SECRET,
    //   { expiresIn: "30s" }
    // );
    // const refreshToken = jwt.sign(
    //   { username: user.username },
    //   process.env.REFRESH_TOKEN_SECRET,
    //   {
    //     expiresIn: "60s",
    //   }
    // );

    // await userDao.saveRefreshToken(user.uid, { refreshToken });

    const fetchedUser = { ...user, signPath: decryptSignPath(user.signPath) };

    return fetchedUser;

    // return user;
  } catch (error) {
    throw error;
  }
}

async function logout(refreshToken) {
  try {
    if (!refreshToken) {
      return res.sendStatus(204);
    }

    const users = await userDao.getAllUsers();
    const foundUser = users.find((user) => user.refreshToken === refreshToken);

    return foundUser;
  } catch (error) {
    throw error;
  }
}

async function registerUser(body, sign, initial) {
  try {
    const existingUser = await userDao.getUserByUsername(body.username);
    if (existingUser) {
      const error = new Error("Username already exists");
      error.statusCode = 409;
      throw error;
    }

    let office;
    let unit;

    if (body.officeId) {
      office = await userDao.getOfficeByID(body.officeId);

      if (!office) {
        const error = new Error("No Office found for that office id");
        error.statusCode = 404;
        throw error;
      }
    }

    if (body.unitId) {
      unit = await userDao.getUnitByID(body.unitId);

      if (!unit) {
        const error = new Error("No Unit found for that unit id");
        error.statusCode = 404;
        throw error;
      }
    }

    const generatedPassword = generateRandomPassword();

    // const encryptedPassword = encrypt(generatedPassword, keyHex);

    const encryptedPassword = await bcrypt.hash(generatedPassword, 10);

    const createdUser = await userDao.createUser({
      ...body,
      firstName: body?.firstName || null,
      lastName: body?.lastName || null,
      officeName: office?.office || null,
      officeId: body?.officeId || null,
      unitName: unit?.unit || null,
      unitId: body?.unitId || null,
      password: encryptedPassword,
      role: body.role ? JSON.parse(body.role) : null,
      relatedUnits: body.relatedUnits ? JSON.parse(body.relatedUnits) : null,
      positions: body.positions ? JSON.parse(body.positions) : "",
      changePass: 1,
      ...((sign || initial) && {
        signPath: encryptSignPath([
          {
            sign: sign ? `/eSignatures/signatures/${sign.filename}` : null,
            initial: initial
              ? `/eSignatures/initials/${initial.filename}`
              : null,
          },
        ]),
      }),
    });

    return { ...createdUser, password: generatedPassword };
  } catch (error) {
    console.error("Error occurred:", error); // Use console.error or logging library

    const statusCode = error.statusCode || 500;
    let errorMessage = "";

    if (statusCode === 409) {
      errorMessage =
        "Username already in use. Please choose a different username.";
    } else if (statusCode === 400) {
      errorMessage = "Bad Request. Please check your input.";
    } else if (statusCode === 401) {
      errorMessage = "Unauthorized access. Please log in.";
    } else if (statusCode === 403) {
      errorMessage =
        "Forbidden. You do not have permission to perform this action.";
    } else if (statusCode === 404) {
      errorMessage = "Resource not found.";
    } else {
      errorMessage = errorMessage
        ? errorMessage
        : error.message
        ? error.message
        : "An unexpected error occurred. Please try again later.";
    }

    throw { ...error, statusCode, message: errorMessage };
  }
}

async function uploadUserSignature(id, data, sign, initial, pnpkicert) {
  try {
    const userPrevState = await userDao.getUserById(id);

    // Decrypt the existing signPath
    const decryptedSignPath = userPrevState.signPath
      ? decryptSignPath(userPrevState.signPath)
      : [];

    const signObject = decryptedSignPath[0];

    const uploadedSignature = await userDao.uploadUserSignature(id, {
      ...((sign ||
        initial ||
        pnpkicert ||
        data.sign ||
        data.initial ||
        data.pnpkicert) && {
        signPath: encryptSignPath([
          {
            ...signObject,
            ...((sign || data.sign) && {
              sign:
                data.sign === "delete"
                  ? null
                  : data.sign
                  ? data.sign
                  : `/eSignatures/signatures/${sign.filename}`,
            }),
            ...((initial || data.initial) && {
              initial:
                data.initial === "delete"
                  ? null
                  : data.initial
                  ? data.initial
                  : `/eSignatures/initials/${initial.filename}`,
            }),
            ...((pnpkicert || data.pnpkicert) && {
              pnpkicert:
                data.pnpkicert === "delete"
                  ? null
                  : data.pnpkicert
                  ? data.pnpkicert
                  : `/eSignatures/pnpkicert/${pnpkicert.filename}`,
              // Set password: null if deleting, otherwise use provided password
              pnpkiPassword:
                data.pnpkicert === "delete" ? null : data.pnpkiPassword || null,
            }),
          },
        ]),
      }),
    });

    const { password, ...rest } = uploadedSignature;

    const userDetails = {
      ...rest,
      signPath: decryptSignPath(uploadedSignature.signPath),
    };

    return userDetails;
  } catch (error) {
    console.error("Error Updating User Signature", error);
    throw error;
  }
}

async function refresh(refreshToken) {
  try {
    if (!refreshToken) {
      const error = new Error("Unauthorized");
      error.statusCode = 401;
      throw error;
    }

    const users = await userDao.getAllUsers();
    const foundUser = users.find((user) => user.refreshToken === refreshToken);

    let AT = null;

    if (!foundUser) {
      const error = new Error("Forbidden");
      error.statusCode = 403;
      throw error;
    } else {
      jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        (err, decoded) => {
          if (err || foundUser.username !== decoded?.username) {
            const error = new Error("Forbidden");
            error.statusCode = 403;
            throw error;
          }
          const accessToken = jwt.sign(
            {
              username: decoded.username,
            },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "30s" }
          );
          AT = { ...foundUser, accessToken };
        }
      );
    }

    return AT;
  } catch (err) {
    console.error("Error with refresh", err);
    throw err;
  }
}

async function updateUser(uid, data, sign, initial, pnpkicert) {
  try {
    const fetchedUser = await userDao.getUserById(uid);

    let office;
    let unit;
    if (data.officeId) {
      office = await userDao.getOfficeByID(data.officeId);
      if (!office) {
        const error = new Error("Office not found");
        error.statusCode = 404;
        throw error;
      }
    }

    if (data.unitId) {
      unit = await userDao.getUnitByID(data.unitId);
      if (!unit) {
        const error = new Error("Unit not found");
        error.statusCode = 404;
        throw error;
      }
    }

    // Change Password - each user (not admin)
    if (data.newPassword) {
      if (data.editor !== "admin") {
        const validPassword = await bcrypt.compare(
          data.password,
          fetchedUser.password
        );
        if (!validPassword) {
          const error = new Error("Invalid current password");
          error.statusCode = 401;
          throw error;
        }
      }

      data.password = await bcrypt.hash(data.newPassword, 10);
    } // Change Password - (admin side)
    else if (data.password) {
      const validPassword = await bcrypt.compare(
        data.password,
        fetchedUser.password
      );
      if (!validPassword) {
        const error = new Error("Invalid current password");
        error.statusCode = 401;
        throw error;
      }

      data.password = await bcrypt.hash(data.password, 10);
    }

    if (data.changePass) {
      data.changePass = parseInt(data.changePass, 10);
    }

    const officeInfo = data.officeId ? office : null;
    const unitInfo = data.unitId ? unit : null;

    // Decrypt the existing signPath
    const destructuredSignPath = fetchedUser.signPath
      ? decryptSignPath(fetchedUser.signPath)
      : [];

    const signObject = destructuredSignPath[0];

    if (data.faceData) {
      delete data.faceData;
    }

    const updatedUser = await userDao.updateUser(
      uid,
      {
        ...data,
        ...(data.positions && { positions: JSON.parse([data?.positions]) }),
        ...(data.role && { role: JSON.parse([data?.role]) }),
        ...(data.relatedUnits && {
          relatedUnits: JSON.parse([data?.relatedUnits]),
        }),
        ...((sign ||
          initial ||
          pnpkicert ||
          data.sign ||
          data.initial ||
          data.pnpkicert) && {
          signPath: encryptSignPath([
            {
              ...signObject,
              ...((sign || data.sign) && {
                sign:
                  data.sign === "delete"
                    ? null
                    : data.sign
                    ? data.sign
                    : `/eSignatures/signatures/${sign.filename}`,
              }),
              ...((initial || data.initial) && {
                initial:
                  data.initial === "delete"
                    ? null
                    : data.initial
                    ? data.initial
                    : `/eSignatures/initials/${initial.filename}`,
              }),
              ...((pnpkicert || data.pnpkicert) && {
                pnpkicert:
                  data.pnpkicert === "delete"
                    ? null
                    : data.pnpkicert
                    ? data.pnpkicert
                    : `/eSignatures/pnpkicert/${pnpkicert.filename}`,
                // Set password: null if deleting, otherwise use provided password
                pnpkiPassword:
                  data.pnpkicert === "delete"
                    ? null
                    : data.pnpkiPassword || null,
              }),
            },
          ]),
        }),
        ...(data.fingerprintData && {
          fingerprintData: JSON.parse([data?.fingerprintData]),
        }),
      },
      officeInfo,
      unitInfo
    );

    return updatedUser;
  } catch (error) {
    console.error("Error updating user", error);
    throw error;
  }
}

async function changePassword(uid, data) {
  try {
    const fetchedUser = await userDao.getUserById(uid);

    // Change Password - each user (not admin)
    if (data.newPassword) {
      if (data.editor !== "admin") {
        const validPassword = await bcrypt.compare(
          data.password,
          fetchedUser.password
        );
        if (!validPassword) {
          const error = new Error("Invalid current password");
          error.statusCode = 401;
          throw error;
        }
      }

      data.password = await bcrypt.hash(data.newPassword, 10);
    }

    const updatedUser = await userDao.changePassword(uid, data);

    return updatedUser;
  } catch (error) {
    console.error("Error user password", error);
    throw error;
  }
}

async function registerFaceData(uid, data) {
  try {
    const registeredFace = await userDao.registerFaceData(uid, data);

    return registeredFace;
  } catch (error) {
    console.error("Error!", error);
    throw new Error("Error in Process");
  }
}

async function getAllUsers() {
  try {
    const fetchedUsers = await userDao.getAllUsers();

    // Decrypt signPath for all users
    if (fetchedUsers && Array.isArray(fetchedUsers)) {
      fetchedUsers.forEach((user) => {
        if (user.signPath) {
          user.signPath = decryptSignPath(user.signPath);
        }
      });
    }

    return fetchedUsers;
  } catch (error) {
    console.error("Error!", error);
    throw new Error("Error in Process");
  }
}

async function getUserById(uid) {
  try {
    const fetchedUser = await userDao.getUserById(uid);

    // Decrypt signPath if it exists
    if (fetchedUser && fetchedUser.signPath) {
      fetchedUser.signPath = decryptSignPath(fetchedUser.signPath);
    }

    return fetchedUser;
  } catch (error) {
    console.error("Error!", error);
    throw new Error("Error in Process");
  }
}

async function deleteUserById(uid) {
  try {
    const deletedUser = await userDao.deleteUserById(uid);

    return deletedUser;
  } catch (error) {
    console.error("Error!", error);
    throw new Error("Error in Process");
  }
}

module.exports = {
  authenticateUser,
  logout,
  registerUser,
  uploadUserSignature,
  updateUser,
  changePassword,
  refresh,
  registerFaceData,
  getAllUsers,
  getUserById,
  deleteUserById,
};
