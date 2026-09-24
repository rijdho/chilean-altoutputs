// Records in ANID's repository by entity type, from its own discovery facets
// (repositorio.be-anid.com/server/api/discover/facets/entityType), read on 2026-09-24.
// Book chapters appear under two labels in the facets ("CapituloLibro" 3,328 and "Capitulo Libro" 112),
// merged here; the rows sum to the total.
// The harvest behind the dashboard is older (2026-04-03); these are shown for context only.
export const ANID_FACETS_DATE = '2026-09-24';
export const ANID_FACETS = [
  ['Proyecto', 68701], ['Articulo', 49778], ['Tesis', 25182], ['InformeFinal', 16394],
  ['Journal', 9617], ['Ponencia', 6548], ['CapituloLibro', 3440], ['Manuscrito', 673],
  ['Patente', 326], ['Libro', 313], ['DatoInvestigacion', 267], ['PlanGestionDatos', 229],
  ['Convenio', 204], ['MaterialAudiovisual', 60], ['MaterialCartografico', 18], ['Software', 8],
];
export const ANID_TOTAL = 181758;
