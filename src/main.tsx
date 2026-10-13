import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App';
import './styles/main.scss';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Required application root #root was not found.');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
