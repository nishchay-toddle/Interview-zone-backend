const createError = require("http-errors");
const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");
require("dotenv").config();

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "24h",
  });
};

const createSendToken = (user, id, statusCode, req, res) => {
  const token = signToken(id);
  const name = user.firstName + " " + user.lastName;
  const email = user.email;
  let data = { name, email, role: user.role };
  res.status(statusCode).json({
    statusCode,
    token,
    data,
  });
};

exports.checkUsername = async (req, res, next) => {
  try {
    const { username } = req.body;
    if (!username) return next(createError(500, "username not found"));
    const userfound = await userModel.findOne({ username: username });
    if (userfound) {
      return res.status(400).json({
        status: "fail",
        message: "username already exists",
      });
    }
    return res.status(200).json({
      status: "success",
      message: "unique username",
    });
  } catch (e) {
    return next(createError(400, e.message));
  }
};

exports.userAddition = async (req, res, next) => {
  try {
    console.log("[REGISTER] Incoming request body:", req.body);
    const { email, password, username, country } = req.body;
    if (!email || !password || !username) {
      console.log("[REGISTER] Missing required fields:", {
        email,
        password,
        username,
      });
      return next(createError(500, "email or passowrd or username required"));
    }
    // add a validator to check if input is actually a email
    const userFound = await userModel.findOne({ email: email });
    if (userFound) {
      console.log("[REGISTER] Email already exists:", email);
      return res.status(400).json({
        status: "fail",
        message: "Email already exists",
      });
    }
    console.log("[REGISTER] Creating new user:", { email, username, country });
    const newUser = await userModel.create({
      email: email,
      username: username,
      country: country,
      password: password,
    });
    console.log("[REGISTER] New user created:", newUser._id);
    createSendToken(newUser, newUser._id, 201, req, res);
    console.log(res);
    return res;
  } catch (err) {
    console.error("[REGISTER] Error:", err);
    return next(createError(400, err.message));
  }
};

exports.userLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    console.log("[LOGIN] Attempting login with email:", email);

    if (!email || !password) {
      return next(createError(500, "email or password required"));
    }

    const user = await userModel.findOne({ email: email });
    if (!user) {
      console.log("[LOGIN] User not found with email:", email);
      return next(createError(400, "email or password is not correct"));
    }

    console.log("[LOGIN] User found, checking password...");
    const check = await user.CheckPass(password, user.password);

    if (check) {
      console.log("[LOGIN] Password verified, sending token...");
      createSendToken(user, user._id, 200, req, res);
    } else {
      console.log("[LOGIN] Password verification failed");
      return next(createError(400, "email or password is not correct"));
    }
  } catch (err) {
    console.error("[LOGIN] Error:", err);
    return next(new Error(err));
  }
};

exports.protect = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = await req.headers.authorization.split(" ")[1];
    }

    if (!token || token === "null") {
      return next(
        createError(401, "You are not logged in! Please log in to get access.")
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const currentUser = await userModel.findById(decoded.id);

    if (!currentUser) {
      return next(
        createError(
          401,
          "The user belonging to this token does no longer exist."
        )
      );
    }

    req.user = currentUser._id;
    next();
  } catch (err) {
    return next(new Error(err.message));
  }
};
