/**
 * Which publisher names belong to Chilean organisations, reviewed by hand on 2026-10-20 against the
 * DataCite harvest of that day (DOI prefix and landing page where the name was not enough).
 *
 * The dashboard groups records by the publisher DataCite records, not by the repository that holds
 * them: several Chilean publishers deposit through GBIF (prefix 10.15468), so "Chilean" here means
 * published by a Chilean organisation, wherever the record is held. Until 2026-10-20 the page guessed
 * from the name ("chile", "Santiago", ...), which missed "Datos de Investigación UC".
 *
 * NOT_CHILEAN lists names a reader might take for Chilean that are not. aggregate() stops when a
 * publisher among those shown matches CANDIDATE but is in neither list, so a new one gets reviewed.
 */
export const CHILEAN = new Set([
  "ANID Repository",
  "Repositorio de datos de investigación de la Universidad de Chile",
  "Universidad de Chile",
  "Laboratorio Biología de Plantas - Universidad de Chile",
  "Usach",
  "Datos de Investigación UC",
  "Pontifical Catholic University of Chile",
  "Repositorio de Datos de Investigación - Universidad Andrés Bello (Chile)",
  "Datos para Resiliencia", // datospararesiliencia.cl
  "Ministerio del Medio Ambiente de Chile", // through GBIF
  "Universidad Austral de Chile",
  "Universidad de Los Andes, Chile",
  "Universidad Central de Chile",
  "Universidad de Magallanes", // through GBIF
  "Instituto de Biodiversidad de Ecosistemas Antárticos y Subantárticos (BASE)", // through GBIF
  "Departamento de Estomatología, Facultad de Odontología, Universidad de Talca",
]);

export const NOT_CHILEAN = new Set([
  "SciELO Data", // SciELO, Brazil
  "SciELO journals",
  "SciELO",
  "Universidad del Rosario", // Colombia
]);

/** Names that look Chilean or Latin American enough to need a decision. */
export const CANDIDATE = /chile|santiago|concepci|valpara|usach|\bUC\b|anid|universidad|pontific|ministerio|instituto|resiliencia|scielo/i;
