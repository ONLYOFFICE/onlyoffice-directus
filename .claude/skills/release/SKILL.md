---
name: release
description: Release a new version of the ONLYOFFICE Directus extension and publish it to npm / Directus Marketplace. Use when asked to cut a release, bump the version, publish to npm or the marketplace, or prepare release notes.
---

# Release onlyoffice-directus

The first release has not happened yet. On a first release, `master` is still empty, there are no tags and nothing is on npm, so expect a big diff on the develop → master PR.

Steps marked **[manual]** need a human: ask the user and wait. Never push, merge, tag or publish without explicit confirmation in chat.

## 1. Prepare on `develop`

1. `git checkout develop && git pull && git submodule update --init --recursive`
2. Update the submodules if the release should ship new formats/templates:
   ```bash
   git -C src/assets/document-formats pull origin master
   git -C src/assets/document-templates pull origin main/new
   ```
   Then commit the new pointers (`chore: update submodules`).
3. Choose the version (semver). Bump `version` in `package.json`.
   - The version bump is what triggers the settings field migration on existing installs (`settings_service.ts`), so **always bump it**, even for small releases.
4. Check that `directus:extension.host` still matches the Directus versions you tested (currently `^11.4.0`).
5. Update `CHANGELOG.md`: add a `## X.Y.Z` header with `Added` / `Changed` / `Fixed` sections, taken from `git log <last-tag>..develop --oneline` (or the full history for 1.0.0).
6. Update the `README.md` if user-facing behaviour changed. Make sure it mentions `MARKETPLACE_TRUST=all`, which is needed to see this non-sandboxed extension in the in-app Marketplace.
7. Update the year in license headers if a new year started (`chore: copyright`).

## 2. Verify

```bash
pnpm install --frozen-lockfile
pnpm test:smoke
```

- All smoke tests must pass.
- **[manual]** Run the manual checklist from `HANDOVER.md` against a real Directus (lowest supported version and latest) and a real ONLYOFFICE Docs instance.
- The `Licenses` CI must be green. If a new dependency is flagged, add an approval to `.check-licenses.yml` only after checking that the license is acceptable.

## 3. Merge to master and tag

1. Commit, then **[manual]** push `develop` after confirmation.
2. **[manual]** Open a PR `develop` → `master` in the internal Gitea (`git.onlyoffice.com/ONLYOFFICE/onlyoffice-directus`). The `Artifact` workflow builds `onlyoffice-directus-vX.Y.Z` (dist + package.json). Download it and sanity-check it.
3. **[manual]** Review and merge the PR.
4. **[manual]** Tag the merge commit and push the tag after confirmation:
   ```bash
   git checkout master && git pull
   git tag -a vX.Y.Z -m "vX.Y.Z"
   git push origin vX.Y.Z
   ```
5. The GitHub mirror (`github.com/ONLYOFFICE/onlyoffice-directus`) syncs on its own. Check that the tag appeared there.
6. **[manual]** Create a GitHub Release for the tag. Use the CHANGELOG section as the notes and attach the build artifact as a zip.
7. Merge `master` back into `develop` if the PR produced a merge commit.

## 4. Publish to npm (= Directus Marketplace)

The Directus Marketplace has no submission form. It indexes public npm packages that have the `directus-extension` keyword and a valid `directus:extension` block.

1. On the tagged `master` checkout: `git submodule update --init --recursive && pnpm install --frozen-lockfile && pnpm build`
2. Check the tarball contents: `npm pack --dry-run`. It must contain `dist/api.js`, `dist/app.js`, `dist/assets/document-templates/**` and `package.json`, and nothing from `src/` or `node_modules/` (`files: ["dist"]`).
3. **[manual]** Publish from the ONLYOFFICE npm account/org. Credentials are with the npm owner and must never be stored in the repo:
   ```bash
   npm publish --access public
   ```
   The package name is `onlyoffice-directus` (unscoped). On the first publish, make sure the name is still free: `npm view onlyoffice-directus`.
4. Wait for marketplace indexing. Then check at `https://registry.directus.io/extensions?search=onlyoffice` and in Directus → Settings → Marketplace (with `MARKETPLACE_TRUST=all`).
5. If the listing shows "compatibility not guaranteed", the `host` range does not cover the viewer's Directus version. Fix it in the next patch release.

## 5. After the release

- Announce the release to the team or the person who requested it.
- Close the related issues on GitHub.
