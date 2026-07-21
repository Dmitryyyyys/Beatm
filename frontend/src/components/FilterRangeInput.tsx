import { useEffect, useState } from 'react'

export const filterFieldClass =
  'w-full min-w-0 px-3 py-2.5 bg-gray-900/60 border border-gray-600/80 rounded-lg text-sm text-white tabular-nums placeholder:text-gray-500 transition-colors focus:outline-none focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/25 hover:border-gray-500'

interface FilterRangeInputProps {
  fromValue: number
  toValue: number
  onFromChange: (value: number) => void
  onToChange: (value: number) => void
  fromPlaceholder?: string
  toPlaceholder?: string
  min?: number
  max?: number
  fromEmptyDefault?: number
  toEmptyDefault?: number
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

const FilterRangeInput = ({
  fromValue,
  toValue,
  onFromChange,
  onToChange,
  fromPlaceholder = 'От',
  toPlaceholder = 'До',
  min = 0,
  max = 99999,
  fromEmptyDefault,
  toEmptyDefault,
}: FilterRangeInputProps) => {
  const [fromText, setFromText] = useState(() => String(fromValue))
  const [toText, setToText] = useState(() => String(toValue))

  useEffect(() => {
    setFromText(String(fromValue))
  }, [fromValue])

  useEffect(() => {
    setToText(String(toValue))
  }, [toValue])

  const commitFrom = () => {
    const fallback = fromEmptyDefault ?? min
    const parsed = fromText === '' ? fallback : parseInt(fromText, 10)
    const next = clamp(Number.isNaN(parsed) ? fallback : parsed, min, max)
    onFromChange(next)
    setFromText(String(next))
  }

  const commitTo = () => {
    const fallback = toEmptyDefault ?? max
    const parsed = toText === '' ? fallback : parseInt(toText, 10)
    const next = clamp(Number.isNaN(parsed) ? fallback : parsed, min, max)
    onToChange(next)
    setToText(String(next))
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        inputMode="numeric"
        value={fromText}
        onChange={(e) => setFromText(e.target.value.replace(/\D/g, ''))}
        onBlur={commitFrom}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        placeholder={fromPlaceholder}
        className={`${filterFieldClass} flex-1`}
        aria-label={fromPlaceholder}
      />
      <span className="shrink-0 text-gray-500 select-none" aria-hidden>
        —
      </span>
      <input
        type="text"
        inputMode="numeric"
        value={toText}
        onChange={(e) => setToText(e.target.value.replace(/\D/g, ''))}
        onBlur={commitTo}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        placeholder={toPlaceholder}
        className={`${filterFieldClass} flex-1`}
        aria-label={toPlaceholder}
      />
    </div>
  )
}

export default FilterRangeInput
