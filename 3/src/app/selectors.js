import { createSelector } from '@reduxjs/toolkit'

export const selectTransactions = (state) => state.transactions
export const selectCategories = (state) => state.categories
export const selectMonthlyBudget = (state) => state.budget.monthlyLimit

export const selectTotalIncome = createSelector([selectTransactions], (transactions) =>
  transactions
    .filter((transaction) => transaction.type === 'income')
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0),
)

export const selectTotalExpenses = createSelector([selectTransactions], (transactions) =>
  transactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0),
)

export const selectRemainingBalance = createSelector(
  [selectTotalIncome, selectTotalExpenses],
  (income, expenses) => income - expenses,
)

// Aggregate only expense rows for category-level charting.
export const selectCategoryExpenseTotals = createSelector([selectTransactions], (transactions) => {
  const totals = {}

  transactions
    .filter((transaction) => transaction.type === 'expense')
    .forEach((transaction) => {
      const category = transaction.category || 'Uncategorized'
      totals[category] = (totals[category] ?? 0) + Number(transaction.amount)
    })

  return totals
})

export const selectMonthlyExpenses = createSelector([selectTransactions], (transactions) => {
  const monthlyTotals = {}
  transactions
    .filter((transaction) => transaction.type === 'expense')
    .forEach((transaction) => {
      const date = new Date(transaction.date)
      const monthLabel = Number.isNaN(date.getTime())
        ? 'Unknown'
        : date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      monthlyTotals[monthLabel] = (monthlyTotals[monthLabel] ?? 0) + Number(transaction.amount)
    })

  return monthlyTotals
})
