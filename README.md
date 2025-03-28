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

### 📤 Outputs

| Output          | Description                                          |
|-----------------|------------------------------------------------------|
| `version`       | Full version string (e.g., `v2.0.0.456-dev`)         |
| `versionMajor`  | Major version component                              |
| `versionMinor`  | Minor version component                              |
| `versionPatch`  | Patch version component                              |
| `buildNumber`   | Optional build number (only for non-prod versions)   |
| `suffix`        | Optional suffix (`dev`, `rc`, or `int`)              |
| `date`          | Release date if provided                             |
| `status`        | `release`, `prerelease`, or `unreleased`             |
| `description`   | Contents of the changelog section                    |

---

## 📦 Supported Version Formats

### ✅ Production versions:
```
v<major>.<minor>.<patch>
```

> Example: `v1.2.3`

### ✅ Non-production versions:
```
v<major>.<minor>.<patch>.<build>-<suffix>
```

- Allowed suffixes: `dev`, `rc`, `int`
- Example: `v1.2.3.456-dev`, `v2.0.0.1-rc`

---

## 🚨 Validation Rules

- Changelog entries must appear in **descending semantic version order**
- **Only `[unreleased]`** (case-insensitive, with brackets) is allowed as a non-version section
- Multiple entries with the **same base version** (e.g., `v1.2.3` and `v1.2.3.1-rc`) are allowed
- **Exact duplicate versions** (e.g., two `v1.2.3`) are rejected

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