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
  Monitor,
  Apple,
  Terminal,
  Info,
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
    Monitor,
    Apple,
    Terminal,
    Info,
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

// --- Derniers installeurs récupérés automatiquement via l'API GitHub ---
// Met à jour, à chaque nouvelle release et pour chaque OS, le lien de
// téléchargement et (pour Windows/macOS) le checksum SHA-256. Aucune valeur
// n'est codée en dur.
;(function initLatestReleases() {
  const RELEASES_API =
    'https://api.github.com/repos/xkddn/RootPass-App/releases/latest'
  const RELEASES_PAGE = 'https://github.com/xkddn/RootPass-App/releases/latest'
  const CACHE_KEY = 'rootpass:latest-release' // clé localStorage
  const CACHE_TTL = 6 * 60 * 60 * 1000 // 6 heures en millisecondes

  // Définition des cibles : un id de bouton, un id de checksum (optionnel),
  // et la façon de reconnaître le bon asset dans la release.
  const TARGETS = [
    {
      downloadId: 'download-exe',
      checksumId: 'checksum-exe',
      // Installeur Windows : "…setup.exe" en priorité, sinon n'importe quel .exe
      match: (a) => /setup\.exe$/i.test(a) || /\.exe$/i.test(a),
    },
    {
      downloadId: 'download-dmg',
      checksumId: 'checksum-dmg',
      // Image disque macOS
      match: (a) => /\.dmg$/i.test(a),
    },
    {
      downloadId: 'download-linux',
      checksumId: 'checksum-linux',
      // AppImage en priorité, sinon paquet .deb
      match: (a) => /\.appimage$/i.test(a) || /\.deb$/i.test(a),
    },
  ]

  // On ne garde que les cibles dont le bouton existe réellement dans la page
  const active = TARGETS.filter((t) => document.getElementById(t.downloadId))
  if (active.length === 0) return

  // Applique au DOM les données { url, sha256 } d'une cible
  function render(target, data) {
    const downloadEl = document.getElementById(target.downloadId)
    const checksumEl = target.checksumId
      ? document.getElementById(target.checksumId)
      : null
    if (downloadEl && data && data.url) downloadEl.href = data.url
    if (checksumEl) {
      checksumEl.textContent =
        (data && data.sha256) || 'Checksum indisponible — voir GitHub Releases'
    }
  }

  // Repli en cas d'échec : boutons vers la page Releases + message explicite
  function renderError() {
    active.forEach((target) => {
      const downloadEl = document.getElementById(target.downloadId)
      const checksumEl = target.checksumId
        ? document.getElementById(target.checksumId)
        : null
      if (downloadEl) downloadEl.href = RELEASES_PAGE
      if (checksumEl) {
        checksumEl.textContent =
          'Checksum indisponible — voir la page GitHub Releases'
      }
    })
  }

  // 1) On tente d'abord le cache localStorage pour économiser l'API
  //    (GitHub limite à 60 requêtes/h par IP en anonyme).
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null')
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      active.forEach((t) => render(t, cached.data[t.downloadId]))
      return // cache encore valide : pas d'appel réseau
    }
  } catch {
    // localStorage indisponible (mode privé) ou JSON corrompu : on ignore
  }

  // 2) Sinon, appel à l'API GitHub
  fetch(RELEASES_API, { headers: { Accept: 'application/vnd.github+json' } })
    .then((res) => {
      if (!res.ok) throw new Error('HTTP ' + res.status)
      return res.json()
    })
    .then((release) => {
      const assets = release.assets || []
      const data = {} // { downloadId: { url, sha256 } }

      active.forEach((target) => {
        const asset = assets.find((a) => target.match(a.name || ''))
        if (!asset) return // cet OS n'a pas d'asset dans cette release
        data[target.downloadId] = {
          url: asset.browser_download_url,
          // digest au format "sha256:abcdef…" → on retire le préfixe
          sha256: (asset.digest || '').replace(/^sha256:/i, '') || null,
        }
        render(target, data[target.downloadId])
      })

      // 3) Mise en cache pour les prochaines visites (6 h)
      try {
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ ts: Date.now(), data }),
        )
      } catch {
        // Quota plein / mode privé : on se passe simplement de cache
      }
    })
    .catch((err) => {
      console.warn('[RootPass] Récupération de la release échouée :', err)
      renderError()
    })
})()
