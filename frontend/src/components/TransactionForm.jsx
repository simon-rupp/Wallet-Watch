import { useState } from 'react'
import { useTransactionsContext } from "../hooks/useTransactionsContext"
import { useAuthContext } from '../hooks/useAuthContext'
import { apiFetch } from "../lib/api"

const TransactionFrom = () => {
    const {dispatch} = useTransactionsContext()
    const [name, setName] = useState('')
    const [type, setType] = useState('expense')
    const [amount, setAmount] = useState('')
    const [category, setCategory] = useState('Rent')
    const [error, setError] = useState(null)
    //const [emptyFeilds, setEmptyFeilds] = useState(null)


    const {user} = useAuthContext()
    
    const handleSubmit = async (e) => {
        e.preventDefault()
        
        if (!user) {
            setError("Please login to add a transaction")
            return
        }
        const transaction = { name, type, amount, category }

        try {
            const res = await apiFetch('/api/transactions', {
                method: 'POST',
                body: JSON.stringify(transaction),
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`  
                }
            })

            const json = await res.json()

            if (!res.ok) {
                setError(json.error || "Failed to add transaction")
                //setEmptyFeilds(json.emptyFeilds)
                return
            } 

            setError(null)
            setName('')
            setType('expense')
            setAmount('')
            setCategory('Rent')
            //setEmptyFeilds(null)
            console.log("new transaction added", json)
            dispatch({type: "CREATE_TRANSACTION", payload: json})
        } catch (err) {
            setError(err.message || "Failed to add transaction")
        }
    }    

    return (
        <form className="create" onSubmit={handleSubmit}>
            <h2>Add New Transaction</h2>
            <label>Transaction Name:</label>
            <input
                type="text"
                onChange={(e) => setName(e.target.value)}
                value={name}
            />

            <label>Transaction Type:</label>
            <select
                onChange={(e) => setType(e.target.value)}
                value={type}
            >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
            </select>
            <label>Category:</label>
            <select onChange={(e) => setCategory(e.target.value)} value={category}>

                <option value="Rent">Rent</option>
                <option value="Taxes">Taxes</option>
                <option value="Utilities">Utilities</option>
                <option value="Mortgage">Mortgage</option>
                <option value="Health">Health</option>
                <option value="Savings">Savings</option>
                <option value="Bills">Bills</option>
                <option value="Travel">Travel</option>
                <option value="Fees">Fees</option>
                <option value="Food and Drink">Food and Drink</option>
                <option value="Shopping">Shopping</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Personal Care">Personal Care</option>
                <option value="Transfer">Transfer</option>
                <option value="Income">Income</option>
                <option value="Uncategorized">Uncategorized</option>

            </select>
            
            <label> Amount:</label>
            <input
                type="number"
                onChange={(e) => setAmount(e.target.value)}
                value={amount}
            />

            <button>Add Transaction</button>
            {error && <p className="error" style={{color: "#cb0808", fontSize: "0.9em"}}>{error}</p>}

        </form>
    )

}

export default TransactionFrom
