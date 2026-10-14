# Permission model

Decision for initial admin scope authorized by user on 2026-10-14.

- Every new account is a normal user; it can read/update its own profile and CRUD its own projects.
- A project owner manually inserts an authenticated user ID in user_roles via Supabase SQL Editor to grant admin. There is no browser role-assignment API and user metadata is never trusted for roles.
- Admin may read bounded profile summaries, count all projects, inspect integration configuration and read audit events. Admin dashboard never exposes auth credentials.
- Admin may edit a bilingual public announcement. A version check prevents overwriting concurrent changes; an immutable database event records actor and time.
- Admin has no user deletion, billing, impersonation, project modification or account-blocking capability in v1.
- Saved projects retain the existing irreversible deletion API, limited to the owner and confirmed by a named dialog. Admin aggregate SELECT policies never grant cross-user mutation.
- Authentication uses verified Supabase users, HttpOnly cookies, local-scope sign-out and server-side CSRF origin checks. APP_URL defines the trusted origin.
