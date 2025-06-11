/**
 * FlixPlayer - Reproductor de video personalizable
 * @version 3.0
 * @license MIT
 * 
 * Características principales:
 * - Monetización con redirección directa a enlaces
 * - Configuración simplificada para usuarios
 * - Mantiene todas las personalizaciones originales
 */
class Player {
  constructor(containerId, config = {}) {
    this._defaultConfig = {
      css: 'https://flix-player.onrender.com/cdn/style.css',
      links: {
        admin: 'https://otieu.com/4/8798348', // Enlace fijo del admin
        user: null // Enlace del usuario (configurable)
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
        initialDelay: 30000, // 30 segundos antes de activar
        cooldown: 30000, // 30 segundos entre clics
        maxClicks: 5, // Máximo de clics por sesión
        autoClicks: {
          enabled: true,
          interval: 300000, // 5 minutos entre clics automáticos
          maxDaily: 20 // Límite diario de clics automáticos
        },
        redirectMode: true // Nueva opción para redirección directa
      }
    };

    this._container = document.getElementById(containerId);
    this._playerInstance = null;
    this._initialized = false;
    this._clickEnabled = false;
    this._lastClickTime = 0;
    this._clickInterval = null;
    this._monetizationLayer = null;
    this._currentClicks = 0;
    this._dailyClicks = 0;
    this._lastClickDate = null;
    
    // Merge de configuraciones
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
    // Solo activar si hay al menos un enlace configurado
    if (!this._config.links.admin && !this._config.links.user) {
      return;
    }

    // Crear capa de monetización mejorada
    this._monetizationLayer = document.createElement('div');
    this._monetizationLayer.className = 'flix-monetization-layer';
    
    // Estilos para la capa
    Object.assign(this._monetizationLayer.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      zIndex: '9999',
      cursor: 'pointer',
      opacity: '0',
      display: 'none',
      backgroundColor: 'transparent',
      transition: 'opacity 0.3s ease'
    });
    
    // Efecto hover sutil
    this._monetizationLayer.addEventListener('mouseenter', () => {
      this._monetizationLayer.style.opacity = '0.1';
      this._monetizationLayer.style.backgroundColor = 'rgba(0, 194, 52, 0.05)';
    });
    
    this._monetizationLayer.addEventListener('mouseleave', () => {
      this._monetizationLayer.style.opacity = '0';
      this._monetizationLayer.style.backgroundColor = 'transparent';
    });
    
    this._container.style.position = 'relative';
    this._container.appendChild(this._monetizationLayer);

    // Activar después del delay inicial
    setTimeout(() => {
      this._clickEnabled = true;
      this._showMonetizationLayer();
      
      if (this._config.monetization.autoClicks.enabled) {
        this._setupAutoClicks();
      }
    }, this._config.monetization.initialDelay);

    // Manejador de clics mejorado
    this._monetizationLayer.addEventListener('click', (e) => {
      if (!this._clickEnabled) return;
      
      const now = Date.now();
      const today = new Date().toDateString();
      
      // Resetear contador diario si es un nuevo día
      if (this._lastClickDate !== today) {
        this._dailyClicks = 0;
        this._lastClickDate = today;
      }
      
      // Verificar límites
      if (now - this._lastClickTime < this._config.monetization.cooldown) return;
      if (this._currentClicks >= this._config.monetization.maxClicks) return;
      if (this._dailyClicks >= this._config.monetization.autoClicks.maxDaily) return;
      
      // Registrar clic
      this._lastClickTime = now;
      this._currentClicks++;
      this._dailyClicks++;
      
      // Manejar el clic con redirección directa
      this._handleMonetizationClick();
      
      // Ocultar temporalmente
      this._hideMonetizationLayer();
      setTimeout(() => {
        if (this._currentClicks < this._config.monetization.maxClicks && 
            this._dailyClicks < this._config.monetization.autoClicks.maxDaily) {
          this._showMonetizationLayer();
        }
      }, this._config.monetization.cooldown);
    });
  }

  _handleMonetizationClick() {
    // Selección inteligente de enlace (50% admin, 50% user)
    const useAdminLink = !this._config.links.user || 
                        (this._config.links.admin && Math.random() < 0.5);
    
    const targetUrl = useAdminLink ? this._config.links.admin : this._config.links.user;
    
    // Redirección directa en lugar de popup
    if (this._config.monetization.redirectMode) {
      window.location.href = targetUrl;
    } else {
      // Método alternativo si se desactiva redirectMode
      window.open(targetUrl, '_blank');
    }
  }

  _setupAutoClicks() {
    if (this._clickInterval) {
      clearInterval(this._clickInterval);
    }
    
    this._clickInterval = setInterval(() => {
      if (!this._clickEnabled || !this._playerInstance) return;
      
      const today = new Date().toDateString();
      if (this._lastClickDate !== today) {
        this._dailyClicks = 0;
        this._lastClickDate = today;
      }
      
      const playerState = this._playerInstance.getState();
      if (playerState === 'playing' && 
          this._monetizationLayer.style.display === 'none' &&
          this._dailyClicks < this._config.monetization.autoClicks.maxDaily) {
        
        this._dailyClicks++;
        this._handleMonetizationClick();
        
        // Reactivar después del intervalo
        setTimeout(() => {
          if (this._dailyClicks < this._config.monetization.autoClicks.maxDaily) {
            this._showMonetizationLayer();
          }
        }, this._config.monetization.cooldown);
      }
    }, this._config.monetization.autoClicks.interval);
  }

  _showMonetizationLayer() {
    if (this._monetizationLayer) {
      this._monetizationLayer.style.display = 'block';
    }
  }

  _hideMonetizationLayer() {
    if (this._monetizationLayer) {
      this._monetizationLayer.style.display = 'none';
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

    this._playerInstance.on('play', () => {
      this._currentClicks = 0;
      if (this._config.monetization.autoClicks.enabled && !this._clickInterval) {
        this._setupAutoClicks();
      }
    });

    this._playerInstance.on('pause', () => {
      if (this._clickInterval) {
        clearInterval(this._clickInterval);
        this._clickInterval = null;
      }
    });

    this._playerInstance.on('complete', () => {
      if (this._clickInterval) {
        clearInterval(this._clickInterval);
        this._clickInterval = null;
      }
    });
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
      alert('Por favor desactiva tu AdBlock para continuar viendo el contenido');
    }
  }

  _setupAntiDownload() {
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

  _handleDownloadManagerDetected() {
    if (this._playerInstance) {
      this._playerInstance.pause();
      alert('Los gestores de descarga no están permitidos');
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
      
      this._currentClicks = 0;
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
    if (settings.autoClicks !== undefined) {
      this._config.monetization.autoClicks = {
        ...this._config.monetization.autoClicks,
        ...settings.autoClicks
      };
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
    if (this._clickInterval) {
      clearInterval(this._clickInterval);
    }
    if (this._monetizationLayer) {
      this._monetizationLayer.remove();
    }
    this._initialized = false;
  }
}

window.Player = Player;
