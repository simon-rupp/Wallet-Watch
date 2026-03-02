import { useTransactionsContext } from "../hooks/useTransactionsContext"


// make a div that displays the total cash flow (income - expenses)

const CashFlow = () => {

    const {transactions} = useTransactionsContext()

    const cashFlowCalculator = (transactions) => {
        let cashFlow = 0;
        
        if (!transactions) return cashFlow
        transactions.forEach((transaction) => {
            if (transaction.type === "income") {
                cashFlow += transaction.amount
            }
            else {
                cashFlow -= transaction.amount
            }
        })
        const truncate = (num) => {
            return Math.trunc(num * 100) / 100
        }
        cashFlow = truncate(cashFlow)


        return cashFlow
    }

    const formatCashFlow = (cashFlow) => {
        return cashFlow.toLocaleString(undefined, {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
      };

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
        <div className="cashFlow">
            <h2>Cash Flow</h2>
            <h3>{negativeSign(cashFlowCalculator(transactions))}{formatCashFlow(handleNegative(cashFlowCalculator(transactions)))}</h3>
        </div>
    )
}

export default CashFlow