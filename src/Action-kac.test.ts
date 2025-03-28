import * as path from 'path';
import * as os from 'os';
import { promises as fs } from 'fs';
import { Action } from './Action';

const modernChangelog = `
# Changelog

## [unreleased]
- Unreleased feature

## v2.0.0.456-dev
### Added
- Dev build for internal testing

## v1.2.3
### Fixed
- Minor production bug
`;

let tmpdir: string;
let action: Action;

beforeAll(async () => {
  tmpdir = await fs.mkdtemp(path.join(os.tmpdir(), "changlog-parser-test"));
  action = new Action(tmpdir);
  await fs.writeFile(path.join(tmpdir, "CHANGELOG.md"), modernChangelog, 'utf8');
});

afterAll(async () => {
  if (tmpdir) {
    await fs.rm(tmpdir, { recursive: true, force: true });
  }
});

test('should return latest released entry (v2.0.0.456-dev)', async () => {
  const entry = await action.run();
  expect(entry).toStrictEqual({
    version: 'v2.0.0.456-dev',
    versionMajor: '2',
    versionMinor: '0',
    versionPatch: '0',
    buildNumber: '456',
    suffix: 'dev',
    status: 'prerelease',
    date: undefined,
    description: '### Added\n- Dev build for internal testing'
  });
});

test('should return [unreleased] entry', async () => {
  const entry = await action.run("unreleased");
  expect(entry).toStrictEqual({
    version: 'unreleased',
    status: 'unreleased',
    date: undefined,
    description: '- Unreleased feature'
  });
});

test('should return specific non-prod entry', async () => {
  const entry = await action.run("v1.2.3");
  expect(entry).toStrictEqual({
    version: 'v1.2.3',
    versionMajor: '1',
    versionMinor: '2',
    versionPatch: '3',
    buildNumber: undefined,
    suffix: undefined,
    status: 'release',
    date: undefined,
    description: '### Fixed\n- Minor production bug'
  });
});

test('should allow multiple entries with same core version', async () => {
  const changelog = `
    ## v1.2.3
    Stable

    ## v1.2.3.1-dev
    Should be older
  `;
  await fs.writeFile(path.join(tmpdir, "CHANGELOG.md"), changelog.trim(), "utf8");
  const entry = await action.run();
  expect(entry?.version).toBe("v1.2.3");
});

test('should correctly identify latest version as v1.2.3.1-int over v1.2.3', async () => {
  const changelog = `
    ## v1.2.3.1-int
    Internal

    ## v1.2.3
    Stable
  `;
  await fs.writeFile(path.join(tmpdir, "CHANGELOG.md"), changelog.trim(), "utf8");
  const entry = await action.run();
  expect(entry?.version).toBe("v1.2.3.1-int");
});

test('should return latest prod version when multiple prod versions are listed', async () => {
  const changelog = `
    ## v2.0.0
    Final

    ## v1.9.9
    Previous
  `;
  await fs.writeFile(path.join(tmpdir, "CHANGELOG.md"), changelog.trim(), "utf8");
  const entry = await action.run();
  expect(entry?.version).toBe("v2.0.0");
});