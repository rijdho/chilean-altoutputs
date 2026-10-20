// The ANID checks and the DataCite type ids, as corrected on 2026-10-20. Each test holds a case
// that the old rule got wrong, so a return to it fails here.
import test from "node:test";
import assert from "node:assert/strict";
import { FIELDS, isWorkIdentifier } from "../lib/metadata-schema.mjs";
import { typeId } from "../lib/datacite-client.mjs";

const check = (id) => FIELDS.find((f) => f.id === id).checkANID;
const dim = (schema, element, qualifier, value) => ({ schema, element, qualifier, value, language: "" });

test("DataCite type ids are kebab-case", () => {
  assert.equal(typeId("ComputationalNotebook"), "computational-notebook");
  assert.equal(typeId("OutputManagementPlan"), "output-management-plan");
  assert.equal(typeId("Software"), "software");
});

test("ANID funding: the grant folio or project id counts", () => {
  assert.equal(check("hasFunding")([dim("dc", "identifier", "folio", "ATE220033")]), true);
  assert.equal(check("hasFunding")([dim("dc", "relation", "projectid", "info:eu-repo/grantAgreement/ANID/1")]), true);
  assert.equal(check("hasFunding")([dim("dc", "title", "", "A title")]), false);
});

test("ANID related works: only an identifier of another work counts", () => {
  const rel = check("hasRelatedWorks");
  assert.equal(rel([dim("dc", "relation", "", "No aplica")]), false);
  assert.equal(rel([dim("dc", "relation", "", "instname: Conicyt")]), false);
  assert.equal(rel([dim("dc", "relation", "projectid", "https://example.org/project/1")]), false);
  const own = "https://hdl.handle.net/10533/1";
  assert.equal(rel([dim("dc", "identifier", "uri", own), dim("dc", "relation", "uri", own)]), false);
  assert.equal(rel([dim("dc", "relation", "doi", "10.1234/abc")]), true);
  assert.equal(rel([dim("dc", "relation", "uri", "https://doi.org/10.1234/abc")]), true);
  assert.equal(isWorkIdentifier("hdl:10533/2"), true);
});

test("ANID ORCID: only a field named orcid counts", () => {
  const orcid = check("hasOrcid");
  assert.equal(orcid([dim("dc", "other", "orcid", "0000-0002-1403-176X")]), true);
  assert.equal(orcid([dim("dc", "description", "", "0000-0002-1403-176X")]), false);
});
