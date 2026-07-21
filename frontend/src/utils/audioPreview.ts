/**
 * Generates a trimmed audio preview from a data URL or File.
 * Rules: if duration > 60s → trim to 60s, if > 30s → 30s, if > 15s → 15s, else keep as is.
 */
export async function generateAudioPreview(dataUrl: string): Promise<string> {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

  try {
    const response = await fetch(dataUrl)
    const arrayBuffer = await response.arrayBuffer()
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

    const duration = audioBuffer.duration
    let trimDuration: number
    if (duration > 60) trimDuration = 60
    else if (duration > 30) trimDuration = 30
    else if (duration > 15) trimDuration = 15
    else return dataUrl

    const sampleRate = audioBuffer.sampleRate
    const channels = audioBuffer.numberOfChannels
    const trimSamples = Math.floor(trimDuration * sampleRate)

    const offlineCtx = new OfflineAudioContext(channels, trimSamples, sampleRate)
    const source = offlineCtx.createBufferSource()
    source.buffer = audioBuffer

    const fadeOutDuration = Math.min(2, trimDuration * 0.1)
    const fadeOutStart = trimDuration - fadeOutDuration
    const gainNode = offlineCtx.createGain()
    gainNode.gain.setValueAtTime(1, 0)
    gainNode.gain.setValueAtTime(1, fadeOutStart)
    gainNode.gain.linearRampToValueAtTime(0, trimDuration)

    source.connect(gainNode)
    gainNode.connect(offlineCtx.destination)
    source.start(0, 0, trimDuration)

    const renderedBuffer = await offlineCtx.startRendering()
    const wavBlob = audioBufferToWav(renderedBuffer)

    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('Failed to convert preview to data URL'))
      reader.readAsDataURL(wavBlob)
    })
  } finally {
    audioContext.close()
  }
}

function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = Math.min(buffer.numberOfChannels, 2)
  const sampleRate = buffer.sampleRate
  const bitsPerSample = 16

  let interleaved: Float32Array
  if (numChannels === 2) {
    const left = buffer.getChannelData(0)
    const right = buffer.getChannelData(1)
    interleaved = new Float32Array(left.length * 2)
    for (let i = 0; i < left.length; i++) {
      interleaved[i * 2] = left[i]
      interleaved[i * 2 + 1] = right[i]
    }
  } else {
    interleaved = buffer.getChannelData(0)
  }

  const dataLength = interleaved.length * (bitsPerSample / 8)
  const arrayBuffer = new ArrayBuffer(44 + dataLength)
  const view = new DataView(arrayBuffer)

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
  }

  writeString(0, 'RIFF')
  view.setUint32(4, 36 + dataLength, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true)
  view.setUint16(32, numChannels * (bitsPerSample / 8), true)
  view.setUint16(34, bitsPerSample, true)
  writeString(36, 'data')
  view.setUint32(40, dataLength, true)

  let offset = 44
  for (let i = 0; i < interleaved.length; i++) {
    const sample = Math.max(-1, Math.min(1, interleaved[i]))
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true)
    offset += 2
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' })
}
