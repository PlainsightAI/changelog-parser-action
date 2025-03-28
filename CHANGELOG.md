# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.4] - 2025-03-28
### Added
- Support for custom non-prod version format `v<major>.<minor>.<patch>.<build>-<suffix>`
- Full semantic version parsing: `versionMajor`, `versionMinor`, `versionPatch`, `buildNumber`, `suffix`, `status`
- `status` field supports: `release`, `prerelease`, `unreleased`
- Detection of latest release regardless of prod/non-prod (based on file order, not semver)
- `[unreleased]` section parsing with or without body
- Support for duplicate core versions with unique build/suffix (e.g., `v1.2.3` + `v1.2.3.1-rc`)
- Line ending normalization (`\n`, `\r\n`)
- Support for deeply nested changelog paths and lowercase filenames
- Footnote/link-reference skipping at the bottom of changelogs

### Changed
- Enforced strict version ordering based on semver (top-down)
- Reject mixed-case suffixes like `-RC` or `-Dev`
- Improved duplicate version detection (exact matches only)
- Enhanced changelog parsing performance for 100+ entries
- Rewrote core logic and tests from the ground up using TypeScript and Jest

### Removed
- Dependency on original upstream parser logic

## [1.0.2] - 2020-11-08
### Changed
- Improved `action.yml` - prepared for the first release in Marketplace

## [1.0.0] - 2020-11-08
### Added
- Added changelog reading and parsing functionalities

[Unreleased]: https://github.com/PlainsightAI/changelog-parser-action/compare/v1.1.0...HEAD
[1.1.4]: https://github.com/PlainsightAI/changelog-parser-action/releases/tag/v1.1.0
[1.0.2]: https://github.com/olivierlacan/keep-a-changelog/compare/v1.0.0...v1.0.2
[1.0.0]: https://github.com/olivierlacan/keep-a-changelog/releases/tag/v1.0.0
