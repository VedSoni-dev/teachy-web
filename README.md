# Teachy Web

The Teachy Academy site — the landing page, the enterprise page, and the course
registry that the app reads.

Live at [vedsoni-dev.github.io/teachy](https://teachy-ashy.vercel.app/).

## Layout

| Path | What |
|------|------|
| `academy/` | the whole site — HTML, CSS, JS, logos, hero video |
| `academy/registry.json` | the course registry the app installs from |
| `academy/assets/hero-demo/` | the hero video and the script that records it |
| `vercel.json` | Vercel build config (`outputDirectory: academy`) |
| `scripts/publish-academy.sh` | publishes `academy/` to the `gh-pages` branch |

## Running it

Static — no build step. Open `academy/index.html`, or serve the folder:

```bash
python -m http.server 8000 --directory academy
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
