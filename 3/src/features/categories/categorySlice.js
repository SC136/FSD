import { createSlice } from '@reduxjs/toolkit'

const defaultCategories = [
  'Food',
  'Travel',
  'Bills',
  'Shopping',
  'Salary',
  'Health',
  'Entertainment',
  'Education',
  'Investment',
  'Other',
]

const categorySlice = createSlice({
  name: 'categories',
  initialState: defaultCategories,
  reducers: {
    addCategory: (state, action) => {
      const normalizedName = action.payload.trim()
      const exists = state.some((category) => category.toLowerCase() === normalizedName.toLowerCase())

      if (normalizedName && !exists) {
        state.push(normalizedName)
      }
    },
  },
})

export const { addCategory } = categorySlice.actions
export default categorySlice.reducer
