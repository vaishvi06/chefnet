import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { AppRoutes } from './routes/AppRoutes';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 60 * 1000 // 1 minute
    }
  }
});

export const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <SocketProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#2F4858',
                  color: '#FAF7F2',
                  fontSize: '14px',
                  borderRadius: '12px',
                  boxShadow: '0 4px 14px rgba(47, 72, 88, 0.25)'
                },
                success: {
                  iconTheme: {
                    primary: '#E07A5F',
                    secondary: '#FAF7F2'
                  }
                },
                error: {
                  iconTheme: {
                    primary: '#D9534F',
                    secondary: '#FAF7F2'
                  }
                }
              }}
            />
            <AppRoutes />
          </SocketProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;

