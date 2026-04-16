import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { addTransaction, updateTransaction } from '../features/transactions/transactionSlice'
import { addCategory } from '../features/categories/categorySlice'
import { selectCategories } from '../app/selectors'

const getTodayDate = () => new Date().toISOString().slice(0, 10)

const initialFormState = {
  amount: '',
  type: 'expense',
  category: '',
  date: getTodayDate(),
  note: '',
}

function TransactionForm({ editingTransaction, onCancelEdit }) {
  const dispatch = useDispatch()
  const categories = useSelector(selectCategories)
  const [formValues, setFormValues] = useState(initialFormState)
  const [customCategory, setCustomCategory] = useState('')

  const isEditing = Boolean(editingTransaction)

  useEffect(() => {
    if (editingTransaction) {
      setFormValues({
        amount: String(editingTransaction.amount ?? ''),
        type: editingTransaction.type ?? 'expense',
        category: editingTransaction.category ?? '',
        date: editingTransaction.date ?? getTodayDate(),
        note: editingTransaction.note ?? '',
      })
      setCustomCategory('')
    } else {
      setFormValues(initialFormState)
    }
  }, [editingTransaction])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormValues((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddCategory = () => {
    const nextCategory = customCategory.trim()

    if (!nextCategory) {
      return
    }

    dispatch(addCategory(nextCategory))
    setFormValues((prev) => ({ ...prev, category: nextCategory }))
    setCustomCategory('')
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const amountValue = Number(formValues.amount)

    if (!amountValue || amountValue < 0 || !formValues.category || !formValues.date) {
      return
    }

    const payload = {
      amount: amountValue,
      type: formValues.type,
      category: formValues.category,
      date: formValues.date,
      note: formValues.note.trim(),
    }

    if (isEditing) {
      dispatch(updateTransaction({ id: editingTransaction.id, changes: payload }))
      onCancelEdit()
    } else {
      dispatch(addTransaction(payload))
    }

    setFormValues(initialFormState)
  }

  return (
    <section className="card">
      <h2>{isEditing ? 'Edit Transaction' : 'Add Transaction'}</h2>
      <form className="transaction-form" onSubmit={handleSubmit}>
        <label>
          Amount
          <input
            type="number"
            min="0"
            step="0.01"
            name="amount"
            value={formValues.amount}
            onChange={handleChange}
            placeholder="0.00"
            required
          />
        </label>

        <label>
          Type
          <select name="type" value={formValues.type} onChange={handleChange}>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </label>

        <label>
          Category
          <select name="category" value={formValues.category} onChange={handleChange} required>
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label>
          Date
          <input type="date" name="date" value={formValues.date} onChange={handleChange} required />
        </label>

        <label className="full-width">
          Note
          <input
            type="text"
            name="note"
            value={formValues.note}
            onChange={handleChange}
            placeholder="Optional description"
          />
        </label>

        <div className="inline-actions full-width">
          <input
            type="text"
            value={customCategory}
            onChange={(event) => setCustomCategory(event.target.value)}
            placeholder="Add custom category"
          />
          <button type="button" className="ghost" onClick={handleAddCategory}>
            Add Category
          </button>
        </div>

        <div className="inline-actions full-width">
          <button type="submit">{isEditing ? 'Save Changes' : 'Add Transaction'}</button>
          {isEditing && (
            <button type="button" className="ghost" onClick={onCancelEdit}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </section>
  )
}

export default TransactionForm
