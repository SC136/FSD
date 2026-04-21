const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const mongoUri = process.env.MONGODB_URI;
const alphaVantageApiKey = process.env.ALPHA_VANTAGE_API_KEY;
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

if (!mongoUri) {
  console.error('Missing MONGODB_URI. Set it in your environment before starting the server.');
  process.exit(1);
}

if (!alphaVantageApiKey) {
  console.warn('ALPHA_VANTAGE_API_KEY is missing. Finance news API requests will fail until it is configured.');
}

mongoose.connect(mongoUri)
  .then(async () => {
    console.log('MongoDB Connected');
    try {
      await seedDummyExpensesIfEmpty();
    } catch (seedError) {
      console.error('Failed to seed dummy expenses:', seedError.message);
    }
  })
  .catch(err  => console.log(err));

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?[0-9\-()\s]{7,20}$/;

const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [emailRegex, 'Please enter a valid email address']
    },
    phone: {
      type: String,
      required: [true, 'Phone is required'],
      trim: true,
      match: [phoneRegex, 'Please enter a valid phone number']
    }
  },
  { timestamps: true }
);

const Contact = mongoose.model('Contact', contactSchema);

const expenseSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0']
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      default: 'Other'
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      validate: {
        validator: value => value instanceof Date && !Number.isNaN(value.getTime()),
        message: 'Please enter a valid date'
      }
    }
  },
  { timestamps: true }
);

const Expense = mongoose.model('Expense', expenseSchema);

const dummyExpenses = [
  { amount: 245.5, category: 'Food', date: '2026-04-03' },
  { amount: 1200, category: 'Travel', date: '2026-04-05' },
  { amount: 1899, category: 'Bills', date: '2026-04-08' },
  { amount: 650, category: 'Shopping', date: '2026-04-10' },
  { amount: 320, category: 'Entertainment', date: '2026-04-13' },
  { amount: 480, category: 'Food', date: '2026-04-16' },
  { amount: 2300, category: 'Bills', date: '2026-04-18' },
  { amount: 150, category: 'Other', date: '2026-04-20' }
];

async function seedDummyExpensesIfEmpty() {
  const existingCount = await Expense.countDocuments();
  if (existingCount > 0) {
    return;
  }

  await Expense.insertMany(buildDummyExpenses());

  console.log(`Seeded ${dummyExpenses.length} dummy expenses.`);
}

function buildDummyExpenses() {
  return dummyExpenses.map((item) => ({
    ...item,
    date: new Date(item.date)
  }));
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function parsePagination(query) {
  const page = Math.max(parseInt(query.page, 10) || DEFAULT_PAGE, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  return { page, limit, skip: (page - 1) * limit };
}

function getSort(query, allowed, defaultField, defaultOrder = -1) {
  const field = allowed.includes(query.sortBy) ? query.sortBy : defaultField;
  const order = query.sortOrder === 'asc' ? 1 : query.sortOrder === 'desc' ? -1 : defaultOrder;
  return { [field]: order };
}

function parseDateRange(startDate, endDate) {
  const range = {};
  if (startDate) {
    const parsedStartDate = new Date(startDate);
    if (Number.isNaN(parsedStartDate.getTime())) {
      return { error: 'Invalid startDate. Use YYYY-MM-DD.' };
    }
    range.$gte = parsedStartDate;
  }
  if (endDate) {
    const parsedEndDate = new Date(endDate);
    if (Number.isNaN(parsedEndDate.getTime())) {
      return { error: 'Invalid endDate. Use YYYY-MM-DD.' };
    }
    parsedEndDate.setHours(23, 59, 59, 999);
    range.$lte = parsedEndDate;
  }
  return { value: range };
}

function buildExpenseFilters(query) {
  const filters = {};
  const category = (query.category || '').trim();
  if (category) {
    filters.category = category;
  }

  const dateRange = parseDateRange(query.startDate, query.endDate);
  if (dateRange.error) {
    return { error: dateRange.error };
  }

  if (Object.keys(dateRange.value).length > 0) {
    filters.date = dateRange.value;
  }

  return { value: filters };
}

function handleApiError(err, res) {
  if (err?.name === 'ValidationError') {
    const firstMessage = Object.values(err.errors)[0]?.message || 'Validation failed';
    return res.status(400).json({ error: firstMessage });
  }

  if (err?.code === 11000) {
    return res.status(409).json({ error: 'A contact with this email already exists' });
  }

  if (err?.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid data format in request' });
  }

  return res.status(500).json({ error: 'Internal server error' });
}

// GET /api/finance-news — proxy Alpha Vantage NEWS_SENTIMENT feed
app.get('/api/finance-news', async (req, res) => {
  try {
    if (!alphaVantageApiKey) {
      return res.status(500).json({ error: 'ALPHA_VANTAGE_API_KEY is not configured on the server.' });
    }

    const params = new URLSearchParams({
      function: 'NEWS_SENTIMENT',
      apikey: alphaVantageApiKey
    });

    const acceptedParams = ['tickers', 'topics', 'time_from', 'time_to', 'sort', 'limit'];

    acceptedParams.forEach((param) => {
      const value = req.query[param];
      if (typeof value === 'string' && value.trim()) {
        params.set(param, value.trim());
      }
    });

    if (!params.has('sort')) {
      params.set('sort', 'LATEST');
    }

    if (!params.has('limit')) {
      params.set('limit', '25');
    }

    const upstreamResponse = await fetch(`https://www.alphavantage.co/query?${params.toString()}`);
    const data = await upstreamResponse.json();

    if (!upstreamResponse.ok) {
      return res.status(upstreamResponse.status).json({ error: 'Failed to fetch finance news from Alpha Vantage.' });
    }

    if (data?.['Error Message']) {
      return res.status(400).json({ error: data['Error Message'] });
    }

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Unexpected server error while fetching finance news.' });
  }
});

// POST /contacts — Add contact
app.post('/contacts', async (req, res) => {
  try {
    const contact = new Contact({
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone
    });
    await contact.save();
    res.status(201).json(contact);
  } catch (err) {
    handleApiError(err, res);
  }
});

// GET /contacts — Get all contacts
app.get('/contacts', async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const sort = getSort(req.query, ['name', 'email', 'createdAt'], 'name', 1);

    const filters = {};
    const search = (req.query.search || '').trim();
    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const [contacts, total] = await Promise.all([
      Contact.find(filters).sort(sort).skip(skip).limit(limit),
      Contact.countDocuments(filters)
    ]);

    res.json({
      data: contacts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1
      }
    });
  } catch (err) {
    handleApiError(err, res);
  }
});

// PUT /contacts/:id — Update contact by ID
app.put('/contacts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid contact ID' });
    }

    const updated = await Contact.findByIdAndUpdate(
      id,
      {
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    return res.json(updated);
  } catch (err) {
    return handleApiError(err, res);
  }
});

// DELETE /contacts/:id — Delete contact
app.delete('/contacts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid contact ID' });
    }

    const deleted = await Contact.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json({ message: 'Contact deleted successfully' });
  } catch (err) {
    handleApiError(err, res);
  }
});

// POST /expenses — Add a new expense
app.post('/expenses', async (req, res) => {
  try {
    const expense = new Expense({
      amount: req.body.amount,
      category: req.body.category,
      date: req.body.date
    });
    await expense.save();
    res.status(201).json(expense);
  } catch (err) {
    handleApiError(err, res);
  }
});

// POST /expenses/seed — Insert dummy expenses on demand
app.post('/expenses/seed', async (req, res) => {
  try {
    const inserted = await Expense.insertMany(buildDummyExpenses());
    return res.status(201).json({
      message: 'Dummy expenses added successfully',
      insertedCount: inserted.length
    });
  } catch (err) {
    return handleApiError(err, res);
  }
});

// GET /expenses — Retrieve all expenses (newest first)
app.get('/expenses', async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const sort = getSort(req.query, ['date', 'amount', 'category', 'createdAt'], 'date', -1);

    const filtersResult = buildExpenseFilters(req.query);
    if (filtersResult.error) {
      return res.status(400).json({ error: filtersResult.error });
    }
    const filters = filtersResult.value;

    const [expenses, total] = await Promise.all([
      Expense.find(filters).sort(sort).skip(skip).limit(limit),
      Expense.countDocuments(filters)
    ]);

    return res.json({
      data: expenses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1
      }
    });
  } catch (err) {
    return handleApiError(err, res);
  }
});

// GET /expenses/export.csv — Export filtered expenses as CSV
app.get('/expenses/export.csv', async (req, res) => {
  try {
    const sort = getSort(req.query, ['date', 'amount', 'category', 'createdAt'], 'date', -1);
    const filtersResult = buildExpenseFilters(req.query);

    if (filtersResult.error) {
      return res.status(400).json({ error: filtersResult.error });
    }

    const expenses = await Expense.find(filtersResult.value).sort(sort);
    const header = 'amount,category,date';
    const rows = expenses.map((expense) => {
      const isoDate = new Date(expense.date).toISOString().slice(0, 10);
      const safeCategory = String(expense.category || '').replace(/"/g, '""');
      return `${expense.amount},"${safeCategory}",${isoDate}`;
    });

    const csv = [header, ...rows].join('\n');
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="expenses-${timestamp}.csv"`);
    return res.status(200).send(csv);
  } catch (err) {
    return handleApiError(err, res);
  }
});

// PUT /expenses/:id — Update an expense by ID
app.put('/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid expense ID' });
    }

    const updated = await Expense.findByIdAndUpdate(
      id,
      {
        amount: req.body.amount,
        category: req.body.category,
        date: req.body.date
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    return res.json(updated);
  } catch (err) {
    return handleApiError(err, res);
  }
});

// DELETE /expenses/:id — Remove an expense by ID
app.delete('/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid expense ID' });
    }

    const deleted = await Expense.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json({ message: 'Expense deleted successfully' });
  } catch (err) {
    handleApiError(err, res);
  }
});

// GET /expenses/analytics — monthly totals, category breakdown, and recent 7-day trend
app.get('/expenses/analytics', async (req, res) => {
  try {
    const match = {};

    const category = (req.query.category || '').trim();
    if (category) {
      match.category = category;
    }

    const dateRange = parseDateRange(req.query.startDate, req.query.endDate);
    if (dateRange.error) {
      return res.status(400).json({ error: dateRange.error });
    }
    if (Object.keys(dateRange.value).length > 0) {
      match.date = dateRange.value;
    }

    const [monthlyTotals, categoryBreakdown, dailyRaw, topExpenses, transactionCount] = await Promise.all([
      Expense.aggregate([
        { $match: match },
        {
          $group: {
            _id: {
              year: { $year: '$date' },
              month: { $month: '$date' }
            },
            total: { $sum: '$amount' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        {
          $project: {
            _id: 0,
            label: {
              $concat: [
                { $toString: '$_id.year' },
                '-',
                {
                  $cond: [
                    { $lt: ['$_id.month', 10] },
                    { $concat: ['0', { $toString: '$_id.month' }] },
                    { $toString: '$_id.month' }
                  ]
                }
              ]
            },
            total: { $round: ['$total', 2] }
          }
        }
      ]),
      Expense.aggregate([
        { $match: match },
        {
          $group: {
            _id: '$category',
            total: { $sum: '$amount' }
          }
        },
        { $sort: { total: -1 } },
        {
          $project: {
            _id: 0,
            category: { $ifNull: ['$_id', 'Other'] },
            total: { $round: ['$total', 2] }
          }
        }
      ]),
      Expense.aggregate([
        {
          $match: {
            ...match,
            date: {
              $gte: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
              $lte: new Date()
            }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$date' },
              month: { $month: '$date' },
              day: { $dayOfMonth: '$date' }
            },
            total: { $sum: '$amount' }
          }
        },
        {
          $project: {
            _id: 0,
            key: {
              $concat: [
                { $toString: '$_id.year' },
                '-',
                {
                  $cond: [
                    { $lt: ['$_id.month', 10] },
                    { $concat: ['0', { $toString: '$_id.month' }] },
                    { $toString: '$_id.month' }
                  ]
                },
                '-',
                {
                  $cond: [
                    { $lt: ['$_id.day', 10] },
                    { $concat: ['0', { $toString: '$_id.day' }] },
                    { $toString: '$_id.day' }
                  ]
                }
              ]
            },
            total: { $round: ['$total', 2] }
          }
        }
      ]),
      Expense.find(match)
        .sort({ amount: -1, date: -1 })
        .limit(5)
        .select('amount category date')
        .lean(),
      Expense.countDocuments(match)
    ]);

    const dailyMap = new Map(dailyRaw.map(item => [item.key, item.total]));
    const recent7Days = [];
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      recent7Days.push({
        label: key,
        total: dailyMap.get(key) || 0
      });
    }

    const totalSpent = categoryBreakdown.reduce((sum, item) => sum + item.total, 0);
    const topCategory = categoryBreakdown[0]?.category || 'N/A';
    const latestMonthTotal = monthlyTotals[monthlyTotals.length - 1]?.total || 0;
    const previousMonthTotal = monthlyTotals[monthlyTotals.length - 2]?.total || 0;

    let monthChangePercent = null;
    if (previousMonthTotal > 0) {
      monthChangePercent = Number((((latestMonthTotal - previousMonthTotal) / previousMonthTotal) * 100).toFixed(2));
    }

    const summary = {
      totalSpent: Number(totalSpent.toFixed(2)),
      transactionCount,
      topCategory,
      latestMonthTotal,
      previousMonthTotal,
      monthChangePercent
    };

    return res.json({ monthlyTotals, categoryBreakdown, recent7Days, topExpenses, summary });
  } catch (err) {
    return handleApiError(err, res);
  }
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
