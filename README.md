# 📝 Changelog Parser Action

Parses a project's `CHANGELOG.md` and extracts version information, including support for **custom non-production version formats** and validation of changelog order.

> 🔧 Forked and enhanced from [`coditory/changelog-parser`](https://github.com/coditory/changelog-parser-action)

---

## ✨ Features

- ✅ Parses changelogs in [Keep a Changelog](https://keepachangelog.com) format
- ✅ Extracts latest or specific version entry
- ✅ Outputs full semantic version parts
- ✅ Supports custom pre-release format: `v<major>.<minor>.<patch>.<build>-<suffix>`
- ✅ Validates changelog version ordering (newest at top)
- ✅ Handles `[unreleased]` section
- ✅ Supports optional dates in version headers (## v1.2.3 - 2024-03-15)


---

## 🚀 Usage

```yaml
- name: Parse changelog
  uses: PlainsightAI/changelog-parser-action@main
  id: changelog
  with:
    path: CHANGELOG.md             # optional, default: autodetects
    version: v2.0.0.456-dev        # optional, default: latest release
```

### 📥 Inputs

| Input                       | Default | Description                                                                                       |
|-----------------------------|---------|---------------------------------------------------------------------------------------------------|
| `path`                      | `""`    | Path to the changelog file. By default, standard locations are searched (`CHANGELOG.md` etc.).   |
| `version`                   | `""`    | Specific version to extract. Default: latest released.                                            |
| `skip-bump-bullet-checks`   | `false` | **Escape hatch — discouraged.** See [Misplaced-bump validation](#-misplaced-bump-validation).    |

### 📤 Outputs

| Output              | Description                                                |
|---------------------|------------------------------------------------------------|
| `version`           | Full version string (e.g., `v2.0.0.456-dev`)               |
| `versionMajor`      | Major version component                                    |
| `versionMinor`      | Minor version component                                    |
| `versionPatch`      | Patch version component                                    |
| `buildNumber`       | Optional build number (only for non-prod versions)         |
| `suffix`            | Optional suffix (`dev`, `rc`, or `int`)                    |
| `date`              | Release date if provided                                   |
| `description`       | Contents of the changelog section                          |
| `isProductionRelease` | `"true"` if production release (`v1.2.3`), `"false"` otherwise |
---

## 📦 Supported Version Formats

### ✅ Production versions:
```
v<major>.<minor>.<patch>
v<major>.<minor>.<patch> - <date>
```

> Example: `v1.2.3`, `v1.2.3 - 2024-03-15`

### ✅ Non-production versions:
```
v<major>.<minor>.<patch>.<build>-<suffix>
v<major>.<minor>.<patch>.<build>-<suffix> - <date>
```

- Allowed suffixes: `dev`, `rc`, `int`
- Example: `v1.2.3.456-dev`, `v2.0.0.1-rc - 2024-02-20`


---

## 🚨 Validation Rules

- Changelog entries must appear in **descending semantic version order**
- **Only `[unreleased]`** (case-insensitive, with brackets) is allowed as a non-version section
- Multiple entries with the **same base version** (e.g., `v1.2.3` and `v1.2.3.1-rc`) are allowed
- **Exact duplicate versions** (e.g., two `v1.2.3`) are rejected
- **Misplaced-bump rules** (see below)

---

## 🛑 Misplaced-bump validation

Two rules catch the failure modes the cascade `bump-strategy.sh` script used to produce ([DT-145](https://plainsight-ai.atlassian.net/browse/DT-145)):

1. **Intro:** a `- Bump <pkg> to X.Y.Z` bullet above the first `## ` header fails parsing. Bumps belong inside `## [Unreleased]`, not in the file preamble.
2. **Released section:** the same shape under a tagged `## vX.Y.Z` header fails parsing. Bumps must live under `## [Unreleased]` until a release cuts them.

Both rules are AST-driven (CommonMark via `marked`), so a bump-shaped line inside a fenced code block or HTML comment is not a false positive.

### 🪤 Escape hatch — `skip-bump-bullet-checks`

`skip-bump-bullet-checks: 'true'` bypasses both rules.

**Strongly discouraged.** The rules exist to catch real bugs the cascade automation used to produce. Setting the flag will:

- emit a workflow warning (visible in the Annotations tab) so the bypass is loud,
- only disable the two bump-bullet rules — version-header parsing, ordering, and duplicate detection still run,
- **not** fix the underlying RELEASE.md.

Use only when you genuinely cannot edit `RELEASE.md` for this PR (e.g., a time-critical hotfix sitting on top of legacy mis-placement). The flag is intended as a temporary safety valve, not a long-term opt-out — fix the file in a follow-up and remove the flag in the next change.

```yaml
- uses: PlainsightAI/changelog-parser-action@main
  with:
    skip-bump-bullet-checks: 'true'  # discouraged; see above
```

---

## 🆚 Differences from Original

| Feature                        | Original Coditory Action | This Fork                        |
|-------------------------------|---------------------------|----------------------------------|
| Custom version format         | ❌                        | ✅ `v1.2.3.456-dev` support       |
| Strict ordering enforcement   | ❌                        | ✅ Top-down semver validation     |
| Build + suffix parsing        | ❌                        | ✅ Extracted as `buildNumber` / `suffix` |
| Multiple entries per base version | ❌                   | ✅ Allowed (e.g. `v1.2.3`, `v1.2.3.1-dev`) |
| Duplicate version detection   | ✅                        | ✅ Still enforced                |

---

## 🧪 Example

Given this changelog:

```md
## [unreleased]
- Upcoming features

## v2.0.0.456-dev
### Added
- Internal dev release

## v2.0.0
### Fixed
- Production bug

## v2.0.0.1-rc
### Added
- Internal dev release

## v1.9.9.999-int
### Added
- Internal test version
```

The latest release is `v2.0.0.456-dev` (because it appears before `v2.0.0`).

---

## 🛠 Development

```bash
npm install
npm run build
npm run test
```

---

📄 Forked from [coditory/changelog-parser-action](https://github.com/coditory/changelog-parser-action) under **MIT** licence.