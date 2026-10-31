/**
 * Anonymous session id for pre-auth carts.
 *
 * The cookie value is an opaque high-entropy token; it is only meaningful when
 * a matching `carts.session_id` row exists, so it needs no signing. When real
 * auth lands, call `rotateSessionId` on login (session fixation defence) and
 * attach the old cart to the account.
 */

import { randomBytes } from "crypto";
import type { Request, Response, NextFunction } from "express";

export const SESSION_COOKIE = "vesta_sid";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

declare global {
  namespace Express {
    interface Request {
      sessionId: string;
    }
  }
}

function parseCookies(header: string | undefined): Record<string, string> {
  if (!header) return {};
  const out: Record<string, string> = {};
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(value);
  }
  return out;
}

function isValidToken(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function newToken(): string {
  return randomBytes(32).toString("hex");
}

function writeSessionCookie(res: Response, token: string): void {
  const secure = process.env.NODE_ENV === "production";
  const parts = [
    `${SESSION_COOKIE}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${ONE_YEAR_SECONDS}`,
  ];
  if (secure) parts.push("Secure");
  res.setHeader("Set-Cookie", parts.join("; "));
}

/** Assigns `req.sessionId`, issuing a new cookie when absent or malformed. */
export function anonymousSession(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const existing = parseCookies(req.headers.cookie)[SESSION_COOKIE];
  if (isValidToken(existing)) {
    req.sessionId = existing;
    return next();
  }

  const token = newToken();
  req.sessionId = token;
  writeSessionCookie(res, token);
  next();
}

/** Issue a fresh session id — use on login before merging the anonymous cart. */
export function rotateSessionId(res: Response): string {
  const token = newToken();
  writeSessionCookie(res, token);
  return token;
}
