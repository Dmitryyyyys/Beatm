import { Link } from 'react-router-dom'
import { Music } from 'lucide-react'

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto border-t border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center space-x-2 mb-4">
              <Music className="h-8 w-8 text-primary-400" />
            </Link>
            <p className="text-gray-400 max-w-md text-sm">
              №1 Музыкальный маркетплейс. Покупайте и продавайте биты, 
              находите новых слушателей и зарабатывайте на музыке.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Основное</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="hover:text-primary-400 transition-colors text-sm">
                  Главная страница
                </Link>
              </li>
              <li>
                <Link to="/search" className="hover:text-primary-400 transition-colors text-sm">
                  Поиск битов
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Документы</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy" className="hover:text-primary-400 transition-colors text-sm">
                  Политика конфиденциальности
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-primary-400 transition-colors text-sm">
                  Публичная оферта
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm text-gray-400">
          <p>© 2026. Все права защищены.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
