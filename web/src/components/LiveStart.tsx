"use client";

// The room's "Start live interview" button (or "Back to the call" while it's on).
import { useEffect, useState } from "react";
import { isLive, startLive, type LiveRequest } from "@/lib/live";

export default function LiveStart(props: LiveRequest & { className?: string }) {
  const { className = "btn btn-gold", ...request } = props;
  const [on, setOn] = useState(false);
  useEffect(() => {
    setOn(isLive());
    const onState = (e: Event) => setOn((e as CustomEvent<boolean>).detail);
    window.addEventListener("jasmin-live-state", onState);
    return () => window.removeEventListener("jasmin-live-state", onState);
  }, []);
  return (
    <button type="button" className={className} onClick={() => startLive(request)}>
      <span className="mr-2 inline-block h-2 w-2 rounded-full bg-red-500 align-middle" />
      {on ? "Back to the call" : "Start live interview"}
    </button>
  );
}
