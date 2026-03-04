import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
const manifestPath = path.join(projectRoot, 'app/game/rpg/data/skill-sound-manifest.json')
const outputDir = path.join(projectRoot, 'public/game/rpg/sfx/skills')
const sampleRate = 44100

const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'))

function createRng(seed) {
  let state = seed >>> 0 || 1
  return () => {
    state = (1664525 * state + 1013904223) >>> 0
    return state / 0x100000000
  }
}

function createBuffer(durationSeconds) {
  return new Float32Array(Math.max(1, Math.floor(durationSeconds * sampleRate)))
}

function clamp(value, min = -1, max = 1) {
  return Math.max(min, Math.min(max, value))
}

function waveform(type, phase) {
  const cycle = (phase / (Math.PI * 2)) % 1
  const normalizedCycle = cycle < 0 ? cycle + 1 : cycle

  switch (type) {
    case 'square':
      return normalizedCycle < 0.5 ? 1 : -1
    case 'triangle':
      return 1 - 4 * Math.abs(normalizedCycle - 0.5)
    case 'saw':
      return normalizedCycle * 2 - 1
    default:
      return Math.sin(phase)
  }
}

function envelope(localTime, duration, attack = 0.01, release = 0.08) {
  if (duration <= 0) return 0
  if (localTime < 0 || localTime > duration) return 0

  const attackValue = attack > 0 ? Math.min(1, localTime / attack) : 1
  const releaseValue = release > 0 ? Math.min(1, (duration - localTime) / release) : 1

  return Math.max(0, Math.min(attackValue, releaseValue))
}

function addOscillator(
  buffer,
  {
    start = 0,
    duration,
    fromFreq,
    toFreq = fromFreq,
    gain = 0.25,
    wave = 'sine',
    attack = 0.005,
    release = 0.05,
    vibratoRate = 0,
    vibratoDepth = 0,
  }
) {
  const startIndex = Math.max(0, Math.floor(start * sampleRate))
  const endIndex = Math.min(buffer.length, Math.floor((start + duration) * sampleRate))
  let phase = 0

  for (let index = startIndex; index < endIndex; index += 1) {
    const localTime = (index - startIndex) / sampleRate
    const progress = duration > 0 ? localTime / duration : 0
    let frequency = fromFreq + (toFreq - fromFreq) * progress

    if (vibratoRate > 0 && vibratoDepth > 0) {
      frequency += Math.sin(localTime * Math.PI * 2 * vibratoRate) * vibratoDepth
    }

    phase += (Math.PI * 2 * frequency) / sampleRate
    buffer[index] += waveform(wave, phase) * gain * envelope(localTime, duration, attack, release)
  }
}

function addNoise(
  buffer,
  { start = 0, duration, gain = 0.2, attack = 0.001, release = 0.05, smoothing = 0.1, seed = 1 }
) {
  const startIndex = Math.max(0, Math.floor(start * sampleRate))
  const endIndex = Math.min(buffer.length, Math.floor((start + duration) * sampleRate))
  const rng = createRng(seed)
  let previous = 0

  for (let index = startIndex; index < endIndex; index += 1) {
    const localTime = (index - startIndex) / sampleRate
    const white = rng() * 2 - 1
    previous = previous * smoothing + white * (1 - smoothing)
    buffer[index] += previous * gain * envelope(localTime, duration, attack, release)
  }
}

function addImpact(buffer, start, strength, seed) {
  addNoise(buffer, {
    start,
    duration: 0.07,
    gain: 0.35 * strength,
    release: 0.06,
    smoothing: 0.02,
    seed,
  })
  addOscillator(buffer, {
    start,
    duration: 0.12,
    fromFreq: 180 * strength,
    toFreq: 70,
    gain: 0.22 * strength,
    wave: 'sine',
    release: 0.1,
  })
}

function addSparkle(buffer, start, strength = 1) {
  addOscillator(buffer, {
    start,
    duration: 0.16,
    fromFreq: 1100,
    toFreq: 1650,
    gain: 0.12 * strength,
    wave: 'triangle',
    release: 0.12,
  })
  addOscillator(buffer, {
    start: start + 0.04,
    duration: 0.14,
    fromFreq: 1450,
    toFreq: 1900,
    gain: 0.08 * strength,
    wave: 'sine',
    release: 0.1,
  })
}

function renderPreset(preset, durationSeconds, seed) {
  const buffer = createBuffer(durationSeconds)

  switch (preset) {
    case 'heal':
      addOscillator(buffer, {
        start: 0,
        duration: 0.32,
        fromFreq: 540,
        toFreq: 880,
        gain: 0.24,
        wave: 'sine',
      })
      addOscillator(buffer, {
        start: 0.18,
        duration: 0.28,
        fromFreq: 700,
        toFreq: 1180,
        gain: 0.16,
        wave: 'triangle',
      })
      addSparkle(buffer, 0.12, 1)
      break

    case 'fireball':
      addNoise(buffer, { start: 0, duration: 0.1, gain: 0.16, seed, smoothing: 0.04 })
      addOscillator(buffer, {
        start: 0.03,
        duration: 0.34,
        fromFreq: 180,
        toFreq: 520,
        gain: 0.26,
        wave: 'saw',
      })
      addOscillator(buffer, {
        start: 0.22,
        duration: 0.3,
        fromFreq: 120,
        toFreq: 70,
        gain: 0.1,
        wave: 'sine',
      })
      break

    case 'ice-arrow':
      addOscillator(buffer, {
        start: 0,
        duration: 0.24,
        fromFreq: 1600,
        toFreq: 920,
        gain: 0.22,
        wave: 'triangle',
      })
      addNoise(buffer, { start: 0.2, duration: 0.08, gain: 0.12, seed, smoothing: 0.01 })
      addSparkle(buffer, 0.05, 0.8)
      break

    case 'meteor-storm':
      addOscillator(buffer, {
        start: 0,
        duration: durationSeconds,
        fromFreq: 140,
        toFreq: 55,
        gain: 0.16,
        wave: 'saw',
        release: 0.2,
      })
      ;[0.18, 0.44, 0.72, 1.0].forEach((time, index) => {
        addImpact(buffer, time, 1 + index * 0.15, seed + index)
      })
      addNoise(buffer, { start: 0.08, duration: 0.9, gain: 0.08, seed: seed + 11, smoothing: 0.08 })
      break

    case 'frost-nova':
      addNoise(buffer, { start: 0, duration: 0.16, gain: 0.14, seed, smoothing: 0.03 })
      addOscillator(buffer, {
        start: 0,
        duration: 0.44,
        fromFreq: 1250,
        toFreq: 360,
        gain: 0.2,
        wave: 'triangle',
      })
      addSparkle(buffer, 0.08, 0.8)
      break

    case 'ice-age':
      addNoise(buffer, { start: 0, duration: 1.1, gain: 0.1, seed, smoothing: 0.12 })
      addOscillator(buffer, {
        start: 0.04,
        duration: durationSeconds,
        fromFreq: 920,
        toFreq: 180,
        gain: 0.14,
        wave: 'triangle',
        release: 0.2,
      })
      addOscillator(buffer, {
        start: 0.3,
        duration: 0.8,
        fromFreq: 180,
        toFreq: 70,
        gain: 0.12,
        wave: 'sine',
      })
      break

    case 'lightning-strike':
      addNoise(buffer, { start: 0, duration: 0.05, gain: 0.28, seed, smoothing: 0.005 })
      addOscillator(buffer, {
        start: 0,
        duration: 0.08,
        fromFreq: 2200,
        toFreq: 800,
        gain: 0.2,
        wave: 'square',
      })
      addOscillator(buffer, {
        start: 0.06,
        duration: 0.34,
        fromFreq: 160,
        toFreq: 70,
        gain: 0.12,
        wave: 'sine',
      })
      break

    case 'chain-lightning':
      ;[0, 0.18, 0.36].forEach((time, index) => {
        addNoise(buffer, {
          start: time,
          duration: 0.05,
          gain: 0.18,
          seed: seed + index,
          smoothing: 0.005,
        })
        addOscillator(buffer, {
          start: time,
          duration: 0.1,
          fromFreq: 2100 - index * 180,
          toFreq: 820,
          gain: 0.16,
          wave: 'square',
        })
      })
      addOscillator(buffer, {
        start: 0.18,
        duration: 0.42,
        fromFreq: 180,
        toFreq: 90,
        gain: 0.08,
        wave: 'sine',
      })
      break

    case 'thunder-wrath':
      addNoise(buffer, { start: 0, duration: 0.08, gain: 0.32, seed, smoothing: 0.004 })
      addOscillator(buffer, {
        start: 0,
        duration: 0.12,
        fromFreq: 2400,
        toFreq: 600,
        gain: 0.22,
        wave: 'square',
      })
      addOscillator(buffer, {
        start: 0.08,
        duration: 0.68,
        fromFreq: 150,
        toFreq: 48,
        gain: 0.18,
        wave: 'saw',
      })
      break

    case 'shield':
      addOscillator(buffer, {
        start: 0,
        duration: durationSeconds,
        fromFreq: 240,
        toFreq: 280,
        gain: 0.16,
        wave: 'sine',
        vibratoRate: 5,
        vibratoDepth: 6,
        release: 0.18,
      })
      addOscillator(buffer, {
        start: 0.05,
        duration: 0.28,
        fromFreq: 680,
        toFreq: 980,
        gain: 0.1,
        wave: 'triangle',
      })
      break

    case 'meteor':
      addOscillator(buffer, {
        start: 0,
        duration: 0.52,
        fromFreq: 420,
        toFreq: 90,
        gain: 0.2,
        wave: 'saw',
      })
      addNoise(buffer, { start: 0.08, duration: 0.45, gain: 0.1, seed, smoothing: 0.06 })
      addImpact(buffer, 0.5, 1.2, seed + 4)
      break

    case 'pierce':
      addOscillator(buffer, {
        start: 0,
        duration: 0.06,
        fromFreq: 900,
        toFreq: 1350,
        gain: 0.16,
        wave: 'square',
      })
      addOscillator(buffer, {
        start: 0.03,
        duration: 0.22,
        fromFreq: 1200,
        toFreq: 420,
        gain: 0.16,
        wave: 'triangle',
      })
      addImpact(buffer, 0.22, 0.55, seed + 2)
      break

    case 'multi-shot':
      ;[0, 0.12, 0.24].forEach((time, index) => {
        addOscillator(buffer, {
          start: time,
          duration: 0.06,
          fromFreq: 900 + index * 80,
          toFreq: 1300 - index * 30,
          gain: 0.12,
          wave: 'square',
        })
        addOscillator(buffer, {
          start: time + 0.02,
          duration: 0.18,
          fromFreq: 1180,
          toFreq: 420,
          gain: 0.1,
          wave: 'triangle',
        })
      })
      addImpact(buffer, 0.4, 0.7, seed + 3)
      break

    case 'dash':
      addNoise(buffer, { start: 0, duration: 0.22, gain: 0.16, seed, smoothing: 0.18 })
      addOscillator(buffer, {
        start: 0.01,
        duration: 0.24,
        fromFreq: 620,
        toFreq: 210,
        gain: 0.12,
        wave: 'sine',
      })
      break

    case 'poison':
      addNoise(buffer, { start: 0, duration: 0.35, gain: 0.16, seed, smoothing: 0.01 })
      addOscillator(buffer, {
        start: 0.05,
        duration: 0.4,
        fromFreq: 190,
        toFreq: 110,
        gain: 0.12,
        wave: 'square',
      })
      break

    case 'dodge':
      addNoise(buffer, { start: 0, duration: 0.12, gain: 0.15, seed, smoothing: 0.2 })
      addOscillator(buffer, {
        start: 0,
        duration: 0.14,
        fromFreq: 760,
        toFreq: 1180,
        gain: 0.12,
        wave: 'sine',
      })
      break

    case 'arrow-rain':
      ;[0.04, 0.16, 0.28, 0.4, 0.52, 0.64].forEach((time, index) => {
        addOscillator(buffer, {
          start: time,
          duration: 0.18,
          fromFreq: 1500 - index * 70,
          toFreq: 420,
          gain: 0.08,
          wave: 'triangle',
        })
      })
      ;[0.62, 0.76, 0.9].forEach((time, index) => {
        addImpact(buffer, time, 0.7 + index * 0.1, seed + index)
      })
      break

    case 'shadow-step':
      addNoise(buffer, { start: 0, duration: 0.28, gain: 0.12, seed, smoothing: 0.25 })
      addOscillator(buffer, {
        start: 0,
        duration: 0.3,
        fromFreq: 140,
        toFreq: 360,
        gain: 0.12,
        wave: 'sine',
      })
      addOscillator(buffer, {
        start: 0.18,
        duration: 0.16,
        fromFreq: 480,
        toFreq: 220,
        gain: 0.08,
        wave: 'triangle',
      })
      break

    case 'slash':
      addNoise(buffer, { start: 0, duration: 0.12, gain: 0.15, seed, smoothing: 0.16 })
      addOscillator(buffer, {
        start: 0,
        duration: 0.16,
        fromFreq: 620,
        toFreq: 240,
        gain: 0.12,
        wave: 'saw',
      })
      addImpact(buffer, 0.14, 0.8, seed + 2)
      break

    case 'battle-shout':
      addOscillator(buffer, {
        start: 0,
        duration: 0.22,
        fromFreq: 170,
        toFreq: 240,
        gain: 0.16,
        wave: 'square',
      })
      addOscillator(buffer, {
        start: 0.12,
        duration: 0.2,
        fromFreq: 260,
        toFreq: 320,
        gain: 0.12,
        wave: 'saw',
      })
      addNoise(buffer, { start: 0.02, duration: 0.18, gain: 0.08, seed, smoothing: 0.05 })
      break

    case 'charge':
      addOscillator(buffer, {
        start: 0,
        duration: 0.16,
        fromFreq: 100,
        toFreq: 180,
        gain: 0.14,
        wave: 'saw',
      })
      addNoise(buffer, { start: 0.04, duration: 0.3, gain: 0.12, seed, smoothing: 0.18 })
      addImpact(buffer, 0.34, 1, seed + 4)
      break

    case 'whirlwind':
      ;[0, 0.14, 0.28, 0.42].forEach((time, index) => {
        addNoise(buffer, {
          start: time,
          duration: 0.12,
          gain: 0.08,
          seed: seed + index,
          smoothing: 0.14,
        })
        addOscillator(buffer, {
          start: time,
          duration: 0.18,
          fromFreq: 720 - index * 80,
          toFreq: 260,
          gain: 0.1,
          wave: 'saw',
        })
      })
      break

    case 'rage':
      ;[0, 0.18, 0.36].forEach((time, index) => {
        addOscillator(buffer, {
          start: time,
          duration: 0.22,
          fromFreq: 110 + index * 30,
          toFreq: 170 + index * 40,
          gain: 0.14,
          wave: 'saw',
        })
      })
      addNoise(buffer, { start: 0.06, duration: 0.5, gain: 0.06, seed, smoothing: 0.09 })
      break

    case 'execute':
      addNoise(buffer, { start: 0, duration: 0.14, gain: 0.14, seed, smoothing: 0.12 })
      addOscillator(buffer, {
        start: 0,
        duration: 0.18,
        fromFreq: 520,
        toFreq: 180,
        gain: 0.14,
        wave: 'saw',
      })
      addImpact(buffer, 0.18, 1.25, seed + 7)
      break

    default:
      addOscillator(buffer, {
        start: 0,
        duration: Math.min(durationSeconds, 0.2),
        fromFreq: 320,
        toFreq: 640,
        gain: 0.18,
        wave: 'saw',
      })
      break
  }

  return normalize(buffer)
}

function normalize(buffer) {
  let peak = 0
  for (const sample of buffer) {
    peak = Math.max(peak, Math.abs(sample))
  }

  if (peak <= 0) return buffer

  const scale = 0.9 / peak
  const normalized = new Float32Array(buffer.length)
  for (let index = 0; index < buffer.length; index += 1) {
    normalized[index] = clamp(buffer[index] * scale)
  }

  return normalized
}

async function writeWav(filePath, samples) {
  const dataSize = samples.length * 2
  const buffer = Buffer.alloc(44 + dataSize)

  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(36 + dataSize, 4)
  buffer.write('WAVE', 8)
  buffer.write('fmt ', 12)
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20)
  buffer.writeUInt16LE(1, 22)
  buffer.writeUInt32LE(sampleRate, 24)
  buffer.writeUInt32LE(sampleRate * 2, 28)
  buffer.writeUInt16LE(2, 32)
  buffer.writeUInt16LE(16, 34)
  buffer.write('data', 36)
  buffer.writeUInt32LE(dataSize, 40)

  for (let index = 0; index < samples.length; index += 1) {
    const value = clamp(samples[index])
    buffer.writeInt16LE(Math.round(value * 32767), 44 + index * 2)
  }

  await fs.writeFile(filePath, buffer)
}

await fs.mkdir(outputDir, { recursive: true })

for (const [index, entry] of manifest.entries()) {
  const outputPath = path.join(outputDir, entry.fileName)
  const samples = renderPreset(entry.preset, entry.durationSeconds, 1000 + index * 17)
  await writeWav(outputPath, samples)
  console.log(`generated ${path.relative(projectRoot, outputPath)}`)
}
