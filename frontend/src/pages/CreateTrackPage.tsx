import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save, X, ChevronDown, Search } from 'lucide-react'
import MediaUploadField from '../components/MediaUploadField'
import { tracksService } from '../services/tracksService'
import { categoriesService } from '../services/categoriesService'
import { authService } from '../services/authService'
import { generateAudioPreview } from '../utils/audioPreview'

interface TrackFormData {
  title: string
  description: string
  categoryId: number | '' // Keep for compatibility, but we'll use selectedCategoryName
  bpm: number | ''
  key: string
  price: number | ''
  fileUrl: string
  previewUrl: string
  coverUrl: string
  tags: string[]
  isPublic: boolean
}

const CreateTrackPage = () => {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [formData, setFormData] = useState<TrackFormData>({
    title: '',
    description: '',
    categoryId: '',
    bpm: '',
    key: '',
    price: '',
    fileUrl: '',
    previewUrl: '',
    coverUrl: '',
    tags: [],
    isPublic: true,
  })
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  
  // Category dropdown state
  const [isCategoryOpen, setIsCategoryOpen] = useState(false)
  const [categorySearch, setCategorySearch] = useState('')
  const categoryRef = useRef<HTMLDivElement>(null)
  
  // Key dropdown state
  const [isKeyOpen, setIsKeyOpen] = useState(false)
  const [keySearch, setKeySearch] = useState('')
  const keyRef = useRef<HTMLDivElement>(null)
  
  // Categories loaded from API
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([])
  
  // Musical keys list (10 popular keys)
  const musicalKeys = [
    'C Major', 'C# Major', 'D Major', 'E Major', 'F Major',
    'G Major', 'A Major', 'B Major',
    'A Minor', 'E Minor'
  ]

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login')
      return
    }

    const currentUser = authService.getCurrentUser()
    if (currentUser?.role !== 'producer') {
      navigate('/')
      return
    }

    loadCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadCategories = async () => {
    try {
      const data = await categoriesService.getAll()
      setCategories(data.map(cat => ({ id: cat.id, name: cat.name })))
    } catch (error) {
      console.error('Failed to load categories:', error)
    }
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setIsCategoryOpen(false)
      }
      if (keyRef.current && !keyRef.current.contains(event.target as Node)) {
        setIsKeyOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData((prev) => ({ ...prev, [name]: checked }))
    } else if (type === 'number') {
      setFormData((prev) => ({ ...prev, [name]: value === '' ? '' : Number(value) }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }))
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }))
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Валидация
    if (!formData.title.trim()) {
      setError('Название трека обязательно')
      return
    }
    if (!formData.fileUrl.trim()) {
      setError('URL файла трека обязателен')
      return
    }
    if (formData.price === '' || Number(formData.price) < 0) {
      setError('Цена должна быть больше или равна 0')
      return
    }

    try {
      setSaving(true)
      
      // Find or create category if selected
      let categoryId: number | undefined = undefined
      if (selectedCategoryName) {
        const category = await categoriesService.findOrCreate(selectedCategoryName)
        categoryId = category.id
      }

      const trackData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        categoryId: categoryId,
        bpm: formData.bpm === '' ? undefined : Math.round(Number(formData.bpm)),
        key: formData.key.trim() || undefined,
        price: Number(formData.price),
        fileUrl: formData.fileUrl.trim(),
        previewUrl: formData.previewUrl.trim() || undefined,
        coverUrl: formData.coverUrl.trim() || undefined,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
        isPublic: formData.isPublic,
      }

      await tracksService.create(trackData)
      setSuccess('Трек успешно создан!')
      setTimeout(() => {
        const user = authService.getCurrentUser()
        navigate(`/profile/${user?.displayName || ''}`)
      }, 1500)
    } catch (error: any) {
      console.error('Failed to create track:', error)
      const status = error.response?.status
      const errorMessage =
        status === 413
          ? 'Файл слишком большой. Попробуйте MP3 или уменьшите размер аудио (лимит ~100 МБ).'
          : error.response?.data?.message || error.message || 'Не удалось создать трек'
      setError(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gray-800 rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-white mb-6">Создать новый трек</h1>

          {error && (
            <div className="mb-4 p-4 bg-red-900 bg-opacity-50 border border-red-700 rounded-lg text-red-200">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-900 bg-opacity-50 border border-green-700 rounded-lg text-green-200">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                Название трека <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white placeholder-gray-400"
                placeholder="Введите название трека"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                Описание
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white placeholder-gray-400"
                placeholder="Опишите ваш трек"
              />
            </div>

            {/* Category Dropdown */}
            <div className="relative" ref={categoryRef}>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Категория
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsCategoryOpen(!isCategoryOpen)
                  setIsKeyOpen(false)
                }}
                className="w-full px-4 py-2 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-gray-800 text-left flex items-center justify-between"
              >
                <span className={selectedCategoryName ? 'text-white' : 'text-gray-400'}>
                  {selectedCategoryName || 'Выберите категорию'}
                </span>
                <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${isCategoryOpen ? 'transform rotate-180' : ''}`} />
              </button>
              {isCategoryOpen && (
                <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-hidden">
                  <div className="p-2 border-b border-gray-700">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="text"
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                        placeholder="Поиск категории..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white placeholder-gray-400"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {categories
                      .filter((category) =>
                        category.name.toLowerCase().includes(categorySearch.toLowerCase())
                      )
                      .map((category) => (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => {
                            setSelectedCategoryName(category.name)
                            setIsCategoryOpen(false)
                            setCategorySearch('')
                          }}
                          className={`w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors ${
                            selectedCategoryName === category.name ? 'bg-primary-600 text-white' : 'text-gray-300'
                          }`}
                        >
                          {category.name}
                        </button>
                      ))}
                    {categories.filter((category) =>
                      category.name.toLowerCase().includes(categorySearch.toLowerCase())
                    ).length === 0 && (
                      <div className="px-4 py-2 text-gray-400 text-sm">Категории не найдены</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* BPM and Key */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="bpm" className="block text-sm font-medium text-gray-300 mb-2">
                  BPM
                </label>
                <input
                  type="number"
                  id="bpm"
                  name="bpm"
                  min="1"
                  step="1"
                  value={formData.bpm}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white placeholder-gray-400"
                  placeholder="120"
                />
              </div>
              <div className="relative" ref={keyRef}>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Ключ (Key)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsKeyOpen(!isKeyOpen)
                    setIsCategoryOpen(false)
                  }}
                  className="w-full px-4 py-2 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-gray-800 text-left flex items-center justify-between"
                >
                  <span className={formData.key ? 'text-white' : 'text-gray-400'}>
                    {formData.key || 'Выберите ключ'}
                  </span>
                  <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${isKeyOpen ? 'transform rotate-180' : ''}`} />
                </button>
                {isKeyOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-hidden">
                    <div className="p-2 border-b border-gray-700">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                          type="text"
                          value={keySearch}
                          onChange={(e) => setKeySearch(e.target.value)}
                          placeholder="Поиск ключа..."
                          className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white placeholder-gray-400"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {musicalKeys
                        .filter((key) =>
                          key.toLowerCase().includes(keySearch.toLowerCase())
                        )
                        .map((key) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => {
                              setFormData((prev) => ({ ...prev, key }))
                              setIsKeyOpen(false)
                              setKeySearch('')
                            }}
                            className={`w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors ${
                              formData.key === key ? 'bg-primary-600 text-white' : 'text-gray-300'
                            }`}
                          >
                            {key}
                          </button>
                        ))}
                      {musicalKeys.filter((key) =>
                        key.toLowerCase().includes(keySearch.toLowerCase())
                      ).length === 0 && (
                        <div className="px-4 py-2 text-gray-400 text-sm">Ключи не найдены</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Price */}
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-300 mb-2">
                Цена ($) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="price"
                name="price"
                required
                min="0"
                step="0.01"
                value={formData.price}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white placeholder-gray-400"
                placeholder="0.00"
              />
            </div>

            {/* Tags */}
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-300 mb-2">
                Теги
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white placeholder-gray-400"
                  placeholder="Введите тег и нажмите Enter"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Добавить
                </button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-primary-600 text-white rounded-full text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-gray-200"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-gray-700 space-y-5">
              <h2 className="text-lg font-semibold text-white">Медиафайлы</h2>

              <MediaUploadField
                id="fileUrl"
                label="Файл трека"
                required
                accept="audio/*"
                value={formData.fileUrl}
                onChange={async (fileUrl) => {
                  setFormData((prev) => ({ ...prev, fileUrl }))
                  if (fileUrl.startsWith('data:audio')) {
                    try {
                      const preview = await generateAudioPreview(fileUrl)
                      setFormData((prev) => ({ ...prev, previewUrl: preview }))
                    } catch (e) {
                      console.error('Preview generation failed:', e)
                    }
                  }
                }}
                placeholder="https://example.com/track.mp3"
                description="Основной аудиофайл для продажи"
              />

              <MediaUploadField
                id="previewUrl"
                label="Превью трека"
                accept="audio/*"
                value={formData.previewUrl}
                onChange={(previewUrl) => setFormData((prev) => ({ ...prev, previewUrl }))}
                placeholder="https://example.com/preview.mp3"
                description="Короткий фрагмент для прослушивания до покупки"
              />

              <MediaUploadField
                id="coverUrl"
                label="Обложка"
                accept="image/*"
                variant="image"
                value={formData.coverUrl}
                onChange={(coverUrl) => setFormData((prev) => ({ ...prev, coverUrl }))}
                placeholder="https://example.com/cover.jpg"
                description="Квадратное изображение для карточки трека"
              />
            </div>

            {/* Is Public */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPublic"
                name="isPublic"
                checked={formData.isPublic}
                onChange={handleInputChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-700 rounded"
              />
              <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-300">
                Опубликовать трек (сделать публичным)
              </label>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-5 w-5" />
                {saving ? 'Создание...' : 'Создать трек'}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors border border-gray-600"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CreateTrackPage

