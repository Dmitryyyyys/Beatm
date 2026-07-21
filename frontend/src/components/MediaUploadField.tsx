import { useRef, useState } from 'react'
import { Upload, Link2, X, Music, Image as ImageIcon, FileAudio } from 'lucide-react'

interface MediaUploadFieldProps {
  id: string
  label: string
  required?: boolean
  accept: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  variant?: 'audio' | 'image'
  description?: string
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const isDataUrl = (value: string) => value.startsWith('data:')

const MediaUploadField = ({
  id,
  label,
  required,
  accept,
  value,
  onChange,
  placeholder = 'https://example.com/file',
  variant = 'audio',
  description,
}: MediaUploadFieldProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [fileMeta, setFileMeta] = useState<{ name: string; size: number } | null>(null)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const hasValue = Boolean(value.trim())
  const uploadedLocally = hasValue && isDataUrl(value)

  const processFile = (file: File) => {
    setFileMeta({ name: file.name, size: file.size })
    setShowUrlInput(false)
    const reader = new FileReader()
    reader.onloadend = () => {
      onChange(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  const handleClear = () => {
    onChange('')
    setFileMeta(null)
    setShowUrlInput(false)
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
    if (!isDataUrl(e.target.value)) {
      setFileMeta(null)
    }
  }

  const Icon = variant === 'image' ? ImageIcon : Music

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <label
            htmlFor={showUrlInput ? `${id}-url` : undefined}
            className="block text-sm font-medium text-gray-300"
          >
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        </div>
        {hasValue && (
          <button
            type="button"
            onClick={handleClear}
            className="shrink-0 p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-700/80 rounded-lg transition-colors"
            title="Очистить"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="sr-only"
      />

      {!showUrlInput ? (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`relative rounded-xl border-2 border-dashed transition-colors ${
            isDragging
              ? 'border-primary-500 bg-primary-500/10'
              : hasValue
                ? 'border-primary-500/40 bg-gray-800/80'
                : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
          }`}
        >
          <div className="p-5 sm:p-6">
            {hasValue ? (
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {variant === 'image' && hasValue ? (
                  <img
                    src={value}
                    alt="Превью"
                    className="h-24 w-24 rounded-lg object-cover border border-gray-600 shrink-0"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-xl bg-primary-500/15 flex items-center justify-center shrink-0">
                    {variant === 'image' ? (
                      <ImageIcon className="h-7 w-7 text-primary-400" />
                    ) : (
                      <FileAudio className="h-7 w-7 text-primary-400" />
                    )}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {fileMeta?.name || (uploadedLocally ? 'Файл загружен' : 'Ссылка указана')}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {fileMeta
                      ? formatFileSize(fileMeta.size)
                      : uploadedLocally
                        ? 'Локальный файл'
                        : value.length > 60
                          ? `${value.slice(0, 48)}…`
                          : value}
                  </p>
                  {variant === 'audio' && hasValue && (
                    <audio src={value} controls className="mt-3 w-full h-9 max-w-md" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="shrink-0 px-4 py-2 text-sm font-medium text-primary-400 border border-primary-500/40 rounded-lg hover:bg-primary-500/10 transition-colors"
                >
                  Заменить
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-gray-700/80 flex items-center justify-center mb-3">
                  <Icon className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-300 mb-1">
                  Перетащите файл сюда или{' '}
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="text-primary-400 hover:text-primary-300 font-medium underline-offset-2 hover:underline"
                  >
                    выберите на устройстве
                  </button>
                </p>
                <p className="text-xs text-gray-500">
                  {variant === 'image' ? 'JPG, PNG, WebP' : 'MP3, WAV и другие аудиоформаты'}
                </p>
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  Выбрать файл
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <input
          id={`${id}-url`}
          type="text"
          value={isDataUrl(value) ? '' : value}
          onChange={handleUrlChange}
          className="w-full px-4 py-2.5 bg-gray-900/60 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white placeholder-gray-500 text-sm"
          placeholder={placeholder}
        />
      )}

      <button
        type="button"
        onClick={() => setShowUrlInput((v) => !v)}
        className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-primary-400 transition-colors"
      >
        <Link2 className="h-3.5 w-3.5" />
        {showUrlInput ? 'Загрузить файл вместо ссылки' : 'Указать ссылку вручную'}
      </button>
    </div>
  )
}

export default MediaUploadField
