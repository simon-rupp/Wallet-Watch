import { useCallback, useEffect, useState } from "react";
import TransactionDetails from "../components/TransactionDetails";
import TransactionForm from "../components/TransactionForm";
import CashFlow from "../components/cashFlow";
import SpendingDisplay from "../components/SpendingDisplay";
import IncomeDisplay from "../components/IncomeDisplay";
import { useTransactionsContext } from "../hooks/useTransactionsContext";
import { useAuthContext } from "../hooks/useAuthContext";
import { apiFetch } from "../lib/api";

const Home = () => {
  const { transactions, dispatch } = useTransactionsContext();
  const { user } = useAuthContext();

  const [filter, setFilter] = useState("newest");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const transactionsPerPage = 20;
  const totalTransactions = transactions?.length || 0;
  const startIndex = (currentPage - 1) * transactionsPerPage;
  const endIndex = startIndex + transactionsPerPage;
  const visibleTransactions = transactions?.slice(startIndex, endIndex) || [];

  const fetchTransactions = useCallback(async () => {
    if (!user) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiFetch(
        `/api/transactions?sortBy=${encodeURIComponent(filter)}`,
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to load transactions.");
        return;
      }

      dispatch({ type: "SET_TRANSACTIONS", payload: data });
    } catch (requestError) {
      setError(requestError.message || "Failed to load transactions.");
    } finally {
      setLoading(false);
    }
  }, [dispatch, filter, user]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  const handleSync = async (event) => {
    event.preventDefault();

    if (!user) {
      return;
    }

    setSyncLoading(true);
    setSyncError(null);

    try {
      const response = await apiFetch("/api/plaid/transactions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();

      if (!response.ok) {
        setSyncError(data.error || "Failed to sync transactions.");
        return;
      }

      setCurrentPage(1);
      await fetchTransactions();
    } catch (requestError) {
      setSyncError(requestError.message || "Failed to sync transactions.");
    } finally {
      setSyncLoading(false);
    }
  };

  const handleNextPage = () => {
    if (endIndex < totalTransactions) {
      setCurrentPage((previousPage) => previousPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((previousPage) => previousPage - 1);
    }
  };

  return (
    <div className="dashboard-layout">
      <section className="panel transactions-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Overview</p>
            <h2>Transactions</h2>
            <p className="panel-subtitle">
              Sync with linked banks or add manual entries to keep your ledger up
              to date.
            </p>
          </div>
          <button
            className="primary-button sync-button"
            onClick={handleSync}
            disabled={syncLoading || loading}
            type="button"
          >
            {syncLoading ? "Syncing..." : "Sync Connected Accounts"}
          </button>
        </div>

        {syncError && <p className="status-message status-error">{syncError}</p>}
        {error && <p className="status-message status-error">{error}</p>}
        {loading && (
          <p className="status-message status-neutral">Loading transactions...</p>
        )}

        <div className="toolbar">
          <label className="field-inline">
            <span>Sort by</span>
            <select
              className="sort-select"
              onChange={(event) => setFilter(event.target.value)}
              value={filter}
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
              <option value="highest">Highest</option>
              <option value="lowest">Lowest</option>
            </select>
          </label>
        </div>

        <div className="transaction-list">
          {visibleTransactions.map((transaction) => (
            <TransactionDetails key={transaction._id} transaction={transaction} />
          ))}

          {!loading && transactions && transactions.length === 0 && (
            <p className="status-message status-neutral">
              No transactions found yet.
            </p>
          )}
        </div>

        <div className="pagination-row">
          <button
            className="ghost-button"
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            type="button"
          >
            Previous
          </button>
          <p className="pageNumber">Page {currentPage}</p>
          <button
            className="ghost-button"
            onClick={handleNextPage}
            disabled={endIndex >= totalTransactions}
            type="button"
          >
            Next
          </button>
        </div>
      </section>

      <aside className="sidebar">
        <div className="metric-grid">
          <CashFlow />
          <IncomeDisplay />
          <SpendingDisplay />
        </div>
        <TransactionForm />
      </aside>
    </div>
  );
};

export default Home;
