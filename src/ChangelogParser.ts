import { marked, Token, Tokens } from "marked";
import { Changelog, ChangelogEntry } from "./Changelog";

interface PendingEntry {
  entry: ChangelogEntry;
  descriptionTokens: Token[];
}

export class ChangelogParser {
  // `- Bump <pkg> to <semver>` — the mechanical bullet the cascade
  // bump-strategy automation produces. Must only appear under
  // `[Unreleased]`; finding it inside a tagged release header (or in the
  // file preamble) means the bump landed in the wrong block.
  //
  // `-` only (not `*` or `+`) is intentional: this regex exists to catch
  // the cascade script's mechanical output, which always emits `-`. A
  // hand-typed `* Bump ...` would slip past — that's by design; the rule
  // is scoped to the automated failure mode we know about.
  private static readonly bumpBulletRegex =
    /^-\s+Bump\s+\S+\s+to\s+\d+(?:\.\d+)+/;

  static parseChangelog(changelog: string): Changelog {
    // marked.lexer gives us a CommonMark token stream. Driving the parser
    // off the AST (not regex splits like `\n## `) keeps the layout-detection
    // honest: `- Bump ...` inside a fenced code block is a `code` token, not
    // a `list`, so the validation rules below don't false-positive on
    // example text inside release notes.
    const tokens = marked.lexer(changelog);

    const introTokens: Token[] = [];
    const pending: PendingEntry[] = [];
    let current: PendingEntry | null = null;

    for (const token of tokens) {
      if (
        token.type === "heading" &&
        (token as Tokens.Heading).depth === 2
      ) {
        const entry = ChangelogParser.parseHeading(
          (token as Tokens.Heading).text
        );
        current = { entry, descriptionTokens: [] };
        pending.push(current);
      } else if (token.type === "def") {
        // Link reference definitions (`[1.2.3]: http://...`) are not part of
        // any section's prose; the regex-based predecessor stripped them via
        // removeLinkLabels, so we keep that behavior.
        continue;
      } else if (current === null) {
        introTokens.push(token);
      } else {
        current.descriptionTokens.push(token);
      }
    }

    ChangelogParser.validateNoListInIntro(introTokens);

    for (const { entry, descriptionTokens } of pending) {
      entry.description = descriptionTokens
        .map(t => t.raw)
        .join("")
        .trim();
      if (entry.status !== "unreleased") {
        ChangelogParser.validateNoBumpBulletsInRelease(
          descriptionTokens,
          entry.version
        );
      }
    }

    const entries = pending.map(p => p.entry);
    ChangelogParser.validateUniqueVersions(entries);
    return new Changelog(entries);
  }

  private static parseHeading(headerText: string): ChangelogEntry {
    // marked already strips ATX `##` markers and trims surrounding
    // whitespace per CommonMark; the regexes below operate on the bare
    // heading text.
    const unreleasedMatch = headerText.match(/^\[\s*unreleased\s*\]$/i);
    if (unreleasedMatch) {
      return {
        version: "unreleased",
        status: "unreleased",
        date: undefined,
        description: "",
      };
    }

    const headerMatch = headerText.match(
      /^v([0-9]+)\.([0-9]+)\.([0-9]+)(?:\.([0-9]+)-((?:dev|rc|int)))?(?:\s*-\s*(\d{4}-\d{2}-\d{2}))?$/
    );
    if (!headerMatch) {
      throw new Error("Could not parse CHANGELOG entry:\n" + headerText);
    }
    const [, major, minor, patch, build, suffix, date] = headerMatch;
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
      status: isProd ? "release" : "prerelease",
      date,
      description: "",
    };
  }

  private static validateUniqueVersions(entries: ChangelogEntry[]): void {
    const versions = new Set<string>();
    for (const entry of entries) {
      if (versions.has(entry.version)) {
        throw new Error(`Duplicated version in changelog: ${entry.version}`);
      }
      versions.add(entry.version);
    }
  }

  // Bump bullets above the first `## ` header almost always mean a
  // cascade-emitted entry was appended above the first version header
  // (FaceGuard case in DT-145). Scoped specifically to the bump-bullet
  // shape so projects whose intros legitimately use bullet lists (feature
  // summaries, pointers to the canonical changelog) are not affected.
  // Driving off `list` tokens — not raw-line `^[-*+]` matches — means a
  // bump-shaped line inside a code block or HTML comment won't trip
  // the rule either.
  private static validateNoListInIntro(tokens: Token[]): void {
    const offending: string[] = [];
    for (const t of tokens) {
      if (t.type !== "list") continue;
      // Skip ordered lists explicitly. The cascade rewriter only emits
      // unordered `- Bump …` bullets, so an ordered intro list (e.g. a
      // numbered policy or deploy-instructions block) can't be a misplaced
      // cascade entry. `bumpBulletRegex` would already filter them out via
      // its `^-` anchor, but guarding here makes the intent explicit and
      // future-proofs against any broadening of the regex.
      if ((t as Tokens.List).ordered) continue;
      for (const item of (t as Tokens.List).items) {
        // `item.raw` carries the bullet marker. Take only the first line
        // so a nested-list item or multi-line bullet stays readable in
        // the error.
        const firstLine = item.raw.trim().split("\n")[0];
        if (ChangelogParser.bumpBulletRegex.test(firstLine)) {
          offending.push(firstLine);
        }
      }
    }
    if (offending.length > 0) {
      throw new Error(
        `Changelog intro (above the first "## " header) contains bump ` +
        `bullet(s) that look like misplaced cascade output: ` +
        offending.map(b => `"${b}"`).join(", ") +
        `. Move them under "## [Unreleased]".`
      );
    }
  }

  // The cascade bump-strategy automation only writes `- Bump <pkg> to X.Y.Z`
  // bullets into `[Unreleased]`. Their presence under a tagged release
  // section indicates a misplaced bump — DT-145 follow-up; see also the
  // producer-side fix at PlainsightAI/openfilter#104.
  private static validateNoBumpBulletsInRelease(
    tokens: Token[],
    version: string
  ): void {
    for (const t of tokens) {
      if (t.type !== "list") continue;
      for (const item of (t as Tokens.List).items) {
        const firstLine = item.raw.trim().split("\n")[0];
        if (ChangelogParser.bumpBulletRegex.test(firstLine)) {
          throw new Error(
            `Bump bullet found in released section "${version}": ` +
            `"${firstLine}". Bump bullets must live under ` +
            `"## [Unreleased]"; the cascade bump-strategy script writes there.`
          );
        }
      }
    }
  }
}
