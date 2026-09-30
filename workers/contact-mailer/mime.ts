/**
 * Minimal RFC 5322 message builder for a single-part UTF-8 text email.
 * Pure (no Workers APIs) so it can be unit tested.
 */

export interface MailParts {
  from: string; // bare address, e.g. contact@25x.codes
  fromName?: string;
  to: string;
  replyTo?: string;
  replyToName?: string;
  subject: string;
  text: string;
  messageId: string; // without angle brackets, e.g. abc@25x.codes
  date?: Date;
}

const utf8ToBase64 = (s: string) => {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
};

/** Strip CR/LF so no value can inject extra headers. */
const oneLine = (s: string) => s.replace(/[\r\n]+/g, " ").trim();

/** RFC 2047 encoded-word when the value is not plain printable ASCII. */
export function encodeHeader(value: string): string {
  const v = oneLine(value);
  return /^[\x20-\x7e]*$/.test(v) ? v : `=?UTF-8?B?${utf8ToBase64(v)}?=`;
}

export function formatAddress(address: string, name?: string): string {
  const addr = oneLine(address);
  if (!name) return `<${addr}>`;
  const n = oneLine(name);
  const display = /^[\x20-\x7e]*$/.test(n) ? `"${n.replace(/["\\]/g, "")}"` : encodeHeader(n);
  return `${display} <${addr}>`;
}

export function buildMime(p: MailParts): string {
  const body = utf8ToBase64(p.text.replace(/\r?\n/g, "\r\n"))
    .match(/.{1,76}/g)!
    .join("\r\n");
  const headers = [
    `From: ${formatAddress(p.from, p.fromName)}`,
    `To: <${oneLine(p.to)}>`,
    p.replyTo ? `Reply-To: ${formatAddress(p.replyTo, p.replyToName)}` : null,
    `Subject: ${encodeHeader(p.subject)}`,
    `Date: ${(p.date ?? new Date()).toUTCString()}`,
    `Message-ID: <${oneLine(p.messageId)}>`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
  ].filter((h): h is string => h !== null);
  return `${headers.join("\r\n")}\r\n\r\n${body}\r\n`;
}
