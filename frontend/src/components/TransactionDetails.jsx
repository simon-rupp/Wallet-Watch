import { useTransactionsContext } from "../hooks/useTransactionsContext"
import { useAuthContext } from '../hooks/useAuthContext'
import { apiFetch } from "../lib/api"

const TransactionDetails = ({ transaction }) => {
    const formattedDate = new Date(transaction.date || transaction.createdAt).toLocaleDateString();
    const {dispatch} = useTransactionsContext()
    const {user} = useAuthContext()
    
    const colorChanger = () => {
        let condition = false
        if (transaction.type === "expense") {
            condition = true
        }
        return condition
    }

    const handleClick = async () => {
        if (!user){
            return
        }
        try {
            const res = await apiFetch(`/api/transactions/${transaction._id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${user.token}`
                }
            })
            const data = await res.json()
            if (res.ok) {
                dispatch({type: "DELETE_TRANSACTION", payload: data})
            }
        } catch (err) {
            console.error("Failed to delete transaction", err)
        }
        
    }  

    const handleAmount = (amount) => {
        return parseFloat(amount).toFixed(2)
    }
    
    return (
        <div className="transaction-details">
            <h3>{transaction.name}</h3>
            <p className="Amount">
                Amount: <span style={{ color: colorChanger() ? "#cb0808" : "#1bad7a" }}>$</span>
                <span style={{ color: colorChanger() ? "#cb0808" : "#1bad7a" }}>
                    {handleAmount(transaction.amount)}
                </span>
            </p>
            <br/>
            <span className="category">{transaction.category[0]}</span>
            <p className="date">{formattedDate}</p>
            
            <span className="deleteButton" onClick={handleClick}>Delete</span>
        </div>
    )
}

export default TransactionDetails
