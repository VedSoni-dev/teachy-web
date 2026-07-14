# Teachy (website)

Free 1:1 learning platform — next-gen Khan Academy. Silent by design.

## Local preview

```bash
cd academy
python3 -m http.server 8765
# http://localhost:8765/?intro=1
```

## Live site

**https://vedsoni-dev.github.io/teachy/**

Published from the `gh-pages` branch (static files — no GitHub Actions / no paid plan needed).

```bash
./scripts/publish-academy.sh
```

That copies `academy/` to `gh-pages` and force-pushes. Edit files under `academy/` on `main` first, commit, then run the script.

## Experience

1. Tutorial flood → crossed-out YouTube → manifesto → **BAM Teachy**
2. Interactive demo browser — tutor coaches beside the cursor
3. Landing: mission + **flagship Use AI to Code** + paths + download

## World platform plan

See [`TEACHY_PLAN.md`](TEACHY_PLAN.md).

Flagship path: [`../courses/ai-to-code.json`](../courses/ai-to-code.json) — also bundled first in the Mac app Learn catalog.
