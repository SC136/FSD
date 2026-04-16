import { configureStore } from '@reduxjs/toolkit'
import transactionReducer from '../features/transactions/transactionSlice'
import categoryReducer from '../features/categories/categorySlice'
import budgetReducer from '../features/budget/budgetSlice'

const STORAGE_KEY = 'finverse-redux-state'

const loadState = () => {
  try {
    const serializedState = localStorage.getItem(STORAGE_KEY)

    if (!serializedState) {
      return undefined
    }

    const parsed = JSON.parse(serializedState)

    return {
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions : undefined,
      categories: Array.isArray(parsed.categories) ? parsed.categories : undefined,
      budget: parsed.budget && typeof parsed.budget === 'object' ? parsed.budget : undefined,
    }
  } catch {
    return undefined
  }
}

const store = configureStore({
  reducer: {
    transactions: transactionReducer,
    categories: categoryReducer,
    budget: budgetReducer,
  },
  preloadedState: loadState(),
})

store.subscribe(() => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store.getState()))
  } catch {
  }
})

export default store
