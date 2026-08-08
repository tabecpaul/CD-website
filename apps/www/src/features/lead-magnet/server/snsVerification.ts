import { createVerify, X509Certificate } from "node:crypto";

export type SnsEnvelope = {
  Type: "Notification" | "SubscriptionConfirmation";
  MessageId: string;
  TopicArn: string;
  Message: string;
  Timestamp: string;
  SignatureVersion: "1" | "2";
  Signature: string;
  SigningCertURL: string;
  Subject?: string;
  SubscribeURL?: string;
  Token?: string;
};

const certificateCache = new Map<string, { pem: string; expiresAt: number }>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function requiredString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (typeof value !== "string" || !value) throw new Error(`SNS_FIELD_INVALID:${key}`);
  return value;
}

export function parseSnsEnvelope(value: unknown): SnsEnvelope {
  if (!isRecord(value)) throw new Error("SNS_BODY_INVALID");
  const type = requiredString(value, "Type");
  if (type !== "Notification" && type !== "SubscriptionConfirmation") {
    throw new Error("SNS_TYPE_UNSUPPORTED");
  }
  const signatureVersion = requiredString(value, "SignatureVersion");
  if (signatureVersion !== "1" && signatureVersion !== "2") {
    throw new Error("SNS_SIGNATURE_VERSION_UNSUPPORTED");
  }
  const envelope: SnsEnvelope = {
    Type: type,
    MessageId: requiredString(value, "MessageId"),
    TopicArn: requiredString(value, "TopicArn"),
    Message: requiredString(value, "Message"),
    Timestamp: requiredString(value, "Timestamp"),
    SignatureVersion: signatureVersion,
    Signature: requiredString(value, "Signature"),
    SigningCertURL: requiredString(value, "SigningCertURL"),
  };
  if (typeof value.Subject === "string") envelope.Subject = value.Subject;
  if (type === "SubscriptionConfirmation") {
    envelope.SubscribeURL = requiredString(value, "SubscribeURL");
    envelope.Token = requiredString(value, "Token");
  }
  return envelope;
}

function expectedSnsHost() {
  const region = process.env.AWS_REGION ?? "ap-northeast-2";
  return `sns.${region}.amazonaws.com`;
}

export function assertTrustedSnsUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  if (
    url.protocol !== "https:" ||
    url.hostname !== expectedSnsHost() ||
    url.port ||
    url.username ||
    url.password
  ) {
    throw new Error("SNS_URL_UNTRUSTED");
  }
  return url;
}

function canonicalString(envelope: SnsEnvelope) {
  const fields: Array<[string, string | undefined]> = envelope.Type === "Notification"
    ? [
        ["Message", envelope.Message],
        ["MessageId", envelope.MessageId],
        ["Subject", envelope.Subject],
        ["Timestamp", envelope.Timestamp],
        ["TopicArn", envelope.TopicArn],
        ["Type", envelope.Type],
      ]
    : [
        ["Message", envelope.Message],
        ["MessageId", envelope.MessageId],
        ["SubscribeURL", envelope.SubscribeURL],
        ["Timestamp", envelope.Timestamp],
        ["Token", envelope.Token],
        ["TopicArn", envelope.TopicArn],
        ["Type", envelope.Type],
      ];
  return fields
    .filter((field): field is [string, string] => typeof field[1] === "string")
    .flatMap(([key, value]) => [key, value])
    .join("\n");
}

async function signingCertificate(url: string) {
  const cached = certificateCache.get(url);
  if (cached && cached.expiresAt > Date.now()) return cached.pem;
  assertTrustedSnsUrl(url);
  const response = await fetch(url, { signal: AbortSignal.timeout(5_000) });
  if (!response.ok) throw new Error("SNS_CERT_FETCH_FAILED");
  const pem = await response.text();
  if (pem.length > 32_000) throw new Error("SNS_CERT_TOO_LARGE");
  const certificate = new X509Certificate(pem);
  if (certificate.validTo && Date.parse(certificate.validTo) <= Date.now()) {
    throw new Error("SNS_CERT_EXPIRED");
  }
  certificateCache.set(url, { pem, expiresAt: Date.now() + 60 * 60 * 1_000 });
  return pem;
}

export async function verifySnsEnvelope(envelope: SnsEnvelope) {
  const expectedTopicArn = process.env.SES_SNS_TOPIC_ARN;
  if (!expectedTopicArn) throw new Error("SES_SNS_TOPIC_ARN_MISSING");
  if (envelope.TopicArn !== expectedTopicArn) throw new Error("SNS_TOPIC_UNEXPECTED");
  const pem = await signingCertificate(envelope.SigningCertURL);
  const verifier = createVerify(envelope.SignatureVersion === "2" ? "RSA-SHA256" : "RSA-SHA1");
  verifier.update(canonicalString(envelope), "utf8");
  verifier.end();
  if (!verifier.verify(pem, envelope.Signature, "base64")) {
    throw new Error("SNS_SIGNATURE_INVALID");
  }
}
