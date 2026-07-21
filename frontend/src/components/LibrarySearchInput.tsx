import { Search, X } from 'lucide-react'

interface LibrarySearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

const LibrarySearchInput = ({
  value,
  onChange,
  placeholder = 'Поиск по названию, тегам...',
  className = '',
}: LibrarySearchInputProps) => {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-white placeholder-gray-400"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          aria-label="Очистить поиск"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

export default LibrarySearchInput
