/**
 * Persistent-identifier structure. A declared ORCID is not always one: DataCite accepts any
 * string (null included) under nameIdentifierScheme "ORCID". Same rule as fair-repo-audit's
 * src/pids.js, so the dashboards and the open tool count identically.
 */
const ORCID_TAIL = /(\d{4}-\d{4}-\d{4}-\d{3}[\dX])\/?$/;

/** An ORCID iD, bare or as a URL, whose ISO 7064 11,2 check digit is right. */
export function isOrcid(value) {
  if (typeof value !== "string") return false;
  const m = ORCID_TAIL.exec(value.trim());
  if (!m) return false;
  const digits = m[1].replace(/-/g, "");
  let total = 0;
  for (const ch of digits.slice(0, -1)) total = (total + Number(ch)) * 2;
  const check = (12 - (total % 11)) % 11;
  return digits.at(-1) === (check === 10 ? "X" : String(check));
}

/** A DataCite name identifier that is an ORCID: marked as one (scheme, schemeUri or the value), and well-formed. */
export const isOrcidId = (n) =>
  !!n && isOrcid(n.nameIdentifier) &&
  (/^orcid$/i.test(n.nameIdentifierScheme ?? "") || /orcid\.org/i.test(n.schemeUri ?? "") || /orcid\.org/i.test(n.nameIdentifier));
