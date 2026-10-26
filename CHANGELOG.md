# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [1.0.0] - 2026-10-26

### Added
- `og-debugger` CLI for URLs and local HTML (`--file`), `--ua`, `--no-image`, `--all`, `--json`, `--strict`
- Open Graph, Twitter Card and article tag extraction with relative URL resolution
- Platform previews for Facebook, LinkedIn and X with their fallback rules
- Share image inspection: HTTP status, PNG/JPEG/GIF/WebP dimensions read from file headers, size, ratio and weight limits
- Checks: missing og:title/type/image/url/description, long titles, non-standard types, http images, og:url vs canonical, duplicate tags, missing twitter:card
- Library API (`checkOpenGraph`, `extractSocial`, `lintSocial`, `previews`, `imageSize`) with injectable fetch, and GitHub Action

[1.0.0]: https://github.com/ksanyok/og-debugger/releases/tag/v1.0.0
