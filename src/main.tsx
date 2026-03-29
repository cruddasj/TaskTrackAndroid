import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { AppStateProvider } from './state/AppStateContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <AppStateProvider>
        <App />
      </AppStateProvider>
    </HashRouter>
  </StrictMode>,
);
