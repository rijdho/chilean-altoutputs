/**
 * What counts as a licence, an open licence, and a link to another work.
 *
 * Pure functions, no I/O, so the tests can plant cases (tests/rules.test.mjs). They exist because
 * the first version counted a field as filled when it merely carried text, the mistake already
 * corrected for ORCID and ROR (pids.mjs):
 *   - "Open Access", "Restricted Access" and the info:eu-repo access terms say who may read a
 *     record, not under what terms: they are not a licence.
 *   - A Creative Commons licence with NonCommercial or NoDerivatives is not open (Open
 *     Definition), and "MIT" can be the university, not the licence.
 *   - A dataset that points only to its own files (HasPart/IsPartOf under its own DOI) or to its
 *     own versions links to no other work. On Dataverse this is most records.
 */

const ACCESS_ONLY = [
  /^\s*(open|closed|restricted|embargoed|metadata[\s-]*only)\s+access\b/i,
  /info:eu-repo\/semantics\/(open|closed|restricted|embargoed)Access/i,
  /^\s*(acceso\s+(abierto|restringido|cerrado)|access\s+rights?)\s*$/i,
];

/** True when a rights value only states an access condition. */
export function isAccessStatement(text) {
  if (!text || typeof text !== "string") return false;
  return ACCESS_ONLY.some((rx) => rx.test(text));
}

/** True when a rights value says something beyond access: an actual licence or terms of use. */
export function isLicenceText(text) {
  if (!text || typeof text !== "string" || !text.trim()) return false;
  return !isAccessStatement(text);
}

const RESTRICTED_CC = /\b(NC|ND)\b|non[\s-]?commercial|no[\s-]?deriv|by-nc|by-nd/i;
const CC = /creative\s*commons|creativecommons\.org\/(licenses|publicdomain)|\bCC[\s-]?BY\b|\bCC[\s-]?0\b|\bCC0\b|public\s+domain/i;
const OSI = [
  /\bMIT\s+licen[cs]e\b/i, /^\s*MIT(-0)?\s*$/, /licenses\/MIT\b/i, /opensource\.org\/licen[cs]es?\/mit\b/i,
  /\bApache\b(?![\s-]*Point)/i, /\bBSD(-[1-4]-Clause)?\b/i, /\b(A|L)?GPL(-?v?\d(\.\d)?)?\b/i,
  /\bGNU\s+(Affero\s+|Lesser\s+)?General\s+Public\s+Licen[cs]e\b/i, /\bMPL(-2\.0)?\b|Mozilla\s+Public\s+Licen[cs]e/i,
  /\bEUPL\b/i, /\bISC\s+Licen[cs]e\b|^\s*ISC\s*$/i, /opensource\.org\/licen[cs]es?\//i,
];

/** True for an open licence: CC BY, CC BY-SA, CC0 or public domain, or an OSI software licence. */
export function isOpenLicence(text) {
  if (!isLicenceText(text)) return false;
  if (CC.test(text)) return !RESTRICTED_CC.test(text);
  return OSI.some((rx) => rx.test(text));
}

const VERSION_TYPES = new Set(["HasVersion", "IsVersionOf", "IsNewVersionOf", "IsPreviousVersionOf", "IsIdenticalTo"]);

/** True when a DataCite related identifier points to another work, not to the record's own files or versions. */
export function isOtherWork(rel, ownDoi) {
  const v = String(rel?.relatedIdentifier ?? "").trim().toLowerCase().replace(/^https?:\/\/(dx\.)?doi\.org\//, "");
  if (!v) return false;
  if (VERSION_TYPES.has(rel.relationType)) return false;
  const own = String(ownDoi ?? "").trim().toLowerCase();
  if (own && (rel.relationType === "HasPart" || rel.relationType === "IsPartOf")) {
    if (v === own || v.startsWith(own + "/") || own.startsWith(v + "/")) return false;
  }
  return true;
}
