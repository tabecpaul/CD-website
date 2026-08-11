"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { sendBlogEvent } from "./BlogEventTracker";

export default function TrackedBlogLink({ trackingLocation, ...props }: ComponentProps<typeof Link> & { trackingLocation: string }) {
  return <Link {...props} onClick={() => { void sendBlogEvent("blog_related_clicked", trackingLocation); }} />;
}
