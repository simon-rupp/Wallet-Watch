require('dotenv').config();

const express = require('express');
const cors = require('cors');
const transactionRoutes = require('./routes/transactions');
const userRoutes = require('./routes/user');
const plaidRoutes = require('./routes/plaid');

const app = express();

if (process.env.NODE_ENV !== 'test') {
  app.use((req, res, next) => {
    console.log(req.path, req.method);
    next();
  });
}

app.use(cors());
app.use(express.json());

app.use('/api/user', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/plaid', plaidRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

module.exports = app;
