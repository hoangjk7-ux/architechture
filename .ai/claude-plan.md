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
| SEC-05 | completed | last-CTO + normalized role admin; audit waits DATA-05 |
| DATA-01 | completed | 7 domain tests pass |
| DATA-02 | completed | mutation validation/reference checks |
| DATA-03 | completed | roadmap hierarchy/cycle/cascade |
| DATA-04 | completed | deletion/reference policies |
| DATA-05 | ready | generalized audit + durable role-change events |
| DATA-06 | in progress | route-delay fixes started; backend list/query optimization remains |
| DATA-07 | in progress | privileged seed removed/workflow hardened; idempotency remains |
| FE-01 | completed | lazy routes + route boundary + route preload on nav intent |
| FE-02 | completed | mobile More navigation + accessibility |
| FE-03 | in progress | loading-vs-empty state fixed on core list pages; mutation UX remains |
| FE-04..05 | ready | split/extract heavy Architecture views; protect dirty formatting churn |
| FE-06 | ready | typed i18n and language Fast Refresh warning cleanup |
| FE-07..08 | ready | list scalability and bundle budget |
| QLT-01 | completed | scoped lint/test/typecheck/check scripts |
| QLT-02 | blocked | workflow not implemented |
| QLT-03 | completed | Convex Edge Runtime harness + coverage |
| QLT-04..05 | blocked | feature contracts/E2E setup |

## Next safe execution

Next priorities: split heavy Architecture subviews, finish DATA-06 backend query
optimization/pagination, DATA-05 generalized audit, FE-06 typed i18n warning
cleanup, and QLT-02 CI. Runtime Google sign-in still requires a production
browser smoke after JWT rotation.

Google credentials are configured on production and JWT_PRIVATE_KEY/JWKS were
rotated after exposure. Do not treat auth complete until login/callback/refresh/
protected-query/logout smoke passes on production.
