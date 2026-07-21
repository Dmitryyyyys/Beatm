import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { categoriesService } from '../services/categoriesService'
import { Category } from '../types'

const Categories = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await categoriesService.getAll()
        setCategories(data.slice(0, 6))
      } catch (error) {
        console.error('Error loading categories:', error)
        setCategories([
          { id: 1, name: 'Hip-Hop', slug: 'hip-hop' },
          { id: 2, name: 'Trap', slug: 'trap' },
          { id: 3, name: 'R&B', slug: 'rnb' },
          { id: 4, name: 'Pop', slug: 'pop' },
          { id: 5, name: 'Electronic', slug: 'electronic' },
          { id: 6, name: 'Drill', slug: 'drill' },
        ])
      } finally {
        setLoading(false)
      }
    }
    loadCategories()
  }, [])

  if (loading) {
    return (
      <section className="py-16 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-gray-300">Загрузка категорий...</div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Популярные категории
          </h2>
          <p className="text-gray-300 text-lg">
            Выберите жанр, который вам интересен
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/search?category=${category.slug}`}
              className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-all border border-gray-700 hover:border-gray-600 group"
            >
              <div className="text-center">
                <div className="text-xl md:text-2xl font-bold text-white group-hover:text-gray-200 transition-colors mb-2">
                  {category.name}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Categories
