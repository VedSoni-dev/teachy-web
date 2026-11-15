# Teachy Web

The Teachy Academy site — the landing page, the enterprise page, and the course
registry that the app reads.

Live at [https://teachy-ashy-two.vercel.app](https://teachy-ashy-two.vercel.app/) (Vercel ← **teachy-web**).
`teachy-ashy.vercel.app` is the old alias still attached to `VedSoni-dev/teachy` — do not treat it as the source of truth until that alias is moved.

## Layout

Rebuilt from scratch in Nov 2026 around one idea: Teachy is the open-source Clicky, and it keeps shipping.

| Path | What |
|------|------|
| `academy/index.html` | Landing page: live ASCII sky hero (move through it, the wind follows), the Teachy cursor flies in on load and becomes the logo, a buddy cursor follows you and talks on hover (hold control + option for a surprise), a commit ticker, the open-source story as a git graph, an interactive demo desk, the latest changelog entry, a night-sky CTA. |
| `academy/changelog.html` | Full changelog with filters (released builds / on main / macOS / Windows) and anchor links. |
| `academy/changelog.js` | **The data.** Every release, newest first, plus the commits shown in the ticker. Add a release by putting a new object at the top. |
| `academy/site.js`, `academy/cl.js` | Page behavior (ES modules, no build). |
| `academy/site.css` | All styles. |
| `academy/cirrus.js` | The sky engine, vendored from [frontend.vedantsoni.com/sky](https://frontend.vedantsoni.com/sky) (MIT). |
| `academy/registry.json` | Course registry the app and release tooling may still read. Not linked from the site. |
| `vercel.json` | Vercel build config (`outputDirectory: academy`) |
| `scripts/publish-academy.sh` | publishes `academy/` to the `gh-pages` branch |

## Running it

Static, no build step. Serve the folder (ES modules need http, not file://):

```bash
python3 -m http.server 8000 --directory academy
```

## The one cross-repo dependency

`academy/registry.json` installs courses by raw URL out of the **teachy-app**
repo:

```
https://raw.githubusercontent.com/VedSoni-dev/teachy/main/courses/build-a-website.json
```

Those URLs still point at the original combined repo. When teachy-app gets its
own remote, they have to be repointed at it — until then, installs resolve
against whatever that repo's `main` holds, which drifts as soon as courses are
edited in teachy-app. Nothing in this repo will fail loudly when that happens;
the app just installs a stale course.

## Deploying

Two paths exist, and they are independent:

- **Vercel** builds from the repo root using `vercel.json`. The project is
  currently wired to the original combined repo, so it needs repointing at this
  one.
- **GitHub Pages** via `scripts/publish-academy.sh`, which pushes `academy/` to
  `gh-pages`.

## Repository layout

Teachy is split across three repos:

| Repo | Holds |
|------|-------|
| **teachy-app** | macOS + Windows apps, `courses/`, `connectors/`, the `worker/` proxy |
| **teachy-web** (this one) | the Academy site and its deploy config |
| **teachy-brain** | strategy, launch material, design docs, course-design skill |
