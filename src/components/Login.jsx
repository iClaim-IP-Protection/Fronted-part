import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    // Dummy validation
    const dummyEmail = "sneha@gmail.com";
    const dummyPassword = "sneha";

    if (email === dummyEmail && password === dummyPassword) {
      
      navigate("/HomePage"); 
    } else {
      alert("Invalid email or password!");
    }
  };

  return (
    <div className="w-[430px] bg-cyan-50 p-8 rounded-2xl shadow-lg mx-auto mt-20">
      <h2 className="text-3xl font-semibold text-center mb-6">Login</h2>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email Address"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 border-b-2 border-gray-300 outline-none focus:border-cyan-500 placeholder-gray-400"
        />
        <input
          type="password"
          placeholder="Password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 border-b-2 border-gray-300 outline-none focus:border-cyan-500 placeholder-gray-400"
        />
        <button className="w-full p-3 bg-blue-400 text-white rounded-full text-lg font-medium hover:bg-blue-500 transition">
          Login
        </button>
      </form>
      <p className="text-center text-gray-600 mt-4">
        Don't have an account?{" "}
        <span
          onClick={() => navigate("/Signup")}
          className="text-cyan-600 hover:underline cursor-pointer"
        >
          Signup now
        </span>
      </p>
    </div>
  );
}

export default Login;