# Teachy (website)

Company site for **Teachy** (free personal 1:1 tutor) and **Teachy Enterprise** (bespoke AI + employee AI fluency).

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

1. Tutorial flood → manifesto → **BAM Teachy**
2. Interactive demo browser — tutor coaches beside the cursor
3. Landing: dual product (Teachy + Enterprise), AI fluency market, how it works, contact

## Products

| Product | CTA |
|---------|-----|
| **Teachy** | Free download + free browser lesson |
| **Teachy Enterprise** | [`enterprise.html`](enterprise.html) + `mailto:enterprise@teachy.app` |

## World platform plan

See [`TEACHY_PLAN.md`](TEACHY_PLAN.md) and [`../docs/TEACHY.md`](../docs/TEACHY.md).
