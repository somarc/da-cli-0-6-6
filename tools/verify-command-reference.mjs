#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
const argOf = (flag, fallback) => {
  const index = args.indexOf(flag);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};

const dataFile = resolve(argOf('--data', 'data/command-reference-0.6.6.json'));
const contentRootArg = argOf('--content-root', '');
const contentRoot = contentRootArg ? resolve(contentRootArg) : null;
const expectedTotal = Number(argOf('--expected-total', '138'));
const catalog = JSON.parse(readFileSync(dataFile, 'utf8'));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(catalog.schemaVersion === 'da-cli.site-command-reference.v1', 'unexpected reference schema');
assert(catalog.release === '0.6.6', 'unexpected reference release');
assert(catalog.rubricVersion === '0.6.6-r3', 'unexpected reference rubric');
assert(catalog.summary?.total === expectedTotal, `summary total must be ${expectedTotal}`);
assert(catalog.commands?.length === expectedTotal, `catalog must contain ${expectedTotal} commands`);
assert(new Set(catalog.commands.map(({ checkId }) => checkId)).size === expectedTotal, 'check IDs must be unique');
assert(new Set(catalog.commands.map(({ path }) => path)).size === expectedTotal, 'command paths must be unique');
assert(catalog.commands.every(({ helpExitCode }) => helpExitCode === 0), 'every installed-help capture must succeed');
assert(catalog.commands.every(({ description }) => description?.trim()), 'every command needs a description');
assert(catalog.commands.every(({ referencePath }) => referencePath?.startsWith('/reference/0-6-6/commands/')), 'every command needs a versioned route');
assert(new Set(catalog.commands.map(({ referencePath }) => referencePath)).size === expectedTotal, 'command routes must be unique');

assert(catalog.families?.length === 24, 'catalog must contain 24 command families');
assert(new Set(catalog.families.map(({ id }) => id)).size === 24, 'family IDs must be unique');
const familyCounts = new Map(catalog.families.map(({ id, count }) => [id, count]));
assert([...familyCounts.values()].reduce((sum, count) => sum + count, 0) === expectedTotal, 'family counts must close to total');
catalog.commands.forEach(({ family }) => assert(familyCounts.has(family), `unknown family: ${family}`));
assert(new Set(catalog.families.map(({ path }) => path)).size === catalog.families.length, 'family routes must be unique');

if (contentRoot) {
  const allPath = resolve(contentRoot, 'reference/0-6-6/commands.html');
  assert(existsSync(allPath), 'all-command page is missing');
  const allSource = readFileSync(allPath, 'utf8');
  const familyRoutes = new Map(catalog.families.map(({ id, path }) => [id, path]));
  catalog.commands.forEach(({ path, family, referencePath }) => {
    const familyRoute = familyRoutes.get(family)?.replace(/^\//, '');
    const familyPath = resolve(contentRoot, `${familyRoute}.html`);
    assert(existsSync(familyPath), `family page is missing: ${family}`);
    const needle = `<code>da ${path}</code>`;
    assert(allSource.includes(needle), `all-command page is missing: ${path}`);
    assert(readFileSync(familyPath, 'utf8').includes(needle), `family page is missing: ${path}`);
    const route = referencePath.replace(/^\//, '');
    const leafPath = resolve(contentRoot, route.endsWith('/') ? `${route}index.html` : `${route}.html`);
    assert(existsSync(leafPath), `command page is missing: ${referencePath}`);
    assert(readFileSync(leafPath, 'utf8').includes(needle), `command page has wrong identity: ${path}`);
  });
}

const statuses = Object.fromEntries(
  [...new Set(catalog.commands.map(({ evidenceStatus }) => evidenceStatus))]
    .sort()
    .map((status) => [status, catalog.commands.filter((item) => item.evidenceStatus === status).length]),
);

console.log(JSON.stringify({
  ok: true,
  release: catalog.release,
  rubricVersion: catalog.rubricVersion,
  commands: catalog.commands.length,
  families: catalog.families.length,
  statuses,
  contentVerified: Boolean(contentRoot),
}, null, 2));
