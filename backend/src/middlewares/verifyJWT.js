const jwt = require("jsonwebtoken");
require("dotenv").config();

const verifyToken = (req, res, next) => {
//   console.log(req.user);
//   console.log(req.role);

  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader && !authHeader.startsWith("Bearer ")) {
    return res.status(401).send({
      success: false,
      message: "No authorization header",
    });
  }

  const accessToken = authHeader.split(" ")[1];

  jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    // console.log(err);
    if (err) {
      return res.status(403).send({
        success: false,
        message: "Invalid token",
      });
    }

    // req.auth = decoded;
    req.user = decoded.username;
    req.role = decoded.role;
    next();
  });
};

module.exports = verifyToken;
