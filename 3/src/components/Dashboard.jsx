import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  selectTransactions,
  selectMonthlyBudget,
  selectRemainingBalance,
  selectTotalExpenses,
  selectTotalIncome,
} from '../app/selectors'
import { setBudget } from '../features/budget/budgetSlice'
import TransactionList from './TransactionList'
import Charts from './Charts'

function Dashboard() {
  const dispatch = useDispatch()
  const transactions = useSelector(selectTransactions)
  const totalIncome = useSelector(selectTotalIncome)
  const totalExpenses = useSelector(selectTotalExpenses)
  const remainingBalance = useSelector(selectRemainingBalance)
  const monthlyBudget = useSelector(selectMonthlyBudget)

  const [budgetInput, setBudgetInput] = useState(String(monthlyBudget))

  const budgetUsagePercent = monthlyBudget > 0 ? Math.min((totalExpenses / monthlyBudget) * 100, 100) : 0

  const budgetRemaining = monthlyBudget - totalExpenses

  return (
    <main className="dashboard">
      <header className="page-header">
        <h1>Personal Finance Dashboard</h1>
        <p>Track transactions, monitor budgets, and visualize spending patterns in real time.</p>
      </header>

      <section className="summary-grid">
        <article className="card metric income">
          <h2>Total Income</h2>
          <p>${totalIncome.toFixed(2)}</p>
        </article>

        <article className="card metric expense">
          <h2>Total Expenses</h2>
          <p>${totalExpenses.toFixed(2)}</p>
        </article>

        <article className="card metric balance">
          <h2>Remaining Balance</h2>
          <p>${remainingBalance.toFixed(2)}</p>
        </article>
      </section>

      <section className="card budget-card">
        <div className="section-header">
          <h2>Monthly Budget</h2>
          <form
            className="inline-actions"
            onSubmit={(event) => {
              event.preventDefault()
              dispatch(setBudget(budgetInput))
            }}
          >
            <input
              type="number"
              min="0"
              step="0.01"
              value={budgetInput}
              onChange={(event) => setBudgetInput(event.target.value)}
              placeholder="Set monthly budget"
            />
            <button type="submit">Save Budget</button>
          </form>
        </div>
        <div className="budget-status">
          <p>
            Limit: <strong>${monthlyBudget.toFixed(2)}</strong>
          </p>
          <p>
            Remaining: <strong>${budgetRemaining.toFixed(2)}</strong>
          </p>
        </div>
        <div className="progress-track" aria-label="Budget usage">
          <div className="progress-fill" style={{ width: `${budgetUsagePercent}%` }} />
        </div>
      </section>

      <Charts />

      <section className="card" style={{ marginTop: '1rem' }}>
        <div className="section-header">
          <h2>Recent Activity</h2>
          <p>{transactions.length} total transactions</p>
        </div>
        <TransactionList readOnly limit={5} />
      </section>
    </main>
  )
}

export default Dashboard
