## NodeJS Scraper Vision

NodeJS Scraper is a Node module that makes website scraping easier by wrapping
request fetching with a jQuery-like document interface.

The repository is useful as a legacy scraping utility with simple, advanced, and
parallel examples plus optional request-rate limiting. Usage details live in
[`README.md`](README.md).

The goal is to keep the scraper understandable while making responsible
fetching, dependency age, and API behavior explicit.

The current focus is:

Priority:

- Preserve the URL/request-object/array input API
- Keep rate-limiting behavior visible in examples
- Avoid encouraging aggressive scraping or bypassing site rules
- Maintain package metadata and examples

Next priorities:

- Document Node version and legacy dependency constraints
- Add tests around callback behavior, request errors, and parallel throttling
- Modernize request/jsdom dependencies in a dedicated pass
- Clarify robots, terms, and rate-limit expectations for users

Contribution rules:

- One PR = one focused API, dependency, example, or documentation change.
- Add tests for behavior changes.
- Keep examples respectful of target services.
- Document API-breaking changes.

## Security And Responsible Use

Scraping can overload sites or collect sensitive data. Users should respect
robots, terms, and rate limits. The library should not hide target URLs,
credentials, or request behavior from callers.

## What We Will Not Merge (For Now)

- Anti-detection or bypass features
- Aggressive default concurrency
- Credential capture or hidden telemetry
- Dependency rewrites without compatibility notes

This list is a roadmap guardrail, not a permanent rule.
Strong user demand and strong technical rationale can change it.
