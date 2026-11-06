// Any button on the site can open Jasmin's chat or start her guided tour.

export type JasminRequest = { mode: "chat"; question?: string } | { mode: "tour" };

export function openJasmin(request: JasminRequest) {
  window.dispatchEvent(new CustomEvent<JasminRequest>("jasmin", { detail: request }));
}
