import { useState, useRef, useEffect, useCallback, memo, type ChangeEvent, type ReactNode } from 'react'
import { Play, Pause, Save, X, ChevronDown, Radio, Zap, Settings2, ChevronUp, Upload, Trash2, Download, Music, Plus, Volume2, RotateCcw, Square, Copy, ClipboardPaste, Scissors, Undo2, Redo2 } from 'lucide-react'

interface InstrumentParams {
  frequency: number
  frequencyEnd?: number
  attack: number
  decay: number
  sustain: number
  release: number
  volume: number
  waveType: OscillatorType
  filterType: BiquadFilterType
  filterFreq: number
  filterQ: number
  duration: number
  useNoise?: boolean
}

type DefaultParams = { [key: number]: InstrumentParams }

interface Instrument {
  id: number
  name: string
  shortName: string
  icon: ReactNode
  color: string
  description: string
  frequency: number
  sample?: string
}

type AudioContextLike = AudioContext | OfflineAudioContext

interface ImportedTrack {
  id: string
  name: string
  audioBuffer: AudioBuffer
  sliceDuration: number
  sliceOffsets: number[]
  sliceDurations: number[]
  detectedBpm: number
  color: string
  volume: number
  waveforms: number[][]
}

interface CellEffect {
  filterType: BiquadFilterType | 'none'
  filterFreq: number
  filterQ: number
  gain: number
  fadeIn: number
  fadeOut: number
  invertPhase: boolean
  compressorEnabled: boolean
  compressorThreshold: number
  compressorRatio: number
  normalize: boolean
  trimStart: number
  trimEnd: number
}

const instruments: Instrument[] = [
  { id: 1, name: 'Kick (Bass Drum)', shortName: 'Kick', icon: <div className="w-8 h-8 rounded-full bg-white/20 border-2 border-white flex items-center justify-center"><div className="w-4 h-4 rounded-full bg-white" /></div>, color: '#ef4444', description: 'Бочка, основа ритма, низкие частоты', frequency: 60 },
  { id: 2, name: 'Snare Drum', shortName: 'Snare', icon: <div className="w-8 h-8 rounded-lg border-2 border-white flex items-center justify-center"><div className="w-5 h-1 bg-white" /></div>, color: '#f59e0b', description: 'Малый барабан, акценты на 2 и 4 долю, средние частоты', frequency: 200 },
  { id: 3, name: 'Clap', shortName: 'Clap', icon: <div className="flex items-center justify-center space-x-1"><div className="w-3 h-5 bg-white rounded-tl rounded-bl" /><div className="w-3 h-5 bg-white rounded-tr rounded-br" /></div>, color: '#eab308', description: 'Хлопок, часто дублирует или усиливает снейр', frequency: 150 },
  { id: 4, name: 'Closed Hi-Hat', shortName: 'Hi-Hat', icon: <div className="w-7 h-7 rounded-full border-2 border-white" />, color: '#10b981', description: 'Закрытый хай-хэт, ритмическая сетка', frequency: 800 },
  { id: 5, name: 'Open Hi-Hat', shortName: 'Open HH', icon: <div className="w-7 h-7 rounded-full border-2 border-white border-dashed" />, color: '#3b82f6', description: 'Открытый хай-хэт, для переходов и грува', frequency: 1000 },
  { id: 6, name: 'Percussion', shortName: 'Perc', icon: <div className="flex space-x-1"><div className="w-2 h-4 bg-white rounded" /><div className="w-2 h-4 bg-white rounded" /></div>, color: '#a855f7', description: 'Дополнительная перкуссия', frequency: 400 },
  { id: 7, name: 'FX / Accent', shortName: 'FX', icon: <Zap className="w-6 h-6" />, color: '#ec4899', description: 'Эффекты или акцентные удары', frequency: 600 },
  { id: 8, name: '808 / Bass Hit', shortName: '808', icon: <Radio className="w-6 h-6" />, color: '#dc2626', description: 'Саб-бас или 808, низ + тело трека', frequency: 50 },
]

const DEFAULT_STEPS = 32
const MAX_STEPS = 128
const MAX_HISTORY = 50
const DEFAULT_BPM = 120
const TRACK_COLORS = ['#06b6d4', '#8b5cf6', '#f97316', '#14b8a6', '#e11d48', '#84cc16', '#d946ef', '#0ea5e9']

const DEFAULT_CELL_EFFECT: CellEffect = {
  filterType: 'none', filterFreq: 1000, filterQ: 1, gain: 1,
  fadeIn: 0, fadeOut: 0, invertPhase: false,
  compressorEnabled: false, compressorThreshold: -24, compressorRatio: 4, normalize: false,
  trimStart: 0, trimEnd: 1,
}

interface ClipboardCell {
  relRow: number
  relCol: number
  active: boolean
  effect?: Partial<CellEffect>
}

const defaultParams: DefaultParams = {
  1: { frequency: 60, frequencyEnd: 40, attack: 0.001, decay: 0.2, sustain: 0.8, release: 0.05, volume: 0.5, waveType: 'sine', filterType: 'lowpass', filterFreq: 200, filterQ: 1, duration: 0.25 },
  2: { frequency: 200, attack: 0.001, decay: 0.15, sustain: 0.7, release: 0.05, volume: 0.4, waveType: 'triangle', filterType: 'bandpass', filterFreq: 1000, filterQ: 0.5, duration: 0.2, useNoise: true },
  3: { frequency: 150, attack: 0.002, decay: 0.25, sustain: 0.6, release: 0.05, volume: 0.35, waveType: 'sine', filterType: 'bandpass', filterFreq: 800, filterQ: 1, duration: 0.3, useNoise: true },
  4: { frequency: 800, attack: 0.001, decay: 0.05, sustain: 0.5, release: 0.03, volume: 0.3, waveType: 'square', filterType: 'highpass', filterFreq: 6000, filterQ: 1, duration: 0.08 },
  5: { frequency: 1000, attack: 0.001, decay: 0.2, sustain: 0.6, release: 0.05, volume: 0.3, waveType: 'square', filterType: 'highpass', filterFreq: 5000, filterQ: 1, duration: 0.25 },
  6: { frequency: 400, attack: 0.001, decay: 0.1, sustain: 0.5, release: 0.05, volume: 0.35, waveType: 'sawtooth', filterType: 'bandpass', filterFreq: 600, filterQ: 2, duration: 0.15 },
  7: { frequency: 600, attack: 0.001, decay: 0.12, sustain: 0.6, release: 0.05, volume: 0.3, waveType: 'sawtooth', filterType: 'bandpass', filterFreq: 800, filterQ: 1.5, duration: 0.15 },
  8: { frequency: 50, frequencyEnd: 35, attack: 0.001, decay: 0.5, sustain: 0.9, release: 0.1, volume: 0.6, waveType: 'sine', filterType: 'lowpass', filterFreq: 150, filterQ: 1, duration: 0.6 },
}

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

const mergeInstrumentParams = (
  importedParams?: Partial<Record<number, Partial<InstrumentParams>>> | DefaultParams,
): DefaultParams =>
  Object.entries(defaultParams).reduce((acc, [instrumentId, params]) => {
    const numericId = Number(instrumentId)
    acc[numericId] = { ...params, ...importedParams?.[numericId] }
    return acc
  }, {} as DefaultParams)

const writeWavString = (view: DataView, offset: number, str: string) => {
  for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
}

const audioBufferToWav = (buffer: AudioBuffer): Blob => {
  const numChannels = buffer.numberOfChannels
  const sampleRate = buffer.sampleRate
  const bitsPerSample = 16
  let interleaved: Float32Array
  if (numChannels >= 2) {
    const left = buffer.getChannelData(0)
    const right = buffer.getChannelData(1)
    interleaved = new Float32Array(left.length * 2)
    for (let i = 0; i < left.length; i++) { interleaved[i * 2] = left[i]; interleaved[i * 2 + 1] = right[i] }
  } else {
    interleaved = buffer.getChannelData(0)
  }
  const channels = Math.min(numChannels, 2)
  const dataLength = interleaved.length * (bitsPerSample / 8)
  const arrayBuffer = new ArrayBuffer(44 + dataLength)
  const view = new DataView(arrayBuffer)
  writeWavString(view, 0, 'RIFF'); view.setUint32(4, 36 + dataLength, true)
  writeWavString(view, 8, 'WAVE'); writeWavString(view, 12, 'fmt ')
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, channels, true)
  view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * channels * (bitsPerSample / 8), true)
  view.setUint16(32, channels * (bitsPerSample / 8), true); view.setUint16(34, bitsPerSample, true)
  writeWavString(view, 36, 'data'); view.setUint32(40, dataLength, true)
  let offset = 44
  for (let i = 0; i < interleaved.length; i++) {
    const sample = Math.max(-1, Math.min(1, interleaved[i]))
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true)
    offset += 2
  }
  return new Blob([arrayBuffer], { type: 'audio/wav' })
}

const getMp3Encoder = (): LameMp3Encoder | undefined => window.Mp3Encoder ?? window.lamejs?.Mp3Encoder

const loadLameEncoder = (): Promise<LameMp3Encoder> =>
  new Promise((resolve, reject) => {
    const cached = getMp3Encoder()
    if (cached) { resolve(cached); return }
    const script = document.createElement('script')
    script.src = '/js/lame.min.js'
    script.onload = () => { const e = getMp3Encoder(); e ? resolve(e) : reject(new Error('Mp3Encoder not found')) }
    script.onerror = () => reject(new Error('Failed to load lame.min.js'))
    document.head.appendChild(script)
  })

const audioBufferToMp3 = (audioBuffer: AudioBuffer, Encoder: LameMp3Encoder): Blob => {
  const channels = Math.min(audioBuffer.numberOfChannels, 2)
  const encoder = new Encoder(channels, audioBuffer.sampleRate, 192)
  const mp3Chunks: Int8Array[] = []
  const toInt16 = (input: Float32Array) => {
    const out = new Int16Array(input.length)
    for (let i = 0; i < input.length; i++) { const s = Math.max(-1, Math.min(1, input[i])); out[i] = s < 0 ? s * 0x8000 : s * 0x7fff }
    return out
  }
  const left = toInt16(audioBuffer.getChannelData(0))
  const right = channels > 1 ? toInt16(audioBuffer.getChannelData(1)) : undefined
  for (let i = 0; i < left.length; i += 1152) {
    const lc = left.subarray(i, i + 1152)
    const chunk = right ? encoder.encodeBuffer(lc, right.subarray(i, i + 1152)) : encoder.encodeBuffer(lc)
    if (chunk.length > 0) mp3Chunks.push(chunk)
  }
  const flush = encoder.flush()
  if (flush.length > 0) mp3Chunks.push(flush)
  return new Blob(mp3Chunks.map((c) => c.buffer.slice(c.byteOffset, c.byteOffset + c.byteLength) as ArrayBuffer), { type: 'audio/mpeg' })
}

const WAVEFORM_BINS = 24
const BPM_DETECT_MIN = 70
const BPM_DETECT_MAX = 180
const ZERO_CROSSING_SEARCH_SEC = 0.008
const AUTO_SLICE_FADE_SEC = 0.006

const normalizeBpm = (value: number): number => {
  let bpm = value
  while (bpm < BPM_DETECT_MIN) bpm *= 2
  while (bpm > BPM_DETECT_MAX) bpm /= 2
  return bpm
}

const estimateBpmFromDuration = (durationSec: number, bpmHint: number): number | null => {
  if (!Number.isFinite(durationSec) || durationSec <= 0.5) return null
  const barCandidates = [1, 2, 4, 8, 16]
  let best: { bpm: number; score: number } | null = null

  for (const bars of barCandidates) {
    const rawBpm = (bars * 4 * 60) / durationSec
    const bpm = normalizeBpm(rawBpm)
    if (!Number.isFinite(bpm)) continue
    const rounded = Math.round(bpm)
    const score = Math.abs(rounded - bpmHint) + Math.abs(rounded - bpm) * 0.75
    if (!best || score < best.score) best = { bpm: rounded, score }
  }

  return best?.bpm ?? null
}

const estimateBpmFromAudioBuffer = (buffer: AudioBuffer, bpmHint: number): number | null => {
  const channel = buffer.getChannelData(0)
  const hopSize = 1024
  const frameRate = buffer.sampleRate / hopSize
  const frameCount = Math.floor(channel.length / hopSize)
  if (frameCount < 32) return estimateBpmFromDuration(buffer.duration, bpmHint)

  const envelope = new Float32Array(frameCount)
  for (let i = 0; i < frameCount; i++) {
    let sum = 0
    const start = i * hopSize
    const end = Math.min(start + hopSize, channel.length)
    for (let j = start; j < end; j++) sum += Math.abs(channel[j])
    envelope[i] = sum / Math.max(end - start, 1)
  }

  const onset = new Float32Array(frameCount)
  for (let i = 1; i < frameCount; i++) onset[i] = Math.max(0, envelope[i] - envelope[i - 1])

  const minLag = Math.max(1, Math.round((60 * frameRate) / BPM_DETECT_MAX))
  const maxLag = Math.max(minLag + 1, Math.round((60 * frameRate) / BPM_DETECT_MIN))
  let bestLag = 0
  let bestScore = 0

  for (let lag = minLag; lag <= Math.min(maxLag, frameCount - 1); lag++) {
    let score = 0
    for (let i = lag; i < frameCount; i++) score += onset[i] * onset[i - lag]
    if (score > bestScore) {
      bestScore = score
      bestLag = lag
    }
  }

  if (!bestLag || bestScore <= 0) return estimateBpmFromDuration(buffer.duration, bpmHint)
  const bpm = normalizeBpm((60 * frameRate) / bestLag)
  const rounded = Math.round(bpm)
  return Number.isFinite(rounded) ? rounded : estimateBpmFromDuration(buffer.duration, bpmHint)
}

const findNearestZeroCrossing = (
  data: Float32Array,
  target: number,
  radius: number,
  minIndex: number,
  maxIndex: number,
): number => {
  const start = Math.max(minIndex, target - radius)
  const end = Math.min(maxIndex, target + radius)
  let bestIndex = Math.max(minIndex, Math.min(maxIndex, target))
  let bestValue = Math.abs(data[bestIndex] ?? 0)

  for (let i = start + 1; i < end; i++) {
    const prev = data[i - 1]
    const curr = data[i]
    const absCurr = Math.abs(curr)
    if ((prev <= 0 && curr >= 0) || (prev >= 0 && curr <= 0)) return i
    if (absCurr < bestValue) {
      bestValue = absCurr
      bestIndex = i
    }
  }

  return bestIndex
}

const buildCleanSliceBoundaries = (buffer: AudioBuffer, stepDuration: number): number[] => {
  const data = buffer.getChannelData(0)
  const sampleRate = buffer.sampleRate
  const totalSteps = Math.max(1, Math.ceil(buffer.duration / stepDuration))
  const searchRadius = Math.max(8, Math.round(sampleRate * ZERO_CROSSING_SEARCH_SEC))
  const minSliceSamples = Math.max(64, Math.round(sampleRate * 0.01))
  const boundaries: number[] = [0]

  for (let i = 1; i < totalSteps; i++) {
    const targetSample = Math.round(i * stepDuration * sampleRate)
    const minIndex = boundaries[i - 1] + minSliceSamples
    const remaining = totalSteps - i
    const maxIndex = Math.max(minIndex, buffer.length - remaining * minSliceSamples)
    const boundary = findNearestZeroCrossing(data, targetSample, searchRadius, minIndex, maxIndex)
    boundaries.push(Math.max(boundaries[i - 1] + minSliceSamples, boundary))
  }

  boundaries.push(buffer.length)
  return boundaries
}

const computeWaveformPeaks = (buffer: AudioBuffer, startSec: number, durationSec: number, numBins: number): number[] => {
  const data = buffer.getChannelData(0)
  const sr = buffer.sampleRate
  const startSample = Math.floor(startSec * sr)
  const endSample = Math.min(Math.floor((startSec + durationSec) * sr), buffer.length)
  const total = endSample - startSample
  if (total <= 0) return new Array(numBins).fill(0)
  const perBin = total / numBins
  const peaks: number[] = []
  for (let i = 0; i < numBins; i++) {
    const binStart = startSample + Math.floor(i * perBin)
    const binEnd = startSample + Math.floor((i + 1) * perBin)
    let peak = 0
    for (let j = binStart; j < binEnd && j < buffer.length; j++) { const abs = Math.abs(data[j]); if (abs > peak) peak = abs }
    peaks.push(peak)
  }
  return peaks
}

const MiniWaveform = memo(({ peaks, color }: { peaks: number[]; color: string }) => (
  <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
    {peaks.map((peak, i) => {
      const barW = 100 / peaks.length
      const h = Math.max(peak * 92, 1.5)
      return <rect key={i} x={i * barW} y={(100 - h) / 2} width={barW * 0.8} height={h} fill={color} rx={1} />
    })}
  </svg>
))

const AUDIO_ACCEPT = '.wav,.mp3,.ogg,.flac,.aac,.m4a,audio/*'

const BeatSequencer = () => {
  const [bpm, setBpm] = useState(DEFAULT_BPM)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [pattern, setPattern] = useState<'A' | 'B'>('A')
  const [steps, setSteps] = useState<{ [key: string]: boolean }>({})
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null)
  const [showSaveDropdown, setShowSaveDropdown] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [selectedInstrument, setSelectedInstrument] = useState<number>(1)
  const [instrumentParams, setInstrumentParams] = useState<DefaultParams>(() => mergeInstrumentParams())
  const [loadedSamples, setLoadedSamples] = useState<{ [key: number]: AudioBuffer }>({})
  const [sampleFileNames, setSampleFileNames] = useState<{ [key: number]: string }>({})
  const [isExporting, setIsExporting] = useState(false)
  const [isImportingAudio, setIsImportingAudio] = useState(false)
  const [totalSteps, setTotalSteps] = useState(DEFAULT_STEPS)
  const [slicedInstruments, setSlicedInstruments] = useState<{ [id: number]: number }>({})
  const [waveformCache, setWaveformCache] = useState<{ [instrumentId: number]: number[][] }>({})
  const [importedTracks, setImportedTracks] = useState<ImportedTrack[]>([])
  const [cellEffects, setCellEffects] = useState<{ [key: string]: Partial<CellEffect> }>({})
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set())
  const [clipboard, setClipboard] = useState<ClipboardCell[]>([])
  const historyRef = useRef<{ steps: { [key: string]: boolean }; cellEffects: { [key: string]: Partial<CellEffect> } }[]>([])
  const historyIndexRef = useRef(-1)
  const skipHistoryRef = useRef(false)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [loopStart, setLoopStart] = useState<number | null>(null)
  const [loopEnd, setLoopEnd] = useState<number | null>(null)
  const [mutedInstrumentIds, setMutedInstrumentIds] = useState<Set<number>>(new Set())
  const [mutedTrackIds, setMutedTrackIds] = useState<Set<string>>(new Set())
  const [soloTarget, setSoloTarget] = useState<string | null>(null)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const fileInputRef = useRef<{ [key: number]: HTMLInputElement | null }>({})
  const audioImportRef = useRef<HTMLInputElement | null>(null)
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set())
  const dragRef = useRef<{ active: boolean; mode: 'select' | 'toggle' | null; toggleTo?: boolean }>({ active: false, mode: null })
  const playStartTimeRef = useRef(0)
  const absStepRef = useRef(0)

  useEffect(() => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    setAudioContext(ctx)
    return () => { ctx.close() }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.save-dropdown')) setShowSaveDropdown(false)
    }
    const handleMouseUp = () => { dragRef.current.active = false }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedCells(new Set())
    }
    const preventCtxOnGrid = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('.grid-cell')) e.preventDefault()
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('contextmenu', preventCtxOnGrid)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('contextmenu', preventCtxOnGrid)
    }
  }, [])

  const parseCellKey = useCallback((key: string) => {
    if (key.startsWith('imported-')) {
      const parts = key.split('-')
      const col = parseInt(parts[parts.length - 1], 10)
      const rowId = parts.slice(0, parts.length - 1).join('-')
      return { rowId, col }
    }
    const parts = key.split('-')
    const col = parseInt(parts[parts.length - 1], 10)
    const rowId = parts.slice(0, parts.length - 1).join('-')
    return { rowId, col }
  }, [])

  const buildCellKey = useCallback((rowId: string, col: number) => `${rowId}-${col}`, [])

  const handleCopy = useCallback(() => {
    if (selectedCells.size === 0) return
    const cells = [...selectedCells]
    const parsed = cells.map((k) => ({ key: k, ...parseCellKey(k) }))
    const rows = [...new Set(parsed.map((p) => p.rowId))]
    const minCol = Math.min(...parsed.map((p) => p.col))
    const minRowIdx = Math.min(...parsed.map((p) => rows.indexOf(p.rowId)))
    const clip: ClipboardCell[] = parsed.map((p) => ({
      relRow: rows.indexOf(p.rowId) - minRowIdx,
      relCol: p.col - minCol,
      active: !!steps[p.key],
      effect: cellEffects[p.key] ? { ...cellEffects[p.key] } : undefined,
    }))
    setClipboard(clip)
  }, [selectedCells, steps, cellEffects, parseCellKey])

  const handlePaste = useCallback(() => {
    if (clipboard.length === 0 || selectedCells.size === 0) return
    const anchor = [...selectedCells][0]
    const { rowId: anchorRowId, col: anchorCol } = parseCellKey(anchor)
    const allRows = [...new Set([...selectedCells].map((k) => parseCellKey(k).rowId))]
    if (!allRows.includes(anchorRowId)) allRows.unshift(anchorRowId)
    const allInstrumentRows = instruments.map((i) => String(i.id))
    const importedRowIds = importedTracks.map((t) => `imported-${t.id}`)
    const orderedRows = [...importedRowIds, ...allInstrumentRows]
    const anchorRowIndex = orderedRows.indexOf(anchorRowId)

    setSteps((prev) => {
      const n = { ...prev }
      clipboard.forEach((cell) => {
        const targetRowIdx = anchorRowIndex + cell.relRow
        if (targetRowIdx < 0 || targetRowIdx >= orderedRows.length) return
        const targetCol = anchorCol + cell.relCol
        if (targetCol < 0 || targetCol >= totalSteps) return
        const targetKey = buildCellKey(orderedRows[targetRowIdx], targetCol)
        n[targetKey] = cell.active
      })
      return n
    })
    setCellEffects((prev) => {
      const n = { ...prev }
      clipboard.forEach((cell) => {
        const targetRowIdx = anchorRowIndex + cell.relRow
        if (targetRowIdx < 0 || targetRowIdx >= orderedRows.length) return
        const targetCol = anchorCol + cell.relCol
        if (targetCol < 0 || targetCol >= totalSteps) return
        const targetKey = buildCellKey(orderedRows[targetRowIdx], targetCol)
        if (cell.effect) n[targetKey] = { ...cell.effect }
        else delete n[targetKey]
      })
      return n
    })
  }, [clipboard, selectedCells, parseCellKey, buildCellKey, instruments, importedTracks, totalSteps])

  const handleCut = useCallback(() => {
    handleCopy()
    setSteps((prev) => {
      const n = { ...prev }
      selectedCells.forEach((key) => { n[key] = false })
      return n
    })
    setCellEffects((prev) => {
      const n = { ...prev }
      selectedCells.forEach((key) => { delete n[key] })
      return n
    })
  }, [handleCopy, selectedCells])

  useEffect(() => {
    const handleCopyPasteKeys = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      if (e.key === 'c' || e.key === 'с') { e.preventDefault(); handleCopy() }
      if (e.key === 'v' || e.key === 'м') { e.preventDefault(); handlePaste() }
      if (e.key === 'x' || e.key === 'ч') { e.preventDefault(); handleCut() }
    }
    document.addEventListener('keydown', handleCopyPasteKeys)
    return () => document.removeEventListener('keydown', handleCopyPasteKeys)
  }, [handleCopy, handlePaste, handleCut])

  const pushHistory = useCallback((s: { [key: string]: boolean }, fx: { [key: string]: Partial<CellEffect> }) => {
    if (skipHistoryRef.current) {
      skipHistoryRef.current = false
      return
    }
    const stack = historyRef.current
    const idx = historyIndexRef.current
    historyRef.current = stack.slice(0, idx + 1)
    historyRef.current.push({ steps: { ...s }, cellEffects: { ...fx } })
    if (historyRef.current.length > MAX_HISTORY) historyRef.current.shift()
    historyIndexRef.current = historyRef.current.length - 1
    setCanUndo(historyIndexRef.current > 0)
    setCanRedo(false)
  }, [])

  const prevStepsRef = useRef(steps)
  const prevEffectsRef = useRef(cellEffects)
  useEffect(() => {
    if (prevStepsRef.current === steps && prevEffectsRef.current === cellEffects) return
    prevStepsRef.current = steps
    prevEffectsRef.current = cellEffects
    pushHistory(steps, cellEffects)
  }, [steps, cellEffects]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleUndo = useCallback(() => {
    const idx = historyIndexRef.current
    if (idx <= 0) return
    const newIdx = idx - 1
    historyIndexRef.current = newIdx
    const snapshot = historyRef.current[newIdx]
    skipHistoryRef.current = true
    setSteps({ ...snapshot.steps })
    setCellEffects({ ...snapshot.cellEffects })
    setCanUndo(newIdx > 0)
    setCanRedo(true)
  }, [])

  const handleRedo = useCallback(() => {
    const idx = historyIndexRef.current
    if (idx >= historyRef.current.length - 1) return
    const newIdx = idx + 1
    historyIndexRef.current = newIdx
    const snapshot = historyRef.current[newIdx]
    skipHistoryRef.current = true
    setSteps({ ...snapshot.steps })
    setCellEffects({ ...snapshot.cellEffects })
    setCanUndo(true)
    setCanRedo(newIdx < historyRef.current.length - 1)
  }, [])

  useEffect(() => {
    const handleUndoRedoKeys = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      if ((e.key === 'z' || e.key === 'я') && !e.shiftKey) { e.preventDefault(); handleUndo() }
      if ((e.key === 'y' || e.key === 'н') || ((e.key === 'z' || e.key === 'я') && e.shiftKey)) { e.preventDefault(); handleRedo() }
    }
    document.addEventListener('keydown', handleUndoRedoKeys)
    return () => document.removeEventListener('keydown', handleUndoRedoKeys)
  }, [handleUndo, handleRedo])


  const setCellActiveState = useCallback((cellKey: string, active: boolean) => {
    setSteps((prev) => {
      if (!!prev[cellKey] === active) return prev
      return { ...prev, [cellKey]: active }
    })
  }, [])

  const activateCellKey = useCallback((cellKey: string) => {
    setCellActiveState(cellKey, true)
  }, [setCellActiveState])

  const startSelectionDrag = useCallback((cellKey: string, additive: boolean) => {
    dragRef.current.active = true
    dragRef.current.mode = 'select'
    if (additive) {
      setSelectedCells((prev) => { const n = new Set(prev); n.add(cellKey); return n })
    } else {
      setSelectedCells(new Set([cellKey]))
    }
  }, [])

  const addToSelectionDrag = useCallback((cellKey: string) => {
    if (!dragRef.current.active) return
    if (dragRef.current.mode !== 'select') return
    setSelectedCells((prev) => { const n = new Set(prev); n.add(cellKey); return n })
  }, [])

  const startToggleDrag = useCallback((cellKey: string) => {
    dragRef.current.active = true
    dragRef.current.mode = 'toggle'
    dragRef.current.toggleTo = !steps[cellKey]
    setCellActiveState(cellKey, !steps[cellKey])
  }, [setCellActiveState, steps])

  const addToToggleDrag = useCallback((cellKey: string) => {
    if (!dragRef.current.active) return
    if (dragRef.current.mode !== 'toggle') return
    setCellActiveState(cellKey, !!dragRef.current.toggleTo)
  }, [setCellActiveState])

  const createNoiseBuffer = useCallback((context: AudioContextLike, duration: number) => {
    const sampleRate = context.sampleRate
    const buffer = context.createBuffer(1, duration * sampleRate, sampleRate)
    const output = buffer.getChannelData(0)
    for (let i = 0; i < buffer.length; i++) output[i] = Math.random() * 2 - 1
    return buffer
  }, [])

  const loadSampleFile = useCallback(async (instrumentId: number, file: File) => {
    if (!audioContext) return
    try {
      const arrayBuffer = await file.arrayBuffer()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0))
      setLoadedSamples((prev) => ({ ...prev, [instrumentId]: audioBuffer }))
      setSampleFileNames((prev) => ({ ...prev, [instrumentId]: file.name }))
      const peaks = computeWaveformPeaks(audioBuffer, 0, audioBuffer.duration, WAVEFORM_BINS)
      setWaveformCache((prev) => ({ ...prev, [instrumentId]: [peaks] }))
    } catch (error) {
      console.error('Error loading sample:', error)
      alert('Ошибка загрузки файла.')
    }
  }, [audioContext])

  const removeSample = (instrumentId: number) => {
    setLoadedSamples((prev) => { const n = { ...prev }; delete n[instrumentId]; return n })
    setSampleFileNames((prev) => { const n = { ...prev }; delete n[instrumentId]; return n })
    setSlicedInstruments((prev) => { const n = { ...prev }; delete n[instrumentId]; return n })
    setWaveformCache((prev) => { const n = { ...prev }; delete n[instrumentId]; return n })
  }

  const buildEffectChain = useCallback((
    context: AudioContextLike,
    source: AudioBufferSourceNode,
    destination: AudioNode,
    volume: number,
    startTime: number,
    sliceDur: number,
    effect?: Partial<CellEffect>,
  ) => {
    const fx = { ...DEFAULT_CELL_EFFECT, ...effect }
    let currentNode: AudioNode = source

    if (fx.invertPhase) {
      const inv = context.createGain()
      inv.gain.setValueAtTime(-1, startTime)
      currentNode.connect(inv)
      currentNode = inv
    }

    if (fx.filterType !== 'none') {
      const filter = context.createBiquadFilter()
      filter.type = fx.filterType as BiquadFilterType
      filter.frequency.setValueAtTime(fx.filterFreq, startTime)
      filter.Q.setValueAtTime(fx.filterQ, startTime)
      currentNode.connect(filter)
      currentNode = filter
    }

    if (fx.compressorEnabled) {
      const comp = context.createDynamicsCompressor()
      comp.threshold.setValueAtTime(fx.compressorThreshold, startTime)
      comp.ratio.setValueAtTime(fx.compressorRatio, startTime)
      comp.attack.setValueAtTime(0.003, startTime)
      comp.release.setValueAtTime(0.25, startTime)
      currentNode.connect(comp)
      currentNode = comp
    }

    const gainNode = context.createGain()
    const effectiveGain = volume * fx.gain
    if (fx.fadeIn > 0 || fx.fadeOut > 0) {
      const fadeInEnd = fx.fadeIn * sliceDur
      const fadeOutStart = sliceDur - fx.fadeOut * sliceDur
      gainNode.gain.setValueAtTime(fx.fadeIn > 0 ? 0.0001 : effectiveGain, startTime)
      if (fx.fadeIn > 0) gainNode.gain.linearRampToValueAtTime(effectiveGain, startTime + fadeInEnd)
      if (fx.fadeOut > 0) {
        gainNode.gain.setValueAtTime(effectiveGain, startTime + Math.max(fadeOutStart, fadeInEnd))
        gainNode.gain.linearRampToValueAtTime(0.0001, startTime + sliceDur)
      }
    } else {
      gainNode.gain.setValueAtTime(effectiveGain, startTime)
    }

    currentNode.connect(gainNode)
    gainNode.connect(destination)
  }, [])

  const scheduleInstrumentPlayback = useCallback((
    context: AudioContextLike, destination: AudioNode, instrumentId: number,
    startTime: number, stepIndex?: number, trackSources?: Set<AudioBufferSourceNode>,
    effect?: Partial<CellEffect>,
  ) => {
    const params = instrumentParams[instrumentId]
    if (!params) return

    const masterGain = context.createGain()
    masterGain.gain.setValueAtTime(params.volume, startTime)
    masterGain.connect(destination)

    const trackSource = (source: AudioBufferSourceNode) => {
      if (trackSources) { trackSources.add(source); source.onended = () => trackSources.delete(source) }
    }

    if (loadedSamples[instrumentId]) {
      const sampleBuffer = loadedSamples[instrumentId]
      const source = context.createBufferSource()
      source.buffer = sampleBuffer
      source.connect(masterGain)
      const trimFx = { ...DEFAULT_CELL_EFFECT, ...effect }
      const sliceDuration = slicedInstruments[instrumentId]
      if (sliceDuration && stepIndex !== undefined) {
        const baseOffset = stepIndex * sliceDuration
        const baseDur = Math.min(sliceDuration, sampleBuffer.duration - baseOffset)
        const offset = baseOffset + baseDur * trimFx.trimStart
        const playDur = baseDur * (trimFx.trimEnd - trimFx.trimStart)
        if (offset < sampleBuffer.duration && playDur > 0) source.start(startTime, offset, playDur)
      } else {
        const dur = sampleBuffer.duration
        const offset = dur * trimFx.trimStart
        const playDur = dur * (trimFx.trimEnd - trimFx.trimStart)
        source.start(startTime, offset, playDur)
      }
      trackSource(source)
      return
    }

    if (params.useNoise) {
      const noiseBuffer = createNoiseBuffer(context, params.duration)
      const noiseSource = context.createBufferSource()
      const filter = context.createBiquadFilter()
      const gainNode = context.createGain()
      noiseSource.buffer = noiseBuffer; noiseSource.loop = false
      filter.type = params.filterType; filter.frequency.value = params.filterFreq; filter.Q.value = params.filterQ
      gainNode.gain.setValueAtTime(0.0001, startTime)
      gainNode.gain.linearRampToValueAtTime(Math.max(params.sustain, 0.0001), startTime + params.attack)
      gainNode.gain.exponentialRampToValueAtTime(Math.max(params.sustain * 0.5, 0.0001), startTime + params.attack + params.decay)
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + params.attack + params.decay + params.release)
      noiseSource.connect(filter); filter.connect(gainNode); gainNode.connect(masterGain)
      noiseSource.start(startTime); noiseSource.stop(startTime + params.duration)
      trackSource(noiseSource)
      return
    }

    const oscillator = context.createOscillator()
    const gainNode = context.createGain()
    const filter = context.createBiquadFilter()
    oscillator.type = params.waveType
    oscillator.frequency.setValueAtTime(params.frequency, startTime)
    if (params.frequencyEnd) oscillator.frequency.exponentialRampToValueAtTime(params.frequencyEnd, startTime + params.decay)
    filter.type = params.filterType; filter.frequency.value = params.filterFreq; filter.Q.value = params.filterQ
    gainNode.gain.setValueAtTime(0.0001, startTime)
    gainNode.gain.linearRampToValueAtTime(Math.max(params.sustain, 0.0001), startTime + params.attack)
    gainNode.gain.exponentialRampToValueAtTime(Math.max(params.sustain * 0.5, 0.0001), startTime + params.attack + params.decay)
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + params.attack + params.decay + params.release)
    oscillator.connect(filter); filter.connect(gainNode); gainNode.connect(masterGain)
    oscillator.start(startTime); oscillator.stop(startTime + params.duration)
  }, [createNoiseBuffer, instrumentParams, loadedSamples, slicedInstruments])

  const scheduleImportedTrackPlayback = useCallback((
    context: AudioContextLike, destination: AudioNode, track: ImportedTrack,
    stepIndex: number, startTime: number, effect?: Partial<CellEffect>,
    trackSources?: Set<AudioBufferSourceNode>,
  ) => {
    const baseOffset = track.sliceOffsets[stepIndex] ?? stepIndex * track.sliceDuration
    const baseDur = track.sliceDurations[stepIndex] ?? Math.min(track.sliceDuration, track.audioBuffer.duration - baseOffset)
    if (baseOffset >= track.audioBuffer.duration || baseDur <= 0) return

    const fx = { ...DEFAULT_CELL_EFFECT, ...effect }
    const trimmedOffset = baseOffset + baseDur * fx.trimStart
    const trimmedDur = baseDur * (fx.trimEnd - fx.trimStart)
    const playDur = Math.max(trimmedDur, 0.001)
    const offset = trimmedOffset

    const source = context.createBufferSource()
    source.buffer = track.audioBuffer
    const safeFadeRatio = Math.min(AUTO_SLICE_FADE_SEC / Math.max(playDur, 0.001), 0.2)
    const mergedEffect: Partial<CellEffect> = {
      fadeIn: safeFadeRatio,
      fadeOut: safeFadeRatio,
      ...effect,
    }
    buildEffectChain(context, source, destination, track.volume, startTime, playDur, mergedEffect)
    source.start(startTime, offset, playDur)
    if (trackSources) { trackSources.add(source); source.onended = () => trackSources.delete(source) }
  }, [buildEffectChain])


  const playTestSound = useCallback((instrumentId: number) => {
    if (!audioContext) return
    if (!instrumentParams[instrumentId]) return
    scheduleInstrumentPlayback(audioContext, audioContext.destination, instrumentId, audioContext.currentTime)
  }, [audioContext, instrumentParams, scheduleInstrumentPlayback])

  const stopAllSources = useCallback(() => {
    activeSourcesRef.current.forEach((src) => { try { src.stop() } catch (_) { /* */ } })
    activeSourcesRef.current.clear()
  }, [])

  const isInstrumentAudible = useCallback((instrumentId: number) => {
    if (soloTarget) return soloTarget === `instrument-${instrumentId}`
    return !mutedInstrumentIds.has(instrumentId)
  }, [mutedInstrumentIds, soloTarget])

  const isTrackAudible = useCallback((trackId: string) => {
    if (soloTarget) return soloTarget === `track-${trackId}`
    return !mutedTrackIds.has(trackId)
  }, [mutedTrackIds, soloTarget])

  const playStep = useCallback((step: number, preciseTime?: number) => {
    if (!audioContext) return
    const t = preciseTime !== undefined && preciseTime > audioContext.currentTime - 0.05
      ? preciseTime
      : audioContext.currentTime
    instruments.forEach((instrument) => {
      const cellKey = `${instrument.id}-${step}`
      if (steps[cellKey] && isInstrumentAudible(instrument.id)) {
        scheduleInstrumentPlayback(audioContext, audioContext.destination, instrument.id, t, step, activeSourcesRef.current, cellEffects[cellKey])
      }
    })
    importedTracks.forEach((track) => {
      const cellKey = `imported-${track.id}-${step}`
      if (steps[cellKey] && isTrackAudible(track.id)) {
        scheduleImportedTrackPlayback(audioContext, audioContext.destination, track, step, t, cellEffects[cellKey], activeSourcesRef.current)
      }
    })
  }, [audioContext, cellEffects, importedTracks, isInstrumentAudible, isTrackAudible, scheduleImportedTrackPlayback, scheduleInstrumentPlayback, steps])

  const clearAll = () => {
    setSteps({}); setCurrentStep(0); stopAllSources()
    setTotalSteps(DEFAULT_STEPS); setSlicedInstruments({}); setWaveformCache({})
    setLoadedSamples({}); setSampleFileNames({}); setImportedTracks([])
    setCellEffects({}); setSelectedCells(new Set())
    setMutedInstrumentIds(new Set()); setMutedTrackIds(new Set()); setSoloTarget(null)
    if (intervalRef.current) { clearInterval(intervalRef.current); setIsPlaying(false) }
  }

  const deleteImportedTrack = useCallback((trackId: string) => {
    setImportedTracks((prev) => prev.filter((t) => t.id !== trackId))
    setSteps((prev) => {
      const n = { ...prev }
      Object.keys(n).forEach((k) => { if (k.startsWith(`imported-${trackId}-`)) delete n[k] })
      return n
    })
    setCellEffects((prev) => {
      const n = { ...prev }
      Object.keys(n).forEach((k) => { if (k.startsWith(`imported-${trackId}-`)) delete n[k] })
      return n
    })
    setSelectedCells((prev) => {
      const n = new Set(prev)
      prev.forEach((k) => { if (k.startsWith(`imported-${trackId}-`)) n.delete(k) })
      return n
    })
    setMutedTrackIds((prev) => {
      const n = new Set(prev)
      n.delete(trackId)
      return n
    })
    setSoloTarget((prev) => prev === `track-${trackId}` ? null : prev)
  }, [])

  const startTransport = useCallback((target: string | null = null) => {
    if (!audioContext) return
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
    stopAllSources()
    setSoloTarget(target)
    setIsPlaying(true)
    const rangeStart = (loopStart !== null && loopEnd !== null) ? Math.min(loopStart, loopEnd) : 0
    const rangeEnd = (loopStart !== null && loopEnd !== null) ? Math.max(loopStart, loopEnd) : totalSteps - 1
    const rangeLen = rangeEnd - rangeStart + 1
    setCurrentStep(rangeStart)
    const stepDurSec = 60 / bpm / 4
    playStartTimeRef.current = audioContext.currentTime
    absStepRef.current = 0
    playStep(rangeStart, playStartTimeRef.current)
    intervalRef.current = setInterval(() => {
      absStepRef.current++
      const nextStep = rangeStart + (absStepRef.current % rangeLen)
      const preciseTime = playStartTimeRef.current + absStepRef.current * stepDurSec
      setCurrentStep(nextStep)
      playStep(nextStep, preciseTime)
    }, stepDurSec * 1000)
  }, [audioContext, bpm, loopStart, loopEnd, playStep, stopAllSources, totalSteps])

  const handlePlay = () => {
    if (isPlaying && !soloTarget) {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
      stopAllSources(); setIsPlaying(false); setCurrentStep(0)
    } else {
      startTransport(null)
    }
  }

  useEffect(() => {
    if (isPlaying && intervalRef.current && audioContext) {
      startTransport(soloTarget)
    }
  }, [audioContext, bpm, isPlaying, soloTarget, startTransport])

  useEffect(() => { return () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
  } }, [])

  const stopPlayback = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
    stopAllSources(); setIsPlaying(false); setCurrentStep(0); setSoloTarget(null)
  }, [stopAllSources])

  const renderBeatToAudioBuffer = useCallback(async () => {
    const stepDuration = 60 / bpm / 4
    let maxTail = instruments.reduce((mx, inst) => {
      const sd = slicedInstruments[inst.id]; if (sd) return Math.max(mx, sd)
      return Math.max(mx, loadedSamples[inst.id]?.duration ?? 0, instrumentParams[inst.id]?.duration ?? 0)
    }, 0.25)
    importedTracks.forEach((t) => { maxTail = Math.max(maxTail, t.sliceDuration) })
    const totalDuration = stepDuration * totalSteps + maxTail + 0.25
    const sampleRate = 44100
    const offlineContext = new OfflineAudioContext(2, Math.ceil(totalDuration * sampleRate), sampleRate)

    for (let stepIndex = 0; stepIndex < totalSteps; stepIndex++) {
      const startTime = stepIndex * stepDuration
      instruments.forEach((instrument) => {
        const cellKey = `${instrument.id}-${stepIndex}`
        if (steps[cellKey]) {
          scheduleInstrumentPlayback(offlineContext, offlineContext.destination, instrument.id, startTime, stepIndex, undefined, cellEffects[cellKey])
        }
      })
      importedTracks.forEach((track) => {
        const cellKey = `imported-${track.id}-${stepIndex}`
        if (steps[cellKey]) {
          scheduleImportedTrackPlayback(offlineContext, offlineContext.destination, track, stepIndex, startTime, cellEffects[cellKey])
        }
      })
    }
    return offlineContext.startRendering()
  }, [bpm, cellEffects, importedTracks, instrumentParams, loadedSamples, scheduleImportedTrackPlayback, scheduleInstrumentPlayback, slicedInstruments, steps, totalSteps])

  const handleExportWav = useCallback(async () => {
    if (!Object.values(steps).some(Boolean)) { alert('Сначала создайте бит.'); return }
    setIsExporting(true)
    try {
      const buf = await renderBeatToAudioBuffer()
      downloadBlob(audioBufferToWav(buf), `beat-${pattern}-${Date.now()}.wav`); setShowSaveDropdown(false)
    } catch (e) { alert(`Ошибка экспорта WAV: ${e instanceof Error ? e.message : String(e)}`) }
    finally { setIsExporting(false) }
  }, [pattern, renderBeatToAudioBuffer, steps])

  const handleExportMp3 = useCallback(async () => {
    if (!Object.values(steps).some(Boolean)) { alert('Сначала создайте бит.'); return }
    setIsExporting(true)
    try {
      const Enc = await loadLameEncoder()
      const buf = await renderBeatToAudioBuffer()
      downloadBlob(audioBufferToMp3(buf, Enc), `beat-${pattern}-${Date.now()}.mp3`); setShowSaveDropdown(false)
    } catch (e) { alert(`Ошибка экспорта MP3: ${e instanceof Error ? e.message : String(e)}`) }
    finally { setIsExporting(false) }
  }, [pattern, renderBeatToAudioBuffer, steps])

  const addAudioBufferAsTrack = useCallback((audioBuffer: AudioBuffer, name: string) => {
    const detectedBpm = estimateBpmFromAudioBuffer(audioBuffer, bpm) ?? bpm
    const normalizedBpm = Math.max(BPM_DETECT_MIN, Math.min(BPM_DETECT_MAX, detectedBpm))
    const stepDuration = 60 / normalizedBpm / 4
    const boundaries = buildCleanSliceBoundaries(audioBuffer, stepDuration)
    const rawOffsets = boundaries.slice(0, -1)
    const rawDurations = boundaries.slice(1).map((end, i) => (end - rawOffsets[i]) / audioBuffer.sampleRate)
    const rawSteps = rawOffsets.length
    const limitedSteps = Math.max(1, Math.min(rawSteps, MAX_STEPS))
    const sliceOffsets = rawOffsets.slice(0, limitedSteps).map((sample) => sample / audioBuffer.sampleRate)
    const sliceDurations = rawDurations.slice(0, limitedSteps)
    const neededSteps = Math.max(DEFAULT_STEPS, limitedSteps)
    const sliceDuration = stepDuration

    setBpm(normalizedBpm)
    setTotalSteps((prev) => Math.max(prev, neededSteps))

    const trackId = `t${Date.now()}`
    const color = TRACK_COLORS[importedTracks.length % TRACK_COLORS.length]
    const waveforms: number[][] = []
    for (let i = 0; i < limitedSteps; i++) {
      waveforms.push(computeWaveformPeaks(audioBuffer, sliceOffsets[i], sliceDurations[i], WAVEFORM_BINS))
    }

    const newTrack: ImportedTrack = {
      id: trackId,
      name,
      audioBuffer,
      sliceDuration,
      sliceOffsets,
      sliceDurations,
      detectedBpm: normalizedBpm,
      color,
      volume: 0.65,
      waveforms,
    }
    setImportedTracks((prev) => [...prev, newTrack])
    setSteps((prev) => {
      const n = { ...prev }
      for (let i = 0; i < limitedSteps; i++) n[`imported-${trackId}-${i}`] = true
      return n
    })
  }, [bpm, importedTracks.length, totalSteps])

  const handleImportAudioTrack = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !audioContext) return
    setIsImportingAudio(true)
    try {
      stopPlayback()
      const audioBuffer = await audioContext.decodeAudioData((await file.arrayBuffer()).slice(0))
      addAudioBufferAsTrack(audioBuffer, file.name)
    } catch { alert('Не удалось загрузить аудио файл.') }
    finally { event.target.value = ''; setIsImportingAudio(false) }
  }, [addAudioBufferAsTrack, audioContext, stopPlayback])

  const toggleTrackMute = useCallback((trackId: string) => {
    setMutedTrackIds((prev) => {
      const n = new Set(prev)
      if (n.has(trackId)) n.delete(trackId)
      else n.add(trackId)
      return n
    })
    setSoloTarget((prev) => prev === `track-${trackId}` ? null : prev)
  }, [])

  const playTrackLane = useCallback((trackId: string) => {
    const target = `track-${trackId}`
    if (isPlaying && soloTarget === target) {
      stopPlayback()
      return
    }
    startTransport(target)
  }, [isPlaying, soloTarget, startTransport, stopPlayback])

  const toggleInstrumentMute = useCallback((instrumentId: number) => {
    setMutedInstrumentIds((prev) => {
      const n = new Set(prev)
      if (n.has(instrumentId)) n.delete(instrumentId)
      else n.add(instrumentId)
      return n
    })
    setSoloTarget((prev) => prev === `instrument-${instrumentId}` ? null : prev)
  }, [])

  const playInstrumentLane = useCallback((instrumentId: number) => {
    const target = `instrument-${instrumentId}`
    if (isPlaying && soloTarget === target) {
      stopPlayback()
      return
    }
    startTransport(target)
  }, [isPlaying, soloTarget, startTransport, stopPlayback])

  const updateSelectedCellEffects = useCallback((update: Partial<CellEffect>) => {
    setCellEffects((prev) => {
      const n = { ...prev }
      selectedCells.forEach((key) => { n[key] = { ...DEFAULT_CELL_EFFECT, ...n[key], ...update } })
      return n
    })
  }, [selectedCells])

  const resetSelectedCellEffects = useCallback(() => {
    setCellEffects((prev) => {
      const n = { ...prev }
      selectedCells.forEach((key) => { delete n[key] })
      return n
    })
  }, [selectedCells])

  const getEffectValue = useCallback(<K extends keyof CellEffect>(key: K): CellEffect[K] => {
    const first = [...selectedCells][0]
    if (!first) return DEFAULT_CELL_EFFECT[key]
    return (cellEffects[first]?.[key] ?? DEFAULT_CELL_EFFECT[key]) as CellEffect[K]
  }, [cellEffects, selectedCells])


  const gridCellHandlers = useCallback((cellKey: string) => ({
    onMouseDown: (e: React.MouseEvent) => {
      if (e.button === 0) {
        e.preventDefault()
        startSelectionDrag(cellKey, e.shiftKey)
      }
      if (e.button === 2) {
        e.preventDefault()
        startToggleDrag(cellKey)
      }
    },
    onMouseEnter: () => {
      addToSelectionDrag(cellKey)
      addToToggleDrag(cellKey)
    },
  }), [addToSelectionDrag, addToToggleDrag, startSelectionDrag, startToggleDrag])

  return (
    <div className="bg-gray-900 text-white min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
            <div className="flex items-center space-x-4">
              <button onClick={handlePlay} className="w-12 h-12 rounded-lg bg-primary-600 hover:bg-primary-700 flex items-center justify-center transition-colors">
                {isPlaying ? <Pause className="h-6 w-6 text-white" /> : <Play className="h-6 w-6 text-white ml-1" />}
              </button>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-gray-700 rounded-lg px-3 py-1.5">
                  <span className="text-xs text-gray-400 uppercase tracking-wide">BPM</span>
                  <input
                    type="range"
                    min="60"
                    max="200"
                    value={bpm}
                    onChange={(e) => setBpm(Number(e.target.value))}
                    className="w-20 h-1.5 accent-primary-500"
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    value={bpm}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10)
                      if (!isNaN(v) && v >= 30 && v <= 300) setBpm(v)
                    }}
                    className="w-10 bg-gray-800 border border-gray-600 rounded px-1 py-0.5 text-center text-sm text-white focus:outline-none focus:border-primary-500"
                  />
                </div>
                <div className="flex items-center gap-1.5 bg-gray-700 rounded-lg px-3 py-1.5">
                  <span className="text-xs text-gray-400 uppercase tracking-wide">Шаги</span>
                  <input
                    type="range"
                    min="8"
                    max={MAX_STEPS}
                    step="4"
                    value={totalSteps}
                    onChange={(e) => setTotalSteps(Number(e.target.value))}
                    className="w-20 h-1.5 accent-primary-500"
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    value={totalSteps}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10)
                      if (!isNaN(v) && v >= 4 && v <= MAX_STEPS) setTotalSteps(v)
                    }}
                    className="w-10 bg-gray-800 border border-gray-600 rounded px-1 py-0.5 text-center text-sm text-white focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3 flex-wrap gap-2">
              <button onClick={handleUndo} disabled={!canUndo} className="flex items-center space-x-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-40" title="Отменить (Ctrl+Z)">
                <Undo2 className="h-4 w-4" />
              </button>
              <button onClick={handleRedo} disabled={!canRedo} className="flex items-center space-x-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-40" title="Повторить (Ctrl+Y)">
                <Redo2 className="h-4 w-4" />
              </button>
              <button onClick={clearAll} className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-red-600 rounded-lg transition-colors"><X className="h-4 w-4" /><span>Очистить</span></button>
              <div className="relative save-dropdown">
                <button onClick={() => setShowSaveDropdown(!showSaveDropdown)} disabled={isExporting} className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-primary-600 rounded-lg transition-colors disabled:opacity-50">
                  <Save className="h-4 w-4" /><span>{isExporting ? 'Экспорт...' : 'Экспорт'}</span><ChevronDown className="h-4 w-4" />
                </button>
                {showSaveDropdown && (
                  <div className="absolute top-full right-0 mt-2 bg-gray-700 rounded-lg shadow-lg z-10 min-w-[220px]">
                    <button onClick={handleExportMp3} className="w-full text-left px-4 py-3 hover:bg-gray-600 rounded-t-lg flex items-center space-x-2"><Download className="h-4 w-4" /><span>Экспорт MP3</span></button>
                    <button onClick={handleExportWav} className="w-full text-left px-4 py-3 hover:bg-gray-600 rounded-b-lg flex items-center space-x-2"><Download className="h-4 w-4" /><span>Экспорт WAV</span></button>
                  </div>
                )}
              </div>
              <input ref={audioImportRef} type="file" accept={AUDIO_ACCEPT} onChange={handleImportAudioTrack} className="hidden" />
              <button onClick={() => audioImportRef.current?.click()} disabled={isImportingAudio} className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-green-600 rounded-lg transition-colors disabled:opacity-50">
                <Music className="h-4 w-4" /><span>{isImportingAudio ? 'Загрузка...' : 'Импорт аудио'}</span>
              </button>
            </div>
          </div>

          {/* Grid */}
          <div className="overflow-x-auto">
            <div className="flex">
              {/* Left labels column */}
              <div className="flex-shrink-0 w-40">
                <div className="h-12" />
                {/* Imported track labels */}
                {importedTracks.map((track) => (
                  <div key={track.id} className="h-16 flex items-center border-r border-cyan-800 bg-gray-800/50 px-1 group relative">
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-bold truncate" style={{ color: track.color }} title={track.name}>
                        {track.name.length > 12 ? track.name.slice(0, 10) + '…' : track.name}
                      </div>
                      <div className="text-[9px] uppercase tracking-wide text-gray-500">Аудио</div>
                      <div className="flex items-center space-x-1 mt-1">
                        <button
                          onClick={() => playTrackLane(track.id)}
                          className={`flex items-center justify-center w-5 h-5 rounded transition-colors border ${isPlaying && soloTarget === `track-${track.id}` ? 'bg-cyan-600 border-cyan-400' : 'bg-gray-700 border-gray-600 hover:bg-cyan-700'}`}
                          title={isPlaying && soloTarget === `track-${track.id}` ? 'Остановить воспроизведение линии' : 'Проиграть только эту линию'}
                        >
                          {isPlaying && soloTarget === `track-${track.id}`
                            ? <Square className="h-3.5 w-3.5 text-white fill-white" />
                            : <Play className="h-3.5 w-3.5 text-cyan-200 ml-0.5" />}
                        </button>
                        <button
                          onClick={() => toggleTrackMute(track.id)}
                          className={`flex items-center justify-center w-5 h-5 rounded transition-colors border ${mutedTrackIds.has(track.id) ? 'bg-red-600 border-red-400' : 'bg-gray-700 border-gray-600 hover:bg-red-700'}`}
                          title={mutedTrackIds.has(track.id) ? 'Вернуть дорожку в микс' : 'Исключить дорожку из микса'}
                        >
                          <Pause className="h-3 w-3 text-white" />
                        </button>
                        <Volume2 className="h-3 w-3 text-gray-400" />
                        <input type="range" min="0" max="1" step="0.05" value={track.volume} className="w-12 h-1"
                          onChange={(e) => {
                            const vol = parseFloat(e.target.value)
                            setImportedTracks((prev) => prev.map((t) => t.id === track.id ? { ...t, volume: vol } : t))
                          }}
                        />
                      </div>
                    </div>
                    <button onClick={() => deleteImportedTrack(track.id)} className="ml-1 p-1 hover:bg-red-600 rounded transition-colors" title="Удалить дорожку">
                      <Trash2 className="h-3 w-3 text-gray-400 hover:text-white" />
                    </button>
                  </div>
                ))}
                {importedTracks.length > 0 && <div className="h-px bg-cyan-800" />}
                {/* Instrument labels */}
                {instruments.map((instrument) => (
                  <div key={instrument.id} className="h-16 flex items-center gap-2 px-2 border-r border-gray-700 group relative" title={instrument.name}>
                    <div className="shrink-0 w-7 h-7 flex items-center justify-center text-white">
                      {instrument.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-medium text-gray-200 truncate leading-tight">
                        {sampleFileNames[instrument.id]
                          ? <span className="text-green-400" title={sampleFileNames[instrument.id]}>{sampleFileNames[instrument.id].length > 10 ? sampleFileNames[instrument.id].slice(0, 8) + '…' : sampleFileNames[instrument.id]}</span>
                          : instrument.shortName}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <button
                          onClick={() => playInstrumentLane(instrument.id)}
                          className={`flex items-center justify-center w-5 h-5 rounded transition-colors border ${isPlaying && soloTarget === `instrument-${instrument.id}` ? 'bg-cyan-600 border-cyan-400' : 'bg-gray-700 border-gray-600 hover:bg-cyan-700'}`}
                          title={isPlaying && soloTarget === `instrument-${instrument.id}` ? 'Остановить воспроизведение линии' : 'Проиграть только эту линию'}
                        >
                          {isPlaying && soloTarget === `instrument-${instrument.id}`
                            ? <Square className="h-3 w-3 text-white fill-white" />
                            : <Play className="h-3 w-3 text-cyan-200 ml-0.5" />}
                        </button>
                        <button
                          onClick={() => toggleInstrumentMute(instrument.id)}
                          className={`flex items-center justify-center w-5 h-5 rounded transition-colors border ${mutedInstrumentIds.has(instrument.id) ? 'bg-red-600 border-red-400' : 'bg-gray-700 border-gray-600 hover:bg-red-700'}`}
                          title={mutedInstrumentIds.has(instrument.id) ? 'Вернуть дорожку в микс' : 'Исключить дорожку из микса'}
                        >
                          <Pause className="h-3 w-3 text-white" />
                        </button>
                      </div>
                    </div>
                    <div className="absolute left-full ml-2 hidden group-hover:block z-50 bg-gray-800 text-white text-xs rounded-lg p-2 shadow-lg whitespace-nowrap border border-gray-700">
                      <div className="font-semibold mb-1">{instrument.name}</div>
                      <div className="text-gray-300">{instrument.description}</div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Grid cells */}
              <div className="flex-1 min-w-0 overflow-x-auto">
                {/* Step numbers */}
                <div className="flex gap-1 mb-2" style={{ width: `${totalSteps * 50}px` }}>
                  {Array.from({ length: totalSteps }).map((_, si) => {
                    const isStart = loopStart === si
                    const isEnd = loopEnd === si
                    const inRange = loopStart !== null && loopEnd !== null && si >= Math.min(loopStart, loopEnd) && si <= Math.max(loopStart, loopEnd)
                    const isCurrent = currentStep === si && isPlaying
                    return (
                      <button
                        key={si}
                        onClick={() => {
                          if (isStart || isEnd) {
                            setLoopStart(null)
                            setLoopEnd(null)
                          } else if (loopStart === null) {
                            setLoopStart(si)
                          } else if (loopEnd === null) {
                            setLoopEnd(si)
                          } else {
                            setLoopStart(si)
                            setLoopEnd(null)
                          }
                        }}
                        className={`text-center text-xs py-1.5 flex-shrink-0 rounded transition-colors cursor-pointer select-none ${
                          isCurrent
                            ? 'font-bold text-primary-400 bg-primary-600/40 ring-1 ring-primary-400'
                            : isStart || isEnd
                              ? 'font-bold text-cyan-200 bg-cyan-600/70 ring-1 ring-cyan-400'
                              : inRange
                                ? 'font-semibold text-cyan-300 bg-cyan-800/40'
                                : si % 4 === 0
                                  ? 'font-bold text-white hover:bg-gray-700'
                                  : 'text-gray-400 hover:bg-gray-700'
                        }`}
                        style={{ width: '48px' }}
                        title={isStart || isEnd ? `Шаг ${si + 1} (граница, клик — сбросить)` : `Шаг ${si + 1} (клик — установить границу)`}
                      >
                        {si + 1}
                      </button>
                    )
                  })}
                </div>
                {loopStart !== null && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-cyan-400">
                      {loopEnd !== null
                        ? `Воспроизведение: шаги ${Math.min(loopStart, loopEnd) + 1} — ${Math.max(loopStart, loopEnd) + 1}`
                        : `Начало: шаг ${loopStart + 1} (выберите конец)`}
                    </span>
                    <button onClick={() => { setLoopStart(null); setLoopEnd(null) }} className="text-xs text-gray-400 hover:text-white px-2 py-0.5 bg-gray-700 rounded transition-colors">Сбросить</button>
                  </div>
                )}
                {/* Imported track rows */}
                {importedTracks.map((track) => (
                  <div key={track.id} className="flex gap-1 mb-1" style={{ width: `${totalSteps * 50}px` }}>
                    {Array.from({ length: totalSteps }).map((_, si) => {
                      const cellKey = `imported-${track.id}-${si}`
                      const isActive = steps[cellKey] || false
                      const isCurrent = currentStep === si && isPlaying
                      const isSelected = selectedCells.has(cellKey)
                      const wf = track.waveforms[si]
                      const hasFx = !!cellEffects[cellKey]
                      return (
                        <button key={si}
                          {...gridCellHandlers(cellKey)}
                          className={`grid-cell h-16 flex-shrink-0 rounded transition-all relative overflow-hidden select-none ${isActive ? '' : 'bg-gray-700/50 hover:bg-gray-600/50'} ${isCurrent ? 'ring-2 ring-primary-400 ring-offset-1 ring-offset-gray-800 shadow-lg shadow-primary-500/50' : ''} ${isSelected ? 'ring-2 ring-cyan-400 ring-offset-1 ring-offset-gray-800' : ''}`}
                          style={{ width: '48px', backgroundColor: isActive ? `${track.color}18` : undefined, opacity: isActive && isCurrent ? 1 : isActive ? 0.9 : 1 }}
                        >
                          {isActive && wf && <MiniWaveform peaks={wf} color={track.color} />}
                          {hasFx && isActive && <div className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-cyan-400" />}
                        </button>
                      )
                    })}
                  </div>
                ))}
                {importedTracks.length > 0 && <div className="h-px bg-cyan-800 mb-1" style={{ width: `${totalSteps * 50}px` }} />}
                {/* Instrument rows */}
                {instruments.map((instrument) => {
                  const wfData = waveformCache[instrument.id]
                  const isSliced = wfData && wfData.length > 1
                  return (
                    <div key={instrument.id} className="flex gap-1 mb-1" style={{ width: `${totalSteps * 50}px` }}>
                      {Array.from({ length: totalSteps }).map((_, si) => {
                        const key = `${instrument.id}-${si}`
                        const isActive = steps[key] || false
                        const isCurrent = currentStep === si && isPlaying
                        const isSelected = selectedCells.has(key)
                        const waveform = wfData ? (isSliced ? wfData[si] : wfData[0]) : undefined
                        const hasWaveform = isActive && waveform
                        return (
                          <button key={si} onClick={() => activateCellKey(key)}
                            {...gridCellHandlers(key)}
                            className={`grid-cell h-16 flex-shrink-0 rounded transition-all relative overflow-hidden select-none ${isActive ? '' : 'bg-gray-700 hover:bg-gray-600'} ${isCurrent ? 'ring-2 ring-primary-400 ring-offset-1 ring-offset-gray-800 shadow-lg shadow-primary-500/50' : ''} ${isSelected ? 'ring-2 ring-cyan-400 ring-offset-1 ring-offset-gray-800' : ''}`}
                            style={{ width: '48px', backgroundColor: isActive ? (hasWaveform ? `${instrument.color}18` : instrument.color) : undefined, opacity: isActive && isCurrent ? 1 : isActive ? 0.9 : 1 }}
                          >
                            {hasWaveform && <MiniWaveform peaks={waveform} color={instrument.color} />}
                          </button>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-700">
            <div className="flex items-center space-x-2">
              <button onClick={() => setPattern('A')} className={`px-6 py-2 rounded-lg transition-colors ${pattern === 'A' ? 'bg-primary-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>A</button>
              <button onClick={() => setPattern('B')} className={`px-6 py-2 rounded-lg transition-colors ${pattern === 'B' ? 'bg-primary-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>B</button>
              {importedTracks.length > 0 && (
                <button onClick={() => audioImportRef.current?.click()} className="flex items-center space-x-1 px-4 py-2 bg-gray-700 hover:bg-cyan-700 rounded-lg transition-colors ml-4">
                  <Plus className="h-4 w-4" /><span>Доб. дорожку</span>
                </button>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {selectedCells.size > 0 && (
                <div className="flex items-center gap-1.5 mr-2">
                  <span className="text-xs text-cyan-400">Выделено: {selectedCells.size}</span>
                  <button onClick={handleCopy} className="flex items-center gap-1 px-2 py-1 bg-gray-700 hover:bg-cyan-700 rounded text-xs transition-colors" title="Копировать (Ctrl+C)">
                    <Copy className="h-3 w-3" /><span>Копировать</span>
                  </button>
                  <button onClick={handleCut} className="flex items-center gap-1 px-2 py-1 bg-gray-700 hover:bg-orange-700 rounded text-xs transition-colors" title="Вырезать (Ctrl+X)">
                    <Scissors className="h-3 w-3" /><span>Вырезать</span>
                  </button>
                  <button onClick={handlePaste} disabled={clipboard.length === 0} className="flex items-center gap-1 px-2 py-1 bg-gray-700 hover:bg-green-700 rounded text-xs transition-colors disabled:opacity-40" title="Вставить (Ctrl+V)">
                    <ClipboardPaste className="h-3 w-3" /><span>Вставить</span>
                  </button>
                </div>
              )}
              <button onClick={() => setShowSettings(!showSettings)} className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                <Settings2 className="h-4 w-4" /><span>Настройки</span>
                {showSettings ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Effects Panel */}
        {selectedCells.size > 0 && (
          <div className="mt-4 bg-gray-800 rounded-lg border border-cyan-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-cyan-400">Редактирование семпла ({selectedCells.size} {selectedCells.size === 1 ? 'ячейка' : 'ячеек'})</h3>
              <div className="flex space-x-2">
                <button onClick={resetSelectedCellEffects} className="flex items-center space-x-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm">
                  <RotateCcw className="h-3 w-3" /><span>Сбросить</span>
                </button>
                <button onClick={() => setSelectedCells(new Set())} className="flex items-center space-x-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm">
                  <X className="h-3 w-3" /><span>Снять выделение</span>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* 1. Amplitude / Gain */}
              <div className="bg-gray-750 rounded-lg p-4 border border-gray-700">
                <label className="block text-sm font-semibold text-white mb-2">Амплитуда</label>
                <div className="text-xs text-gray-400 mb-2">Громкость выбранных ячеек</div>
                <div className="flex items-center space-x-3">
                  <input type="range" min="0" max="2" step="0.01" value={getEffectValue('gain')} onChange={(e) => updateSelectedCellEffects({ gain: parseFloat(e.target.value) })} className="flex-1" />
                  <span className="text-sm font-mono text-cyan-300 w-12 text-right">{Math.round(Number(getEffectValue('gain')) * 100)}%</span>
                </div>
              </div>

              {/* 2. Filter type + frequency */}
              <div className="bg-gray-750 rounded-lg p-4 border border-gray-700">
                <label className="block text-sm font-semibold text-white mb-2">Фильтрация</label>
                <div className="text-xs text-gray-400 mb-2">Low-pass / High-pass / Band-pass</div>
                <select value={getEffectValue('filterType')} onChange={(e) => updateSelectedCellEffects({ filterType: e.target.value as CellEffect['filterType'] })} className="w-full bg-gray-700 text-white rounded-lg px-3 py-1.5 text-sm mb-2">
                  <option value="none">Выключен</option>
                  <option value="lowpass">Low-pass</option>
                  <option value="highpass">High-pass</option>
                  <option value="bandpass">Band-pass</option>
                </select>
                {getEffectValue('filterType') !== 'none' && (
                  <div className="flex items-center space-x-3">
                    <input type="range" min="20" max="20000" value={getEffectValue('filterFreq')} onChange={(e) => updateSelectedCellEffects({ filterFreq: parseFloat(e.target.value) })} className="flex-1" />
                    <span className="text-sm font-mono text-cyan-300 w-16 text-right">{getEffectValue('filterFreq')} Hz</span>
                  </div>
                )}
              </div>

              {/* 3. Compressor */}
              <div className="bg-gray-750 rounded-lg p-4 border border-gray-700">
                <label className="block text-sm font-semibold text-white mb-2">Компрессия</label>
                <div className="text-xs text-gray-400 mb-2">Сжатие динамического диапазона</div>
                <label className="flex items-center space-x-2 cursor-pointer mb-2">
                  <input type="checkbox" checked={!!getEffectValue('compressorEnabled')} onChange={(e) => updateSelectedCellEffects({ compressorEnabled: e.target.checked })} className="rounded accent-cyan-500" />
                  <span className="text-sm text-gray-300">{getEffectValue('compressorEnabled') ? 'Включено' : 'Выключено'}</span>
                </label>
                {getEffectValue('compressorEnabled') && (
                  <div className="flex items-center space-x-3">
                    <span className="text-xs text-gray-400 w-10">Порог</span>
                    <input type="range" min="-60" max="0" value={getEffectValue('compressorThreshold')} onChange={(e) => updateSelectedCellEffects({ compressorThreshold: parseFloat(e.target.value) })} className="flex-1" />
                    <span className="text-sm font-mono text-cyan-300 w-14 text-right">{getEffectValue('compressorThreshold')} dB</span>
                  </div>
                )}
              </div>

              {/* 4. Fade In */}
              <div className="bg-gray-750 rounded-lg p-4 border border-gray-700">
                <label className="block text-sm font-semibold text-white mb-2">Fade In</label>
                <div className="text-xs text-gray-400 mb-2">Плавное нарастание громкости</div>
                <div className="flex items-center space-x-3">
                  <input type="range" min="0" max="1" step="0.01" value={getEffectValue('fadeIn')} onChange={(e) => updateSelectedCellEffects({ fadeIn: parseFloat(e.target.value) })} className="flex-1" />
                  <span className="text-sm font-mono text-cyan-300 w-12 text-right">{Math.round(Number(getEffectValue('fadeIn')) * 100)}%</span>
                </div>
              </div>

              {/* 5. Fade Out */}
              <div className="bg-gray-750 rounded-lg p-4 border border-gray-700">
                <label className="block text-sm font-semibold text-white mb-2">Fade Out</label>
                <div className="text-xs text-gray-400 mb-2">Плавное затухание громкости</div>
                <div className="flex items-center space-x-3">
                  <input type="range" min="0" max="1" step="0.01" value={getEffectValue('fadeOut')} onChange={(e) => updateSelectedCellEffects({ fadeOut: parseFloat(e.target.value) })} className="flex-1" />
                  <span className="text-sm font-mono text-cyan-300 w-12 text-right">{Math.round(Number(getEffectValue('fadeOut')) * 100)}%</span>
                </div>
              </div>

              {/* 6. Phase inversion */}
              <div className="bg-gray-750 rounded-lg p-4 border border-gray-700">
                <label className="block text-sm font-semibold text-white mb-2">Инверсия фазы</label>
                <div className="text-xs text-gray-400 mb-2">Поворот фазы на 180°</div>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" checked={!!getEffectValue('invertPhase')} onChange={(e) => updateSelectedCellEffects({ invertPhase: e.target.checked })} className="rounded accent-cyan-500" />
                  <span className="text-sm text-gray-300">{getEffectValue('invertPhase') ? 'Инвертировано' : 'Обычная'}</span>
                </label>
              </div>

              {/* 7. Normalize */}
              <div className="bg-gray-750 rounded-lg p-4 border border-gray-700">
                <label className="block text-sm font-semibold text-white mb-2">Нормализация</label>
                <div className="text-xs text-gray-400 mb-2">Выравнивание амплитуды до максимума</div>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" checked={!!getEffectValue('normalize')} onChange={(e) => updateSelectedCellEffects({ normalize: e.target.checked, gain: e.target.checked ? 1.0 : Number(getEffectValue('gain')) })} className="rounded accent-cyan-500" />
                  <span className="text-sm text-gray-300">{getEffectValue('normalize') ? 'Включено' : 'Выключено'}</span>
                </label>
              </div>

              {/* 8. Trim / Обрезка */}
              <div className="bg-gray-750 rounded-lg p-4 border border-gray-700">
                <label className="block text-sm font-semibold text-white mb-2">Обрезка</label>
                <div className="text-xs text-gray-400 mb-2">Начало и конец воспроизведения семпла</div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <span className="text-xs text-gray-400 w-12">Начало</span>
                    <input type="range" min="0" max="0.99" step="0.01" value={getEffectValue('trimStart')} onChange={(e) => updateSelectedCellEffects({ trimStart: parseFloat(e.target.value) })} className="flex-1" />
                    <span className="text-sm font-mono text-cyan-300 w-12 text-right">{Math.round(Number(getEffectValue('trimStart')) * 100)}%</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-xs text-gray-400 w-12">Конец</span>
                    <input type="range" min="0.01" max="1" step="0.01" value={getEffectValue('trimEnd')} onChange={(e) => updateSelectedCellEffects({ trimEnd: parseFloat(e.target.value) })} className="flex-1" />
                    <span className="text-sm font-mono text-cyan-300 w-12 text-right">{Math.round(Number(getEffectValue('trimEnd')) * 100)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instrument Settings Panel */}
        {showSettings && (
          <div className="mt-6 bg-gray-800 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Настройки семплов</h3>
              <button onClick={() => playTestSound(selectedInstrument)} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors flex items-center space-x-2">
                <Play className="h-4 w-4" /><span>Прослушать</span>
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Инструмент</label>
              <div className="grid grid-cols-4 gap-2">
                {instruments.map((inst) => (
                  <button key={inst.id} onClick={() => setSelectedInstrument(inst.id)} className={`px-4 py-2 rounded-lg transition-colors text-sm ${selectedInstrument === inst.id ? 'bg-primary-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
                    {inst.shortName}
                  </button>
                ))}
              </div>
            </div>
            {instrumentParams[selectedInstrument] && (
              <div className="space-y-4">
                <div className="bg-gray-700 rounded-lg p-4 mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Загрузить семпл для {instruments.find((i) => i.id === selectedInstrument)?.name}</label>
                  <div className="flex items-center space-x-4">
                    <input ref={(el) => { fileInputRef.current[selectedInstrument] = el }} type="file" accept={AUDIO_ACCEPT} onChange={(e) => { const f = e.target.files?.[0]; if (f) loadSampleFile(selectedInstrument, f) }} className="hidden" />
                    <button onClick={() => fileInputRef.current[selectedInstrument]?.click()} className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"><Upload className="h-4 w-4" /><span>Выбрать файл</span></button>
                    {loadedSamples[selectedInstrument] && (
                      <>
                        <span className="text-sm text-gray-300">{sampleFileNames[selectedInstrument] || 'Семпл'}</span>
                        <button onClick={() => removeSample(selectedInstrument)} className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"><Trash2 className="h-4 w-4" /><span>Удалить</span></button>
                      </>
                    )}
                  </div>
                </div>
                {!loadedSamples[selectedInstrument] && (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Частота: {instrumentParams[selectedInstrument].frequency.toFixed(0)} Hz</label>
                        <input type="range" min="20" max="2000" value={instrumentParams[selectedInstrument].frequency} onChange={(e) => setInstrumentParams({ ...instrumentParams, [selectedInstrument]: { ...instrumentParams[selectedInstrument], frequency: parseFloat(e.target.value) } })} className="w-full" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Громкость: {(instrumentParams[selectedInstrument].volume * 100).toFixed(0)}%</label>
                        <input type="range" min="0" max="1" step="0.01" value={instrumentParams[selectedInstrument].volume} onChange={(e) => setInstrumentParams({ ...instrumentParams, [selectedInstrument]: { ...instrumentParams[selectedInstrument], volume: parseFloat(e.target.value) } })} className="w-full" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Длительность: {instrumentParams[selectedInstrument].duration.toFixed(2)}s</label>
                        <input type="range" min="0.01" max="1" step="0.01" value={instrumentParams[selectedInstrument].duration} onChange={(e) => setInstrumentParams({ ...instrumentParams, [selectedInstrument]: { ...instrumentParams[selectedInstrument], duration: parseFloat(e.target.value) } })} className="w-full" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Тип волны</label>
                        <select value={instrumentParams[selectedInstrument].waveType} onChange={(e) => setInstrumentParams({ ...instrumentParams, [selectedInstrument]: { ...instrumentParams[selectedInstrument], waveType: e.target.value as OscillatorType } })} className="w-full bg-gray-700 text-white rounded-lg px-3 py-2">
                          <option value="sine">Sine</option><option value="square">Square</option><option value="sawtooth">Sawtooth</option><option value="triangle">Triangle</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div><label className="block text-sm font-medium text-gray-300 mb-2">Attack: {instrumentParams[selectedInstrument].attack.toFixed(3)}s</label><input type="range" min="0" max="0.1" step="0.001" value={instrumentParams[selectedInstrument].attack} onChange={(e) => setInstrumentParams({ ...instrumentParams, [selectedInstrument]: { ...instrumentParams[selectedInstrument], attack: parseFloat(e.target.value) } })} className="w-full" /></div>
                      <div><label className="block text-sm font-medium text-gray-300 mb-2">Decay: {instrumentParams[selectedInstrument].decay.toFixed(3)}s</label><input type="range" min="0" max="0.5" step="0.01" value={instrumentParams[selectedInstrument].decay} onChange={(e) => setInstrumentParams({ ...instrumentParams, [selectedInstrument]: { ...instrumentParams[selectedInstrument], decay: parseFloat(e.target.value) } })} className="w-full" /></div>
                      <div><label className="block text-sm font-medium text-gray-300 mb-2">Sustain: {instrumentParams[selectedInstrument].sustain.toFixed(2)}</label><input type="range" min="0" max="1" step="0.01" value={instrumentParams[selectedInstrument].sustain} onChange={(e) => setInstrumentParams({ ...instrumentParams, [selectedInstrument]: { ...instrumentParams[selectedInstrument], sustain: parseFloat(e.target.value) } })} className="w-full" /></div>
                      <div><label className="block text-sm font-medium text-gray-300 mb-2">Release: {instrumentParams[selectedInstrument].release.toFixed(3)}s</label><input type="range" min="0" max="0.3" step="0.01" value={instrumentParams[selectedInstrument].release} onChange={(e) => setInstrumentParams({ ...instrumentParams, [selectedInstrument]: { ...instrumentParams[selectedInstrument], release: parseFloat(e.target.value) } })} className="w-full" /></div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div><label className="block text-sm font-medium text-gray-300 mb-2">Тип фильтра</label><select value={instrumentParams[selectedInstrument].filterType} onChange={(e) => setInstrumentParams({ ...instrumentParams, [selectedInstrument]: { ...instrumentParams[selectedInstrument], filterType: e.target.value as BiquadFilterType } })} className="w-full bg-gray-700 text-white rounded-lg px-3 py-2"><option value="lowpass">Lowpass</option><option value="highpass">Highpass</option><option value="bandpass">Bandpass</option><option value="notch">Notch</option><option value="allpass">Allpass</option></select></div>
                      <div><label className="block text-sm font-medium text-gray-300 mb-2">Частота фильтра: {instrumentParams[selectedInstrument].filterFreq.toFixed(0)} Hz</label><input type="range" min="20" max="20000" value={instrumentParams[selectedInstrument].filterFreq} onChange={(e) => setInstrumentParams({ ...instrumentParams, [selectedInstrument]: { ...instrumentParams[selectedInstrument], filterFreq: parseFloat(e.target.value) } })} className="w-full" /></div>
                      <div><label className="block text-sm font-medium text-gray-300 mb-2">Q фильтра: {instrumentParams[selectedInstrument].filterQ.toFixed(2)}</label><input type="range" min="0.1" max="10" step="0.1" value={instrumentParams[selectedInstrument].filterQ} onChange={(e) => setInstrumentParams({ ...instrumentParams, [selectedInstrument]: { ...instrumentParams[selectedInstrument], filterQ: parseFloat(e.target.value) } })} className="w-full" /></div>
                      {!instrumentParams[selectedInstrument].useNoise && (
                        <div><label className="block text-sm font-medium text-gray-300 mb-2">Конечная частота: {instrumentParams[selectedInstrument].frequencyEnd?.toFixed(0) || 'N/A'} Hz</label><input type="range" min="20" max="2000" value={instrumentParams[selectedInstrument].frequencyEnd || instrumentParams[selectedInstrument].frequency} onChange={(e) => setInstrumentParams({ ...instrumentParams, [selectedInstrument]: { ...instrumentParams[selectedInstrument], frequencyEnd: parseFloat(e.target.value) } })} className="w-full" /></div>
                      )}
                    </div>
                    <div className="flex justify-end">
                      <button onClick={() => setInstrumentParams({ ...instrumentParams, [selectedInstrument]: { ...defaultParams[selectedInstrument] } })} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">Сбросить к умолчанию</button>
                    </div>
                  </>
                )}
                {loadedSamples[selectedInstrument] && (
                  <div className="bg-gray-700 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Громкость семпла: {(instrumentParams[selectedInstrument].volume * 100).toFixed(0)}%</label>
                    <input type="range" min="0" max="1" step="0.01" value={instrumentParams[selectedInstrument].volume} onChange={(e) => setInstrumentParams({ ...instrumentParams, [selectedInstrument]: { ...instrumentParams[selectedInstrument], volume: parseFloat(e.target.value) } })} className="w-full" />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default BeatSequencer
