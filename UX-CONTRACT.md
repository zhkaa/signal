# UX Contract

## Product context

YouTube creators research niches, compare public channel data and prepare saved video metadata. RU/EN UI, Gregorian dates in Asia/Qyzylorda, WCAG 2.2 AA target. User-entered content is not translated silently. Visual contract: DESIGN.md, runtime tokens in src/client/styles/tokens.css; light theme.

## Business-context sources

| Scope                          | Source                                                                   | Reviewed   |
| ------------------------------ | ------------------------------------------------------------------------ | ---------- |
| Product and redesign           | User request 2026-10-14; README.md                                       | 2026-10-14 |
| Project ownership and deletion | supabase/migrations/02_projects.sql, 03_policies.sql; routes/projects.js | 2026-10-14 |
| Admin permissions              | docs/permissions.md; supabase/migrations/06_admin.sql                    | 2026-10-14 |
| Auth/OAuth                     | Supabase official Google and PKCE documentation; routes/auth.js          | 2026-10-14 |
| Billing and legal              | Not introduced in this scope; no payments or invented agreement text     | 2026-10-14 |

## Canonical UI Map

| Capability     | Canonical owner                          | Source of truth      | Allowed variants                  | Verification       |
| -------------- | ---------------------------------------- | -------------------- | --------------------------------- | ------------------ |
| Select/Listbox | Native HTML select in optimizer          | DESIGN.md            | native platform popup             | browser keyboard   |
| Form           | signal.validate + field/input CSS        | app.js, main.css     | auth/tool/settings                | browser validation |
| Scrollbar      | Global CSS baseline                      | tokens.css, main.css | horizontal table geometry         | computed style     |
| Toast          | Shared feedback region and message keys  | app.js, index.html   | success/error                     | live regions       |
| CRUD           | projectActions + server projects service | routes/projects.js   | paginated list/open/create/delete | API tests          |

No table selection, date picker or bulk action is introduced. Channel comparison uses explicit buttons for up to four rows.

## Dataset navigation

Projects and admin users: 12 rows per server page, total count, previous/next boundaries. YouTube queries have bounded results (6 channels, four niche samples with up to ten videos each). Search is explicit submit because requests spend API quota; no autosuggest. Preserve committed query and page in URL; selected competitors are transient page state. Clamp page after deletion. Empty, no-results, loading and persistent failure have distinct copy. Tables scroll horizontally without bounding sibling forms.

## Flow ledger

| Operation         | Pending            | Success                            | Failure                            | Source             |
| ----------------- | ------------------ | ---------------------------------- | ---------------------------------- | ------------------ |
| Register/login    | disable submit     | dashboard or email confirmation    | generic auth error, preserve email | routes/auth.js     |
| Create project    | disable save       | owning project list + saved status | retain result                      | routes/projects.js |
| Open project      | no network         | optimizer populated                | preserved list navigation          | projectActions     |
| Delete project    | busy inside dialog | close + refresh valid list         | keep dialog + retry                | projects service   |
| Search            | stable spinner     | same route, result count           | preserve query and retry           | routes/tools.js    |
| Save profile      | disable save       | remain, saved status               | preserve name                      | routes/auth.js     |
| Save announcement | disable save       | remain, saved status               | explicit conflict + reload         | routes/admin.js    |

## Navigation and responsive behavior

Public `/`, `/login`, `/register`, `/forgot-password`; reset requires a recovery session. `/app/*` requires verified Supabase identity. Admin link appears only after server capability response; direct forbidden URL shows explanatory 403 UI. Browser Back restores route/query/page. Document title is localized `{Page} — Signal`. Mobile sidebar becomes an inline disclosure with aria-expanded, closing after selection and Escape. No modal semantics on this disclosure.

## Overlays and feedback

Delete uses native `<dialog>.showModal()` (app-owned surface, not browser confirm), accessible title, cancel autofocus, focus restoration, bounded viewport. Hard deletion matches existing project lifecycle; name the project and permanent loss. Mutation failure stays inside dialog. Shared success live region; errors persist until retry/navigation. No auto-dismiss of critical errors. In-progress form values remain in memory while moving between routes; beforeunload warns only for unsaved optimizer results or changed announcement/profile. Logout clears all account-scoped state. Dialog top layer sits above app/header/status.

## Async and resilience

Pessimistic mutations, global duplicate guard, 20-second client timeout and 15-second service timeout. No automatic retry of mutations. Guard operation generation on logout/route change. No persisted passwords or tokens in JS storage. Refresh and access tokens are HttpOnly SameSite=Lax cookies; mutation Origin and JSON checks prevent CSRF. Refresh on protected requests, verify identity via getUser, broadcast logout across tabs. A 401 preserves safe current work and returns through login to the requested tool. A 403 keeps safe shell accessible. Announcement optimistic concurrency uses version, 409 requires reload. Network failure preserves input; disconnected browser shows a stable banner.

## Validation

All forms novalidate, validation on submit, first-invalid focus, per-field aria-invalid/describedby and error text. Email format, name 2–100, password 8–128, topic 3–160, search 2–100. Password reveal resets on auth navigation; correct autocomplete and paste allowed. Error codes are localized centrally. Clipboard requires explicit action and only copies generated content.

## Permission and clipboard

Server and RLS enforce ownership; hiding admin is supplemental. No client-editable roles or user deletion in admin v1. No service-role key. Initial admin is granted explicitly by project owner in SQL Editor. Admin settings mutations are audited by DB trigger.

## Verification

Required: npm test, npm run build, npm run format:check; premium static audit and DESIGN lint. Browser: RU/EN landing/auth, 390px and desktop, keyboard, validation, missing config, direct protected routes, account workflows against isolated test services. Compare optimizer and search shared states. Live external Supabase/Google/YouTube verification requires project credentials and applied migrations; test services cannot prove cloud integration.

Email confirmation is a server-rendered auth variant using shared tokens and buttons. GET opens a non-consuming confirmation screen, explicit POST verifies the single-use email token, and success requires a confirmed Supabase user. The email uses inline styles and Arial fallback for mail-client compatibility; web pages use Geologica. Outline hover always preserves dark text; disabled buttons use explicit border/background/text colors instead of opacity.
