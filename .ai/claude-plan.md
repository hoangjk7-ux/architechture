# TechGov orchestration status

## Baseline

- Production build: pass; initial JS khoảng 1,056 kB minified / 286 kB gzip.
- Lint toàn repo: fail do vừa quét TechGov vừa quét nested `OpenHands/`.
- Security: blocked for production; SimpleAuth/localStorage và anonymous CTO fallback.
- Tests hiện có: 2 frontend tests, chưa có backend permission/integrity suite.
- Dirty files cần bảo vệ: xem `.ai/orchestration.md`.

## Task status

| Task | State | Dependency/blocker |
|---|---|---|
| SEC-00 | completed | ADR: `docs/security/auth-rbac.md` |
| SEC-01 | completed | identity/session contracts |
| SEC-02 | completed | explicit backend guards |
| SEC-03 | completed | official Google Convex Auth session |
| SEC-04 | completed | backend user + route 403 policy |
| SEC-05 | ready | last-CTO, normalized role admin, audit |
| DATA-01 | completed | 7 domain tests pass |
| DATA-02..07 | blocked | SEC-04 and/or prior DATA tasks |
| FE-01 | completed | lazy routes + route boundary |
| FE-02 | blocked | coordinate AppLayout ownership with SEC frontend migration |
| FE-03..08 | blocked/ready per graph | protect dirty i18n/architecture files |
| QLT-01 | completed | scoped lint/test/typecheck/check scripts |
| QLT-02 | blocked | workflow not implemented |
| QLT-03 | completed | Convex Edge Runtime harness + coverage |
| QLT-04..05 | blocked | feature contracts/E2E setup |

## Next safe execution

Security session/guard release unit is implemented and compiling. Next priorities:
SEC-05 role invariants, DATA-02 validator integration, and FE-02 mobile navigation.
Runtime Google sign-in still requires deployment credentials and a dev smoke test.

Do not deploy until Google credentials are configured, CTO bootstrap is executed
explicitly for the intended deployment, and login/refresh/query/logout smoke passes.
