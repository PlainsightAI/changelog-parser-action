import { ChangelogParser } from "./ChangelogParser";

test("should parse valid prod and non-prod versions", () => {
  const changelog = ChangelogParser.parseChangelog([
    "## v1.2.3",
    "Prod release",
    "## v1.2.3.456-dev",
    "Dev build",
    "## v1.2.3.0-int",
    "Internal test"
  ].join("\n"));

  expect(changelog.getEntries()).toStrictEqual([
    {
      version: "v1.2.3",
      versionMajor: "1",
      versionMinor: "2",
      versionPatch: "3",
      buildNumber: undefined,
      suffix: undefined,
      status: "release",
      date: undefined,
      description: "Prod release"
    },
    {
      version: "v1.2.3.456-dev",
      versionMajor: "1",
      versionMinor: "2",
      versionPatch: "3",
      buildNumber: "456",
      suffix: "dev",
      status: "prerelease",
      date: undefined,
      description: "Dev build"
    },
    {
      version: "v1.2.3.0-int",
      versionMajor: "1",
      versionMinor: "2",
      versionPatch: "3",
      buildNumber: "0",
      suffix: "int",
      status: "prerelease",
      date: undefined,
      description: "Internal test"
    }
  ]);
});

["[unreleased]", "[UNRELEASED]"].forEach(tag => {
  test("should parse allowed unreleased tag: " + tag, () => {
    const changelog = ChangelogParser.parseChangelog([
      `## ${tag}`,
      "Some content"
    ].join("\n"));

    expect(changelog.getEntries()[0]).toMatchObject({
      version: "unreleased",
      status: "unreleased"
    });
  });
});

test("should throw error on invalid version formats", () => {
  const invalidHeaders = [
    "## 1.2.3",
    "## v1.2.3-beta",
    "## v1.2.3.456-prod",
    "## v1.2.3.456", // missing suffix
    "## [1.2.3]",
    "## Version 1.2.3",
    "## unreleased",
    "## UNRELEASED"
  ];

  for (const header of invalidHeaders) {
    expect(() => {
      ChangelogParser.parseChangelog([header, "Invalid"].join("\n"));
    }).toThrow("Could not parse CHANGELOG entry:");
  }
});

test("should throw on duplicate versions", () => {
  expect(() => {
    ChangelogParser.parseChangelog([
      "## v1.0.0",
      "## v1.0.0"
    ].join("\n"));
  }).toThrow("Duplicated version in changelog: v1.0.0");
});

test('should allow same core version with different builds', () => {
  const changelog = ChangelogParser.parseChangelog([
    "## v1.2.3",
    "Prod release",
    "## v1.2.3.1-dev",
    "Dev build",
    "## v1.2.3.2-rc",
    "Release candidate"
  ].join("\n"));

  expect(changelog.getEntries().map(e => e.version)).toEqual([
    "v1.2.3",
    "v1.2.3.1-dev",
    "v1.2.3.2-rc"
  ]);
});


test('should throw error on exact duplicate versions', () => {
  expect(() =>
    ChangelogParser.parseChangelog([
      "## v1.2.3",
      "Release A",
      "## v1.2.3",
      "Release B"
    ].join("\n"))
  ).toThrow("Duplicated version in changelog: v1.2.3");
});

test('should fail on malformed version like "1.0" (missing patch)', () => {
  expect(() =>
    ChangelogParser.parseChangelog([
      "## v1.0",
      "Bad version"
    ].join("\n"))
  ).toThrow("Could not parse CHANGELOG entry:");
});

test('should fail on malformed version like "v1.0.0.456-prod" (invalid suffix)', () => {
  expect(() =>
    ChangelogParser.parseChangelog([
      "## v1.0.0.456-prod",
      "Bad suffix"
    ].join("\n"))
  ).toThrow("Could not parse CHANGELOG entry:");
});

test('should parse version with leading/trailing whitespace in header', () => {
  const changelog = ChangelogParser.parseChangelog([
    "##   v1.2.3.4-dev   ",
    "Trimmed header"
  ].join("\n"));
  expect(changelog.getEntries()[0].version).toBe("v1.2.3.4-dev");
});

test('should reject mixed-case suffixes like -RC or -Dev', () => {
  const invalidHeaders = [
    "## v1.2.3.1-RC",
    "## v1.2.3.2-Int",
    "## v1.2.3.3-DeV"
  ];

  for (const header of invalidHeaders) {
    expect(() => {
      ChangelogParser.parseChangelog([header, "Mixed case"].join("\n"));
    }).toThrow("Could not parse CHANGELOG entry:");
  }
});


test('should support long changelog descriptions with markdown formatting', () => {
  const changelog = ChangelogParser.parseChangelog([
    "## v1.0.0",
    "### Added",
    "- Feature 1\n- Feature 2",
    "### Changed",
    "- Something changed",
    "### Fixed",
    "- A bug was fixed"
  ].join("\n"));

  expect(changelog.getEntries()[0]).toMatchObject({
    version: "v1.0.0",
    description: expect.stringContaining("### Added")
  });
});

test('should throw on duplicated version with suffix (e.g., v1.2.3.1-dev)', () => {
  expect(() =>
    ChangelogParser.parseChangelog([
      "## v1.2.3.1-dev",
      "First entry",
      "## v1.2.3.1-dev",
      "Duplicate"
    ].join("\n"))
  ).toThrow("Duplicated version in changelog: v1.2.3.1-dev");
});

test('should ignore versions that are commented out', () => {
  const changelog = ChangelogParser.parseChangelog([
    "# ## v1.2.3",
    "# - This is a comment",
    "## v1.0.0",
    "First release"
  ].join("\n"));

  const versions = changelog.getEntries().map(e => e.version);
  expect(versions).toEqual(["v1.0.0"]);
});

test('should parse version entry followed by empty line', () => {
  const changelog = ChangelogParser.parseChangelog([
    "## v1.0.0",
    ""
  ].join("\n"));

  expect(changelog.getEntries()[0].version).toBe("v1.0.0");
  expect(changelog.getEntries()[0].description).toBe("");
});

test('should support [unreleased] entry with no body', () => {
  const changelog = ChangelogParser.parseChangelog([
    "## [unreleased]"
  ].join("\n"));

  expect(changelog.getEntries()[0]).toMatchObject({
    version: "unreleased",
    description: ""
  });
});

test('should parse prod version with date', () => {
  const changelog = ChangelogParser.parseChangelog([
    "## v1.2.3 - 2024-01-01",
    "Some release notes"
  ].join("\n"));

  expect(changelog.getEntries()[0]).toMatchObject({
    version: "v1.2.3",
    versionMajor: "1",
    versionMinor: "2",
    versionPatch: "3",
    buildNumber: undefined,
    suffix: undefined,
    status: "release",
    date: "2024-01-01",
    description: "Some release notes"
  });
});

test('should parse non-prod version with date', () => {
  const changelog = ChangelogParser.parseChangelog([
    "## v1.2.3.456-dev - 2024-01-02",
    "Dev version description"
  ].join("\n"));

  expect(changelog.getEntries()[0]).toMatchObject({
    version: "v1.2.3.456-dev",
    versionMajor: "1",
    versionMinor: "2",
    versionPatch: "3",
    buildNumber: "456",
    suffix: "dev",
    status: "prerelease",
    date: "2024-01-02",
    description: "Dev version description"
  });
});

test('should ignore extra whitespace around date', () => {
  const changelog = ChangelogParser.parseChangelog([
    "## v1.0.0.1-int   -   2024-03-28",
    "Internal release"
  ].join("\n"));

  expect(changelog.getEntries()[0]).toMatchObject({
    version: "v1.0.0.1-int",
    status: "prerelease",
    date: "2024-03-28"
  });
});

test('should return true for production release in isProductionRelease logic', () => {
  const changelog = ChangelogParser.parseChangelog([
    "## v1.2.3",
    "Stable release"
  ].join("\n"));

  const entry = changelog.getEntries()[0];
  expect(entry.buildNumber).toBeUndefined();
  expect(entry.suffix).toBeUndefined();
  expect(entry.version).toBe("v1.2.3");
  expect(entry.status).toBe("release"); // still checked internally
  expect(entry.buildNumber === undefined).toBe(true); // logic for isProductionRelease
});

test('should return false for non-production release in isProductionRelease logic', () => {
  const changelog = ChangelogParser.parseChangelog([
    "## v1.2.3.456-dev",
    "Dev release"
  ].join("\n"));

  const entry = changelog.getEntries()[0];
  expect(entry.buildNumber).toBe("456");
  expect(entry.suffix).toBe("dev");
  expect(entry.version).toBe("v1.2.3.456-dev");
  expect(entry.status).toBe("prerelease");
  expect(entry.buildNumber === undefined).toBe(false); // logic for isProductionRelease
});

// ─────────────────── DT-145 follow-up: misplaced bump bullets ───────────────────
// The cascade bump-strategy script (PlainsightAI/openfilter) emits
// `- Bump <pkg> to X.Y.Z` bullets into RELEASE.md. A prior bug landed those
// bullets either in the file intro (FaceGuard case) or inside an already-
// tagged release section (filter-sweet-green-subject-data-aggregator #39).
// These rules fail CI on either pattern so the gate catches mis-edits even
// after the producer-side fix has shipped.

test('should throw when bump bullet appears in intro (FaceGuard pattern)', () => {
  expect(() =>
    ChangelogParser.parseChangelog([
      "# Changelog",
      "",
      "FaceGuard release notes",
      "- Bump openfilter to 1.0.0",
      "",
      "## [Unreleased]",
      ""
    ].join("\n"))
  ).toThrow(/Changelog intro .* contains bump bullet/);
});

test('should report multiple misplaced intro bullets', () => {
  expect(() =>
    ChangelogParser.parseChangelog([
      "# Changelog",
      "- Bump openfilter to 1.0.0",
      "- Bump openfilter to 1.1.0",
      "## [Unreleased]"
    ].join("\n"))
  ).toThrow(/"- Bump openfilter to 1.0.0".*"- Bump openfilter to 1.1.0"/);
});

test('should allow a non-bump bullet list in the intro', () => {
  // The intro rule is scoped to the cascade's bump-bullet shape so projects
  // whose intros legitimately use bullet lists (feature summaries, pointers
  // to the canonical changelog) are not affected. Regression in case a
  // future change broadens the rule back to "any list".
  const changelog = ChangelogParser.parseChangelog([
    "# Changelog",
    "",
    "Highlights:",
    "- Feature summary",
    "- Pointer to canonical changelog",
    "",
    "## [Unreleased]",
    "Some notes"
  ].join("\n"));

  expect(changelog.getEntries().map(e => e.version)).toEqual(["unreleased"]);
});

test('should allow an ordered list in the intro', () => {
  // Cascade rewriter only emits unordered `- Bump …` bullets, so a
  // numbered intro list (deploy policy, release-process notes) can't be a
  // misplaced cascade entry. The intro validator skips ordered lists
  // explicitly via `(list).ordered` — this test pins that.
  const changelog = ChangelogParser.parseChangelog([
    "# Changelog",
    "",
    "1. Breaking changes require a manual release.",
    "2. See README for deploy instructions.",
    "",
    "## v1.2.3",
    "First release"
  ].join("\n"));

  expect(changelog.getEntries().map(e => e.version)).toEqual(["v1.2.3"]);
});

test('should allow plain-paragraph intro above the first version header', () => {
  const changelog = ChangelogParser.parseChangelog([
    "# Changelog",
    "",
    "All notable changes to this project will be documented in this file.",
    "The format is based on Keep a Changelog.",
    "",
    "## [Unreleased]",
    "Some notes"
  ].join("\n"));

  expect(changelog.getEntries().map(e => e.version)).toEqual(["unreleased"]);
});

test('should throw when bump bullet appears in a released section (SGSDA #39 pattern)', () => {
  expect(() =>
    ChangelogParser.parseChangelog([
      "# Sweet Green Subject Data Aggregator filter release notes",
      "",
      "## v0.1.27 - 2026-04-24",
      "",
      "### Changed",
      "",
      "- Bump openfilter to 1.1.0",
      "",
      "### Fixed",
      "- Restore RELEASE.md heading format"
    ].join("\n"))
  ).toThrow(/Bump bullet found in released section "v0.1.27".*"- Bump openfilter to 1\.1\.0"/);
});

test('should throw on bump bullet in released section even without a date', () => {
  expect(() =>
    ChangelogParser.parseChangelog([
      "## v1.0.0",
      "### Changed",
      "- Bump openfilter to 1.1.0"
    ].join("\n"))
  ).toThrow(/Bump bullet found in released section "v1.0.0"/);
});

test('should allow bump bullets under [Unreleased]', () => {
  const changelog = ChangelogParser.parseChangelog([
    "# Changelog",
    "",
    "## [Unreleased]",
    "",
    "### Changed",
    "",
    "- Bump openfilter to 1.1.0",
    "",
    "## v0.1.27 - 2026-04-24",
    "",
    "### Fixed",
    "- Restore RELEASE.md heading format"
  ].join("\n"));

  expect(changelog.getEntries().map(e => e.version)).toEqual([
    "unreleased",
    "v0.1.27"
  ]);
});

test('should not fire bump-bullet rule on prose mentioning a bump', () => {
  // "Bumped" in a narrative paragraph is not a bullet — must not trigger.
  const changelog = ChangelogParser.parseChangelog([
    "## v1.0.0",
    "Bumped openfilter to 1.1.0 as part of this release.",
    "Other notes."
  ].join("\n"));

  expect(changelog.getEntries()[0].version).toBe("v1.0.0");
});

test('should accept variant package names in the bump bullet rule', () => {
  // The rule keys on the bullet shape, not the package name — any
  // `- Bump <pkg> to X.Y.Z` under a released header is rejected.
  expect(() =>
    ChangelogParser.parseChangelog([
      "## v1.0.0",
      "- Bump filter-faceblur to 0.1.5"
    ].join("\n"))
  ).toThrow(/Bump bullet found in released section "v1.0.0".*"- Bump filter-faceblur to 0\.1\.5"/);
});

test('should preserve per-line interior whitespace in description (post-marked behavior pin)', () => {
  // The marked-driven parser rebuilds descriptions from token.raw and
  // trims only the joined result. The previous regex-based parser
  // line-trimmed each line individually. Both shapes appear in
  // downstream consumers (e.g. `openfilter/create-release.yaml` uses
  // `outputs.description` directly as release-notes content). This test
  // pins the current behavior so a future parser swap doesn't silently
  // regress either direction.
  const changelog = ChangelogParser.parseChangelog([
    "## v1.0.0",
    "### Added",
    "- A bullet  with  internal  whitespace"
  ].join("\n"));

  const desc = changelog.getEntries()[0].description;
  // Interior whitespace inside the bullet text round-trips verbatim.
  expect(desc).toContain("A bullet  with  internal  whitespace");
  // The H3 marker and bullet marker are preserved.
  expect(desc).toContain("### Added");
  expect(desc).toMatch(/^### Added/);
});
