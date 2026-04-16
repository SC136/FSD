import { createSlice } from '@reduxjs/toolkit'

const budgetSlice = createSlice({
  name: 'budget',
  initialState: {
    monthlyLimit: 0,
  },
  reducers: {
    setBudget: (state, action) => {
      state.monthlyLimit = Number(action.payload) || 0
    },
  },
})

export const { setBudget } = budgetSlice.actions
export default budgetSlice.reducer
