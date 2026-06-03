import './style.css'
import {
  createIcons,
  Github,
  CircleAlert,
  Download,
  Code2,
  Lock,
  CloudOff,
  ShieldCheck,
  Search,
} from 'lucide'

// Rend uniquement les icônes utilisées (tree-shaking friendly)
createIcons({
  icons: {
    Github,
    CircleAlert,
    Download,
    Code2,
    Lock,
    CloudOff,
    ShieldCheck,
    Search,
  },
  attrs: {
    'stroke-width': 1.6,
    'aria-hidden': 'true',
    focusable: 'false',
  },
})

// Année dynamique dans le footer
const yearEl = document.getElementById('current-year')
if (yearEl) yearEl.textContent = String(new Date().getFullYear())
