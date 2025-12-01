import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import AuthOverlay from './AuthOverlay';
import LandingPage from './LandingPage';
import HomePage from './HomePage';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
const app = (
  <GoogleOAuthProvider clientId="247193530706-lscvo9tovkvdnj54e6ak15eum5ubgcbh.apps.googleusercontent.com">
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthOverlay />} />
        <Route path="/home" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  </GoogleOAuthProvider>
);
root.render(app as any);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
// Service worker 和 Web Vitals 已移除以避免缺失文件导致的编译错误。
