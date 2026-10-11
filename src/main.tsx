import React, { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AdminPanel } from './components/AdminPanel.tsx';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';

function Root() {
  const checkIsAdmin = () => {
    const p = window.location.pathname.toLowerCase();
    const h = window.location.hash.toLowerCase();
    const s = window.location.search.toLowerCase();
    return p.startsWith('/admin') || h === '#admin' || s.includes('admin=true');
  };

  const [isAdmin, setIsAdmin] = useState(checkIsAdmin);

  useEffect(() => {
    const onPop = () => setIsAdmin(checkIsAdmin());
    window.addEventListener('popstate', onPop);
    window.addEventListener('hashchange', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('hashchange', onPop);
    };
  }, []);

  return (
    <ErrorBoundary>
      {isAdmin ? <AdminPanel /> : <App />}
    </ErrorBoundary>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);

