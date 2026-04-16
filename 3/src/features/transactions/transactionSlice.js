import { createSlice } from '@reduxjs/toolkit'

const transactionSlice = createSlice({
  name: 'transactions',
  initialState: [],
  reducers: {
    addTransaction: {
      reducer: (state, action) => {
        state.unshift(action.payload)
      },
      prepare: (transaction) => ({
        payload: {
          ...transaction,
          id: transaction.id ?? crypto.randomUUID(),
        },
      }),
    },
    updateTransaction: (state, action) => {
      const { id, changes } = action.payload
      const index = state.findIndex((transaction) => transaction.id === id)

      if (index !== -1) {
        state[index] = { ...state[index], ...changes }
      }
    },
    deleteTransaction: (state, action) => state.filter((transaction) => transaction.id !== action.payload),
  },
})

export const { addTransaction, updateTransaction, deleteTransaction } = transactionSlice.actions
export default transactionSlice.reducer
