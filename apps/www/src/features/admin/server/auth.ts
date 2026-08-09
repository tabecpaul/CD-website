import { createHmac, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "cdk_admin";
const EIGHT_HOURS = 8 * 60 * 60;

function sessionSecret() {
  const value = process.env.ADMIN_DASHBOARD_SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("ADMIN_AUTH_NOT_CONFIGURED");
  return value;
}

export function verifyAdminPassword(password: string) {
  const stored = process.env.ADMIN_DASHBOARD_PASSWORD_HASH;
  if (!stored) return false;
  const [algorithm, salt, expectedHex] = stored.split("$");
  if (algorithm !== "scrypt" || !salt || !expectedHex || !/^[0-9a-f]{128}$/i.test(expectedHex)) return false;
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHex, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function signature(expires: number) {
  return createHmac("sha256", sessionSecret()).update(`analytics-admin:${expires}`).digest("hex");
}

export function createAdminSession() {
  const expires = Math.floor(Date.now() / 1000) + EIGHT_HOURS;
  return { value: `${expires}.${signature(expires)}`, maxAge: EIGHT_HOURS };
}

export function verifyAdminSession(value: string | undefined) {
  if (!value) return false;
  try {
    const [rawExpires, rawSignature] = value.split(".");
    const expires = Number(rawExpires);
    if (!Number.isSafeInteger(expires) || expires <= Date.now() / 1000 || !/^[0-9a-f]{64}$/i.test(rawSignature ?? "")) return false;
    const actual = Buffer.from(rawSignature, "hex");
    const expected = Buffer.from(signature(expires), "hex");
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export async function hasAdminSession() {
  return verifyAdminSession((await cookies()).get(ADMIN_COOKIE)?.value);
}
