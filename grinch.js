import { dirname } from 'path';
import { fileURLToPath } from 'url';

const dirnafn = dirname(fileURLToPath(import.meta.url));

console.log(__dirname)