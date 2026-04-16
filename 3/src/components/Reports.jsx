import { useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectTransactions } from '../app/selectors'
import PDFGenerator from './PDFGenerator'

const toDateKey = (dateValue) => {
  const parsed = new Date(dateValue)

  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return parsed.toISOString().slice(0, 10)
}

const getDefaultStartDate = () => {
  const date = new Date()
  date.setDate(1)
  return date.toISOString().slice(0, 10)
}

const getToday = () => new Date().toISOString().slice(0, 10)

function Reports() {
  const transactions = useSelector(selectTransactions)
  const [startDate, setStartDate] = useState(getDefaultStartDate)
  const [endDate, setEndDate] = useState(getToday)
  const reportRef = useRef(null)

  const filteredTransactions = useMemo(() => {
    const normalizedStart = startDate || null
    const normalizedEnd = endDate || null

    return transactions.filter((transaction) => {
      const key = toDateKey(transaction.date)

      if (!key) {
        return false
      }

      if (normalizedStart && key < normalizedStart) {
        return false
      }

      if (normalizedEnd && key > normalizedEnd) {
        return false
      }

      return true
    })
  }, [transactions, startDate, endDate])

  const summary = useMemo(() => {
    const totalIncome = filteredTransactions
      .filter((transaction) => transaction.type === 'income')
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0)

    const totalExpenses = filteredTransactions
      .filter((transaction) => transaction.type === 'expense')
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0)

    return {
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
    }
  }, [filteredTransactions])

  const periodLabel = startDate && endDate ? `${startDate} to ${endDate}` : 'All dates'

  return (
    <main className="dashboard reports-page">
      <header className="page-header">
        <h1>Reports</h1>
        <p>Analyze transactions by date range, review totals, and export a detailed PDF report.</p>
      </header>

      <section className="card filters-card">
        <div className="section-header">
          <h2>Date Filters</h2>
          <p>{filteredTransactions.length} transactions in range</p>
        </div>

        <div className="filters-grid">
          <label>
            Start Date
            <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          </label>

          <label>
            End Date
            <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
          </label>
        </div>
      </section>

      <section className="summary-grid">
        <article className="card metric income">
          <h2>Total Income</h2>
          <p>${summary.totalIncome.toFixed(2)}</p>
        </article>

        <article className="card metric expense">
          <h2>Total Expenses</h2>
          <p>${summary.totalExpenses.toFixed(2)}</p>
        </article>

        <article className="card metric balance">
          <h2>Balance</h2>
          <p>${summary.balance.toFixed(2)}</p>
        </article>
      </section>

      <section ref={reportRef} className="card report-table-card">
        <div className="section-header">
          <h2>Transaction Summary</h2>
          <p>{periodLabel}</p>
        </div>

        {filteredTransactions.length === 0 ? (
          <p className="empty-state">No transactions found for the selected date range.</p>
        ) : (
          <div className="report-table-wrap">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>{new Date(transaction.date).toLocaleDateString()}</td>
                    <td>{transaction.category}</td>
                    <td>
                      <span className={transaction.type === 'income' ? 'pill income' : 'pill expense'}>
                        {transaction.type}
                      </span>
                    </td>
                    <td>${Number(transaction.amount).toFixed(2)}</td>
                    <td>{transaction.note || 'No note'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <PDFGenerator
        transactions={filteredTransactions}
        summary={summary}
        periodLabel={periodLabel}
        reportRef={reportRef}
      />
    </main>
  )
}

export default Reports
