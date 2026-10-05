import { createRoot } from 'react-dom/client'
import Aurora from './components/Aurora.jsx'

const mount = document.getElementById('hero-aurora')
if (mount) createRoot(mount).render(<Aurora />)
