#!/usr/bin/env node
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdirSync, copyFileSync, statSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const src = resolve(root, 'node_modules/@babylonjs/havok/lib/esm/HavokPhysics.wasm');
const outDir = resolve(root, 'public/havok');
const dest = resolve(outDir, 'HavokPhysics.wasm');

mkdirSync(outDir, { recursive: true });
copyFileSync(src, dest);
const bytes = statSync(dest).size;
console.log(`copy-havok: ${bytes.toLocaleString()} bytes -> ${dest.replace(root, '.')}`);
