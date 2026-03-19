import {BrowserRouter, Route, Routes} from "react-router-dom"
import React, { useState } from "react";
import MainPage from "./components/MainPage";
import HomePage from "./pages/HomePage";
import RegisterIP from "./pages/RegisterIp";
import Login from "./components/Login";
import Signup from "./components/SignUp";
import MyAssets from "./pages/MyAssets";
import MyProfile from "./pages/MyProfile";
import ConnectSolanaWallet from "./pages/ConnectSolanaWallet";


function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <BrowserRouter>
      <Routes>

      {/* signup */}

        <Route path="/signup" element={<Signup/>}/>
        {/* Login Page */}
        <Route path="/login" element={<Login/>} />
         

        {/* Dashboard (MainPage) */}
        <Route path="/dashboard" element={<MainPage/>} />
          
        {/* Home Page */}
        
        <Route path="/HomePage" element={<HomePage/>}/>
          
         <Route path="/connect-wallet" element={<ConnectSolanaWallet/>}/> 

        {/* Register ip */}
        <Route path="/RegisterIp" element={<RegisterIP/>}/>

        
        <Route path="/" element={<Login/>}/>

        <Route path="/myAssets" element={<MyAssets/>}/>

        <Route path="/profile" element={<MyProfile/>}/>

      </Routes>
    </BrowserRouter>
  );
}

export default App;