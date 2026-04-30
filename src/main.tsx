import { createRoot } from 'react-dom/client'
import './lib/desktopApiRuntime.ts'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById("root")!).render(<App />);
