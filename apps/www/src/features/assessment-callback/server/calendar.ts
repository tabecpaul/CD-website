function calendarStamp(value: Date) {
  return value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function icsEscape(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

export function googleCalendarUrl(start: Date, end: Date) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: "Career Direct Korea 20분 콜백",
    dates: `${calendarStamp(start)}/${calendarStamp(end)}`,
    details: "Career Direct 검사 진행 과정과 적합성을 안내하는 20분 전화 콜백입니다.",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function callbackCalendarIcs(input: { start: Date; end: Date; uid: string }) {
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
    `SUMMARY:${icsEscape("Career Direct Korea 20분 콜백")}`,
    `DESCRIPTION:${icsEscape("Career Direct 검사 진행 과정과 적합성을 안내하는 20분 전화 콜백입니다.")}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return `${lines.join("\r\n")}\r\n`;
}
