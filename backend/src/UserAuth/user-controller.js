const express = require("express");
const usersRouter = express.Router();
const userService = require("../UserAuth/user-service");
const verifyToken = require("../middlewares/verifyJWT");
const uploadSign = require("../middlewares/multer-png");

usersRouter.post("/login", async (req, res) => {
  try {
    const body = req.body;

    // Validate input
    if (!body.username || !body.password) {
      throw new Error("Username and password are required");
    }

    // Validate user credentials
    const user = await userService.authenticateUser(
      body.username,
      body.password,
    );

    if (!user || user.status === 0) {
      const error = new Error("Invalid username or password");
      error.statusCode = 404;
      throw error;
    }

    const serverDateTime = { serverDateTime: new Date().toISOString() };

    const { password, ...otherUserDetails } = user;

    res
      .status(200)
      // .cookie("refreshToken", refreshToken, {
      //   httpOnly: true,
      //   // Set sameSite to "None" and secure to "true" if deployed with SSL Cert.
      //   // Otherwise, set it to "Strict" and comment out secure
      //   sameSite: "Strict",
      //   secure: true,
      //   maxAge: 3600 * 1000, // 1hr
      //   maxAge: 60 * 1000, // 1min
      // })
      .send({
        valid: true,
        message: "Login successful",
        data: { ...otherUserDetails, ...serverDateTime },
      });
  } catch (error) {
    console.log(error);
    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || "Internal server error";

    res.status(statusCode).json({ error: errorMessage });
  }
});

usersRouter.post("/logout", async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    const foundUser = await userService.logout(refreshToken);

    if (!foundUser) {
      res
        .clearCookie("refreshToken", {
          httpOnly: true,
          sameSite: "Strict",
        })
        .sendStatus(204);
    } else {
      await userService.updateUser(foundUser.uid, {
        refreshToken: null,
      });
      res
        .clearCookie("refreshToken", {
          httpOnly: true,
          sameSite: "Strict",
        })
        .sendStatus(204);
    }
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || "Internal server error";

    res.status(statusCode).json({ error: errorMessage });
  }
});

usersRouter.post("/register", uploadSign, async (req, res) => {
  try {
    const sign = req.files?.sign ? req.files.sign[0] : null;
    const initial = req.files?.initial ? req.files.initial[0] : null;

    const data = {};

    // Loop through the query parameters and add them to the filters object
    for (const [key, value] of Object.entries(req.body)) {
      if (value) {
        if (key === "officeId" || key === "unitId" || key === "status") {
          data[key] = parseInt(value, 10);
        } else {
          data[key] = value;
        }
      }
    }

    // Validate input
    if (!data.username) {
      throw new BadRequestError("Username is required");
    }

    // Register user
    const result = await userService.registerUser(data, sign, initial);
    // const uuid = result[0];

    // // Create a new object without the "password" property
    // const userData = { ...result };
    // delete userData.password;

    res.status(201).json({
      message: "User registered successfully",
      data: result,
    });
  } catch (error) {
    console.log(error);

    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || "Internal server error";

    res.status(statusCode).json({ error: errorMessage });
  }
});

usersRouter.put("/uploadSignature/:uid", uploadSign, async (req, res) => {
  try {
    const { uid } = req.params;
    const data = req.body;
    const sign = req.files?.sign ? req.files.sign[0] : null;
    const initial = req.files?.initial ? req.files.initial[0] : null;

    const uploadedSignature = await userService.uploadUserSignature(
      parseInt(uid, 10),
      data,
      sign,
      initial,
    );

    res.status(200).json({
      message: "User Signature Updated Successfully",
      data: uploadedSignature,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || "Internal server error";

    res.status(statusCode).json({ error: errorMessage });
  }
});

usersRouter.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    const refresh = await userService.refresh(refreshToken);

    res.json(refresh);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || "Internal server error";

    res.status(statusCode).json({ error: errorMessage });
  }
});

usersRouter.put("/update/:uid", uploadSign, async (req, res) => {
  try {
    const uid = parseInt(req.params.uid, 10);
    const data = req.body;
    const sign = req.files?.sign ? req.files.sign[0] : null;
    const initial = req.files?.initial ? req.files.initial[0] : null;
    const pnpkicert = req.files?.pnpkicert ? req.files.pnpkicert[0] : null;

    const toBoolean = (value) => {
      return value === "true" || value === "1";
    };

    const fieldsToChange = {
      ...data,
      ...(data.officeId && { officeId: parseInt(data.officeId, 10) }),
      ...(data.unitId && { unitId: parseInt(data.unitId, 10) }),
      ...(data.enableFingerprint && {
        enableFingerprint: toBoolean(data.enableFingerprint),
      }),
      ...(data.enableFaceRecog && {
        enableFaceRecog: toBoolean(data.enableFaceRecog),
      }),
      status: toBoolean(data.status) ? 1 : 0,
    };

    const result = await userService.updateUser(
      uid,
      fieldsToChange,
      sign,
      initial,
      pnpkicert,
    );
    if (result === 0) {
      throw new NotFoundError("User not found");
    }

    // Create a new object without the "password" property
    const userData = { ...result };
    delete userData.password;

    res.status(201).json({
      message: "User updated successfully",
      data: {
        ...userData,
      },
    });
  } catch (error) {
    console.log(error);

    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || "Internal server error";

    res.status(statusCode).json({ error: errorMessage });
  }
});

usersRouter.put("/changePassword/:uid", async (req, res, next) => {
  try {
    const uid = parseInt(req.params.uid, 10);

    const data = {};

    // Loop through the query parameters and add them to the filters object
    for (const [key, value] of Object.entries(req.body)) {
      if (value || value === 0) {
        if (key === "changePass") {
          data[key] = parseInt(value, 10);
        } else {
          data[key] = value;
        }
      }
    }

    const result = await userService.changePassword(uid, data);
    if (result === 0) {
      throw new NotFoundError("User not found");
    }

    // Create a new object without the "password" property
    const userData = { ...result };
    delete userData.password;

    res.status(201).json({
      message: "User updated successfully",
      data: {
        ...userData,
      },
    });
  } catch (error) {
    next(error);
  }
});

usersRouter.put("/registerFaceData/:uid", async (req, res) => {
  try {
    const uid = parseInt(req.params.uid, 10);
    const data = req.body;

    const result = await userService.registerFaceData(uid, data);

    if (result === 0) {
      throw new NotFoundError("User not found");
    }

    // Create a new object without the "password" property
    const userData = { ...result };
    delete userData.password;

    res.status(201).json({
      message: "User updated successfully",
      data: {
        ...userData,
      },
    });
  } catch (error) {
    console.log(error);

    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || "Internal server error";

    res.status(statusCode).json({ error: errorMessage });
  }
});

usersRouter.get("/getAllUsers", async (req, res) => {
  try {
    const fetchedUsers = await userService.getAllUsers();

    res.json(fetchedUsers);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || "Internal server error";

    res.status(statusCode).json({ error: errorMessage });
  }
});

usersRouter.get("/getUser/:uid", async (req, res) => {
  try {
    const uid = parseInt(req.params.uid, 10);
    const fetchedUser = await userService.getUserById(uid);

    res.json(fetchedUser);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || "Internal server error";

    res.status(statusCode).json({ error: errorMessage });
  }
});

usersRouter.delete("/delete/:uid", async (req, res) => {
  try {
    const uid = parseInt(req.params.uid, 10);
    const deletedUser = await userService.deleteUserById(uid);

    res.json(deletedUser);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || "Internal server error";

    res.status(statusCode).json({ error: errorMessage });
  }
});

module.exports = usersRouter;
