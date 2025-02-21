export async function searchContent(query, options = {}) {
  const {
    start = 1,
    num = 10,
    dateRestrict = 'd1',
    lr = 'lang_en',
    sort = 'date'
  } = options

  try {
    const params = new URLSearchParams({
      key: import.meta.env.VITE_GOOGLE_API_KEY,
      cx: import.meta.env.VITE_SEARCH_ENGINE_ID,
      q: query,
      start,
      num,
      dateRestrict,
      lr,
      sort
    })

    const response = await fetch(`https://www.googleapis.com/customsearch/v1?${params}`)
    const data = await response.json()

    if (data.error) {
      throw new Error(data.error.message)
    }

    return {
      items: data.items || [],
      searchInfo: data.searchInformation,
      queries: data.queries
    }
  } catch (error) {
    console.error('Search API error:', error)
    throw error
  }
} 