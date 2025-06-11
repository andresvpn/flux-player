/**
 * FlixPlayer - Reproductor con Monetización por Carga
 * @version 3.4
 * @license MIT
 * 
 * Características clave:
 * - Contador SIEMPRE comienza en cero al cargar
 * - Máximos clicks POR SESIÓN (no persiste)
 * - Monetización inmediata
 */
class Player {
  constructor(containerId, config = {}) {
    this._defaultConfig = {
      css: 'https://flix-player.onrender.com/cdn/style.css',
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
        enabled: true,
        initialDelay: 10000, // 10 segundos para activar
        cooldown: 15000, // 15 segundos entre clics
        maxClicks: 3, // Máximo de clics por carga
        redirectMode: true
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
    if (!this._config.monetization.enabled || 
        (!this._config.links.admin && !this._config.links.user)) {
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
    
    // Selección de enlace (60% admin, 40% user)
    const useAdminLink = !this._config.links.user || Math.random() < 0.6;
    const targetUrl = useAdminLink ? this._config.links.admin : this._config.links.user;
    
    // Redirección directa
    if (this._config.monetization.redirectMode) {
      window.location.href = targetUrl;
    } else {
      window.open(targetUrl, '_blank');
    }
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

    if (this._config.features.antiDownload) {
      this._setupAntiDownload();
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

  _setupAntiDownload() {
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('selectstart', (e) => e.preventDefault());

    setInterval(() => {
      if (navigator.userAgent.indexOf('IDM') > -1 || 
          document.documentElement.getAttribute('idm_id')) {
        this._handleDownloadManagerDetected();
      }
    }, 1000);
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

window.Player = Player;
