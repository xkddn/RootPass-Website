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
  Globe,
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
    Globe,
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

// --- Bascule de langue FR / EN ---
// Le HTML est en français par défaut. On stocke la version originale (FR) de
// chaque élément marqué `data-i18n`, et on remplace par la traduction anglaise
// au besoin. Le choix est mémorisé dans localStorage.
;(function initI18n() {
  const STORAGE_KEY = 'rootpass:lang'

  // Traductions anglaises (anglais simple). La clé correspond à data-i18n.
  // Le HTML inline (strong, em, code, br, liens…) est conservé à l'identique.
  const EN = {
    skip: 'Skip to main content',
    'nav.features': 'Features',

    'hero.badge': '100% local · Zero cloud · Zero tracking',
    'hero.title':
      'The password manager<br class="hidden sm:block"> you have been waiting for.',
    'hero.subtitle':
      'The security of a bunker. The ease of use of 2026. <span class="text-zinc-200">100% local, 0% cloud.</span>',
    'hero.btnDownload': 'Download for Windows',
    'hero.btnSource': 'View the source code',
    'hero.openSource': 'Open Source · MIT License · Free forever',

    'features.title':
      'Built for the paranoid.<br class="hidden sm:block"> Made for everyday use.',
    'features.subtitle':
      'All the protection of an encrypted vault, with no compromise on comfort.',

    'card.encryption.title': 'Unbreakable encryption',
    'card.encryption.body':
      'Your vault is protected by <strong class="text-zinc-200">AES-256-GCM</strong>, the same standard used by government agencies. The key is derived on the fly from your Master Password — it is never stored, anywhere.',
    'card.encryption.badge': 'AES-256-GCM · key derived on the fly',

    'card.cloud.title': 'The cloud is yours',
    'card.cloud.body':
      'Sync through your own OneDrive, Dropbox or a simple USB stick. <strong class="text-zinc-200">Zero central server</strong> — your data never leaves your control.',

    'card.totp.title': 'Built-in 2FA',
    'card.totp.body':
      'Generate your <strong class="text-zinc-200">TOTP</strong> codes right inside the app. No more need for a third-party app for your two-factor authentication.',

    'card.spotlight.title': 'Spotlight search',
    'card.spotlight.body':
      'A global shortcut to find anything in one second, without even opening the main window. Type, find, paste.',

    'download.title': 'Download with confidence',
    'download.subtitle':
      'Open source, with public and verifiable builds. Here is how to install in a few seconds.',
    'download.note':
      '<strong class="text-amber-300">"Unknown publisher" on launch? That is normal.</strong><br>RootPass is not signed with a paid certificate, so your system shows a warning, just like most open source apps. Since the code and the builds are fully public, you can check for yourself that there is nothing to hide.<br><br>Follow the "Transparent and verifiable" guide below to be 100% sure your download is safe. If you have any question, feel free to open an issue on GitHub.<br>(Not required!)',

    'install.title': 'Quick install',
    'install.win.steps':
      '<li>Run the <code class="font-mono text-zinc-300">.exe</code> file.</li><li>On the SmartScreen window, click <em class="not-italic text-zinc-300">More info</em>.</li><li>Click <em class="not-italic text-zinc-300">Run anyway</em>.</li>',
    'install.mac.steps':
      '<li>Open the <code class="font-mono text-zinc-300">.dmg</code> file.</li><li><em class="not-italic text-zinc-300">Right-click</em> the app, then choose <em class="not-italic text-zinc-300">Open</em>.</li><li>Confirm opening in the window that appears.</li>',
    'install.linux.desc':
      'Make the AppImage executable, or install the <code class="font-mono text-zinc-300">.deb</code> package:',

    'verify.title': 'Transparent and verifiable',
    'verify.body':
      'RootPass is <a href="https://github.com/xkddn/RootPass-App" target="_blank" rel="noopener noreferrer" class="font-medium text-emerald-400 underline decoration-emerald-400/40 underline-offset-2 hover:text-emerald-300">100% open source</a>. Every installer is built automatically by GitHub Actions from the public code — nothing is added by hand, everything is traceable.',
    'verify.win.desc':
      'Check the integrity: run this command in PowerShell, then compare it with the official fingerprint.',
    'verify.mac.desc':
      'Check the integrity: run this command in the Terminal, then compare it with the official fingerprint.',
    'verify.linux.desc':
      'Check the integrity: run this command in the terminal, then compare it with the official fingerprint.',

    'alert.master':
      '<strong class="font-semibold text-red-300">Important: Back up your Master Password!!!!</strong><br>If you lose it, the vault is <strong class="font-semibold text-white">UNRECOVERABLE</strong>. No reset is possible, not even by me. That is the price of end-to-end encryption. Be smart, write it down somewhere safe and all will be fine.',

    'footer.tagline': '· 100% Open Source · MIT License',
    'footer.source': 'Source code',
    'footer.rights': 'RootPass. All rights reserved under the MIT License.',
  }

  const nodes = document.querySelectorAll('[data-i18n]')
  if (nodes.length === 0) return

  // On mémorise le HTML français d'origine pour pouvoir le restaurer.
  const originalFR = new Map()
  nodes.forEach((el) => originalFR.set(el, el.innerHTML))

  const toggle = document.getElementById('lang-toggle')
  const label = toggle ? toggle.querySelector('[data-lang-label]') : null

  function apply(lang) {
    nodes.forEach((el) => {
      const key = el.getAttribute('data-i18n')
      if (lang === 'en' && EN[key] != null) {
        el.innerHTML = EN[key]
      } else {
        el.innerHTML = originalFR.get(el)
      }
    })

    document.documentElement.lang = lang

    // Le bouton affiche la langue vers laquelle on peut basculer.
    if (label) label.textContent = lang === 'en' ? 'FR' : 'EN'
    if (toggle) {
      toggle.setAttribute(
        'aria-label',
        lang === 'en' ? 'Passer en français' : 'Switch to English',
      )
    }

    try {
      localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      // localStorage indisponible (mode privé) : on ignore
    }
  }

  let saved = 'fr'
  try {
    saved = localStorage.getItem(STORAGE_KEY) || 'fr'
  } catch {
    // ignore
  }
  apply(saved)

  if (toggle) {
    toggle.addEventListener('click', () => {
      const next = document.documentElement.lang === 'en' ? 'fr' : 'en'
      apply(next)
    })
  }
})()
