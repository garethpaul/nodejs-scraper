# AGENTS.md

## Repository purpose

`garethpaul/nodejs-scraper` is a legacy Node.js scraping helper that fetches pages and exposes a jQuery-like document interface.

## Project structure

- `Makefile` - repository verification targets
- `scripts` - baseline checks and helper scripts
- `docs` - plans, notes, and generated README assets
- `lib` - library source code
- `test` - tests and fixtures
- `package.json` - Node package metadata and scripts

## Development commands

- Install exact dependencies: `npm ci --ignore-scripts`
- Audit production dependencies: `npm audit --omit=dev`
- Full baseline: `make check`
- Combined verification: `make verify`
- Tests: `make test`
- package script `test`: `npm test`
- package script `check`: `npm run check`
- If a command above skips because a platform toolchain is missing, verify on a machine with that SDK before claiming platform behavior is tested.

## Coding conventions

- Language mix noted in the README: JavaScript (5).
- Use Node 20.19.0 or newer for package scripts and repository verification.

## Testing guidance

- Test-related files detected: `examples/test.js`, `test/`,
  `test/document.test.js`, `test/http-request.test.js`, `test/scraper.test.js`
- Start with the narrowest relevant test or Make target, then run `make check` before handing off if the change is not documentation-only.
- Keep README verification notes in sync when commands, fixtures, or supported toolchains change.

## PR / change guidance

- Keep diffs focused on the requested repository and avoid unrelated modernization or formatting churn.
- Preserve public APIs, sample behavior, file formats, and documented environment variables unless the task explicitly changes them.
- Update tests, README notes, or docs/plans when behavior, security posture, or validation commands change.
- Call out skipped platform validation, legacy toolchain assumptions, and any risky files touched in the final summary.

## Safety and gotchas

- No required secret or credential file was identified in the repository scan.
- Keep credentials, private target URLs, captured pages, and environment files out of git.
- Tests should avoid external requests by injecting fake transport/document dependencies. Network errors should be surfaced to callbacks without reading missing response bodies, non-function callbacks should not throw during async completion, non-object headers should not create numeric header names, and option defaults should not mutate caller inputs. HTTP(S) URI validation should reject non-web schemes, missing HTTP(S) hosts, and HTTP(S) URI credentials before request dispatch. Keep the bounded timeout, public-address checks, bounded redirects, streaming body limit, and parser limit ahead of jsdom. Preserve disabled remote script/resource loading and keep package.json synchronized with package-lock.json.
- Scraping workflows should respect robots guidance, terms of service, and rate limits.
- Treat non-positive `reqPerSec` values as a caller mistake rather than a queue-stalling throttle.
- See `SECURITY.md` for vulnerability reporting and safe research guidance.

## Agent workflow

1. Inspect the README, Makefile, manifests, and the files directly related to the request.
2. Make the smallest source or docs change that satisfies the task; avoid generated, vendored, or local-environment files unless required.
3. Run the narrowest useful validation first, then `make check` or the documented package/platform gate when available.
4. If a required SDK, service credential, or external runtime is unavailable, record the skipped command and why.
5. Summarize changed files, commands run, and remaining risks or follow-up validation.
