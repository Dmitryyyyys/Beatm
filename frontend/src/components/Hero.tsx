import { Link } from 'react-router-dom'
import cover2 from '../assets/cover2.jpg'
import cover4 from '../assets/cover4.avif'
import cover5 from '../assets/cover5.jpg'

const Hero = () => {

  return (
    <section className="bg-gray-900 text-white py-20 md:py-28 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 relative z-10">
            №1 Музыкальный маркетплейс
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl mb-10 text-gray-200 max-w-3xl mx-auto relative z-10">
            Покупайте и продавайте биты, находите новых слушателей и зарабатывайте на музыке.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
            <Link
              to="/register?role=producer"
              className="bg-white text-gray-900 hover:bg-gray-100 font-semibold px-8 py-4 rounded-lg transition-colors inline-flex items-center justify-center"
            >
              Начать продавать
            </Link>
            <Link
              to="/search"
              className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-gray-900 font-semibold px-8 py-4 rounded-lg transition-colors inline-flex items-center justify-center"
            >
              Искать биты
            </Link>
          </div>
        </div>

        {/* Images Block */}
        <div className="mt-16 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            <div className="relative aspect-square rounded-lg overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-300">
              <img
                src={cover2}
                alt="Cover 2"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="relative aspect-square rounded-lg overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-300">
              <img
                src={cover4}
                alt="Cover 4"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="relative aspect-square rounded-lg overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-300">
              <img
                src={cover5}
                alt="Cover 5"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
