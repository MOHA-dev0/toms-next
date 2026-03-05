"use client";

import { useEffect } from "react";

/**
 * Empty wrapper to apply the full-screen layout classes
 * safely on the client side without converting the entire page to a CC.
 */
export default function FullscreenLayoutWrapper() {
  useEffect(() => {
    document.body.classList.add("itinerary-fullscreen");
    return () => {
      document.body.classList.remove("itinerary-fullscreen");
    };
  }, []);

  return null;
}
