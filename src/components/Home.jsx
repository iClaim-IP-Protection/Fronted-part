import React from "react";
import Navbar from "./Navbar";
import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="h-screen w-screen flex flex-col">
      {/* Navbar */}
      <Navbar />

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-r from-blue-100 via-blue-200 to-blue-300">
        <div className="flex gap-16">
          {/* Register Button */}
          <button
            onClick={() => navigate("/signup")}
            className="px-12 py-5 text-lg font-semibold text-white rounded-xl
                       bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700
                       shadow-lg hover:scale-105 transform transition duration-300 ease-in-out"
          >
            Register User
          </button>

          {/* Login Button */}
          <button
            onClick={() => navigate("/login")}
            className="px-12 py-5 text-lg font-semibold text-white rounded-xl
                       bg-gradient-to-r from-cyan-500 via-cyan-600 to-cyan-700
                       shadow-lg hover:scale-105 transform transition duration-300 ease-in-out"
          >
            Login User
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home;