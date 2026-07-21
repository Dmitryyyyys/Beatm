import Hero from '../components/Hero'
import Stats from '../components/Stats'
import Categories from '../components/Categories'
import FeaturedTracks from '../components/FeaturedTracks'

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gray-900">
      <Hero />
      <Stats />
      <Categories />
      <FeaturedTracks />
    </div>
  )
}

export default HomePage
