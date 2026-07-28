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

## Write back what you learn - this is not optional

Before finishing a session in which you made an architectural choice, found
something surprising, or implemented a call the user made in conversation:

```bash
pwsh ../teachy-brain/scripts/new-decision.ps1 "<the call, as a short sentence>"
```

A decision made in chat and implemented in code leaves no record of the reasoning
anywhere - the code shows what, the commit shows what changed, and the why dies
when the session ends. That is the single way this system fails.

Full protocol, including when NOT to record: `../teachy-brain/WRITE-BACK.md`.
Check yourself with `pwsh ../teachy-brain/scripts/brain-status.ps1`.

## Standing context

Repeated here rather than left to memory files: those are keyed to the workspace
root (C:\Users\vedan\teachy), so a session started inside this repo loads none of
them. This block always loads.

- **Ved never maintains the brain.** Keeping decisions, incidents and known
  issues current is Claude's job, done as part of finishing work - not offered as
  an option.
- **He wants the call made, not a menu.** Decide, act, state the honest cost in a
  sentence. Reserve questions for money, publication, and product direction.
- **Never declare victory.** Name what is still missing. Verify by running things.
- **The workspace** is three repos side by side: `teachy-app`, `teachy-web`,
  `teachy-brain`, plus a generated `graph/`.
