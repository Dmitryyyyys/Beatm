import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Tag, Plus, Edit2, Trash2, Save, X, Search } from 'lucide-react'
import { authService } from '../services/authService'
import { categoriesService } from '../services/categoriesService'
import { Category } from '../types'

const AdminCategoriesPage = () => {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)

  const [formData, setFormData] = useState({
    name: '',
  })

  useEffect(() => {
    if (!authService.isAuthenticated() || !authService.isAdmin()) {
      navigate('/admin/login')
    } else {
      loadCategories()
    }
  }, [navigate])

  const loadCategories = async () => {
    try {
      setLoading(true)
      const data = await categoriesService.getAll()
      setCategories(data)
    } catch (error) {
      console.error('Failed to load categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNameChange = (name: string) => {
    setFormData({
      name,
    })
  }

  const handleAdd = () => {
    setIsAdding(true)
    setEditingId(null)
    setFormData({
      name: '',
    })
  }

  const handleEdit = (category: Category) => {
    setEditingId(category.id)
    setIsAdding(false)
    setFormData({
      name: category.name,
    })
  }

  const handleCancel = () => {
    setIsAdding(false)
    setEditingId(null)
    setFormData({
      name: '',
    })
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Название обязательно')
      return
    }

    try {
      if (editingId) {
        await categoriesService.update(editingId, { name: formData.name })
      } else {
        // Используем findOrCreate, который автоматически создаст категорию если её нет
        await categoriesService.findOrCreate(formData.name)
      }
      await loadCategories()
      handleCancel()
    } catch (error: any) {
      console.error('Failed to save category:', error)
      const errorMessage =
        error.response?.data?.message || error.message || 'Не удалось сохранить категорию'
      alert(errorMessage)
    }
  }

  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return

    try {
      await categoriesService.delete(categoryToDelete.id)
      await loadCategories()
      setDeleteModalOpen(false)
      setCategoryToDelete(null)
    } catch (error: any) {
      console.error('Failed to delete category:', error)
      const errorMessage =
        error.response?.data?.message || error.message || 'Не удалось удалить категорию'
      alert(errorMessage)
    }
  }

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-400"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6 mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Tag className="h-8 w-8 text-primary-400" />
              <h1 className="text-3xl font-bold text-white">Управление категориями</h1>
            </div>
            <button
              onClick={handleAdd}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Добавить категорию</span>
            </button>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-4 mb-6"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск категорий..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </motion.div>

        {/* Add/Edit Form */}
        {(isAdding || editingId) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6 mb-6"
          >
            <h2 className="text-xl font-bold text-white mb-4">
              {editingId ? 'Редактировать категорию' : 'Добавить категорию'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Название *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Hip-Hop"
                />
              </div>
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  <X className="h-4 w-4 inline mr-2" />
                  Отмена
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                >
                  <Save className="h-4 w-4 inline mr-2" />
                  Сохранить
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Categories List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-700">
            <h2 className="text-xl font-bold text-white">
              Категории ({filteredCategories.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-700">
            {filteredCategories.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Tag className="h-12 w-12 mx-auto mb-3 text-gray-500" />
                <p>Категории не найдены</p>
              </div>
            ) : (
              filteredCategories.map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-6 hover:bg-gray-750 transition-colors ${
                    editingId === category.id ? 'bg-gray-750' : ''
                  }`}
                >
                  {editingId === category.id ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Название *
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleNameChange(e.target.value)}
                          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div className="flex items-center justify-end space-x-3">
                        <button
                          onClick={handleCancel}
                          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                        >
                          <X className="h-4 w-4 inline mr-2" />
                          Отмена
                        </button>
                        <button
                          onClick={handleSave}
                          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                        >
                          <Save className="h-4 w-4 inline mr-2" />
                          Сохранить
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Tag className="h-5 w-5 text-primary-400" />
                          <h3 className="text-lg font-semibold text-white">{category.name}</h3>
                        </div>
                        {category.createdAt && (
                          <p className="text-gray-400 text-xs ml-8 mt-2">
                            Создано: {new Date(category.createdAt).toLocaleDateString('ru-RU')}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(category)}
                          className="p-2 text-blue-400 hover:bg-gray-700 rounded-lg transition-colors"
                          title="Редактировать"
                        >
                          <Edit2 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(category)}
                          className="p-2 text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
                          title="Удалить"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        {/* Delete Confirmation Modal */}
        {deleteModalOpen && categoryToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 p-6 max-w-md w-full mx-4"
            >
              <h3 className="text-xl font-bold text-white mb-4">Удалить категорию?</h3>
              <p className="text-gray-300 mb-6">
                Вы уверены, что хотите удалить категорию "{categoryToDelete.name}"? Это действие
                нельзя отменить.
              </p>
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setDeleteModalOpen(false)
                    setCategoryToDelete(null)
                  }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Удалить
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminCategoriesPage
