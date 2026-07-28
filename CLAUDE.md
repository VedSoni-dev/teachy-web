# Working in teachy-web

The Teachy Academy site. Static — no build step.

## Query the graph before exploring

A knowledge graph spanning teachy-app, teachy-web and teachy-brain lives at
`../graph/teachy-graph.json`:

```bash
graphify explain "<thing>" --graph ../graph/teachy-graph.json
graphify path "<a>" "<b>" --graph ../graph/teachy-graph.json
```

Rebuild after changes: `pwsh ../teachy-brain/scripts/rebuild-graph.ps1`

## Why decisions were made

Decision records live in the **teachy-brain** repo under `decisions/`.

## The one thing that fails silently

`academy/registry.json` installs courses from the app repo by raw GitHub URL. If
that URL points at the wrong repo or branch, the app installs a stale course and
**nothing errors**. Check it whenever courses move. See
[decision 0005](../teachy-brain/decisions/0005-three-repos.md).
