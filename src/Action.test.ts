import * as path from 'path';
import * as os from 'os';
import { promises as fs } from 'fs';
import { Action } from './Action';

let tmpdir: string;
let action: Action;

beforeAll(async () => {
  tmpdir = await fs.mkdtemp(path.join(os.tmpdir(), "changlog-parser-test"));
  action = new Action(tmpdir);
});

afterAll(async () => {
  if (tmpdir) {
    await fs.rm(tmpdir, { recursive: true, force: true });
  }
});

const writeChangelog = async (content: string[], fileName = "CHANGELOG.md"): Promise<void> => {
  await fs.writeFile(path.join(tmpdir, fileName), content.join("\n"), 'utf8');
};

test('should throw error on missing CHANGELOG in default locations', async () => {
  expect.assertions(1);
  try {
    await action.run();
  } catch (e) {
    expect(e.message).toEqual("Could not find CHANGELOG file. Searched in locations: CHANGELOG.md, CHANGELOG, changelog.md, changelog");
  }
});

test('should throw error on missing CHANGELOG in specific location', async () => {
  expect.assertions(1);
  try {
    await action.run(undefined, "CHANGELOGGG.md");
  } catch (e) {
    expect(e.message).toEqual("Could not find CHANGELOG file: CHANGELOGGG.md");
  }
});

test('should load CHANGELOG from default location (prod version)', async () => {
  await writeChangelog([
    "## v1.0.0",
    "Stable release"
  ]);
  const entry = await action.run();
  expect(entry?.version).toBe("v1.0.0");
});

test('should load CHANGELOG from specific location (non-prod version)', async () => {
  await writeChangelog([
    "## v2.0.0.123-dev",
    "Dev release"
  ], "CHANGELOGGG.md");
  const entry = await action.run(undefined, "CHANGELOGGG.md");
  expect(entry?.version).toBe("v2.0.0.123-dev");
});

test('should return latest released version (top-down newest)', async () => {
  await writeChangelog([
    "## [unreleased]",
    "## v3.0.0.999-rc",
    "## v2.0.0",
    "## v1.0.0"
  ]);
  const entry = await action.run();
  expect(entry?.version).toBe("v3.0.0.999-rc");
});

test('should throw error on out-of-order versions', async () => {
  await writeChangelog([
    "## [unreleased]",
    "## v2.0.0",
    "## v3.0.0.999-rc"
  ]);
  await expect(action.run()).rejects.toThrow(
    'Invalid changelog: version "v3.0.0.999-rc" must be older than or equal to "v2.0.0"'
  );
});

test('should return empty entry if changelog is completely empty', async () => {
  await writeChangelog([""]);
  const entry = await action.run();
  expect(entry).toBeUndefined();
});

test('should throw error if requested version not found', async () => {
  expect.assertions(1);
  await writeChangelog([
    "## v1.0.0"
  ]);
  try {
    await action.run("v9.9.9");
  } catch (e) {
    expect(e.message).toEqual("Could not find CHANGELOG entry for version: v9.9.9");
  }
});

test('should support parsing [unreleased] explicitly', async () => {
  await writeChangelog([
    "## [unreleased]",
    "Experimental feature"
  ]);
  const entry = await action.run("unreleased");
  expect(entry?.version).toBe("unreleased");
});
