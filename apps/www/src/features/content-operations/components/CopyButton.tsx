"use client";

import { useState } from "react";

export default function CopyButton({ value, label = "복사" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1_500);
  }
  return <button type="button" onClick={copy} className="rounded-lg border border-navy/15 px-3 py-2 text-xs font-bold text-teal">{copied ? "복사됨" : label}</button>;
}

