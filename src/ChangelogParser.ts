import { Changelog, ChangelogEntry } from "./Changelog";

export class ChangelogParser {
  // https://regexr.com/5fp7a
  private static readonly linkLabelRegex = /^\[ *[^\]]+ *\]:.+/;

  // Markdown bullet at the start of a (left-stripped) line — `-`, `*`, or
  // `+` followed by whitespace. Used to detect changelog entries misplaced
  // in the file intro (above the first `## ` version header).
  private static readonly bulletLineRegex = /^[-*+]\s/;

  // `- Bump <pkg> to <semver>` — the mechanical bullet the cascade
  // bump-strategy automation produces. Must only appear under
  // `[Unreleased]`; finding it inside a tagged release header means the
  // bump landed in the wrong block.
  private static readonly bumpBulletRegex = /^-\s+Bump\s+\S+\s+to\s+\d+(?:\.\d+)+/;

  static parseChangelog(changelog: string): Changelog {
    const changelogNoIntro = ChangelogParser.removeChangelogIntro(changelog);
    const changelogNoLinks = ChangelogParser.removeLinkLabels(changelogNoIntro);
    const entries = ("\n" + changelogNoLinks)
      .split('\n## ')
      .map(entry => entry.trim())
      .filter(entry => entry.length > 0)
      .map(entry => ChangelogParser.parseEntry(entry));
    ChangelogParser.validateUniqueVersions(entries);
    ChangelogParser.validateNoBumpBulletsInReleasedSections(entries);
    return new Changelog(entries);
  }

  private static validateUniqueVersions(entries: ChangelogEntry[]): void {
    const versions = new Set();
    entries.forEach(entry => {
      if (versions.has(entry.version)) {
        throw new Error(`Duplicated version in changelog: ${entry.version}`);
      }
      versions.add(entry.version);
    });
  }

  // The cascade bump-strategy automation only writes `- Bump <pkg> to X.Y.Z`
  // bullets into `[Unreleased]`. Their presence under a tagged release
  // section indicates a misplaced bump — DT-145 follow-up; see also the
  // producer-side fix at PlainsightAI/openfilter#104.
  private static validateNoBumpBulletsInReleasedSections(
    entries: ChangelogEntry[]
  ): void {
    entries.forEach(entry => {
      if (entry.status === "unreleased") return;
      const offending = entry.description
        .split("\n")
        .find(line => ChangelogParser.bumpBulletRegex.test(line.trim()));
      if (offending !== undefined) {
        throw new Error(
          `Bump bullet found in released section "${entry.version}": ` +
          `"${offending.trim()}". Bump bullets must live under ` +
          `"## [Unreleased]"; the cascade bump-strategy script writes there.`
        );
      }
    });
  }

  private static removeChangelogIntro(changelog: string): string {
    if (changelog.startsWith("## ")) {
      return changelog;
    }
    const index = changelog.indexOf('\n## ');
    // Bullet lines in the intro almost always mean a changelog entry was
    // appended above the first version header (FaceGuard case in DT-145).
    // Reject early — they would otherwise be silently dropped by this
    // function and never validated again. Scan the actual intro segment:
    // up to the first `\n## ` when one exists, or the whole file when no
    // version header is present at all.
    const intro = index >= 0 ? changelog.substring(0, index) : changelog;
    ChangelogParser.validateIntroHasNoBullets(intro);
    return index > 0 ? changelog.substring(index) : "";
  }

  private static validateIntroHasNoBullets(intro: string): void {
    const offending: string[] = [];
    intro.split("\n").forEach(line => {
      if (ChangelogParser.bulletLineRegex.test(line.trimStart())) {
        offending.push(line.trim());
      }
    });
    if (offending.length > 0) {
      throw new Error(
        `Changelog intro (above the first "## " header) contains bullet ` +
        `line(s) that look like misplaced changelog entries: ` +
        offending.map(b => `"${b}"`).join(", ") +
        `. Move them under "## [Unreleased]".`
      );
    }
  }

  private static removeLinkLabels(changelog: string): string {
    return changelog.split("\n")
      .filter(line => !ChangelogParser.linkLabelRegex.test(line))
      .join("\n");
  }

  private static parseEntry(entry: string): ChangelogEntry {
    const lines = entry.split("\n").map(line => line.trim());
    const header = lines.shift() || "";
    const description = lines.join("\n");
  
    // Handle "unreleased"
    const unreleasedMatch = header.match(/^\[\s*unreleased\s*\]$/i);
    if (unreleasedMatch) {
      return {
        version: 'unreleased',
        status: 'unreleased',
        date: undefined,
        description
      };
    }
  
    // Match version with optional date:
    // e.g. "v1.2.3 - 2024-03-11"
    const headerMatch = header.match(/^v([0-9]+)\.([0-9]+)\.([0-9]+)(?:\.([0-9]+)-((?:dev|rc|int)))?(?:\s*-\s*(\d{4}-\d{2}-\d{2}))?$/);
    if (headerMatch) {
      const [ , major, minor, patch, build, suffix, date ] = headerMatch;
      const isProd = !suffix;
      const version = isProd
        ? `v${major}.${minor}.${patch}`
        : `v${major}.${minor}.${patch}.${build}-${suffix}`;
  
      return {
        version,
        versionMajor: major,
        versionMinor: minor,
        versionPatch: patch,
        buildNumber: build,
        suffix,
        status: isProd ? 'release' : 'prerelease',
        date,
        description
      };
    }
  
    throw new Error("Could not parse CHANGELOG entry:\n" + entry);
  }
  
  
}
