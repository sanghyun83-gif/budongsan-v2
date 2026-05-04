import { createHash, createHmac } from "crypto";

const UUID_V5_NAMESPACE = "f7a1f6e9-6f85-4d53-8f41-9f3c3f6a1111";

export type PropertyType = "apartment" | "dasaedae" | "officetel";

export interface StableKeyInput {
  propertyType: PropertyType;
  complexName: string;
  sggCd?: string;
  umdNm?: string;
  jibun?: string;
}

function stripSpecial(value: string): string {
  return value.toLowerCase().replace(/[^0-9a-z가-힣]/gi, "");
}

export function normalizeName(value: string): string {
  return stripSpecial((value ?? "").trim());
}

export function normalizeUmd(value: string): string {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

export function normalizeJibun(value: string): string {
  return (value ?? "").trim().replace(/\s+/g, "");
}

function uuidToBytes(uuid: string): Buffer {
  const hex = uuid.replace(/-/g, "");
  if (!/^[0-9a-fA-F]{32}$/.test(hex)) throw new Error("Invalid UUID namespace");
  return Buffer.from(hex, "hex");
}

function bytesToUuid(bytes: Buffer): string {
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

function uuidV5(name: string, namespace = UUID_V5_NAMESPACE): string {
  const ns = uuidToBytes(namespace);
  const hash = createHash("sha1").update(Buffer.concat([ns, Buffer.from(name, "utf8")])).digest();
  const bytes = Buffer.from(hash.subarray(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return bytesToUuid(bytes);
}

export function buildStableKeyInput(input: StableKeyInput): string {
  return [
    input.propertyType,
    normalizeName(input.complexName),
    (input.sggCd ?? "").trim(),
    normalizeUmd(input.umdNm ?? ""),
    normalizeJibun(input.jibun ?? "")
  ].join("|");
}

export function makeStableKey(input: StableKeyInput): string {
  return uuidV5(buildStableKeyInput(input));
}

export function propertyTypeToCode(propertyType: PropertyType): "A" | "V" | "O" {
  if (propertyType === "apartment") return "A";
  if (propertyType === "dasaedae") return "V";
  return "O";
}

export function codeToPropertyType(code: string): PropertyType {
  if (code === "A") return "apartment";
  if (code === "V") return "dasaedae";
  if (code === "O") return "officetel";
  throw new Error("Invalid property type code");
}

export interface RoutePayload {
  propertyType: PropertyType;
  complexName: string;
  sggCd?: string;
  umdNm?: string;
  jibun?: string;
  regionName?: string;
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

export function encodeRouteParams(payload: RoutePayload, secret?: string): string {
  const body = base64UrlEncode(JSON.stringify(payload));
  if (!secret) return body;
  const sig = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function decodeRouteParams(token: string, secret?: string): RoutePayload {
  const [body, sig] = token.split(".");
  if (!body) throw new Error("Invalid token");
  if (secret) {
    if (!sig) throw new Error("Missing signature");
    const expected = createHmac("sha256", secret).update(body).digest("base64url");
    if (sig !== expected) throw new Error("Invalid signature");
  }
  return JSON.parse(base64UrlDecode(body)) as RoutePayload;
}
