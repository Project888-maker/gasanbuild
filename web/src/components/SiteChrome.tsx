"use client";

// The portfolio's nav, footer and Jasmin stay off the Sputnik Delivery pages,
// which are a separate business sharing this site.

import { usePathname } from "next/navigation";

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const path = usePathname() || "";
  return path.startsWith("/sputnik") ? null : <>{children}</>;
}
