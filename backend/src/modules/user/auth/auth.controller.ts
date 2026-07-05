import type { Request, Response } from "express";
import { userServices } from "./auth.service";
import { sendSuccess, sendError } from "../../../utils/apiResponse";
import { tokenUtils } from "../../../utils/token";
import { CookieUtils } from "../../../utils/cookie";

// ─── Login ───────────────────────────────────────────────────────
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.validated as { email: string; password: string };

  const result = await userServices.loginUser(email, password);

  // Set tokens in HttpOnly cookies
  tokenUtils.setAccessTokenCookie(res, result.accessToken);
  tokenUtils.setRefreshTokenCookie(res, result.refreshToken);

  sendSuccess(res, {
    statusCode: 200,
    message: "User logged in successfully.",
    data: {
      user: result.user,
    },
  });
};

// ─── Get Profile ─────────────────────────────────────────────────
export const getProfile = async (_req: Request, res: Response): Promise<void> => {
  const { userId } = res.locals.auth!;

  const user = await userServices.getUserProfile(userId);

  sendSuccess(res, {
    statusCode: 200,
    message: "User profile fetched successfully.",
    data: { user },
  });
};

// ─── Refresh Token ───────────────────────────────────────────────
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  const oldRefreshToken = req.cookies?.refreshToken;

  if (!oldRefreshToken) {
    sendError(res, {
      statusCode: 401,
      message: "No refresh token provided.",
    });
    return;
  }

  const tokens = await userServices.refreshUserToken(oldRefreshToken);

  // Set new tokens in cookies
  tokenUtils.setAccessTokenCookie(res, tokens.accessToken);
  tokenUtils.setRefreshTokenCookie(res, tokens.refreshToken);

  sendSuccess(res, {
    statusCode: 200,
    message: "Tokens refreshed successfully.",
  });
};

// ─── Logout ──────────────────────────────────────────────────────
export const logout = async (req: Request, res: Response): Promise<void> => {
  const refreshTokenValue = req.cookies?.refreshToken;

  if (refreshTokenValue) {
    await userServices.logoutUser(refreshTokenValue);
  }

  // Clear cookies
  CookieUtils.clearCookie(res, "accessToken", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
  });
  CookieUtils.clearCookie(res, "refreshToken", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
  });

  sendSuccess(res, {
    statusCode: 200,
    message: "User logged out successfully.",
  });
};
