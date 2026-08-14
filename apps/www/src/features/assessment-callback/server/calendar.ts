function calendarStamp(value: Date) {
  return value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function icsEscape(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

function calendarCopy(contactMethod: "phone" | "zoom", durationMinutes: number) {
  const channel = contactMethod === "zoom" ? "Zoom 상담" : "전화 상담";
  return {
    title: `Career Direct Korea ${durationMinutes}분 ${channel}`,
    description: `Career Direct 평가 진행 과정과 적합성을 안내하는 ${durationMinutes}분 ${channel}입니다.`,
  };
}

export function googleCalendarUrl(start: Date, end: Date, contactMethod: "phone" | "zoom" = "phone", durationMinutes = 20) {
  const copy = calendarCopy(contactMethod, durationMinutes);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: copy.title,
    dates: `${calendarStamp(start)}/${calendarStamp(end)}`,
    details: copy.description,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function callbackCalendarIcs(input: { start: Date; end: Date; uid: string; contactMethod?: "phone" | "zoom"; durationMinutes?: number }) {
  const copy = calendarCopy(input.contactMethod ?? "phone", input.durationMinutes ?? 20);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Career Direct Korea//Callback//KO",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${icsEscape(input.uid)}@careerdirect.kr`,
    `DTSTAMP:${calendarStamp(new Date())}`,
    `DTSTART:${calendarStamp(input.start)}`,
    `DTEND:${calendarStamp(input.end)}`,
    `SUMMARY:${icsEscape(copy.title)}`,
    `DESCRIPTION:${icsEscape(copy.description)}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return `${lines.join("\r\n")}\r\n`;
}
