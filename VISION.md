## NodeJS Scraper Vision

This document explains the current state and direction of the project.
Project overview and developer docs: [`README.md`](README.md)

NodeJS Scraper is a Node module that makes website scraping easier by wrapping
HTTP(S) fetching with a jQuery-like document interface.

The repository is useful as a legacy scraping utility with simple, advanced, and
parallel examples plus optional request-rate limiting. Usage details live in
[`README.md`](README.md).

The goal is to keep the scraper understandable while making responsible
fetching, dependency age, and API behavior explicit.

The current focus is:

Priority:

- Preserve the URL/request-object/array input API
- Keep rate-limiting behavior visible in examples
- Keep external examples on reserved `example.test` placeholders
- Avoid encouraging aggressive scraping or bypassing site rules
- Maintain package metadata and the pinned legacy jsdom contract
- Keep the Node 20 built-in transport limited to public network destinations
  across bounded redirects
- Keep no-network tests for request options and network errors
- Keep request and fetch option normalization free of caller-visible mutation
- Keep non-object headers from leaking into normalized request options
- Keep the header injection guard around caller-provided header names and values
- Keep examples bounded and runnable from the repository checkout
- Keep non-positive `reqPerSec` values from stalling queued requests
- Keep non-function callbacks from throwing during asynchronous completion
- Keep request URI dispatch limited to HTTP(S) schemes
- Keep HTTP(S) hosts required before request dispatch
- Keep HTTP(S) URI credentials rejected before request dispatch
- Keep outbound requests on a 10-second timeout by default while preserving
  finite positive caller overrides
- Keep a configurable streaming and parse limit in front of legacy jsdom
- Keep `make lint`, `make test`, `make build`, and `make check` wired to the
  local npm/static baseline
- Keep hosted Linux validation pinned, credential-free, read-only, explicitly
  on Node 20, and independent of legacy package installation

Next priorities:

- Document Node version and legacy dependency constraints
- Keep maintenance and verification on Node 20+ while the legacy jsdom API is
  replaced in a dedicated compatibility pass
- Add tests around callback ordering and parallel throttling
- Add broader rate-limit tests for fractional and string `reqPerSec` values
- Add clearer examples for non-mutating option reuse
- Modernize the jsdom dependency in a dedicated pass
- Clarify robots, terms, and rate-limit expectations for users

Contribution rules:

- One PR = one focused API, dependency, example, or documentation change.
- Add tests for behavior changes.
- Keep examples respectful of target services.
- Document API-breaking changes.
- Preserve non-object headers handling when changing request normalization.
- Preserve the header injection guard when changing request normalization.
- Preserve HTTP(S) URI validation when changing request dispatch.
- Preserve HTTP(S) host validation when changing request dispatch.
- Preserve HTTP(S) URI credentials rejection when changing request dispatch.
- Preserve the bounded request timeout when changing request normalization.
- Preserve the response body parse limit when changing scraper parsing.
- Preserve public-address checks, bounded redirects, and cross-origin header
  stripping when changing the built-in transport.
- Run `make lint`, `make test`, `make build`, and `make check` before pushing
  behavior, dependency, or example changes.

## Security And Responsible Use

Canonical security policy and reporting:

- [`SECURITY.md`](SECURITY.md)

Scraping can overload sites or collect sensitive data. Users should respect
robots, terms, and rate limits. The library should not hide target URLs,
credentials, or request behavior from callers.
The header injection guard should keep CR/LF-bearing header names and values out
of request options before dispatch.
Outbound requests should retain a bounded default timeout so unavailable
targets cannot leave work open indefinitely.
Oversized or unsupported response bodies should fail before legacy jsdom
parsing. The built-in transport should stop reading once the streaming byte
limit is exceeded.

## What We Will Not Merge (For Now)

- Anti-detection or bypass features
- Aggressive default concurrency
- Credential capture or hidden telemetry
- Dependency rewrites without compatibility notes

This list is a roadmap guardrail, not a permanent rule.
Strong user demand and strong technical rationale can change it.
