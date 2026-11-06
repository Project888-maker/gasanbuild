"use client";

import { openJasmin, type JasminRequest } from "@/lib/jasmin-events";

export default function JasminButton({
  request,
  className = "btn btn-ghost",
  children,
}: {
  request: JasminRequest;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button type="button" className={className} onClick={() => openJasmin(request)}>
      {children}
    </button>
  );
}
