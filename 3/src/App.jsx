import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useMemo, useState } from 'react'
import Dashboard from './components/Dashboard'
import AddTransactionPage from './components/AddTransactionPage'
import Reports from './components/Reports'
import FinanceNews from './components/FinanceNews'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import './App.css'

const routeTitles = {
  '/dashboard': 'Dashboard',
  '/add-transaction': 'Add Transaction',
  '/reports': 'Reports',
  '/finance-news': 'Finance News',
}

function AppShell() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const location = useLocation()

  const pageTitle = useMemo(() => routeTitles[location.pathname] ?? 'Personal Finance', [location.pathname])

  return (
    <div className="app-shell">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="app-content">
        <Navbar title={pageTitle} onOpenMenu={() => setIsSidebarOpen(true)} />
        <main key={location.pathname} className="page-container route-fade">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/add-transaction" element={<AddTransactionPage />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/finance-news" element={<FinanceNews />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}

export default App
