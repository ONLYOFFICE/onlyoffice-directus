# CLAUDE.md

ONLYOFFICE Docs integration for Directus: a Directus **bundle extension** (endpoint + settings module + file-field interface). Background, decisions and history are in `HANDOVER.md`.

## Commands

```bash
git submodule update --init --recursive   # required before any build (formats JSON + blank templates)
pnpm install --frozen-lockfile            # Node >= 22, pnpm 10.18.2
pnpm build                                # dist/api.js, dist/app.js, dist/assets/document-templates
pnpm test                                 # smoke tests against the existing dist/ (no build)
pnpm test:smoke                           # build + smoke tests: run after every change
pnpm dev                                  # watch build
```

`pnpm build` does not type-check, and `tsc --noEmit` has known pre-existing errors. Don't treat those as caused by your change, and don't add `tsc` to the build.

## Layout

- `src/api/index.ts`: all server routes under `/onlyoffice`: `GET /editor/:file_id`, `POST /file`, `GET /file/:file_id` (download for Docs), `POST /file/:file_id/callback` (save), `GET /settings`
- `src/services/`: `editor_config_service` (Docs config + permissions), `file_service` (create/overwrite `directus_files`), `settings_service` (lazy settings collection + version-driven field migration), `jwt_utils`
- `src/utils/get_accountability.ts`: rebuilds Directus accountability (roles + policies) for requests that come from Docs without a session
- `src/assets/templates/editor.ts`: server-rendered HTML page that loads Docs `api.js`
- `src/modules/settings/`: settings page (app). `src/onlyoffice-file-interface/`: "ONLYOFFICE Editor" field interface (app)
- `src/schema/`: definition of the hidden singleton collection `onlyoffice_settings`
- `src/assets/document-formats`, `src/assets/document-templates`: **git submodules**, never edit them in place
- `test/smoke.test.mjs`: node:test smoke tests on `dist/api.js` with mocked Directus services

## Conventions

- TypeScript (server) and Vue 3 options/`setup` (app). Tabs in `src/api`, 4 spaces in `src/services`: follow the file you are in.
- Every source file starts with the Apache-2.0 header `(c) Copyright Ascensio System SIA <year>`.
- Commits: conventional prefixes (`feat:`, `fix:`, `chore:`, `ci:`). Branch from `develop` and merge via PR. `master` holds releases only.
- Use Directus services from `context.services` with the right `accountability`. Never use raw DB access, and never use `accountability: null` (admin) for user file operations.

## Don'ts

- Don't rename the `onlyoffice_settings` collection or its fields (existing installs store data there).
- When adding a settings field, **bump `version` in package.json**, or existing installs will never get the field (see `settings_service.ts`).
- Don't "fix" the CSP header on the editor page without allowing the Docs origin. Don't remove `keep-behind` or the drawer `z-index` override in `interface.vue`.
- Never write secrets (Docs JWT secret, npm tokens, credentials) into the repo, tests or docs. Tests generate their own random secrets.
- Don't commit `dist/` or `node_modules/`.
- Release and marketplace publishing: follow the `release` skill (`.claude/skills/release/SKILL.md`).
