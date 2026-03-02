import { useTransactionsContext } from "../hooks/useTransactionsContext"


// make a div that displays the total spending (sum of all expenses)

const SpendingDisplay = () => {

    const {transactions} = useTransactionsContext()

    const spendingCalculator = (transactions) => {
        let cashFlow = 0;
        
        if (!transactions) return cashFlow
        transactions.forEach((transaction) => {
            if (transaction.type === "income") {
                cashFlow += 0;            
            } else {
                cashFlow -= transaction.amount
            }
        })
        const truncate = (num) => {
            return Math.trunc(num * 100) / 100
        }
        cashFlow = truncate(cashFlow)


        return cashFlow
    }

    const handleNegative = (cashFlow) => {
        if (cashFlow < 0) {
            return cashFlow * -1
        }
        else {
            return cashFlow
        }
    }

    const negativeSign = (cashFlow) => {
        if (cashFlow < 0) {
            return "-"
        }
        else {
            return ""
        }
    
    }

    return (
        <div className="spendingDisplay">
            <h2>Total</h2>
            <h3>{negativeSign(spendingCalculator(transactions))}${handleNegative(spendingCalculator(transactions))}</h3>
        </div>
    )
}

export default SpendingDisplay