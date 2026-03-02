const Transaction = require('../models/transaction');
const mongoose = require('mongoose');

const VALID_TYPES = new Set(['income', 'expense']);
const NOT_FOUND_RESPONSE = { message: 'Transaction not found' };

const sort = (condition) => {
  if (condition === 'newest') {
    return { date: -1 };
  }
  if (condition === 'oldest') {
    return { date: 1 };
  }
  if (condition === 'highest') {
    return { amount: -1 };
  }
  if (condition === 'lowest') {
    return { amount: 1 };
  }
  if (condition === 'income') {
    return { type: -1 };
  }
  if (condition === 'expense') {
    return { type: 1 };
  }
  return { date: -1 };
};

const truncateAmount = (num) => Math.trunc(num * 100) / 100;

const normalizeCategory = (category) => {
  if (category === undefined) {
    return undefined;
  }
  if (Array.isArray(category)) {
    return category;
  }
  if (typeof category === 'string' && category.trim()) {
    return [category.trim()];
  }
  return null;
};

const validateCreatePayload = ({ name, type, amount, category }) => {
  const errors = [];
  const parsedAmount = Number(amount);
  const parsedCategory = normalizeCategory(category);

  if (!name || typeof name !== 'string' || !name.trim()) {
    errors.push('name');
  }
  if (!VALID_TYPES.has(type)) {
    errors.push('type');
  }
  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    errors.push('amount');
  }
  if (category !== undefined && parsedCategory === null) {
    errors.push('category');
  }

  return {
    errors,
    values: {
      name: typeof name === 'string' ? name.trim() : name,
      type,
      amount: truncateAmount(parsedAmount),
      category: parsedCategory,
    },
  };
};

const validateUpdatePayload = ({ name, type, amount, category }) => {
  const errors = [];
  const updates = {};

  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim()) {
      errors.push('name');
    } else {
      updates.name = name.trim();
    }
  }

  if (type !== undefined) {
    if (!VALID_TYPES.has(type)) {
      errors.push('type');
    } else {
      updates.type = type;
    }
  }

  if (amount !== undefined) {
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      errors.push('amount');
    } else {
      updates.amount = truncateAmount(parsedAmount);
    }
  }

  if (category !== undefined) {
    const parsedCategory = normalizeCategory(category);
    if (parsedCategory === null) {
      errors.push('category');
    } else {
      updates.category = parsedCategory;
    }
  }

  return { errors, updates };
};

// GET all transactions
const getAllTransactions = async (req, res) => {
  const userID = req.user._id.toString();
  const filter = req.query.sortBy;
  const transactions = await Transaction.find({ userID }).sort(sort(filter));
  res.status(200).json(transactions);
};

// GET a transaction
const getTransaction = async (req, res) => {
  const { id } = req.params;
  const userID = req.user._id.toString();

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json(NOT_FOUND_RESPONSE);
  }

  const transaction = await Transaction.findOne({ _id: id, userID });
  if (!transaction) {
    return res.status(404).json(NOT_FOUND_RESPONSE);
  }

  return res.status(200).json(transaction);
};

// POST a transaction
const createTransaction = async (req, res) => {
  const { errors, values } = validateCreatePayload(req.body);

  if (errors.length > 0) {
    return res.status(400).json({
      error: `Invalid field(s): ${errors.join(', ')}`,
      invalidFields: errors,
    });
  }

  try {
    const transaction = await Transaction.create({
      name: values.name,
      type: values.type,
      amount: values.amount,
      category: values.category,
      userID: req.user._id.toString(),
      date: new Date(),
    });
    return res.status(201).json(transaction);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

// DELETE a transaction
const deleteTransaction = async (req, res) => {
  const { id } = req.params;
  const userID = req.user._id.toString();

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json(NOT_FOUND_RESPONSE);
  }

  const transaction = await Transaction.findOneAndDelete({ _id: id, userID });
  if (!transaction) {
    return res.status(404).json(NOT_FOUND_RESPONSE);
  }

  return res.status(200).json(transaction);
};

// UPDATE a transaction
const updateTransaction = async (req, res) => {
  const { id } = req.params;
  const userID = req.user._id.toString();

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json(NOT_FOUND_RESPONSE);
  }

  const { errors, updates } = validateUpdatePayload(req.body);
  if (errors.length > 0) {
    return res.status(400).json({
      error: `Invalid field(s): ${errors.join(', ')}`,
      invalidFields: errors,
    });
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No valid fields were provided for update' });
  }

  const transaction = await Transaction.findOneAndUpdate({ _id: id, userID }, updates, {
    new: true,
    runValidators: true,
  });
  if (!transaction) {
    return res.status(404).json(NOT_FOUND_RESPONSE);
  }

  return res.status(200).json(transaction);
};

module.exports = {
  createTransaction,
  getAllTransactions,
  getTransaction,
  deleteTransaction,
  updateTransaction,
};
