Original prompt: 如何给dogeow目录下，url为/game/rpg的技能加音效，不同技能不同音效，你能生成吗？还是有其他网站 可以生成

2026-03-04

- Added per-skill sound manifest and registry for RPG combat skills.
- Wired BattleArena to play skill-specific audio from `skillUsed` events via `soundManager.playSkill`.
- Added a deterministic Node-based WAV generator and generated placeholder files under `public/game/rpg/sfx/skills`.
- Added Vitest coverage for manifest lookup behavior.
- Documented generation workflow and external AI/library options in `docs/rpg-skill-sfx-prompts.md`.
- Verified generated WAV headers and registry tests; TypeScript check passed.

TODO

- Confirm `/game/rpg` loads and does not regress with the new sound preload/runtime path.
- If needed, replace placeholder WAVs with higher-quality AI-generated or licensed assets using the documented prompts.

2026-03-10

- Investigated local `/api/rpg/combat/start` latency; frontend only waits for POST success and already shows a loading state.
- Tightened frontend feedback for combat start by optimistically setting `isFighting` during the request so the arena immediately shows a pending combat state, then rolling back on failure.
- Found the main local delay in `dogeow-api`: `composer run dev` starts `queue:listen`, which spawns one-off workers with `--sleep=3`, so the first combat job can wait before being picked up.
- Found a second delay source: `GameCombatUpdate` and `GameInventoryUpdate` were queued broadcasts, so combat rounds and Reverb push each incurred queue latency.
- Updated backend events to broadcast immediately and changed local dev queue startup to `queue:work --sleep=1` to reduce first-feedback delay.
