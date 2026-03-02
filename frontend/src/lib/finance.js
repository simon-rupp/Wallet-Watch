const CURRENCY_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const formatCurrency = (value) => {
  return CURRENCY_FORMATTER.format(toNumber(value));
};

export const calculateTotals = (transactions) => {
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return {
      income: 0,
      spending: 0,
      cashFlow: 0,
    };
  }

  const totals = transactions.reduce(
    (accumulator, transaction) => {
      const amount = toNumber(transaction.amount);

      if (transaction.type === "income") {
        accumulator.income += amount;
      } else {
        accumulator.spending += amount;
      }

      return accumulator;
    },
    { income: 0, spending: 0 }
  );

  return {
    income: totals.income,
    spending: totals.spending,
    cashFlow: totals.income - totals.spending,
  };
};
