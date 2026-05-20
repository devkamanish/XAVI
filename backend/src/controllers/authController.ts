import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User";
import RefreshToken from "../models/RefreshToken";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";
import { sendSuccess, sendError } from "../utils/response";
import config from "../config";

// POST /api/auth/signup
export const signup = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError(res, "Email already registered", 409);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    // Generate tokens
    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken();

    // Save refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
    await RefreshToken.create({
      token: refreshToken,
      user: user._id,
      expiresAt,
    });

    return sendSuccess(
      res,
      {
        user: user.toJSON(),
        accessToken,
        refreshToken,
      },
      "Account created successfully",
      201
    );
  } catch (error) {
    console.error("Signup error:", error);
    return sendError(res, "Failed to create account");
  }
};

// POST /api/auth/login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user with password
    const user = await User.findOne({ email });
    if (!user) {
      return sendError(res, "Invalid email or password", 401);
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return sendError(res, "Invalid email or password", 401);
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken();

    // Save refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await RefreshToken.create({
      token: refreshToken,
      user: user._id,
      expiresAt,
    });

    return sendSuccess(res, {
      user: user.toJSON(),
      accessToken,
      refreshToken,
    }, "Logged in successfully");
  } catch (error) {
    console.error("Login error:", error);
    return sendError(res, "Login failed");
  }
};

// POST /api/auth/refresh
export const refreshAccessToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return sendError(res, "Refresh token is required", 400);
    }

    // Find the refresh token in DB
    const storedToken = await RefreshToken.findOne({ token: refreshToken });
    if (!storedToken) {
      return sendError(res, "Invalid refresh token", 401);
    }

    // Check if expired
    if (storedToken.expiresAt < new Date()) {
      await RefreshToken.deleteOne({ _id: storedToken._id });
      return sendError(res, "Refresh token expired. Please log in again.", 401);
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(storedToken.user.toString());

    // Rotate refresh token (security best practice)
    const newRefreshToken = generateRefreshToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await RefreshToken.deleteOne({ _id: storedToken._id });
    await RefreshToken.create({
      token: newRefreshToken,
      user: storedToken.user,
      expiresAt,
    });

    return sendSuccess(res, {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    }, "Token refreshed");
  } catch (error) {
    console.error("Refresh error:", error);
    return sendError(res, "Token refresh failed");
  }
};

// POST /api/auth/logout
export const logout = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await RefreshToken.deleteOne({ token: refreshToken });
    }

    return sendSuccess(res, null, "Logged out successfully");
  } catch (error) {
    return sendError(res, "Logout failed");
  }
};

// GET /api/auth/me
export const getMe = async (req: Request, res: Response) => {
  try {
    return sendSuccess(res, { user: req.user }, "User fetched");
  } catch (error) {
    return sendError(res, "Failed to fetch user");
  }
};
