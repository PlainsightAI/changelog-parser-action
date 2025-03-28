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
