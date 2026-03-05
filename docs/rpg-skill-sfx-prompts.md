# RPG 技能音效清单

## 已接入方式

- 战斗中技能触发时，前端会优先按技能名匹配音效文件。
- 如果技能名没有匹配到，则回退到 `effect_key` 对应的默认音效。
- 音效文件目录：`public/game/rpg/sfx/skills/`
- 重新生成占位音效：

```bash
npm run generate:rpg-sfx
```

## 外部生成网站

- ElevenLabs Sound Effects
  官方说明：支持直接用文本提示生成音效，最长 30 秒，也支持生成可循环音效。
  链接：https://help.elevenlabs.io/hc/en-us/articles/25735182995985-What-is-Sound-Effects

- Adobe Firefly Text to sound effects
  官方说明：支持文本提示、上传音视频参考、用自己的声音控制时机和强弱；当前文本提示只支持英文。
  链接：https://helpx.adobe.com/firefly/work-with-audio-and-video/work-with-audio/text-to-sound-effects.html

- Canva AI Sound Effect Generator
  官方说明：在编辑器里通过 Aurora Sound FX 生成音效，可设置时长和强度；当前提供 1 次免费 credit。
  链接：https://www.canva.com/features/ai-sound-effect-generator/

- 现成素材库备用
  ZapSplat: https://www.zapsplat.com/basic-member-homepage/
  Freesound FAQ: https://freesound.org/help/faq/

## 使用建议

- Firefly 用英文 prompt，最稳。
- 先把时长控制在 `0.4s - 1.5s`，更适合技能按钮和战斗循环。
- 提示词里明确写 `no voice, no music, clean isolated sound effect`，能减少杂音和背景乐。
- 生成后优先导出 `wav`，再按需转 `mp3`。

## 主动技能提示词

| 技能 | 当前文件 | 英文提示词 |
| -------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |image.png
| 治疗术 | `heal-soft.wav` | Short fantasy healing spell for an action RPG, gentle holy shimmer, rising magical chimes, soft restorative glow, no voice, no music, clean isolated sound effect. |
| 火球术 | `fireball-ember.wav` | Short fantasy fireball cast for an action RPG, ember ignition into a fast burning projectile, hot magical whoosh, tiny impact tail, no voice, no music, clean isolated sound effect. |
| 冰箭 | `ice-arrow-crack.wav` | Short fantasy ice arrow cast for an action RPG, sharp crystalline launch, cold magical whistle, brittle frost crack on hit, no voice, no music, clean isolated sound effect. |
| 烈焰风暴 | `inferno-meteor-storm.wav` | Epic fantasy fire storm ultimate for an action RPG, roaring inferno vortex, multiple flaming impacts, intense heat and destruction, no voice, no music, clean isolated sound effect. |
| 冰霜新星 | `frost-nova-ring.wav` | Short fantasy frost nova burst for an action RPG, expanding ring of freezing energy, icy sparkle and crackling freeze wave, no voice, no music, clean isolated sound effect. |
| 冰河世纪 | `ice-age-blizzard.wav` | Epic fantasy ice age ultimate for an action RPG, deep freezing blizzard surge, ancient glacier cracking, wide area frost devastation, no voice, no music, clean isolated sound effect. |
| 雷击 | `lightning-strike-zap.wav` | Short fantasy lightning strike for an action RPG, instant electric crack, bright magical zap, focused thunder snap, no voice, no music, clean isolated sound effect. |
| 连锁闪电 | `chain-lightning-arc.wav` | Short fantasy chain lightning spell for an action RPG, electricity jumping rapidly between enemies, multiple sharp arcs and crackles, no voice, no music, clean isolated sound effect. |
| 雷霆万钧 | `thunder-wrath-burst.wav` | Epic fantasy thunder wrath ultimate for an action RPG, massive sky lightning blast, layered electric surges and thunder power, no voice, no music, clean isolated sound effect. |
| 魔法护盾 | `arcane-shield-hum.wav` | Short fantasy magic shield activation for an action RPG, arcane barrier rising, shimmering energy dome, defensive magical hum, no voice, no music, clean isolated sound effect. |
| 陨石术 | `meteor-impact-fall.wav` | Epic fantasy meteor spell for an action RPG, falling rock from the sky, fiery descent, heavy magical impact, no voice, no music, clean isolated sound effect. |
| 穿刺射击 | `pierce-shot-flight.wav` | Short fantasy piercing arrow shot for an action RPG, taut bow release, fast air-cutting projectile, precise impact, no voice, no music, clean isolated sound effect. |
| 多重射击 | `multishot-volley.wav` | Short fantasy multi-shot ability for an action RPG, rapid volley of arrows, repeated bow snaps, layered projectile swishes, no voice, no music, clean isolated sound effect. |
| 疾风步 | `wind-dash-step.wav` | Short fantasy wind dash movement skill for an action RPG, fast agile burst, airy whoosh and footstep vanish, no voice, no music, clean isolated sound effect. |
| 毒箭 | `poison-arrow-hiss.wav` | Short fantasy poison arrow shot for an action RPG, sinister hiss, toxic liquid sting, sharp projectile launch, no voice, no music, clean isolated sound effect. |
| 闪避 | `dodge-swish-evade.wav` | Short fantasy dodge maneuver for an action RPG, quick evasive sidestep, light air swish, responsive movement cue, no voice, no music, clean isolated sound effect. |
| 箭雨 | `arrow-rain-storm.wav` | Epic fantasy arrow rain ultimate for an action RPG, many arrows falling from the sky, whistling barrage and clustered impacts, no voice, no music, clean isolated sound effect. |
| 暗影步 | `shadow-step-veil.wav` | Short fantasy shadow step for an action RPG, dark teleport blur, smoky vanish, stealthy magical reappearance, no voice, no music, clean isolated sound effect. |
| 重击 | `heavy-slash-smash.wav` | Short fantasy heavy slash attack for an action RPG, powerful blade swing, metallic cut and brutal hit, no voice, no music, clean isolated sound effect. |
| 战吼 | `battle-shout-buff.wav` | Short fantasy battle shout buff for an action RPG, heroic war cry energy burst, empowering pulse, no voice, no music, clean isolated sound effect. |
| 冲锋 | `charge-rush-impact.wav` | Short fantasy charge attack for an action RPG, armored rush forward, heavy momentum, impact on contact, no voice, no music, clean isolated sound effect. |
| 旋风斩 | `whirlwind-blade-spin.wav` | Short fantasy whirlwind blade attack for an action RPG, spinning steel arcs, circular slash motion, repeated cutting hits, no voice, no music, clean isolated sound effect. |
| 狂暴 | `rage-burst-frenzy.wav` | Short fantasy rage activation for an action RPG, savage power-up surge, aggressive pulse, intense combat ferocity, no voice, no music, clean isolated sound effect. |
| 斩杀 | `execute-cleaver-finisher.wav` | Short fantasy execution finisher for an action RPG, decisive heavy weapon strike, lethal cut and final impact, no voice, no music, clean isolated sound effect. |
