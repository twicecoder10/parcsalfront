export type ConsentState = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
};

const CONSENT_KEY = "parcsal_cookie_consent_v1";

const DEFAULT_CONSENT: ConsentState = {
  necessary: true,
  analytics: false,
  marketing: false,
};

export function getConsent(): ConsentState | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(CONSENT_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      parsed.necessary === true &&
      typeof parsed.analytics === "boolean" &&
      typeof parsed.marketing === "boolean"
    ) {
      return {
        necessary: true,
        analytics: parsed.analytics,
        marketing: parsed.marketing,
      };
    }
  } catch {
    return null;
  }

  return null;
}

export function setConsent(state: ConsentState): void {
  if (typeof window === "undefined") return;
  const normalized: ConsentState = {
    necessary: true,
    analytics: Boolean(state.analytics),
    marketing: Boolean(state.marketing),
  };

  localStorage.setItem(CONSENT_KEY, JSON.stringify(normalized));
  window.dispatchEvent(
    new CustomEvent("parcsal:consent-change", { detail: normalized })
  );
}

export function clearConsent(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CONSENT_KEY);
  window.dispatchEvent(
    new CustomEvent("parcsal:consent-change", { detail: DEFAULT_CONSENT })
  );
}

export function getDefaultConsent(): ConsentState {
  return { ...DEFAULT_CONSENT };
}

