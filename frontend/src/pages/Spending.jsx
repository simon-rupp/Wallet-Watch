import { useEffect, useState } from "react";
import TransactionDetails from "../components/TransactionDetails";
import { useTransactionsContext } from "../hooks/useTransactionsContext";
import SpendingDisplay from "../components/SpendingDisplay";
import { useAuthContext } from "../hooks/useAuthContext";
import { apiFetch } from "../lib/api";

const Spending = () => {
  const { transactions, dispatch } = useTransactionsContext();
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await apiFetch("/api/transactions", {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const data = await response.json();

        if (response.ok) {
          dispatch({ type: "SET_TRANSACTIONS", payload: data });
        } else {
          setError(data.error || "Failed to load spending transactions.");
        }
      } catch (requestError) {
        setError(
          requestError.message || "Failed to load spending transactions."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [dispatch, user]);

  const spendingTransactions = transactions
    ? transactions.filter((transaction) => transaction.type === "expense")
    : [];

  return (
    <div className="insight-layout">
      <section className="panel transactions-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Insights</p>
            <h2>Spending Transactions</h2>
            <p className="panel-subtitle">
              Review your outgoing transactions by date and category.
            </p>
          </div>
        </div>

        {loading && (
          <p className="status-message status-neutral">Loading transactions...</p>
        )}
        {error && <p className="status-message status-error">{error}</p>}

        <div className="transaction-list">
          {spendingTransactions.map((transaction) => (
            <TransactionDetails key={transaction._id} transaction={transaction} />
          ))}

          {!loading && spendingTransactions.length === 0 && (
            <p className="status-message status-neutral">
              No spending transactions available.
            </p>
          )}
        </div>
      </section>

      <aside className="sidebar single-metric">
        <SpendingDisplay />
      </aside>
    </div>
  );
};

export default Spending;
