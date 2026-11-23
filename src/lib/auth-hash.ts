import { randomBytes, scryptSync } from "crypto";
export const hashPassword = (pw: string) => { const s = randomBytes(16).toString("hex"); return `${s}:${scryptSync(pw, s, 64).toString("hex")}`; };
