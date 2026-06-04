"use client";
import { useEffect } from "react";
import { polyfillCountryFlagEmojis } from "country-flag-emoji-polyfill";

/**
 * Lädt Twemoji Country Flags als Fallback-Font für Browser (Windows Chrome/Edge),
 * die Flag-Emojis nicht nativ rendern. Der Polyfill injiziert ein @font-face,
 * sodass alle Stellen mit font-family: 'Twemoji Country Flags', ... korrekt
 * gerendert werden.
 */
export function FlagPolyfill() {
  useEffect(() => {
    polyfillCountryFlagEmojis("Twemoji Country Flags");
  }, []);
  return null;
}
