import { rateLimit } from "express-rate-limit";
import type { Request, Response } from "express";
import { envConfig } from "../config/env";
import { sendError } from "../utils/apiResponse";

const windowMs = envConfig.RATE_LIMIT_WINDOW_MS;

// Returns a 429 with a `Retry-After` header (seconds until the window resets) so
// clients know exactly how long to back off. A custom `handler` otherwise loses
// the library's built-in Retry-After, so we set it explicitly.
const limitHandler =
  (message: string) =>
  (req: Request, res: Response): void => {
    // express-rate-limit attaches `rateLimit` to the request at runtime.
    const reset = (req as Request & { rateLimit?: { resetTime?: Date } }).rateLimit
      ?.resetTime;
    if (reset) {
      const retryAfter = Math.max(0, Math.ceil((reset.getTime() - Date.now()) / 1000));
      res.setHeader("Retry-After", String(retryAfter));
    }
    sendError(res, { statusCode: 429, message });
  };

// ─── Global limiter ──────────────────────────────────────────────
// A generous per-IP ceiling that blunts scraping / abuse without getting in
// the way of a busy admin dashboard. The health probe is exempt.
export const apiLimiter = rateLimit({
  windowMs,
  limit: envConfig.RATE_LIMIT_MAX,
  standardHeaders: true, // emit RateLimit-* headers
  legacyHeaders: false, // drop the deprecated X-RateLimit-* headers
  skip: (req: Request) => req.path === "/health",
  handler: limitHandler("Too many requests. Please slow down and try again shortly."),
});

// ─── Auth limiter ────────────────────────────────────────────────
// A strict per-IP limiter for credential endpoints (login / token refresh) to
// blunt brute-force and credential-stuffing. `skipSuccessfulRequests` means
// only FAILED attempts count, so a legitimate user is never locked out by
// their own successful sign-ins.
export const authLimiter = rateLimit({
  windowMs,
  limit: envConfig.AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: limitHandler("Too many attempts. Please wait a few minutes and try again."),
});
