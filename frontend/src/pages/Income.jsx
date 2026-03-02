import { useEffect, useState } from "react"

import TransactionDetails from "../components/TransactionDetails"
import { useTransactionsContext } from "../hooks/useTransactionsContext"
import IncomeDisplay from "../components/IncomeDisplay"
import { useAuthContext } from "../hooks/useAuthContext"
import { apiFetch } from "../lib/api"


const Income = () => {

    const { transactions, dispatch } = useTransactionsContext()
    const { user } = useAuthContext()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)



    useEffect(() => {
        const fetchTransactions = async () => {
            if (!user) {
                return
            }

            setLoading(true)
            setError(null)

            try {
                const res = await apiFetch("/api/transactions", {
                    headers: {'Authorization': `Bearer ${user.token}`}
                  })
                const data = await res.json()
                if (res.ok) {
                    dispatch({type: "SET_TRANSACTIONS", payload: data})
                } else {
                    setError(data.error || "Failed to load income transactions")
                }
            } catch (err) {
                setError(err.message || "Failed to load income transactions")
            } finally {
                setLoading(false)
            }
        }

        fetchTransactions()
    }, [dispatch, user])

    const Expenses = transactions ? transactions.filter(transaction => transaction.type === "income") : []

    return (
        <div className="home">
            <div className="transactions">
                <h2>Your Income:</h2>
                {loading && <p style={{ color: "#414141", fontSize: "0.9em" }}>Loading transactions...</p>}
                {error && <p className="error" style={{color: "#cb0808", fontSize: "0.9em"}}>{error}</p>}
                
                {Expenses && Expenses.map(transaction => (
                    <TransactionDetails key = {transaction._id} transaction = {transaction}/>
                ))}

            </div>
            <div className="rightSide">
                <IncomeDisplay transactions = {transactions}></IncomeDisplay>
            </div>
        </div>
    )
}

export default Income
