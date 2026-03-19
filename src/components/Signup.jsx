import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Signup() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [wallet, setWallet] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    // You can send data to backend here
    alert("Signup Successful!");
    navigate("/login"); // go to Login after signup
  };

  return (
    <div className="w-[430px] bg-cyan-50 p-8 rounded-2xl shadow-lg mx-auto mt-20">
      <h2 className="text-3xl font-semibold text-center mb-6">Signup</h2>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-3 border-b-2 border-gray-300 outline-none focus:border-cyan-500 placeholder-gray-400"
        />
        <input
          type="text"
          placeholder="Username"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-3 border-b-2 border-gray-300 outline-none focus:border-cyan-500 placeholder-gray-400"
        />
        <input
          type="text"
          placeholder="Wallet Address"
          required
          value={wallet}
          onChange={(e) => setWallet(e.target.value)}
          className="w-full p-3 border-b-2 border-gray-300 outline-none focus:border-cyan-500 placeholder-gray-400"
        />
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
        <input
          type="password"
          placeholder="Confirm Password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full p-3 border-b-2 border-gray-300 outline-none focus:border-cyan-500 placeholder-gray-400"
        />
        <button className="w-full p-3 bg-blue-400 text-white rounded-full text-lg font-medium hover:bg-blue-500 transition">
          Signup
        </button>
      </form>
      <p className="text-center text-gray-600 mt-4">
        Already have an account?{" "}
        <span
          onClick={() => navigate("/login")}
          className="text-cyan-600 hover:underline cursor-pointer"
        >
          Login
        </span>
      </p>
    </div>
  );
}

export default Signup;