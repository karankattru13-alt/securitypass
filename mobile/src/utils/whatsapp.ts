import { Linking } from 'react-native';

const COUNTRY_CODE = process.env.EXPO_PUBLIC_WA_COUNTRY_CODE || '91';
/**
 * Base URL the approve/deny link points at. Defaults to the app scheme (works
 * when the resident has the app installed). Set EXPO_PUBLIC_APP_URL to your
 * hosted web build for a link that also opens in a browser.
 */
const APP_URL = process.env.EXPO_PUBLIC_APP_URL || 'societypass://';

const withSlash = (u: string) =>
  u.endsWith('/') || u.endsWith('://') ? u : `${u}/`;

/** Deep link that opens the resident's approve/deny screen for a request. */
export function requestApprovalLink(visitorId: number | string) {
  return `${withSlash(APP_URL)}request/${visitorId}`;
}

export function whatsappUrl(phone: string, message: string) {
  const digits = String(phone).replace(/\D/g, '');
  const number = digits.length === 10 ? `${COUNTRY_CODE}${digits}` : digits;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function buildRequestMessage(o: {
  visitorId: number | string;
  visitorName: string;
  purpose?: string;
  flat?: string;
  guardName?: string;
  gate?: string;
}) {
  return [
    '🔔 *SocietyPass* — new visitor request',
    '',
    `*Visitor:* ${o.visitorName}`,
    o.purpose ? `*Purpose:* ${o.purpose}` : '',
    o.flat ? `*Flat:* ${o.flat}` : '',
    o.guardName ? `*Raised by:* ${o.guardName}${o.gate ? ` · ${o.gate}` : ''}` : '',
    '',
    `Tap to approve or deny:`,
    requestApprovalLink(o.visitorId),
  ]
    .filter(Boolean)
    .join('\n');
}

/** Opens WhatsApp (app or web) with a prefilled message to the resident. */
export async function notifyResidentOnWhatsApp(phone: string, message: string) {
  const url = whatsappUrl(phone, message);
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}
