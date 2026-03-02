import { useState } from "react";
import { useAuthContext } from "../hooks/useAuthContext";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";

export const useLogin = () => {
    const navigate = useNavigate();
    const { dispatch } = useAuthContext();
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const login = async (username, password) => {
        setLoading(true);
        setError(null);

        try {
            const response = await apiFetch("/api/user/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            const json = await response.json();

            if (!response.ok) {
                setError(json.error || "Login failed");
                setLoading(false);
                return;
            }

            // save user to local storage
            localStorage.setItem("user", JSON.stringify(json));
            setError(null);
            setLoading(false);
            dispatch({ type: "LOGIN", payload: json });
            navigate("/");
        } catch (err) {
            setError(err.message || "Network error");
            setLoading(false);
        }
    }

    return { error, loading, login };

}
