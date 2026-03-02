import { useTransactionsContext } from "../hooks/useTransactionsContext";
import { calculateTotals, formatCurrency } from "../lib/finance";

const IncomeDisplay = () => {
  const { transactions } = useTransactionsContext();
  const { income } = calculateTotals(transactions);

  return (
    <article className="metric-card is-positive">
      <p className="metric-label">Total Income</p>
      <h3 className="metric-value">{formatCurrency(income)}</h3>
      <p className="metric-caption">Across all tracked transactions</p>
    </article>
  );
};

export default IncomeDisplay;
