const toBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })

export const sendReportByEmail = async ({ recipientEmail, pdfBlob, summary, periodLabel }) => {
  const endpoint = import.meta.env.VITE_REPORT_API_URL || 'http://localhost:8787/api/send-report'

  const pdfDataUrl = await toBase64(pdfBlob)
  const pdfBase64 = String(pdfDataUrl).split(',')[1] ?? ''

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      recipientEmail,
      periodLabel,
      summary,
      pdfBase64,
      reportFileName: `finance-report-${Date.now()}.pdf`,
    }),
  })

  if (!response.ok) {
    const result = await response.json().catch(() => ({}))
    throw new Error(result.error || 'Failed to send report email.')
  }
}
