/**
 * FlixPlayer - Reproductor con Monetización por Carga
 * @version 3.4
 * @license MIT
 * 
 * Características clave:
 * - Contador SIEMPRE comienza en cero al cargar
 * - Máximos clicks POR SESIÓN (no persiste)
 * - Monetización configurable
 */

(function () {
  // Dominio y ruta exacta PERMITIDA (en base64)
  const rutaPermitidaBase64 = "aHR0cHM6Ly9mbGl4LXBsYXllci5vbnJlbmRlci5jb20vY2RuL3BsYXllci5qcw=="; // https://flix-player.onrender.com/cdn/player.js

  // Decodifica base64
  const rutaPermitida = atob(rutaPermitidaBase64);

  // Detecta desde qué URL real fue cargado este script
  const urlActualDelScript = document.currentScript?.src || "";

  // Compara rutas exactas
  if (urlActualDelScript !== rutaPermitida) {
    document.body.innerHTML = `
      <!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Infracción de Licencia | FlixPlayer</title>
    <!-- Bootstrap Icons -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
    <!-- Animaciones fluidas -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css">
    <style>
        :root {
            --primary-500: #16a34a;
            --primary-600: #15803d;
            --primary-700: #166534;
            --gray-50: #f9fafb;
            --gray-100: #f3f4f6;
            --gray-200: #e5e7eb;
            --gray-800: #1f2937;
            --error-500: #ef4444;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background-color: var(--gray-50);
            color: var(--gray-800);
            min-height: 100vh;
            display: grid;
            place-items: center;
            line-height: 1.6;
            padding: 1.5rem;
        }
        
        .security-card {
            width: 100%;
            max-width: 540px;
            background: white;
            border-radius: 16px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.04), 
                        0 8px 10px -6px rgba(0, 0, 0, 0.02);
            overflow: hidden;
            border: 1px solid var(--gray-200);
            transform: translateY(0);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .security-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.08), 
                        0 10px 10px -6px rgba(0, 0, 0, 0.02);
        }
        
        .security-header {
            background: var(--primary-600);
            padding: 1.75rem 2rem;
            color: white;
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        
        .security-icon {
            font-size: 1.75rem;
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        .security-title {
            font-size: 1.375rem;
            font-weight: 600;
            letter-spacing: -0.025em;
        }
        
        .security-body {
            padding: 2.5rem 2rem;
        }
        
        .alert-message {
            display: flex;
            gap: 1rem;
            margin-bottom: 2rem;
        }
        
        .alert-icon {
            color: var(--error-500);
            font-size: 1.5rem;
            flex-shrink: 0;
            margin-top: 0.25rem;
        }
        
        .alert-content h2 {
            font-size: 1.125rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
            color: var(--primary-700);
        }
        
        .alert-content p {
            color: var(--gray-800);
            font-size: 0.9375rem;
        }
        
        .domain-container {
            background: var(--gray-100);
            border-radius: 8px;
            padding: 1.5rem;
            margin: 1.5rem 0;
            text-align: center;
            border: 1px dashed var(--primary-500);
            position: relative;
            overflow: hidden;
        }
        
        .domain-label {
            display: block;
            font-size: 0.875rem;
            color: var(--primary-700);
            margin-bottom: 0.75rem;
            font-weight: 500;
        }
        
        .domain-value {
            font-family: 'Roboto Mono', monospace;
            font-size: 1rem;
            font-weight: 600;
            color: var(--primary-700);
            word-break: break-all;
            padding: 0.5rem 1rem;
            background: white;
            border-radius: 4px;
            display: inline-block;
            border: 1px solid var(--gray-200);
            animation: highlight 6s ease infinite;
        }
        
        .legal-notice {
            background: var(--gray-100);
            border-left: 4px solid var(--primary-500);
            padding: 1rem;
            margin-top: 2rem;
            font-size: 0.8125rem;
            color: var(--gray-800);
        }
        
        .security-footer {
            border-top: 1px solid var(--gray-200);
            padding: 1.25rem 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.8125rem;
            color: var(--gray-800);
        }
        
        .brand {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-weight: 500;
            color: var(--primary-600);
        }
        
        /* Animaciones */
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.8; }
        }
        
        @keyframes highlight {
            0%, 100% { box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.1); }
            50% { box-shadow: 0 0 0 8px rgba(22, 163, 74, 0); }
        }
        
        @keyframes subtleShake {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-3px); }
            40% { transform: translateX(3px); }
            60% { transform: translateX(-2px); }
            80% { transform: translateX(2px); }
        }
        
        .animate-subtle-shake {
            animation: subtleShake 1.5s ease infinite;
        }
        
        /* Responsive */
        @media (max-width: 480px) {
            .security-body {
                padding: 1.75rem 1.5rem;
            }
            
            .security-header {
                padding: 1.5rem;
            }
        }
    </style>
</head>
<body>
    <div class="security-card animate__animated animate__fadeIn">
        <div class="security-header">
            <i class="bi bi-shield-lock security-icon"></i>
            <h1 class="security-title">Infracción de Licencia</h1>
        </div>
        
        <div class="security-body">
            <div class="alert-message animate__animated animate__fadeIn">
                <i class="bi bi-exclamation-octagon-fill alert-icon"></i>
                <div class="alert-content">
                    <h2>Uso no autorizado detectado</h2>
                    <p>El sistema ha identificado un intento de acceso ilegítimo al código fuente protegido de FlixPlayer desde un dominio no autorizado.</p>
                </div>
            </div>
            
            <div class="domain-container animate__animated animate__fadeIn">
                <span class="domain-label">Dominio infractor registrado:</span>
                <div class="domain-value animate-subtle-shake">${urlActualDelScript}</div>
            </div>
            
            <div class="animate__animated animate__fadeIn">
                <p style="text-align: center; font-size: 0.9375rem;">
                    <i class="bi bi-activity" style="margin-right: 0.5rem;"></i>
                    Esta infracción ha sido registrada en nuestros sistemas de seguridad.
                </p>
            </div>
            
            <div class="legal-notice animate__animated animate__fadeIn">
                <p><strong>Notificación Legal:</strong> El uso no autorizado de software protegido por derechos de autor constituye una violación de las leyes internacionales de propiedad intelectual y puede resultar en acciones legales.</p>
            </div>
        </div>
        
        <div class="security-footer">
            <div class="brand">
                <i class="bi bi-shield-check"></i>
                <span>FlixPlayer Security System</span>
            </div>
            <div>© 2023 Todos los derechos reservados</div>
        </div>
    </div>
</body>
</html>
          `;
    throw new Error("Este player.js fue copiado o clonado y está bloqueado.");
  }

  // Si pasa la verificación
  console.log("[FlixPlayer] Verificado correctamente.")
  
const xy00 = "aHR0cHM6Ly9mbGl4LXBsYXllci5vbnJlbmRlci5jb20vY2RuL3NlZ3Vyby5jc3M="
class Player {
  constructor(containerId, config = {}) {
    this._defaultConfig = {
      css: atob(xy00),
      links: {
        admin: 'https://otieu.com/4/8798348',
        user: null
      },
      player: {
        castAppId: 'D4AF960B',
        displayDescription: true,
        autostart: false,
        mute: false,
        volume: 100,
        playbackRates: [0.5, 1, 1.25, 1.5, 2],
        contextMenu: false,
        aboutText: "",
        aboutLink: "",
        skin: { name: "FlixStream" },
        logo: {
          file: "",
          link: null
        },
        captions: {
          color: "#FFF",
          fontSize: 14,
          backgroundOpacity: 0,
          edgeStyle: "raised"
        }
      },
      media: {
        title: "",
        description: "",
        image: "",
        file: "",
        downloadUrl: null,
        thumbnails: ""
      },
      features: {
        progressSaving: true,
        antiAdBlock: false,
        antiDownload: false
      },
      monetization: {
        enabled: false, // Cambiado a false por defecto
        initialDelay: 10000, // 10 segundos para activar
        cooldown: 15000, // 15 segundos entre clics
        maxClicks: 3, // Máximo de clics por carga
        redirectMode: false // Cambiado a false para no redirigir automáticamente
      }
    };

    this._container = document.getElementById(containerId);
    this._playerInstance = null;
    this._initialized = false;
    this._clickEnabled = false;
    this._lastClickTime = 0;
    this._currentClicks = 0; // Siempre comienza en 0
    
    this._config = this._deepMerge(this._defaultConfig, config);
    
    if (this._container) {
      this._initialize();
      this._setupProtections();
    } else {
      console.error(`Contenedor #${containerId} no encontrado`);
    }
  }

  _initialize() {
    this._loadDependencies().then(() => {
      this._setupPlayer();
      this._setupMonetization();
      this._setupEventListeners();
      this._initialized = true;
    }).catch(err => {
      console.error("Error al cargar dependencias:", err);
    });
  }

  _setupProtections() {
    // Protección contra sandbox
    try {
     const _d0r4 = "https://flix-player.onrender.com/sandbox.html";

      const q = () => window.location.href = _d0r4;

      const b = () => {
        try {
          if (this._config.ampallow) {
            const o = window.location.ancestorOrigins;
            if (o[o.length - 1].endsWith("ampproject.org")) return;
          }
        } catch (e) {}
        setTimeout(q, 900);
      };

      const v = () => {
        try {
          if (window.frameElement && window.frameElement.hasAttribute('sandbox')) return b();
        } catch (e) {}

        if (location.href.indexOf('data') !== -1 && document.domain === "") return b();

        if (typeof navigator.plugins !== 'undefined' &&
            typeof navigator.plugins.namedItem !== 'undefined' &&
            navigator.plugins.namedItem('Chrome PDF Viewer') !== null) {
          const x = document.createElement('object');
          x.onerror = b;
          x.setAttribute('type', 'application/pdf');
          x.setAttribute('style', 'visibility:hidden;width:0;height:0;position:absolute;top:-99px;');
          x.setAttribute('data', 'data:application/pdf;base64,JVBERi0xLg0KdHJhaWxlcjw8L1Jvb3Q8PC9QYWdlczw8L0tpZHNbPDwvTWVkaWFCb3hbMCAwIDMgM10+Pl0+Pj4+Pj4=');
          document.body.appendChild(x);
          setTimeout(() => x.parentElement.removeChild(x), 150);
        }
      };

      v();

      if ((() => {
        try { document.domain = document.domain; }
        catch (e) {
          try { if (e.toString().toLowerCase().includes("sandbox")) return true; }
          catch (e) {}
        }
        return false;
      })()) b();

      if ((() => {
        if (window.parent === window) return false;
        let f;
        try { f = window.frameElement; }
        catch (e) { f = null; }
        return f === null ? document.domain === "" && location.protocol !== "data:" : f.hasAttribute("sandbox");
      })()) b();

    } catch (e) {}
    
    // Protección contra descargas
    if (this._config.features.antiDownload) {
      document.addEventListener('contextmenu', (e) => e.preventDefault());
      document.addEventListener('selectstart', (e) => e.preventDefault());

      setInterval(() => {
        if (navigator.userAgent.indexOf('IDM') > -1 || 
            document.documentElement.getAttribute('idm_id') ||
            document.documentElement.getAttribute('idmghost')) {
          this._handleDownloadManagerDetected();
        }
      }, 1000);
    }
  }

  _loadDependencies() {
    return new Promise((resolve, reject) => {
      if (window.jwplayer) {
        if (this._config.css) {
          this._injectCustomCSS();
        }
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://cdn.jwplayer.com/libraries/KB5zFt7A.js`;
      script.onload = () => {
        if (this._config.css) {
          this._injectCustomCSS();
        }
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  _injectCustomCSS() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = this._config.css;
    document.head.appendChild(link);
  }

  _setupPlayer() {
    this._playerInstance = jwplayer(this._container).setup({
      ...this._config.player,
      file: this._config.media.file,
      image: this._config.media.image,
      playlist: [{
        title: this._config.media.title,
        description: this._config.media.description,
        image: this._config.media.image,
        sources: [{ file: this._config.media.file }],
        tracks: this._config.media.thumbnails ? [{
          file: this._config.media.thumbnails,
          kind: "thumbnails"
        }] : []
      }]
    });

    if (this._config.media.downloadUrl) {
      this._playerInstance.on('ready', () => {
        this._playerInstance.addButton(
          '<svg xmlns="http://www.w3.org/2000/svg" class="jw-svg-icon jw-svg-icon-download" viewBox="0 0 512 512"><path d="M412.907 214.08C398.4 140.693 333.653 85.333 256 85.333c-61.653 0-115.093 34.987-141.867 86.08C50.027 178.347 0 232.64 0 298.667c0 70.72 57.28 128 128 128h277.333C464.213 426.667 512 378.88 512 320c0-56.32-43.84-101.973-99.093-105.92zM256 384L149.333 277.333h64V192h85.333v85.333h64L256 384z"/></svg>',
          "Download",
          () => window.location.href = this._config.media.downloadUrl,
          "download-btn"
        );
      });
    }
  }

  _setupMonetization() {
    // Solo activar monetización si está explícitamente habilitada
    if (!this._config.monetization.enabled) {
      return;
    }

    // Verificar que haya al menos un enlace configurado
    const hasLinks = this._config.links.admin || this._config.links.user;
    if (!hasLinks) {
      return;
    }

    // Activar después del delay inicial
    setTimeout(() => {
      this._clickEnabled = true;
      this._playerInstance.getContainer().style.cursor = 'pointer';
    }, this._config.monetization.initialDelay);

    // Manejador de clics directo en el reproductor
    this._playerInstance.on('displayClick', () => this._handleMonetizationClick());
  }

  _handleMonetizationClick() {
    if (!this._clickEnabled) return;
    
    const now = Date.now();
    
    // Verificar cooldown y máximo de clics
    if (now - this._lastClickTime < this._config.monetization.cooldown) return;
    if (this._currentClicks >= this._config.monetization.maxClicks) return;
    
    // Registrar clic
    this._lastClickTime = now;
    this._currentClicks++;
    
    // Selección de enlace (50% admin, 50% user si ambos existen)
    let targetUrl;
    if (this._config.links.admin && this._config.links.user) {
      targetUrl = Math.random() < 0.5 ? this._config.links.admin : this._config.links.user;
    } else {
      targetUrl = this._config.links.admin || this._config.links.user;
    }
    
    // Abrir en nueva pestaña
    window.open(targetUrl, '_blank');
  }

  _setupEventListeners() {
    if (this._config.features.progressSaving) {
      this._playerInstance.on('time', (e) => {
        localStorage.setItem(`progress_${this._container.id}`, e.position);
      });

      this._playerInstance.on('ready', () => {
        const savedTime = localStorage.getItem(`progress_${this._container.id}`);
        if (savedTime) this._playerInstance.seek(parseFloat(savedTime));
      });
    }

    if (this._config.features.antiAdBlock) {
      this._checkAdBlock();
    }
  }

  _checkAdBlock() {
    const ad = document.createElement('div');
    ad.innerHTML = '&nbsp;';
    ad.className = 'ad-unit';
    ad.style.position = 'absolute';
    ad.style.left = '-9999px';
    ad.style.height = '1px';
    document.body.appendChild(ad);

    setTimeout(() => {
      if (ad.offsetHeight === 0) {
        this._handleAdBlockDetected();
      }
      document.body.removeChild(ad);
    }, 100);
  }

  _handleAdBlockDetected() {
    if (this._playerInstance) {
      this._playerInstance.pause();
      this._playerInstance.setMute(true);
      alert('Desactiva AdBlock para ver el contenido');
    }
  }

  _handleDownloadManagerDetected() {
    if (this._playerInstance) {
      this._playerInstance.pause();
      alert('Gestores de descarga no permitidos');
    }
  }

  _deepMerge(target, source) {
    const result = { ...target };
    if (source) {
      for (const key in source) {
        if (source[key] instanceof Object && key in target) {
          result[key] = this._deepMerge(target[key], source[key]);
        } else {
          result[key] = source[key];
        }
      }
    }
    return result;
  }

  // Métodos públicos
  play() {
    if (this._playerInstance) this._playerInstance.play();
    return this;
  }

  pause() {
    if (this._playerInstance) this._playerInstance.pause();
    return this;
  }

  loadMedia(file, image, title = "", description = "") {
    if (this._playerInstance) {
      this._config.media.file = file;
      this._config.media.image = image;
      this._config.media.title = title;
      this._config.media.description = description;
      
      this._playerInstance.load([{
        title,
        description,
        image,
        sources: [{ file }],
        tracks: this._config.media.thumbnails ? [{
          file: this._config.media.thumbnails,
          kind: "thumbnails"
        }] : []
      }]);
      
      // Resetear contador al cargar nuevo media
      this._currentClicks = 0;
      this._lastClickTime = 0;
    }
    return this;
  }

  setDownloadUrl(url) {
    this._config.media.downloadUrl = url;
    return this;
  }

  setUserLink(url) {
    this._config.links.user = url;
    return this;
  }

  setMonetizationSettings(settings) {
    if (settings.enabled !== undefined) {
      this._config.monetization.enabled = settings.enabled;
    }
    if (settings.maxClicks !== undefined) {
      this._config.monetization.maxClicks = settings.maxClicks;
    }
    if (settings.cooldown !== undefined) {
      this._config.monetization.cooldown = settings.cooldown;
    }
    if (settings.redirectMode !== undefined) {
      this._config.monetization.redirectMode = settings.redirectMode;
    }
    return this;
  }

  destroy() {
    if (this._playerInstance) {
      this._playerInstance.remove();
    }
    this._initialized = false;
  }
}

window.Player = Player
})();
