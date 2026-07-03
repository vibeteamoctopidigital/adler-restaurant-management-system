import type { Request, Response } from "express";
import { adminServices } from "./admin.service";
import { sendSuccess, sendError } from "../../utils/apiResponse";
import { tokenUtils } from "../../utils/token";
import { CookieUtils } from "../../utils/cookie";

// ─── Login ───────────────────────────────────────────────────────
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.validated as { email: string; password: string };

  const result = await adminServices.loginAdmin(email, password);

  // Set tokens in HttpOnly cookies
  tokenUtils.setAccessTokenCookie(res, result.accessToken);
  tokenUtils.setRefreshTokenCookie(res, result.refreshToken);

  sendSuccess(res, {
    statusCode: 200,
    message: "Admin logged in successfully.",
    data: {
      admin: result.admin,
    },
  });
};

// ─── Get Profile ─────────────────────────────────────────────────
export const getProfile = async (_req: Request, res: Response): Promise<void> => {
  const { userId } = res.locals.auth!;

  const admin = await adminServices.getAdminProfile(userId);

  sendSuccess(res, {
    statusCode: 200,
    message: "Admin profile fetched successfully.",
    data: { admin },
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

  const tokens = await adminServices.refreshAdminToken(oldRefreshToken);

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
    await adminServices.logoutAdmin(refreshTokenValue);
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
    message: "Admin logged out successfully.",
  });
};
