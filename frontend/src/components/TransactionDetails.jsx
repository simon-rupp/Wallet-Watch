import { useTransactionsContext } from "../hooks/useTransactionsContext";
import { useAuthContext } from "../hooks/useAuthContext";
import { apiFetch } from "../lib/api";
import { formatCurrency, toNumber } from "../lib/finance";

const TransactionDetails = ({ transaction }) => {
  const { dispatch } = useTransactionsContext();
  const { user } = useAuthContext();

  const amount = toNumber(transaction.amount);
  const isExpense = transaction.type === "expense";
  const transactionDate = new Date(
    transaction.date || transaction.createdAt || Date.now()
  ).toLocaleDateString();
  const category = Array.isArray(transaction.category)
    ? transaction.category[0]
    : transaction.category;
  const categoryLabel = category || "Uncategorized";

  const handleDelete = async () => {
    if (!user) {
      return;
    }

    try {
      const response = await apiFetch(`/api/transactions/${transaction._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      const data = await response.json();

      if (response.ok) {
        dispatch({ type: "DELETE_TRANSACTION", payload: data });
      }
    } catch (error) {
      console.error("Failed to delete transaction", error);
    }
  };

  return (
    <article className="transaction-details">
      <div className="transaction-main">
        <div className="transaction-copy">
          <span
            className={`transaction-type-chip ${
              isExpense ? "chip-expense" : "chip-income"
            }`}
          >
            {isExpense ? "Expense" : "Income"}
          </span>
          <h3>{transaction.name}</h3>
          <p className="transaction-meta">
            <span>{categoryLabel}</span>
            <span>{transactionDate}</span>
          </p>
        </div>
        <p className={`transaction-amount ${isExpense ? "expense" : "income"}`}>
          {isExpense ? "-" : "+"}
          {formatCurrency(Math.abs(amount))}
        </p>
      </div>
      <button className="deleteButton" onClick={handleDelete} type="button">
        Delete
      </button>
    </article>
  );
};

export default TransactionDetails;
