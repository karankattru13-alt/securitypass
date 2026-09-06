import { Linking } from 'react-native';

const COUNTRY_CODE = process.env.EXPO_PUBLIC_WA_COUNTRY_CODE || '91';

/**
 * Base URL the approve/deny link points at. Defaults to the app scheme (works
 * when the resident has the app installed). Set EXPO_PUBLIC_APP_URL to your
 * hosted web build for a link that also opens in a browser.
 */
const APP_URL = process.env.EXPO_PUBLIC_APP_URL || 'societypass://';

/**
 * How the message is delivered, in priority order:
 *  1. EXPO_PUBLIC_WA_PROXY_URL — your server endpoint. It receives
 *     POST { to, message } and calls the WhatsApp Cloud API with a token kept
 *     server-side. This is the correct way for a web build.
 *  2. EXPO_PUBLIC_WA_TOKEN + EXPO_PUBLIC_WA_PHONE_ID — direct WhatsApp Cloud API
 *     call. Works, but exposes the token in the bundle: dev / native only.
 *  3. Neither — falls back to opening the wa.me "click to send" page, which the
 *     sender must confirm manually (WhatsApp allows nothing more from a client).
 */
const PROXY_URL = process.env.EXPO_PUBLIC_WA_PROXY_URL || '';
const WA_TOKEN = process.env.EXPO_PUBLIC_WA_TOKEN || '';
const WA_PHONE_ID = process.env.EXPO_PUBLIC_WA_PHONE_ID || '';
const WA_API_VERSION = process.env.EXPO_PUBLIC_WA_API_VERSION || 'v21.0';

export const canSendAutomatically = () =>
  !!PROXY_URL || !!(WA_TOKEN && WA_PHONE_ID);

const withSlash = (u: string) =>
  u.endsWith('/') || u.endsWith('://') ? u : `${u}/`;

export const normalizeNumber = (phone: string) => {
  const digits = String(phone).replace(/\D/g, '');
  return digits.length === 10 ? `${COUNTRY_CODE}${digits}` : digits;
};

/** Deep link that opens the resident's approve/deny screen for a request. */
export function requestApprovalLink(visitorId: number | string) {
  return `${withSlash(APP_URL)}request/${visitorId}`;
}

export function whatsappUrl(phone: string, message: string) {
  return `https://wa.me/${normalizeNumber(phone)}?text=${encodeURIComponent(message)}`;
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
    'SocietyPass - new visitor request',
    '',
    `Visitor: ${o.visitorName}`,
    o.purpose ? `Purpose: ${o.purpose}` : '',
    o.flat ? `Flat: ${o.flat}` : '',
    o.guardName ? `Raised by: ${o.guardName}${o.gate ? ` (${o.gate})` : ''}` : '',
    '',
    'Approve or deny:',
    requestApprovalLink(o.visitorId),
  ]
    .filter(Boolean)
    .join('\n');
}

async function sendViaProxy(to: string, message: string) {
  const res = await fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, message }),
  });
  if (!res.ok) throw new Error(`Proxy responded ${res.status}`);
}

async function sendViaCloudApi(to: string, message: string) {
  const res = await fetch(
    `https://graph.facebook.com/${WA_API_VERSION}/${WA_PHONE_ID}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${WA_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: { preview_url: false, body: message },
      }),
    }
  );
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`WhatsApp API ${res.status}: ${detail}`);
  }
}

export type WhatsAppResult =
  | { ok: true; mode: 'sent' }
  | { ok: true; mode: 'opened' }
  | { ok: false; error: string };

/**
 * Delivers the message to the resident. Sends automatically when a proxy / Cloud
 * API is configured; otherwise opens the wa.me page for a manual send.
 */
export async function notifyResidentOnWhatsApp(
  phone: string,
  message: string
): Promise<WhatsAppResult> {
  const to = normalizeNumber(phone);

  if (PROXY_URL) {
    try {
      await sendViaProxy(to, message);
      return { ok: true, mode: 'sent' };
    } catch (e: any) {
      return { ok: false, error: e?.message || 'Could not reach the WhatsApp relay.' };
    }
  }

  if (WA_TOKEN && WA_PHONE_ID) {
    try {
      await sendViaCloudApi(to, message);
      return { ok: true, mode: 'sent' };
    } catch (e: any) {
      return { ok: false, error: e?.message || 'WhatsApp Cloud API call failed.' };
    }
  }

  try {
    await Linking.openURL(whatsappUrl(phone, message));
    return { ok: true, mode: 'opened' };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Could not open WhatsApp.' };
  }
}
