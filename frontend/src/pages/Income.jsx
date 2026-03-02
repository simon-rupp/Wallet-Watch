import { useEffect, useState } from "react";
import TransactionDetails from "../components/TransactionDetails";
import { useTransactionsContext } from "../hooks/useTransactionsContext";
import IncomeDisplay from "../components/IncomeDisplay";
import { useAuthContext } from "../hooks/useAuthContext";
import { apiFetch } from "../lib/api";

const Income = () => {
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
          setError(data.error || "Failed to load income transactions.");
        }
      } catch (requestError) {
        setError(requestError.message || "Failed to load income transactions.");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [dispatch, user]);

  const incomeTransactions = transactions
    ? transactions.filter((transaction) => transaction.type === "income")
    : [];

  return (
    <div className="insight-layout">
      <section className="panel transactions-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Insights</p>
            <h2>Income Transactions</h2>
            <p className="panel-subtitle">Track all incoming cash in one feed.</p>
          </div>
        </div>

        {loading && (
          <p className="status-message status-neutral">Loading transactions...</p>
        )}
        {error && <p className="status-message status-error">{error}</p>}

        <div className="transaction-list">
          {incomeTransactions.map((transaction) => (
            <TransactionDetails key={transaction._id} transaction={transaction} />
          ))}

          {!loading && incomeTransactions.length === 0 && (
            <p className="status-message status-neutral">
              No income transactions available.
            </p>
          )}
        </div>
      </section>

      <aside className="sidebar single-metric">
        <IncomeDisplay />
      </aside>
    </div>
  );
};

export default Income;
