import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ProveedorSesion } from './nucleo/sesion/SesionContexto';
import { ProveedorAvisos } from './nucleo/ui/Avisos';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProveedorAvisos>
      <ProveedorSesion>
        <App />
      </ProveedorSesion>
    </ProveedorAvisos>
  </StrictMode>,
);
