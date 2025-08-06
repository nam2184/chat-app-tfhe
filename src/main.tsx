import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import './main.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 0,
      // experimental_prefetchInRender is deprecated and may cause issues
      // Consider removing or updating it depending on your version
      // experimental_prefetchInRender: false,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
	</React.StrictMode>,
)


