import { useCallback, useEffect, useState } from "react"

import TransactionDetails from "../components/TransactionDetails"
import TransactionForm from "../components/TransactionForm"
import CashFlow from "../components/cashFlow"
import { useTransactionsContext } from "../hooks/useTransactionsContext"
import { useAuthContext } from "../hooks/useAuthContext"
import { apiFetch } from "../lib/api"


const Home = () => {
    
    const { transactions, dispatch } = useTransactionsContext()
    const { user } = useAuthContext()
    const [filter, setFilter] = useState("newest")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [syncLoading, setSyncLoading] = useState(false)
    const [syncError, setSyncError] = useState(null)
    
    const transactionsPerPage = 20;
    const [currentPage, setCurrentPage] = useState(1);

    const startIndex = (currentPage - 1) * transactionsPerPage;
    const endIndex = startIndex + transactionsPerPage;
    const totalTransactions = transactions?.length || 0;
    

    const handleNextPage = () => {
        if (endIndex < totalTransactions) {
          setCurrentPage(currentPage + 1);
        }
      };
    
      const handlePreviousPage = () => {
        if (currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
      };

    const fetchTransactions = useCallback(async () => {
        if (!user) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await apiFetch(`/api/transactions?sortBy=${encodeURIComponent(filter)}`, {
                headers: {'Authorization': `Bearer ${user.token}`}
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Failed to load transactions");
                return;
            }

            dispatch({type: "SET_TRANSACTIONS", payload: data});
        } catch (err) {
            setError(err.message || "Failed to load transactions");
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

    const onClick = async (event) => {
        event.preventDefault();

        if (!user) {
            return;
        }

        setSyncLoading(true);
        setSyncError(null);

        try {
            const res = await apiFetch("/api/plaid/transactions", {
                method: "POST",
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await res.json();

            if (!res.ok) {
                setSyncError(data.error || "Failed to sync transactions");
                return;
            }

            console.log("new transactions added", data);
            setCurrentPage(1);
            await fetchTransactions();
        } catch (err) {
            setSyncError(err.message || "Failed to sync transactions");
        } finally {
            setSyncLoading(false);
        }
    };

    return (
        <div className="home">
            
            <div className="transactions">
            
            <button className="syncButton" onClick={onClick} disabled={syncLoading || loading}>
               {syncLoading ? "Syncing Transactions..." : "Sync Transactions From Connected Banks"}
            </button>
            {syncError && <p className="error" style={{color: "#cb0808", fontSize: "0.9em"}}>{syncError}</p>}
            {error && <p className="error" style={{color: "#cb0808", fontSize: "0.9em"}}>{error}</p>}
            {loading && <p style={{ color: "#414141", fontSize: "0.9em" }}>Loading transactions...</p>}
            <div className="aboveTransactions">
                <h2 className="allTransactionsText">All Transactions:</h2>
                <div className="filter">
                    <p className="filterText"> Filter:</p>
                    <select className="sortButton" onChange={(e) => setFilter(e.target.value)}>
                        <option value="newest">Newest</option>
                        <option value="oldest">Oldest</option>
                        <option value="income">Income</option>
                        <option value="expense">Expense</option>
                        <option value="highest">Highest</option>
                        <option value="lowest">Lowest</option>
                    </select>
                </div>
            </div>
                {transactions && transactions.slice(startIndex, endIndex).map(transaction => (
                    <TransactionDetails key={transaction._id} transaction={transaction} />
                ))}
                {!loading && transactions && transactions.length === 0 && (
                    <p style={{ color: "#414141", fontSize: "0.9em" }}>No transactions found.</p>
                )}
                <button className="syncButton" onClick={handlePreviousPage} disabled={currentPage === 1}>Previous Page</button>
                <button className="syncButton" onClick={handleNextPage} disabled={endIndex >= totalTransactions}>Next Page</button>
                <p className="pageNumber">Page {currentPage}</p>
            </div>
            <div className="rightSide">
                <TransactionForm />
                <CashFlow transactions={transactions} />
            </div>    
        </div>
    )
}

export default Home
