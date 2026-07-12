export const GOOGLE_ADS_ID = "AW-814669550";

export const WAITLIST_CONVERSION_SEND_TO =
  "AW-814669550/flg1CJvkms8cEO69u4QD";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackWaitlistConversion() {
  window.gtag?.("event", "conversion", {
    send_to: WAITLIST_CONVERSION_SEND_TO,
  });
}
