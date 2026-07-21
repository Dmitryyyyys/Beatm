import { useState, useEffect, useRef } from 'react'
import { Clock, ChevronDown, Check } from 'lucide-react'

export type TimeSortValue = 'newest' | 'oldest' | null

interface TimeSortDropdownProps {
  value: TimeSortValue
  onChange: (value: TimeSortValue) => void
  className?: string
}

const OPTIONS: { value: TimeSortValue; label: string }[] = [
  { value: 'newest', label: 'Новые' },
  { value: 'oldest', label: 'Старые' },
  { value: null, label: 'Все' },
]

const TimeSortDropdown = ({ value, onChange, className = '' }: TimeSortDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const activeLabel = OPTIONS.find((o) => o.value === value)?.label ?? 'Все'

  const select = (next: TimeSortValue) => {
    onChange(next)
    setIsOpen(false)
  }

  return (
    <div ref={ref} className={`relative shrink-0 ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={`flex items-center gap-2 h-[42px] px-3 bg-gray-800 border rounded-lg text-gray-300 transition-colors ${
          isOpen
            ? 'border-primary-500/50 ring-1 ring-primary-500/30 bg-gray-700'
            : 'border-gray-700 hover:bg-gray-700 hover:border-gray-600'
        }`}
      >
        <Clock className="h-4 w-4 shrink-0 text-gray-400" />
        <span className="text-sm text-gray-200 min-w-[2.5rem]">{activeLabel}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute right-0 mt-2 w-44 py-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20 overflow-hidden"
        >
          {OPTIONS.map((option) => {
            const isSelected = value === option.value
            return (
              <button
                key={option.label}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => select(option.value)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm transition-colors ${
                  isSelected
                    ? 'bg-primary-500/15 text-primary-400'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <span className={isSelected ? 'font-medium' : ''}>{option.label}</span>
                {isSelected && <Check className="h-4 w-4 shrink-0 text-primary-400" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default TimeSortDropdown
