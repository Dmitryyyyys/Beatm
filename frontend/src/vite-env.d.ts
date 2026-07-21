/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface LameMp3Encoder {
  new (channels: number, sampleRate: number, kbps: number): {
    encodeBuffer(left: Int16Array, right?: Int16Array): Int8Array
    flush(): Int8Array
  }
}

interface LameJs {
  Mp3Encoder: LameMp3Encoder
}

interface Window {
  Mp3Encoder?: LameMp3Encoder
  lamejs?: LameJs & ((...args: unknown[]) => void)
}