/**
 * Data loader: imports pre-generated dashboard JSONs.
 * In production these are bundled as static assets via Vite.
 */

import overview     from '../../../data/dashboard/overview.json';
import types        from '../../../data/dashboard/types.json';
import repositories from '../../../data/dashboard/repositories.json';
import fields       from '../../../data/dashboard/fields.json';
import licenses     from '../../../data/dashboard/licenses.json';
import yearly       from '../../../data/dashboard/yearly.json';
import institutions from '../../../data/dashboard/institutions.json';

export { overview, types, repositories, fields, licenses, yearly, institutions };
