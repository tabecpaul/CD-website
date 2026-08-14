import {
  ageRangeOptions,
  callbackTopics,
  genderOptions,
  isContactMethod,
  maritalStatusOptions,
  normalizeCallbackSource,
  normalizeContactMethod,
  timeSlots,
} from "../domain";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^01[016789]\d{7,8}$/;
const SENSITIVE_VALUE = /(?:[^\s@]+@[^\s@]+\.[^\s@]+)|(?:\b01[016789][- ]?\d{3,4}[- ]?\d{4}\b)/i;

function allowed<T extends readonly { value: string }[]>(options: T, value: unknown) {
  return typeof value === "string" && options.some((option) => option.value === value) ? value : null;
}

function limited(value: unknown, max: number, sensitive = false) {
  if (value == null || value === "") return null;
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (!normalized || normalized.length > max || (sensitive && SENSITIVE_VALUE.test(normalized))) return null;
  return normalized;
}

function kstDate(offsetDays: number) {
  const now = new Date(Date.now() + 9 * 3_600_000);
  const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + offsetDays));
  return date.toISOString().slice(0, 10);
}

export type CallbackSubmission = ReturnType<typeof parseCallbackSubmission>;

export function parseCallbackSubmission(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("invalid_request");
  const body = value as Record<string, unknown>;
  const name = limited(body.name, 60);
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const phone = typeof body.phone === "string" ? body.phone.replace(/\D/g, "") : "";
  if (body.contactMethod != null && (typeof body.contactMethod !== "string" || !isContactMethod(body.contactMethod))) {
    throw new Error("selection_invalid");
  }
  const contactMethod = normalizeContactMethod(typeof body.contactMethod === "string" ? body.contactMethod : null);
  const needsSchedule = contactMethod !== "direct_assessment";
  const preferredDate = needsSchedule && typeof body.preferredDate === "string" ? body.preferredDate : null;
  const timeSlot = needsSchedule ? allowed(timeSlots, body.timeSlot) : null;
  const gender = allowed(genderOptions, body.gender);
  const ageRange = allowed(ageRangeOptions, body.ageRange);
  const maritalStatus = allowed(maritalStatusOptions, body.maritalStatus);
  const rawTopics = Array.isArray(body.topics) ? body.topics : [];
  const topics = [...new Set(rawTopics.filter((topic): topic is string =>
    typeof topic === "string" && callbackTopics.some((option) => option.value === topic),
  ))];
  const otherTopic = limited(body.otherTopic, 300);

  if (!name || name.length < 2 || !EMAIL.test(email) || email.length > 256 || !PHONE.test(phone)) {
    throw new Error("contact_invalid");
  }
  if (needsSchedule && (!preferredDate || !/^\d{4}-\d{2}-\d{2}$/.test(preferredDate) || preferredDate < kstDate(0) || preferredDate > kstDate(60))) {
    throw new Error("date_invalid");
  }
  if ((needsSchedule && !timeSlot) || !gender || !ageRange || !maritalStatus || topics.length === 0 || topics.length !== rawTopics.length) {
    throw new Error("selection_invalid");
  }
  if ((topics.includes("other") && !otherTopic) || (!topics.includes("other") && otherTopic)) {
    throw new Error("other_topic_invalid");
  }
  if (body.privacyAgreed !== true) throw new Error("privacy_required");

  return {
    name,
    email,
    phone,
    contactMethod,
    programCohort: limited(body.programCohort, 128, true),
    institutionName: limited(body.institutionName, 160, true),
    preferredDate,
    timeSlot,
    gender,
    ageRange,
    maritalStatus,
    topics,
    otherTopic,
    privacyAgreed: true,
    marketingAgreed: body.marketingAgreed === true,
    source: normalizeCallbackSource(typeof body.source === "string" ? body.source : null),
    ctaLocation: limited(body.ctaLocation, 64, true),
    utmSource: limited(body.utmSource, 128, true),
    utmMedium: limited(body.utmMedium, 128, true),
    utmCampaign: limited(body.utmCampaign, 128, true),
    utmContent: limited(body.utmContent, 128, true),
  };
}

export function callbackDateBounds() {
  return { min: kstDate(0), max: kstDate(60) };
}
