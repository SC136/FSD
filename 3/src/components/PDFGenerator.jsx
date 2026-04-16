import { useState } from 'react'
import { sendReportByEmail } from '../services/EmailService'

const formatMoney = (value) => `$${Number(value).toFixed(2)}`

const drawSummary = (pdf, summary, periodLabel) => {
  pdf.setFontSize(18)
  pdf.text('Personal Finance Report', 14, 18)

  pdf.setFontSize(11)
  pdf.setTextColor(90)
  pdf.text(`Period: ${periodLabel}`, 14, 26)
  pdf.text(`Generated: ${new Date().toLocaleString()}`, 14, 32)

  pdf.setTextColor(20)
  pdf.setFontSize(12)
  pdf.text(`Total Income: ${formatMoney(summary.totalIncome)}`, 14, 44)
  pdf.text(`Total Expenses: ${formatMoney(summary.totalExpenses)}`, 14, 52)
  pdf.text(`Balance: ${formatMoney(summary.balance)}`, 14, 60)
}

const drawTransactions = (pdf, transactions) => {
  let y = 74

  pdf.setFontSize(13)
  pdf.text('Transactions', 14, y)
  y += 8

  pdf.setFontSize(10)
  transactions.forEach((transaction, index) => {
    if (y > 278) {
      pdf.addPage()
      y = 16
    }

    const row = `${index + 1}. ${new Date(transaction.date).toLocaleDateString()} | ${transaction.category} | ${transaction.type.toUpperCase()} | ${formatMoney(transaction.amount)}${transaction.note ? ` | ${transaction.note}` : ''}`
    const wrapped = pdf.splitTextToSize(row, 180)
    pdf.text(wrapped, 14, y)
    y += wrapped.length * 5 + 2
  })
}

export const buildReportPdfBlob = async ({ transactions, summary, periodLabel, reportElement }) => {
  const [{ jsPDF }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ])

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  drawSummary(pdf, summary, periodLabel)
  drawTransactions(pdf, transactions)

  if (reportElement) {
    const canvas = await html2canvas(reportElement, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
    })

    const imageData = canvas.toDataURL('image/png')
    const imageProps = pdf.getImageProperties(imageData)
    const pageWidth = 180
    const renderedHeight = (imageProps.height * pageWidth) / imageProps.width

    pdf.addPage()
    pdf.setFontSize(13)
    pdf.text('Report Snapshot', 14, 16)
    pdf.addImage(imageData, 'PNG', 14, 22, pageWidth, Math.min(renderedHeight, 250))
  }

  return pdf.output('blob')
}

function PDFGenerator({ transactions, summary, periodLabel, reportRef }) {
  const [recipientEmail, setRecipientEmail] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [isSending, setIsSending] = useState(false)

  const handleDownload = async () => {
    if (transactions.length === 0) {
      setStatusMessage('Add transactions in the selected range before generating a report.')
      return
    }

    const blob = await buildReportPdfBlob({
      transactions,
      summary,
      periodLabel,
      reportElement: reportRef?.current,
    })

    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `finance-report-${new Date().toISOString().slice(0, 10)}.pdf`
    anchor.click()
    URL.revokeObjectURL(url)
    setStatusMessage('PDF generated successfully.')
  }

  const handleSend = async () => {
    if (!recipientEmail.trim()) {
      setStatusMessage('Enter a recipient email address first.')
      return
    }

    if (transactions.length === 0) {
      setStatusMessage('No transactions found for the selected range.')
      return
    }

    setIsSending(true)
    setStatusMessage('Preparing report...')

    try {
      const blob = await buildReportPdfBlob({
        transactions,
        summary,
        periodLabel,
        reportElement: reportRef?.current,
      })

      await sendReportByEmail({
        recipientEmail: recipientEmail.trim(),
        pdfBlob: blob,
        summary,
        periodLabel,
      })

      setStatusMessage('Report email sent successfully.')
    } catch (error) {
      setStatusMessage(error.message || 'Failed to send report email.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <section className="card report-actions">
      <h2>Export And Share</h2>
      <p>Download the current report as PDF, then optionally email it to a recipient.</p>

      <div className="inline-actions report-buttons">
        <button type="button" onClick={handleDownload}>
          Download PDF
        </button>
      </div>

      <div className="email-controls">
        <label htmlFor="report-email">Recipient Email</label>
        <input
          id="report-email"
          type="email"
          placeholder="name@example.com"
          value={recipientEmail}
          onChange={(event) => setRecipientEmail(event.target.value)}
        />
        <button type="button" onClick={handleSend} disabled={isSending}>
          {isSending ? 'Sending...' : 'Send Report'}
        </button>
      </div>

      {statusMessage && <p className="status-message">{statusMessage}</p>}
    </section>
  )
}

export default PDFGenerator
