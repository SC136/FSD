import { useEffect, useMemo, useState } from 'react'

const defaultFilters = {
  sort: 'LATEST',
}

const sortOptions = ['LATEST', 'EARLIEST', 'RELEVANCE']

const buildQuery = (filters) => {
  const params = new URLSearchParams()

  params.set('sort', filters.sort)
  params.set('limit', '25')

  return params
}

const normalizeSentiment = (value) => {
  const numeric = Number(value)

  if (Number.isNaN(numeric)) {
    return null
  }

  return numeric
}

function FinanceNews() {
  const [filters, setFilters] = useState(defaultFilters)
  const [articles, setArticles] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')

  const sentimentSummary = useMemo(() => {
    const scores = articles
      .map((article) => normalizeSentiment(article.overall_sentiment_score))
      .filter((value) => value !== null)

    if (scores.length === 0) {
      return null
    }

    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length
    return average.toFixed(3)
  }, [articles])

  const fetchNews = async () => {
    setIsLoading(true)
    setStatusMessage('Fetching market intelligence...')

    try {
      const query = buildQuery(filters)
      const response = await fetch(`http://localhost:8787/api/finance-news?${query.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch finance news.')
      }

      if (Array.isArray(data.feed)) {
        setArticles(data.feed)
        setStatusMessage(`Loaded ${data.feed.length} articles.`)
      } else {
        setArticles([])
        setStatusMessage(data.note || 'No articles returned for this query.')
      }
    } catch (error) {
      setArticles([])
      setStatusMessage(error.message || 'Unable to fetch finance news right now.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchNews()
  }, [])

  return (
    <main className="dashboard">
      <header className="page-header">
        <h1>Finance News</h1>
        <p>
          Live Alpha Intelligence stream powered by Alpha Vantage news and sentiment signals for stocks,
          crypto, forex, and macro themes.
        </p>
      </header>

      <section className="card news-filters-card">
        <div className="section-header">
          <h2>News Filters</h2>
          <button type="button" onClick={fetchNews} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Refresh Feed'}
          </button>
        </div>

        <div className="news-filters-grid">
          <label>
            Sort
            <select
              value={filters.sort}
              onChange={(event) => setFilters((prev) => ({ ...prev, sort: event.target.value }))}
            >
              {sortOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="summary-grid">
        <article className="card metric balance">
          <h2>Articles Loaded</h2>
          <p>{articles.length}</p>
        </article>

        <article className="card metric income">
          <h2>Average Sentiment</h2>
          <p>{sentimentSummary ?? 'N/A'}</p>
        </article>

        <article className="card metric expense">
          <h2>Feed Status</h2>
          <p className="news-status-text">{statusMessage || 'Idle'}</p>
        </article>
      </section>

      <section className="card news-list-card">
        <div className="section-header">
          <h2>News And Sentiment Feed</h2>
          <p>{filters.sort} order</p>
        </div>

        {articles.length === 0 ? (
          <p className="empty-state">No market news matched this filter set.</p>
        ) : (
          <ul className="news-feed-list">
            {articles.map((article, index) => (
              <li key={`${article.url}-${index}`} className="news-feed-item">
                <div>
                  <h3>{article.title}</h3>
                  <p>{article.summary || 'No summary provided.'}</p>
                  <small>
                    {article.source} • {article.time_published || 'Unknown time'}
                  </small>
                </div>

                <div className="news-feed-meta">
                  <span className="pill income">Sentiment {article.overall_sentiment_label || 'Neutral'}</span>
                  <strong>{Number(article.overall_sentiment_score || 0).toFixed(3)}</strong>
                  <a href={article.url} target="_blank" rel="noreferrer">
                    Open Story
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

export default FinanceNews
