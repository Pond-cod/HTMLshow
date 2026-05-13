import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts a Google Drive file URL (viewer or uc link) to a proxy-safe URL
 * that can be rendered by next/image or <img> tags.
 */
export function cleanImageUrl(url?: string): string {
  if (!url) return '';
  if (url.includes('drive.google.com/file/d/')) {
    const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) return `/api/proxy-image?id=${match[1]}`;
  }
  if (url.includes('drive.google.com/uc')) {
    const match = url.match(/id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) return `/api/proxy-image?id=${match[1]}`;
  }
  return url;
}
