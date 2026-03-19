import { Link } from "react-router-dom";
import React from "react";

const dummyData = {
  
  total_ips: 5,
  verified_ips: 3,
  transfers: 2,
  ips: [
    { id: 1, name: "IP 1", status: "verified" },
    { id: 2, name: "IP 2", status: "pending" },
    { id: 3, name: "IP 3", status: "verified" },
    { id: 4, name: "IP 4", status: "pending" },
    { id: 5, name: "IP 5", status: "verified" },
    { id: 6, name: "IP 6", status: "verified" },
  ],
};

function HomePage() {
  const wallet = localStorage.getItem("wallet");
  const data=dummyData

  return (
    <div className="flex h-screen bg-gray-50">

      {/* Sidebar */}
      <div className="w-1/5 bg-blue-900 text-white p-6">
        <h1 className="text-2xl font-bold mb-10">iClaim</h1>
        <ul className="space-y-6">
          <li>
            <Link
              to="/dashboard"
              className="cursor-pointer hover:text-blue-300 transition"
            >
              Dashboard
            </Link>
          </li>
          <li>
            <Link
              to="/registerIp"
              className="cursor-pointer hover:text-blue-300 transition"
            >
              Register IP
            </Link>
          </li>
          <li>
            <Link
              to="/myAssets"
              className="cursor-pointer hover:text-blue-300 transition"
            >
              My Assets
            </Link>
          </li>
          <li>
            <Link
              to="/profile"
              className="cursor-pointer hover:text-blue-300 transition"
            >
              Profile
            </Link>
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="w-4/5 p-6 overflow-auto">

        {/* Wallet Section */}
        <div className="flex justify-center items-center bg-blue-100 p-4 rounded mb-6 shadow">
          <span className="font-medium text-blue-900">Wallet: {wallet || "Not Connected"}</span>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          <div className="bg-blue-200 text-blue-900 p-6 text-center rounded shadow hover:scale-105 transform transition">
            Total IPs: {data.total_ips}
          </div>
          <div className="bg-green-200 text-green-900 p-6 text-center rounded shadow hover:scale-105 transform transition">
            Verified IPs: {data.verified_ips}
          </div>
          <div className="bg-yellow-200 text-yellow-900 p-6 text-center rounded shadow hover:scale-105 transform transition">
            Transfers: {data.transfers}
          </div>
        </div>

        {/* IP Cards */}
        <div className="grid grid-cols-3 gap-6 mt-4">
          {data.ips.map((ip) => (
            <div
              key={ip.id}
              className={`p-6 rounded shadow transform transition hover:scale-105 ${
                ip.status === "verified" ? "bg-green-100 text-green-900" : "bg-yellow-100 text-yellow-900"
              }`}
            >
              <h2 className="font-semibold text-lg">{ip.name}</h2>
              <p>Status: {ip.status}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

export default HomePage;