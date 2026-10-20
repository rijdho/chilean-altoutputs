// Copy the records index the record lists fetch from the tracked dashboard data into public/,
// so the served file is always the one the aggregate step last wrote.
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = resolve(here, '../../data/dashboard/records-lite.json');
const dst = resolve(here, '../public/data/records-lite.json');
mkdirSync(dirname(dst), { recursive: true });
copyFileSync(src, dst);
console.log('records-lite.json synced');
