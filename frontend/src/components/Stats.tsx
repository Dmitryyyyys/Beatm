const Stats = () => {
  const stats = [
    { value: '186K+', label: 'Товаров' },
    { value: '6.4K+', label: 'Продавцов' },
    { value: '50K+', label: 'Покупателей' },
    { value: '24/7', label: 'Поддержка' },
  ]

  return (
    <section className="py-12 bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2">
                {stat.value}
              </div>
              <div className="text-gray-300 font-medium text-sm md:text-base">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Stats
