# Security Policy

## Supported Versions

The supported security scope for `nodejs-scraper` is the current default branch, `master`. Older commits, tags, branches, forks, demos, and generated artifacts are not actively supported unless the repository explicitly marks them as maintained.

Project summary: NodeJS Screen Scraper

## Reporting a Vulnerability

Please report suspected vulnerabilities through GitHub's private vulnerability reporting or by opening a draft GitHub Security Advisory for `garethpaul/nodejs-scraper` when that option is available. If GitHub does not show a private reporting option for this repository, contact the repository owner through GitHub and avoid posting exploit details publicly until the issue can be assessed.

Do not open a public issue that includes exploit code, secrets, personal data, or detailed reproduction steps for an unpatched vulnerability.

## What to Include

Helpful reports include:

- the affected file, endpoint, permission, dependency, or workflow
- a concise impact statement explaining what an attacker could do
- reproduction steps using test data and accounts you control
- the branch, commit SHA, platform version, device, runtime, or dependency versions used
- logs, screenshots, or proof-of-concept snippets that demonstrate impact without exposing private data

## Project Security Posture

- This repository appears to be a Node.js or JavaScript project. The active security scope is the code and documentation on the default branch.
- Review found authentication, token, or session-related code paths; changes in those areas should receive security-focused review before merge.
- Review found external API integrations or credential-adjacent configuration; changes in those areas should receive security-focused review before merge.
- Review found network clients, sockets, web APIs, or service endpoints; changes in those areas should receive security-focused review before merge.
- Review found mobile permission or privacy-sensitive data handling; changes in those areas should receive security-focused review before merge.
- Review found file, document, data, or media parsing flows; changes in those areas should receive security-focused review before merge.
- Review found shell execution, subprocess, or dynamic evaluation surfaces; changes in those areas should receive security-focused review before merge.
- Dependency manifests detected: package.json. Dependency updates should preserve lockfiles when present and avoid introducing packages without a clear maintenance reason.

## Service and API Notes

For web services, APIs, sockets, or scraping workflows, prioritize reports involving authentication bypass, authorization errors, injection, server-side request forgery, unsafe deserialization, credential leakage, data exposure, or denial-of-service conditions. Use test accounts and minimal proof-of-concept traffic only.

For this scraper, also review whether external requests respect target terms,
robots guidance, and caller-provided rate limits. Tests should inject fake
request clients instead of contacting live sites, and network errors should
reach callbacks without exposing or logging captured page content.
Non-positive `reqPerSec` values should not stall queued requests.
Positive `reqPerSec` values should bound request starts rather than scheduling
new work from remote response completion; slow responses may overlap, but they
must not create an initial or completion-driven burst.
Non-function callbacks should be treated as no-ops so invalid caller input does
not become an asynchronous process-level exception.
Non-object headers should be ignored during normalization so invalid caller
input does not create numeric request header names.
The header injection guard should drop CR/LF-bearing header names and values
before request dispatch.
Request URIs should stay limited to HTTP(S) schemes before dispatch to the
request client.
HTTP(S) hosts should be required before dispatch so malformed HTTP URLs do not
reach the request client.
HTTP(S) URI credentials should be rejected before dispatch so credential-bearing
URLs do not reach the request client.
Outbound requests use a 10-second timeout by default so an unresponsive target
cannot hold a request open indefinitely. Callers may supply a finite positive
timeout; invalid values fall back to the bounded default.
Keep the response body parse limit enabled so oversized or unsupported content
cannot enter jsdom. The built-in transport enforces the same limit while
streaming so the response is not fully buffered first.
The built-in transport must reject private network, loopback, link-local,
reserved, multicast, documentation, IPv4-mapped, and translation-prefix
destinations after DNS resolution and on every bounded redirect. Cross-origin
redirects must not forward authorization, cookie, or proxy authorization
headers.
The checked-in examples use reserved `example.test` URLs so casual test runs do
not send traffic to retired third-party endpoints.

## Dependency and Supply Chain Security

Dependency updates should come from trusted package managers and should keep lockfiles in sync when lockfiles exist. Do not commit credentials, private keys, tokens, generated secrets, or machine-local configuration. If a vulnerability depends on a compromised package, typosquatting risk, insecure transitive dependency, or unsafe build step, include the package name, affected version, and the path through which it is used.

The manifest and lockfile pin jsdom 29.1.1 and jQuery 4.0.0; the default fetch
path uses the Node 20 built-in HTTP(S) transport. Parser or transport changes
are security-sensitive and must be verified with `npm ci`, `npm audit
--omit=dev`, `npm run check`, and every Make gate. Keep jsdom script execution
and external resource loading disabled for untrusted remote HTML.
Maintenance and verification require Node 20 or newer; Node 6 is unsupported
and must not be used as a production or security-testing runtime.
Hosted verification pins Node 20 and disables checkout credential persistence;
it does not install the unlocked legacy dependency tree or make live requests.

The pinned Linux workflow installs the exact lockfile with package scripts
disabled, audits production dependencies, and runs local-only parser plus
dependency-injected transport tests without live scraping.

## Safe Research Guidelines

Good-faith research is welcome when it stays within these boundaries:

- use only accounts, devices, data, and infrastructure that you own or have explicit permission to test
- avoid destructive actions, persistence, spam, phishing, social engineering, or denial-of-service testing
- minimize access to personal data and stop testing immediately if private data is exposed
- do not exfiltrate secrets or third-party data; report the minimum evidence needed to verify impact
- keep vulnerability details confidential until the maintainer has assessed the report

## Maintainer Response

The maintainer will review complete reports as availability allows, prioritize issues by exploitability and impact, and coordinate a fix or mitigation when the affected code is still maintained. For sample, archived, or educational repositories, the likely remediation may be documentation, dependency updates, or clearly marking unsupported code rather than a production-style patch release.
