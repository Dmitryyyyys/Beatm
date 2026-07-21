const countryCodeMap: { [key: string]: string } = {
  'россия': 'ru',
  'russia': 'ru',
  'russian federation': 'ru',
  'украина': 'ua',
  'ukraine': 'ua',
  'беларусь': 'by',
  'belarus': 'by',
  'казахстан': 'kz',
  'kazakhstan': 'kz',
  'сша': 'us',
  'usa': 'us',
  'united states': 'us',
  'united states of america': 'us',
  'великобритания': 'gb',
  'uk': 'gb',
  'united kingdom': 'gb',
  'германия': 'de',
  'germany': 'de',
  'франция': 'fr',
  'france': 'fr',
  'италия': 'it',
  'italy': 'it',
  'испания': 'es',
  'spain': 'es',
  'польша': 'pl',
  'poland': 'pl',
}

export const getCountryFlagUrl = (countryName: string | undefined): string | null => {
  if (!countryName) return null
  
  const normalizedName = countryName.toLowerCase().trim()
  const countryCode = countryCodeMap[normalizedName]
  
  if (countryCode) {
    return `https://flagcdn.com/w40/${countryCode}.png`
  }
  
  if (normalizedName.length >= 2) {
    const code = normalizedName.substring(0, 2)
    return `https://flagcdn.com/w40/${code}.png`
  }
  
  return null
}

export const getCountryFlagEmoji = (countryName: string | undefined): string | null => {
  if (!countryName) return null
  
  const normalizedName = countryName.toLowerCase().trim()
  const countryCode = countryCodeMap[normalizedName]?.toUpperCase()
  
  if (!countryCode) return null
  
  const flag = countryCode
    .split('')
    .map(char => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join('')
  
  return flag
}


