import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Buffer } from 'buffer'; // Import Buffer polyfill
import './index.css';
if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
}
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
