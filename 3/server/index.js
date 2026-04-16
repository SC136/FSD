import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { Resend } from 'resend'

const app = express()
const port = Number(process.env.PORT || 8787)

app.use(cors())
app.use(express.json({ limit: '15mb' }))

const resendApiKey = process.env.RESEND_API_KEY
const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
const alphaVantageApiKey = process.env.ALPHA_VANTAGE_API_KEY

if (!resendApiKey) {
  console.warn('RESEND_API_KEY is missing. Email API requests will fail until it is configured.')
}

if (!alphaVantageApiKey) {
  console.warn('ALPHA_VANTAGE_API_KEY is missing. Finance news API requests will fail until it is configured.')
}

const resend = resendApiKey ? new Resend(resendApiKey) : null

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'finverse-email-api' })
})

app.get('/api/finance-news', async (req, res) => {
  try {
    if (!alphaVantageApiKey) {
      return res.status(500).json({ error: 'ALPHA_VANTAGE_API_KEY is not configured on the server.' })
    }

    const params = new URLSearchParams({
      function: 'NEWS_SENTIMENT',
      apikey: alphaVantageApiKey,
    })

    const acceptedParams = ['tickers', 'topics', 'time_from', 'time_to', 'sort', 'limit']

    acceptedParams.forEach((param) => {
      const value = req.query[param]

      if (typeof value === 'string' && value.trim()) {
        params.set(param, value.trim())
      }
    })

    if (!params.has('sort')) {
      params.set('sort', 'LATEST')
    }

    if (!params.has('limit')) {
      params.set('limit', '50')
    }

    const upstreamResponse = await fetch(`https://www.alphavantage.co/query?${params.toString()}`)
    const data = await upstreamResponse.json()

    if (!upstreamResponse.ok) {
      return res.status(upstreamResponse.status).json({ error: 'Failed to fetch news from Alpha Vantage.' })
    }

    if (data?.['Error Message']) {
      return res.status(400).json({ error: data['Error Message'] })
    }

    return res.json(data)
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Unexpected server error while fetching finance news.' })
  }
})

app.post('/api/send-report', async (req, res) => {
  try {
    const {
      recipientEmail,
      periodLabel,
      summary,
      pdfBase64,
      reportFileName = `finance-report-${new Date().toISOString().slice(0, 10)}.pdf`,
    } = req.body || {}

    if (!resendApiKey) {
      return res.status(500).json({ error: 'RESEND_API_KEY is not configured on the server.' })
    }

    if (!recipientEmail || !pdfBase64 || !summary) {
      return res.status(400).json({ error: 'Missing required fields: recipientEmail, summary, pdfBase64.' })
    }

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
        <h2>Personal Finance Report</h2>
        <p><strong>Period:</strong> ${periodLabel || 'Custom range'}</p>
        <ul>
          <li><strong>Total Income:</strong> $${Number(summary.totalIncome || 0).toFixed(2)}</li>
          <li><strong>Total Expenses:</strong> $${Number(summary.totalExpenses || 0).toFixed(2)}</li>
          <li><strong>Balance:</strong> $${Number(summary.balance || 0).toFixed(2)}</li>
        </ul>
        <p>Your PDF report is attached.</p>
      </div>
    `

    const emailResult = await resend.emails.send({
      from: fromEmail,
      to: recipientEmail,
      subject: `Finance Report - ${periodLabel || 'Custom Range'}`,
      html,
      attachments: [
        {
          filename: reportFileName,
          content: pdfBase64,
        },
      ],
    })

    if (emailResult.error) {
      return res.status(500).json({ error: emailResult.error.message || 'Failed to send email with Resend.' })
    }

    return res.json({ ok: true, id: emailResult.data?.id ?? null })
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Unexpected server error while sending email.' })
  }
})

app.listen(port, () => {
  console.log(`Finverse email API running on http://localhost:${port}`)
})
