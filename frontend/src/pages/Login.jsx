// Login page

import { useState } from "react";
import { Link } from "react-router-dom";
import { useLogin } from "../hooks/useLogin";

const Login = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const { error, login } = useLogin();
    
    
    
    
    
    // Login function
    const onSubmit = async (e) => {
        e.preventDefault();
        await login(username, password);
    };
    
    return (
        
        <div className="loginPageDiv">
            <form onSubmit={(e) => onSubmit(e)} className="loginForm">
            <h2 className="loginRegisterTitle">Login</h2>
                <label>Username:</label>
                <input
                    type="text"
                    placeholder="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
                <label>Password:</label>
                <input
                    type="password"
                    placeholder="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button className="loginButton">Login</button>
                {error && <p className="error">{error}</p>}
            </form>
            <p className="linkToRegister">
            Don't have an account? <Link to="/register">Register</Link>
            </p>
        </div>
    );
}

export default Login;