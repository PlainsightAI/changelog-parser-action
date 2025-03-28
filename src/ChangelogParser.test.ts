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
