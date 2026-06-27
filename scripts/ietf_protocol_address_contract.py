#!/usr/bin/env python3


def validation_errors(transport_source, scraper_source, transport_tests):
    errors = []

    required_transport = (
        "family === 4 && isGloballyReachableIetfProtocolAddress(address)",
        "function isGloballyReachableIetfProtocolAddress(address)",
        "return address === '192.0.0.9' || address === '192.0.0.10';",
        "['192.0.0.0', 24]",
    )
    for fragment in required_transport:
        if fragment not in transport_source:
            errors.append(f"transport missing IETF protocol-address contract: {fragment}")

    if "['192.0.0.0', 29]" in transport_source:
        errors.append("transport must block the full non-global IETF protocol-assignment /24")

    required_scraper = (
        "function isHttpUri(uri)",
        "parsed = new URL(uri)",
        "parsed.username",
        "parsed.password",
    )
    for fragment in required_scraper:
        if fragment not in scraper_source:
            errors.append(f"scraper missing WHATWG URI contract: {fragment}")
    if "require('url')" in scraper_source or "url.parse(uri)" in scraper_source:
        errors.append("scraper URI preflight must not use legacy url.parse semantics")

    required_tests = (
        "assert.equal(transport.isPublicAddress('192.0.0.9'), true)",
        "assert.equal(transport.isPublicAddress('192.0.0.10'), true)",
        "'192.0.0.11'",
        "'192.0.0.200'",
        "rejects unassigned IETF protocol literals before dispatch",
        "rejects DNS answers in unassigned IETF protocol space",
        "rejects redirects to unassigned IETF protocol space",
    )
    for fragment in required_tests:
        if fragment not in transport_tests:
            errors.append(f"transport tests missing IETF protocol-address case: {fragment}")

    return errors
