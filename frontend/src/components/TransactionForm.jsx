import { useState } from "react";
import { useTransactionsContext } from "../hooks/useTransactionsContext";
import { useAuthContext } from "../hooks/useAuthContext";
import { apiFetch } from "../lib/api";

const categories = [
  "Rent",
  "Taxes",
  "Utilities",
  "Mortgage",
  "Health",
  "Savings",
  "Bills",
  "Travel",
  "Fees",
  "Food and Drink",
  "Shopping",
  "Entertainment",
  "Personal Care",
  "Transfer",
  "Income",
  "Uncategorized",
];

const TransactionForm = () => {
  const { dispatch } = useTransactionsContext();
  const { user } = useAuthContext();

  const [name, setName] = useState("");
  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Rent");
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!user) {
      setError("Please login to add a transaction.");
      return;
    }

    const transaction = { name, type, amount, category };

    try {
      const response = await apiFetch("/api/transactions", {
        method: "POST",
        body: JSON.stringify(transaction),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      });
      const json = await response.json();

      if (!response.ok) {
        setError(json.error || "Failed to add transaction.");
        return;
      }

      setError(null);
      setName("");
      setType("expense");
      setAmount("");
      setCategory("Rent");
      dispatch({ type: "CREATE_TRANSACTION", payload: json });
    } catch (requestError) {
      setError(requestError.message || "Failed to add transaction.");
    }
  };

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      <div className="form-card-header">
        <p className="eyebrow">Manual Entry</p>
        <h2>Add Transaction</h2>
      </div>

      <div className="form-grid">
        <label className="field">
          <span>Transaction Name</span>
          <input
            type="text"
            onChange={(event) => setName(event.target.value)}
            value={name}
            placeholder="e.g. Monthly Rent"
            required
          />
        </label>

        <label className="field">
          <span>Type</span>
          <select
            onChange={(event) => setType(event.target.value)}
            value={type}
            required
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </label>

        <label className="field">
          <span>Category</span>
          <select
            onChange={(event) => setCategory(event.target.value)}
            value={category}
            required
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Amount (USD)</span>
          <input
            type="number"
            min="0"
            step="0.01"
            onChange={(event) => setAmount(event.target.value)}
            value={amount}
            placeholder="0.00"
            required
          />
        </label>
      </div>

      <button className="primary-button form-submit" type="submit">
        Add Transaction
      </button>

      {error && <p className="status-message status-error">{error}</p>}
    </form>
  );
};

export default TransactionForm;
