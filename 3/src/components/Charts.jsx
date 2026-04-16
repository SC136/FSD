import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { selectCategoryExpenseTotals, selectMonthlyExpenses } from '../app/selectors'

const chartColors = ['#e76f51', '#2a9d8f', '#f4a261', '#264653', '#f94144', '#577590', '#43aa8b']

function Charts() {
  const categoryTotals = useSelector(selectCategoryExpenseTotals)
  const monthlyTotals = useSelector(selectMonthlyExpenses)

  const pieData = useMemo(
    () =>
      Object.entries(categoryTotals).map(([name, value]) => ({
        name,
        value,
      })),
    [categoryTotals],
  )

  const barData = useMemo(
    () =>
      Object.entries(monthlyTotals).map(([month, total]) => ({
        month,
        total,
      })),
    [monthlyTotals],
  )

  return (
    <section className="chart-grid">
      <article className="card chart-card">
        <h2>Category-Wise Expenses</h2>
        <div className="chart-wrap">
          {pieData.length === 0 ? (
            <p className="empty-state">Add expense transactions to see category breakdown.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} label>
                  {pieData.map((entry, index) => (
                    <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </article>

      <article className="card chart-card">
        <h2>Monthly Spending</h2>
        <div className="chart-wrap">
          {barData.length === 0 ? (
            <p className="empty-state">Add expense transactions to see monthly trends.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d8e0de" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                <Bar dataKey="total" fill="#2a9d8f" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </article>
    </section>
  )
}

export default Charts
