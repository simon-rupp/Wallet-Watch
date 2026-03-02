import { useState } from "react";
import { useAuthContext } from "../hooks/useAuthContext";
import { apiFetch } from "../lib/api";

export const useRegister = () => {
    const { dispatch } = useAuthContext();
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    
    const register = async (username, password, confirmPassword) => {
        setLoading(true);
        setError(null);


        if (password !== confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }
        
        try {
            const response = await apiFetch("/api/user/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            const json = await response.json();

            if (!response.ok) {
                setError(json.error || "Registration failed");
                setLoading(false);
                return;
            }

            // save user to local storage
            localStorage.setItem("user", JSON.stringify(json));
            setError(null);
            setLoading(false);
            dispatch({ type: "LOGIN", payload: json });
        } catch (err) {
            setError(err.message || "Network error");
            setLoading(false);
        }

        
    }

    return { error, loading, register };
}
