import { randomBytes, scryptSync } from "node:crypto";
import { readFileSync } from "node:fs";

const password = process.argv[2] ?? readFileSync(0, "utf8").trim();
if (!password || password.length < 12) {
  console.error("12자 이상의 비밀번호를 인자 또는 표준입력으로 제공하세요.");
  process.exit(1);
}
const salt = randomBytes(16).toString("hex");
const hash = scryptSync(password, salt, 64).toString("hex");
console.log(`scrypt$${salt}$${hash}`);
