# IETF Protocol-Address Boundary

status: completed

## Context

The built-in SSRF guard blocked only `192.0.0.0/29`, `192.0.0.8`, and the two
NAT64 discovery addresses. IANA classifies the parent `192.0.0.0/24` protocol
assignment block as non-global, with only `192.0.0.9` and `192.0.0.10` marked
globally reachable. Unassigned addresses such as `.11` and `.200` therefore
passed the public-address classifier.

Primary reference:
https://www.iana.org/assignments/iana-ipv4-special-registry/iana-ipv4-special-registry.xhtml

## Decision

- Block the complete `192.0.0.0/24` range.
- Return early only for the PCP and TURN anycast exceptions at `192.0.0.9` and
  `192.0.0.10`.
- Cover direct literals, DNS answers, redirects, and both positive exceptions.
- Use WHATWG URL parsing in scraper preflight so it matches transport dispatch
  and avoids deprecated ambiguous `url.parse()` behavior.

## Verification Completed

- Focused HTTP transport tests passed after the red classifier assertion.
- `npm test` and `npm run check` passed on Node 24 without parser warnings.
- Eight isolated hostile mutations were rejected across the `/24`, both
  exceptions, WHATWG URL parser, and literal/DNS/redirect tests.
- Repository and external-root `make check` passed, including all six Make
  authority tests.
- `npm audit --omit=dev` reported zero vulnerabilities; Python compilation and
  diff hygiene passed.
- Hosted Node 20, CodeQL, and exact-head review remain release gates.
