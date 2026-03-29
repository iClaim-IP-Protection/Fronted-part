import {BrowserRouter, Route, Routes} from "react-router-dom"
import React, { useState } from "react";
import Dashboard from "./pages/Dashboard";
import RegisterIP from "./pages/RegisterIp";
import Login from "./components/Login";
import Signup from "./components/Signup";
import MyAssets from "./pages/MyAssets";
import MyProfile from "./pages/MyProfile";
import ConnectSolanaWallet from "./pages/ConnectSolanaWallet";
import Home from "./components/Home";
import AssetInfo from "./pages/AssetInfo";
import EditAsset from "./pages/EditAsset";
import AssetCertification from "./pages/AssetCertification";
import AssetConfirmation from "./pages/AssetConfirmation";


function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <BrowserRouter>
      <Routes>

      {/* signup */}

        <Route path="/signup" element={<Signup/>}/>
        {/* Login Page */}
        <Route path="/login" element={<Login/>} />
         

        {/* Home (MainPage) */}
        <Route path="/home" element={<Home/>} />
          
        {/* Dashboard */}
        
        <Route path="/dashboard" element={<Dashboard/>}/>
          
         <Route path="/connect-wallet" element={<ConnectSolanaWallet/>}/> 

        {/* Register ip */}
        <Route path="/RegisterIp" element={<RegisterIP/>}/>
        <Route path="/registerip" element={<RegisterIP/>}/>

        
        <Route path="/edit-asset/:assetId" element={<EditAsset/>}/>

        <Route path="/assets/:assetId/certify" element={<AssetCertification/>}/>

        <Route path="/assets/:assetId/confirmation" element={<AssetConfirmation/>}/>

        <Route path="/assets" element={<MyAssets/>}/>

        <Route path="/assets/:assetId" element={<AssetInfo/>}/>

        <Route path="/" element={<MyAssets/>}/>

        <Route path="/profile" element={<MyProfile/>}/>

      </Routes>
    </BrowserRouter>
  );
}

export default App;