import * as core from '@actions/core';
import { Action } from './Action';

async function run(): Promise<void> {
  const path = core.getInput('path') || undefined;
  const version = core.getInput('version') || undefined;
  const skipBumpBulletChecks = core.getBooleanInput('skip-bump-bullet-checks');

  if (skipBumpBulletChecks) {
    // Loud-by-default: the bypass shows up in the workflow's Annotations
    // tab so reviewers can see it even if they don't read the step log.
    core.warning(
      "skip-bump-bullet-checks=true — misplaced-bump validation is " +
      "disabled. This rule exists to catch bugs the cascade bump-strategy " +
      "script used to produce; re-enable as soon as the underlying " +
      "RELEASE.md is fixed."
    );
  }

  const entry = await new Action().run(version, path, { skipBumpBulletChecks });

  const versionStr = entry?.version ?? "";
  const major = entry?.versionMajor ?? "";
  const minor = entry?.versionMinor ?? "";
  const patch = entry?.versionPatch ?? "";
  const build = entry?.buildNumber ?? "";
  const suffix = entry?.suffix ?? "";
  const date = entry?.date ?? "";
  const description = entry?.description ?? "";
  const isProductionRelease = build === "" ? "true" : "false";

  core.startGroup('Parse CHANGELOG');
  core.info(`Version: "${versionStr}"`);
  core.info(`  Major: "${major}"`);
  core.info(`  Minor: "${minor}"`);
  core.info(`  Patch: "${patch}"`);
  core.info(`  Build: "${build}"`);
  core.info(`  Suffix: "${suffix}"`);
  core.info(`  isProductionRelease: "${isProductionRelease}"`);
  core.info(`Date: "${date}"`);
  core.info(`Description:\n${description}\n`);
  core.endGroup();

  core.setOutput('version', versionStr);
  core.setOutput('versionMajor', major);
  core.setOutput('versionMinor', minor);
  core.setOutput('versionPatch', patch);
  core.setOutput('buildNumber', build);
  core.setOutput('suffix', suffix);
  core.setOutput('date', date);
  core.setOutput('description', description);
  core.setOutput('isProductionRelease', isProductionRelease);
}

async function main(): Promise<void> {
  try {
    await run();
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed(String(error));
    }
  }
}

main();
