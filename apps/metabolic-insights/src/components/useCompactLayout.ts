import { useEffect, useState } from "react";

/** Phone and widths below iPad landscape (1024). */
const COMPACT_QUERY = "(max-width: 1023px)";

function readCompact(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia(COMPACT_QUERY).matches;
}

export function useCompactLayout(): boolean {
  const [compact, setCompact] = useState(readCompact);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const media = window.matchMedia(COMPACT_QUERY);
    const apply = () => setCompact(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  return compact;
}
