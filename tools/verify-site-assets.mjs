#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const manifestPath = resolve('media/imagine/provenance.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(manifest.schemaVersion === 'da-cli-site.imagine-provenance.v1', 'unexpected media provenance schema');
assert(Array.isArray(manifest.assets) && manifest.assets.length === 7, 'expected seven delivered visual assets');

const results = manifest.assets.map((asset) => {
  const file = resolve(asset.path.replace(/^\//, ''));
  assert(existsSync(file), `missing visual asset: ${asset.path}`);
  const bytes = readFileSync(file);
  const digest = createHash('sha256').update(bytes).digest('hex');
  assert(digest === asset.sha256, `visual asset digest mismatch: ${asset.path}`);
  assert(bytes.byteLength > 1024, `visual asset is unexpectedly small: ${asset.path}`);
  return { path: asset.path, bytes: bytes.byteLength, sha256: digest };
});

console.log(JSON.stringify({ ok: true, assets: results }, null, 2));
