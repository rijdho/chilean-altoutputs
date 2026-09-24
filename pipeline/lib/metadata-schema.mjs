/**
 * Metadata completeness schema for Chilean research outputs audit.
 *
 * 10 fields evaluated on both DataCite and ANID records.
 * Each field has:
 *   - id, label, description
 *   - checkDataCite(record)  — evaluates a DataCite attributes object
 *   - checkANID(dimFields)   — evaluates an array of parsed DIM fields
 */

import { isOrcid, isOrcidId } from "./pids.mjs";

// ── Helpers ─────────────────────────────────────────────────────────────────

function hasNonEmpty(val) {
  if (val == null) return false;
  if (typeof val === "string") return val.trim().length > 0;
  if (Array.isArray(val)) return val.length > 0;
  return true;
}

/** Find a DIM field by schema.element.qualifier */
function dimVal(dimFields, schema, element, qualifier) {
  const f = dimFields.find(
    (f) =>
      f.schema === schema &&
      f.element === element &&
      (qualifier === undefined ? true : f.qualifier === qualifier),
  );
  return f?.value ?? null;
}

/** Find ALL matching DIM fields */
function dimVals(dimFields, schema, element, qualifier) {
  return dimFields
    .filter(
      (f) =>
        f.schema === schema &&
        f.element === element &&
        (qualifier === undefined ? true : f.qualifier === qualifier),
    )
    .map((f) => f.value)
    .filter(Boolean);
}

// ── Open license patterns ───────────────────────────────────────────────────

const OPEN_LICENSE_PATTERNS = [
  /creative\s*commons/i,
  /\bCC[\s-]?BY\b/i,
  /\bCC[\s-]?0\b/i,
  /\bCC0\b/i,
  /\bMIT\b/,
  /\bGPL\b/i,
  /\bApache\b/i,
  /\bBSD\b/i,
  /creativecommons\.org/i,
  /opensource\.org/i,
  /spdx\.org/i,
];

function isOpenLicense(text) {
  if (!text || typeof text !== "string") return false;
  return OPEN_LICENSE_PATTERNS.some((rx) => rx.test(text));
}

// ── Field definitions ───────────────────────────────────────────────────────

export const FIELDS = [
  {
    id: "hasOrcid",
    label: "Creator ORCID",
    description: "At least one creator has a well-formed ORCID identifier (pattern and check digit)",
    // Until 2026-09-24 the scheme alone counted, so a null under "ORCID" did too.
    checkDataCite: (rec) => {
      const creators = rec.creators || [];
      return creators.some((c) =>
        (c.nameIdentifiers || []).some(isOrcidId),
      );
    },
    checkANID: (dimFields) => {
      // ORCID stored as dc.contributor.author with ORCID qualifier
      // or dc.identifier.orcid or person.identifier.orcid
      return dimFields.some((f) => isOrcid(f.value));
    },
  },

  {
    id: "hasLicense",
    label: "License",
    description: "Rights or license information specified",
    checkDataCite: (rec) => {
      const rights = rec.rightsList || [];
      return rights.some(
        (r) =>
          hasNonEmpty(r.rights) ||
          hasNonEmpty(r.rightsUri) ||
          hasNonEmpty(r.rightsIdentifier),
      );
    },
    checkANID: (dimFields) => {
      const rights = dimVals(dimFields, "dc", "rights");
      const license = dimVals(dimFields, "dc", "rights", "license");
      const uri = dimVals(dimFields, "dc", "rights", "uri");
      return rights.length > 0 || license.length > 0 || uri.length > 0;
    },
  },

  {
    id: "hasOpenLicense",
    label: "Open License",
    description: "CC-BY, CC0, MIT, GPL, Apache, or BSD license",
    checkDataCite: (rec) => {
      const rights = rec.rightsList || [];
      return rights.some(
        (r) =>
          isOpenLicense(r.rights) ||
          isOpenLicense(r.rightsUri) ||
          isOpenLicense(r.rightsIdentifier),
      );
    },
    checkANID: (dimFields) => {
      const allRights = [
        ...dimVals(dimFields, "dc", "rights"),
        ...dimVals(dimFields, "dc", "rights", "license"),
        ...dimVals(dimFields, "dc", "rights", "uri"),
      ];
      return allRights.some((v) => isOpenLicense(v));
    },
  },

  {
    id: "hasSubjects",
    label: "Subject Keywords",
    description: "Subject or keyword metadata present",
    checkDataCite: (rec) => {
      const subjects = rec.subjects || [];
      return subjects.some((s) => hasNonEmpty(s.subject));
    },
    checkANID: (dimFields) => {
      const subjects = dimVals(dimFields, "dc", "subject");
      const keywords = dimVals(dimFields, "dc", "subject", "keyword");
      return subjects.length > 0 || keywords.length > 0;
    },
  },

  {
    id: "hasDescription",
    label: "Description",
    description: "Non-trivial description (>20 words)",
    checkDataCite: (rec) => {
      const descriptions = rec.descriptions || [];
      return descriptions.some((d) => {
        const text = d.description || "";
        const words = text.trim().split(/\s+/).length;
        return words > 20;
      });
    },
    checkANID: (dimFields) => {
      const descs = dimVals(dimFields, "dc", "description");
      const abstracts = dimVals(dimFields, "dc", "description", "abstract");
      const all = [...descs, ...abstracts];
      return all.some((text) => text.trim().split(/\s+/).length > 20);
    },
  },

  {
    id: "hasFunding",
    label: "Funding Info",
    description: "Funding or grant information present",
    checkDataCite: (rec) => {
      const funding = rec.fundingReferences || [];
      return funding.some(
        (f) =>
          hasNonEmpty(f.funderName) ||
          hasNonEmpty(f.funderIdentifier) ||
          hasNonEmpty(f.awardNumber),
      );
    },
    checkANID: (dimFields) => {
      const sponsors = dimVals(dimFields, "dc", "description", "sponsorship");
      const funding = dimVals(dimFields, "dc", "relation", "funding");
      const projects = dimVals(dimFields, "oaire", "fundingStream");
      const funderName = dimVals(dimFields, "oaire", "funderName");
      return (
        sponsors.length > 0 ||
        funding.length > 0 ||
        projects.length > 0 ||
        funderName.length > 0
      );
    },
  },

  {
    id: "hasRelatedWorks",
    label: "Related Identifiers",
    description: "Related identifiers (DOI links to other works)",
    checkDataCite: (rec) => {
      const related = rec.relatedIdentifiers || [];
      return related.some((r) => hasNonEmpty(r.relatedIdentifier));
    },
    checkANID: (dimFields) => {
      const relations = dimVals(dimFields, "dc", "relation");
      const isPartOf = dimVals(dimFields, "dc", "relation", "ispartof");
      const isReferencedBy = dimVals(
        dimFields,
        "dc",
        "relation",
        "isreferencedby",
      );
      const hasVersion = dimVals(dimFields, "dc", "relation", "hasversion");
      const uri = dimVals(dimFields, "dc", "relation", "uri");
      return (
        relations.length > 0 ||
        isPartOf.length > 0 ||
        isReferencedBy.length > 0 ||
        hasVersion.length > 0 ||
        uri.length > 0
      );
    },
  },

  {
    id: "hasVersion",
    label: "Version",
    description: "Version information specified",
    checkDataCite: (rec) => {
      return hasNonEmpty(rec.version);
    },
    checkANID: (dimFields) => {
      const version = dimVal(dimFields, "dc", "description", "version");
      const citation = dimVal(dimFields, "dc", "identifier", "citation");
      // Sometimes version is embedded in citation string
      return (
        hasNonEmpty(version) ||
        (hasNonEmpty(citation) && /v(ersion)?\s*\d/i.test(citation))
      );
    },
  },

  {
    id: "hasLanguage",
    label: "Language",
    description: "Language of the resource specified",
    checkDataCite: (rec) => {
      return hasNonEmpty(rec.language);
    },
    checkANID: (dimFields) => {
      const lang = dimVal(dimFields, "dc", "language");
      const iso = dimVal(dimFields, "dc", "language", "iso");
      return hasNonEmpty(lang) || hasNonEmpty(iso);
    },
  },

  {
    id: "hasPublisher",
    label: "Publisher / Repository",
    description: "Publisher or repository name specified",
    checkDataCite: (rec) => {
      return hasNonEmpty(rec.publisher);
    },
    checkANID: (dimFields) => {
      const publisher = dimVal(dimFields, "dc", "publisher");
      const source = dimVal(dimFields, "dc", "source");
      return hasNonEmpty(publisher) || hasNonEmpty(source);
    },
  },
];

/**
 * Evaluate a single record against all fields.
 *
 * @param {object} record - DataCite attributes or parsed DIM fields
 * @param {"datacite"|"anid"} source
 * @returns {Object<string, boolean>} field id -> boolean
 */
export function evaluateRecord(record, source) {
  const checkFn = source === "datacite" ? "checkDataCite" : "checkANID";
  const result = {};
  for (const field of FIELDS) {
    try {
      result[field.id] = field[checkFn](record);
    } catch {
      result[field.id] = false;
    }
  }
  return result;
}

/**
 * Compute completeness score from field results.
 *
 * @param {Object<string, boolean>} fieldResults
 * @returns {number} 0-1 score
 */
export function computeCompleteness(fieldResults) {
  const total = FIELDS.length;
  const present = FIELDS.filter((f) => fieldResults[f.id]).length;
  return total > 0 ? present / total : 0;
}

/**
 * Get field IDs and labels for dashboard use.
 */
export const FIELD_IDS = FIELDS.map((f) => f.id);
export const FIELD_LABELS = Object.fromEntries(
  FIELDS.map((f) => [f.id, f.label]),
);
