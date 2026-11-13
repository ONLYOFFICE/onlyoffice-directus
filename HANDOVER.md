# Handover: ONLYOFFICE extension for Directus

State as of 2026-11-13, branch `develop` @ `21003bd`. Items marked **[unverified]** could not be confirmed from the code, history or public sources.

Bugs, security notes and the locations of secrets are deliberately **not** in this repository. They are handed over separately as a private file.

---

## 1. Integration type

**An extension inside Directus**, not a separate service. It is a Directus *bundle* (`package.json` → `directus:extension`) with three entries:

| Entry | Type | Source | What it does |
|---|---|---|---|
| `onlyoffice` | endpoint (server) | `src/api/index.ts` | REST routes under `/onlyoffice/*` |
| `onlyoffice_module` | module (app) | `src/modules/settings/` | "ONLYOFFICE Settings" page in the left nav |
| `onlyoffice-file-interface` | interface (app) | `src/onlyoffice-file-interface/` | "ONLYOFFICE Editor" interface for `file` (uuid) fields |

**ONLYOFFICE product: ONLYOFFICE Docs (Document Server)**, self-hosted or Docs Cloud. It is integrated through the Docs API (`web-apps/apps/api/documents/api.js`):

```
Browser ── GET /onlyoffice/editor/:id ─► Directus (extension): builds signed editor config, returns HTML page
Browser ── loads api.js from Docs, opens editor
Docs    ── GET /onlyoffice/file/:id?oo_token=… ─► Directus: streams file (oo_token = JWT, 10 min, directus_jwt_secret)
Docs    ── POST /onlyoffice/file/:id/callback ─► Directus: on status 2/3 downloads result from Docs and overwrites the file
```

All Docs↔Directus traffic is signed with the Docs JWT secret (if set). The header name is configurable; the default is `AuthorizationJwt`.

**Supported versions**

- **Directus ≥ 11.4.0** (`host: ^11.4.0`). This is derived from the code and was not tested on every version:
  - `getAccountability` uses `AccessService` / `PoliciesService`, which first appear in Directus **v11.0.0** (policies migration). The extension fails on 10.x.
  - File creation uses `import.meta.dirname`, which needs Node ≥ 20.11. Directus 11.0–11.3 still allowed Node 18 (the official Docker image was `node:18`). From **11.4.0** Directus requires Node ≥ 22.
  - Developed and checked locally against Directus 11.12.0.
- **ONLYOFFICE Docs: minimum version [unverified].** The README does not state one. The format list comes from the `document-formats` submodule (v3.2.0), which includes formats added in Docs 9.0 (hwp/hwpx, pages, numbers, key). Opening those needs Docs ≥ 9.0. Creating new docx/xlsx/pptx/pdf files does not depend on the Docs version.

## 2. Main features (user scenarios)

1. **Configure the connection.** In Settings → Modules, enable ONLYOFFICE. On the ONLYOFFICE page, enter the Docs public URL, Docs JWT secret and JWT header. The settings are stored in the hidden singleton collection `onlyoffice_settings`.
2. **Add an editor field.** Create a File field in any collection and choose the "ONLYOFFICE Editor" interface.
3. **Create a new file** from the field ("Replace file" button) as Document, Spreadsheet, Presentation or PDF. The blank template is chosen by the user's language, then the Directus default language, then `default`.
4. **Upload an existing file** through the same dialog ("Or Upload file", which is the standard Directus file interface).
5. **View inline.** The item page shows the file in an embedded, read-only editor (iframe).
6. **Edit in a new tab.** Users with `update` permission on the file (`directus_files`) get edit mode. Everyone else gets view mode.
7. **Co-editing and saving.** Docs calls back with status 2/3, and the file is overwritten on behalf of the first user in `actions`.
8. **Replace the file** with another new or uploaded file.
9. **Theme.** The Directus appearance (light/dark) is passed to the editor. With `auto`, the editor follows the browser's `prefers-color-scheme`.

## 3. Build

Toolchain: **Node ≥ 22**, **pnpm 10.18.2** (`packageManager`; enable with `corepack enable`).

```bash
git submodule update --init --recursive   # REQUIRED, see below
pnpm install --frozen-lockfile
pnpm build          # directus-extension build --sourcemap + copy templates into dist/
pnpm test:smoke     # build + node:test smoke tests against dist/
pnpm dev            # watch build, no minify
```

Non-standard parts:

- **Two public git submodules are required:**
  - `src/assets/document-formats` (github.com/ONLYOFFICE/document-formats). Its JSON is imported into the bundle, so the build fails without it.
  - `src/assets/document-templates` (github.com/ONLYOFFICE/document-templates, branch `main/new`). It holds the blank files that `copy-assets` copies to `dist/assets/document-templates/<lang>/new.*`. Without it, the build passes but file creation fails at runtime.
- `pnpm build` does **not** type-check: the SDK uses esbuild/rollup. `npx tsc --noEmit` currently reports about 31 errors (see §6). Do not add `tsc` to the build without fixing them first.
- `@directus/extensions` and `@directus/types` are imported but not declared. They resolve through the SDK's dependencies (types only).
- Install shows a warning that pnpm ignored the build scripts of `esbuild` and `vue-demi`. It is harmless.
- There are no private packages or registries. Everything comes from npmjs and public GitHub.

**Repositories**

- `origin` is the internal Gitea `git@git.onlyoffice.com:ONLYOFFICE/onlyoffice-directus.git` (SSH key access through the ONLYOFFICE Git admins).
- The public mirror is `github.com/ONLYOFFICE/onlyoffice-directus` (`package.json` → `repository`/`bugs` point there). It is synced from Gitea. GitHub `develop` currently differs from Gitea `develop` by one submodule pointer commit, which looks like a mirror artefact.

**CI** (`.github/workflows/`)

- `artifact.yml` runs on PRs into `master` (opened/reopened) and manually. It builds and uploads `onlyoffice-directus-v<version>` (`dist/` + `package.json`).
- `licenses.yml` runs on push/PR to `master`/`develop`. It runs `ONLYOFFICE/check-licenses` against Apache-2.0. Approved exceptions are in `.check-licenses.yml` (e.g. `@directus/schema`, BUSL-1.1, transitive). When a dependency bump trips this check, add an approval entry there.

**Local dev setup used so far**

- A clone of `directus/directus` sits next to this repo. The extension repo is cloned into `directus/api/extensions/onlyoffice-directus`, with `EXTENSIONS_AUTO_RELOAD=true` and SQLite.
- Alternatives: mount `dist/` + `package.json` into the `extensions/` folder of a Docker Directus, or use `pnpm link`.
- A Docs instance must be able to reach Directus over HTTP (callback/download), and the browser must be able to reach Docs.

## 4. Marketplace publication

**There has been no release yet** (checked 2026-11-13):

- `master` has no code, only the CI and LICENSE commits.
- There are no tags on Gitea or GitHub, and no GitHub Releases.
- The package is not on npm (`onlyoffice-directus` → 404).
- The Directus Marketplace registry has no entry.
- `package.json` version is `1.0.0` and `CHANGELOG.md` has no version header, so the first release will be **1.0.0**.

General publication path (details in `.claude/skills/release/SKILL.md`):

1. Release through the git flow (`develop` → PR → `master`, tag `vX.Y.Z`). The GitHub mirror syncs on its own.
2. **Directus Marketplace = npm.** The marketplace indexes public npm packages that have the `directus-extension` keyword and a valid `directus:extension` block. There is no separate submission form or manual review. The package shows up after `npm publish` (indexing may take some time).
3. **Important:** this bundle contains a non-sandboxed API extension (endpoint). By default Directus runs with `MARKETPLACE_TRUST=sandbox` and **hides such extensions** from the in-app Marketplace. Users must set `MARKETPLACE_TRUST=all`, or install manually (npm package or `dist` into `extensions/`). The README currently says "add from the in-built Marketplace" without mentioning this.
4. Whoever owns the npm account/org must do the `npm publish`. The owner is **[unverified]** and is named in the private handover file once known.

Typical reasons an extension does not show up or is marked incompatible:

- missing `directus-extension` keyword;
- `host` range not matching the user's Directus version (shown as "compatibility not guaranteed");
- non-sandboxed extension on an instance with the default `MARKETPLACE_TRUST`.

## 5. Implicit knowledge (why it's done this way)

- **Settings collection is created lazily.** Any call to `SettingsService.getService()` creates the hidden singleton `onlyoffice_settings` if it is missing, and generates `directus_jwt_secret` with `randomUUID()`. There is no install hook or migration.
- **Field migration is driven by `package.json` `version`.** New fields from `src/schema/settings_fields.ts` are added only when the stored `version` differs from `package.json`. **If you add a settings field, bump the version**, otherwise existing installs never get it.
- **Do not rename `onlyoffice_settings`** (`ONLYOFFICE_SETIINGS_COLLECTION_KEY`; the typo in the constant name is harmless) or existing field names. Customer data lives there.
- **Two different secrets:**
  - `doc_server_jwt_secret` must match the Docs config. It signs the editor config and verifies the callback and the download header.
  - `directus_jwt_secret` is internal. It signs `oo_token` in the download URL so Docs can fetch a file without a Directus session.
- **`getAccountability` rebuilds Directus permissions by hand** (role tree + policies) for requests from Docs, which carry no Directus session. Files are then read and written with that user's rights, never as admin. Keep it in sync with Directus's own accountability logic when Directus changes its permission model.
- **The document key** is `<file id>_<modified_on>` with `:` replaced by `-` (Docs rejects `:`). The key changes after every save, so Docs never serves a stale cached version.
- **Saving overwrites the existing `directus_files` record** (`uploadOne(stream, {storage}, fileId)`) in the first `STORAGE_LOCATIONS` entry.
- **`encodeFilename`** produces an RFC 5987 `filename*`-style value so non-ASCII names download correctly.
- **The `keep-behind` dialog and the global `z-index` override on `.v-drawer`** in `interface.vue` keep the Create/Replace dialog from hiding behind the drawer. The `value` watcher closes the dialog when the standard file input changed the value. Don't remove these without retesting replace/upload.
- **The editor page is server-rendered** (`src/assets/templates/editor.ts`) rather than a Vue component. Docs `api.js` must load from the Docs origin in a standalone page, both for "Open in new tab" and inside the iframe.
- **`Content-Security-Policy: default-src: 'self'`** on the editor page is syntactically invalid, so browsers ignore it. A "correct" `default-src 'self'` would block Docs `api.js`. Change it only together with an allow-list for the Docs origin.

## 6. Known problems, tech debt, branches

Non-sensitive tech debt (bugs and security findings are in the private file):

- `tsc --noEmit` reports about 31 errors: `request.log`/`accountability` are not in the express types, `error` is `unknown` in catch blocks, and two packages are undeclared. The build ignores them.
- `@directus/extensions-sdk` 16.0.2 is outdated (current is 18.x). Bump it together with Directus testing.
- `host` was `^10.10.0` until this handover. Corrected to `^11.4.0`, see §1.
- No unit tests. Smoke tests (`test/smoke.test.mjs`) cover the endpoint with mocked Directus services. The UI and real Docs are checked manually (checklist below).
- `CHANGELOG.md` has no version and no date.
- UI strings in the interface/settings are hard-coded English (only the field labels use `$t:`).
- Error responses: most routes return HTTP 200 with `{error: 1}` instead of proper status codes.

**Branches**

| Branch | State |
|---|---|
| `develop` (Gitea) | main development line, all finished work |
| `master` | no code yet, receives the first release |
| `feat/update` | merged into develop (fa5f185), deleted on server |
| `fix/build` | deleted on server. Two commits from Dec 2024 (a8807bb, cf4a0be: build fixes, add `@directus/env`/`utils`) were never merged, but develop already has equivalents. Obsolete. |

## 7. Plans and commitments

No plans, TODOs or customer/partner commitments are recorded in the code, issues or history. **[unverified]**: confirm with the previous maintainer.

Natural next steps: the first release 1.0.0 (npm + GitHub), the README note about `MARKETPLACE_TRUST`, and the fixes from the private bug list.

---

## Manual smoke checklist (UI + real ONLYOFFICE Docs)

Run it before every release. Needs Directus ≥ 11.4 with the built extension and a reachable Docs instance with JWT enabled.

- [ ] Directus starts and logs no extension load errors. Settings → Extensions lists `onlyoffice-directus` (bundle, 3 entries).
- [ ] Settings → Modules: enable ONLYOFFICE. The icon appears in the left nav.
- [ ] The ONLYOFFICE page opens and the form shows URL / JWT secret / JWT header. Saving shows "Saved", and reloading keeps the values.
- [ ] A non-admin user without access to `onlyoffice_settings` does not see the module.
- [ ] Data Model: add a File field with the "ONLYOFFICE Editor" interface.
- [ ] Create an item → Replace file → create a Document, a Spreadsheet, a Presentation and a PDF. Each is saved and shown in the embedded viewer.
- [ ] With the user language set to e.g. German, a new document opens with the German template defaults.
- [ ] "Or Upload file" with an existing docx: the viewer shows it.
- [ ] "Open in a new tab" as a user with update rights: the editor opens in edit mode. Make a change, close the tab, wait about 10 s, reload the item: the change is saved (the file's modified date changed).
- [ ] Two users edit the same file at the same time: co-editing works.
- [ ] A user with read-only rights: "Open in a new tab" opens in view mode.
- [ ] Wrong JWT secret in settings: the editor shows a Docs security error and the file is not overwritten.
- [ ] A file name with non-ASCII characters (e.g. Cyrillic) opens and saves correctly.
- [ ] Directus appearance set to dark: the editor uses the dark theme.
- [ ] Replace an existing file with a new one: the dialog is not hidden behind the drawer, and the field points to the new file.
