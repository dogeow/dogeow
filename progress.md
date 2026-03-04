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
