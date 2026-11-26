import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from './lib/session.jsx';
import { ChatProvider } from './lib/chat.jsx';
import { ToastProvider } from './components/feedback/Toast.jsx';
import { queryClient } from './lib/queryClient.js';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <SessionProvider>
            <ChatProvider>
              <App />
            </ChatProvider>
          </SessionProvider>
        </ToastProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
