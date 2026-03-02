import { useTransactionsContext } from "../hooks/useTransactionsContext";
import { calculateTotals, formatCurrency } from "../lib/finance";

const SpendingDisplay = () => {
  const { transactions } = useTransactionsContext();
  const { spending } = calculateTotals(transactions);

  return (
    <article className="metric-card is-negative">
      <p className="metric-label">Total Spending</p>
      <h3 className="metric-value">{formatCurrency(spending)}</h3>
      <p className="metric-caption">Outgoing transactions</p>
    </article>
  );
};

export default SpendingDisplay;
