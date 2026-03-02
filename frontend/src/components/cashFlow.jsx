import { useTransactionsContext } from "../hooks/useTransactionsContext";
import { calculateTotals, formatCurrency } from "../lib/finance";

const CashFlow = () => {
  const { transactions } = useTransactionsContext();
  const { cashFlow } = calculateTotals(transactions);
  const isNegative = cashFlow < 0;

  return (
    <article className={`metric-card ${isNegative ? "is-negative" : "is-positive"}`}>
      <p className="metric-label">Cash Flow</p>
      <h3 className="metric-value">
        {isNegative ? "-" : ""}
        {formatCurrency(Math.abs(cashFlow))}
      </h3>
      <p className="metric-caption">Income minus expenses</p>
    </article>
  );
};

export default CashFlow;
