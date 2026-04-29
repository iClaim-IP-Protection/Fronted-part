import {BrowserRouter, Route, Routes} from "react-router-dom"
import React, { useState } from "react";
import { WalletProvider } from "./context/WalletContext";
import { BlockchainProvider } from "./context/BlockchainContext";
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
import CertificationDetails from "./pages/CertificationDetails";
import MainLayout from "./layouts/MainLayout";


function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <BrowserRouter>
      <WalletProvider>
        <BlockchainProvider>
          <Routes>

      {/* signup */}

        <Route path="/signup" element={<Signup/>}/>
        {/* Login Page */}
        <Route path="/login" element={<Login/>} />
         

        {/* Home (MainPage) */}
        <Route path="/home" element={<Home/>} />
          
        {/* Dashboard */}
        
        <Route path="/dashboard" element={<MainLayout><Dashboard/></MainLayout>}/>
          
         <Route path="/connect-wallet" element={<MainLayout><ConnectSolanaWallet/></MainLayout>}/> 

        {/* Register ip */}
        <Route path="/RegisterIp" element={<MainLayout><RegisterIP/></MainLayout>}/>
        <Route path="/registerip" element={<MainLayout><RegisterIP/></MainLayout>}/>

        
        <Route path="/edit-asset/:assetId" element={<MainLayout><EditAsset/></MainLayout>}/>

        <Route path="/assets/:assetId/certify" element={<MainLayout><AssetCertification/></MainLayout>}/>

        <Route path="/assets/:assetId/confirmation" element={<MainLayout><AssetConfirmation/></MainLayout>}/>

        <Route path="/certifications/:assetId" element={<MainLayout><CertificationDetails/></MainLayout>}/>

        <Route path="/assets" element={<MainLayout><MyAssets/></MainLayout>}/>

        <Route path="/assets/:assetId" element={<MainLayout><AssetInfo/></MainLayout>}/>

        <Route path="/" element={<MainLayout><MyAssets/></MainLayout>}/>

        <Route path="/profile" element={<MainLayout><MyProfile/></MainLayout>}/>

      </Routes>
        </BlockchainProvider>
      </WalletProvider>
    </BrowserRouter>
  );
}

export default App;