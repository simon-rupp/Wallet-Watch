// Register page

import { useState } from "react";
import { Link } from "react-router-dom";
import { useRegister } from "../hooks/useRegister";

const Register = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("")
    const { error, register } = useRegister();     
    
    // Register function
    const onSubmit = async (e) => {

        e.preventDefault();
        await register(username, password, confirmPassword);
    };
    
    return (
        
        <div className="loginPageDiv">
            <form onSubmit={(e) => onSubmit(e)} className="registerForm">
            <h2 className="loginRegisterTitle">Register</h2>

                <label>Create Username:</label>
                <input
                    type="text"
                    placeholder="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
                <label>Create Password:</label>
                <input
                    type="password"
                    placeholder="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <label>Confirm Password:</label>
                <input
                    type="password"
                    placeholder="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                />
                <button className="loginButton">Register</button>
                {error && <p className="error">{error}</p>}
            </form>
            <p>Already have an account? <Link to="/login">Login</Link></p>
        </div>
    );
}

export default Register;