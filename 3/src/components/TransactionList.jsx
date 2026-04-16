import { useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { deleteTransaction } from '../features/transactions/transactionSlice'
import { selectTransactions } from '../app/selectors'

function TransactionList({ onEdit, readOnly = false, limit = null }) {
  const dispatch = useDispatch()
  const transactions = useSelector(selectTransactions)
  const [typeFilter, setTypeFilter] = useState('all')

  const filteredTransactions = useMemo(() => {
    if (typeFilter === 'all') {
      return transactions
    }

    return transactions.filter((transaction) => transaction.type === typeFilter)
  }, [transactions, typeFilter])

  const visibleTransactions = useMemo(() => {
    if (!limit) {
      return filteredTransactions
    }

    return filteredTransactions.slice(0, limit)
  }, [filteredTransactions, limit])

  return (
    <section className="card">
      <div className="section-header">
        <h2>Transactions</h2>
        <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
          <option value="all">All</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
      </div>

      {visibleTransactions.length === 0 ? (
        <p className="empty-state">No transactions yet. Add one from the form.</p>
      ) : (
        <ul className="transaction-list">
          {visibleTransactions.map((transaction) => (
            <li key={transaction.id} className="transaction-item">
              <div>
                <strong>{transaction.category}</strong>
                <p>{transaction.note || 'No note'}</p>
                <small>{new Date(transaction.date).toLocaleDateString()}</small>
              </div>
              <div className="item-meta">
                <span className={transaction.type === 'income' ? 'pill income' : 'pill expense'}>
                  {transaction.type}
                </span>
                <strong>${Number(transaction.amount).toFixed(2)}</strong>
                {!readOnly && (
                  <div className="inline-actions">
                    <button type="button" className="ghost" onClick={() => onEdit?.(transaction)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => dispatch(deleteTransaction(transaction.id))}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default TransactionList
