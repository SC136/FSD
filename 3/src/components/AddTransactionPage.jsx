import { useState } from 'react'
import TransactionForm from './TransactionForm'
import TransactionList from './TransactionList'

function AddTransactionPage() {
  const [editingTransaction, setEditingTransaction] = useState(null)

  return (
    <main className="dashboard">
      <header className="page-header">
        <h1>Add And Manage Transactions</h1>
        <p>Capture income and expenses quickly, then edit or remove entries from the transaction list.</p>
      </header>

      <section className="layout-grid">
        <TransactionForm
          editingTransaction={editingTransaction}
          onCancelEdit={() => setEditingTransaction(null)}
        />
        <TransactionList onEdit={setEditingTransaction} />
      </section>
    </main>
  )
}

export default AddTransactionPage
