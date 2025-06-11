/**
 * FlixPlayer - Reproductor de video personalizable
 * @version 2.6
 * @license MIT
 * 
 * Características principales:
 * - Personalización completa del reproductor
 * - Sistema de monetización discreto integrado (clic en el reproductor)
 * - Tráfico de clics automático cada X minutos
 * - Límite de clics durante la reproducción
 * - Interfaz profesional minimalista
 */
class Player {
  constructor(containerId, config = {}) {
    this._defaultConfig = {
      css: 'https://flix-player.onrender.com/cdn/style.css',
      direct_link: {
        creator: 'https://otieu.com/4/8798348',
        user: null,
        userPercentage: 50,
        adminPercentage: 50
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
      clickBehavior: {
        enabled: true,
        initialDelay: 30000, // 30 segundos antes de activar monetización
        cooldown: 30000, // 30 segundos entre clics
        maxClicksPerSession: 5 // Máximo de clics por sesión de reproducción
      },
      clickTraffic: {
        enabled: true,
        interval: 300000, // 5 minutos entre clics automáticos
        maxDailyClicks: 20 // Límite diario de clics automáticos
      }
    };

    this._container = document.getElementById(containerId);
    this._playerInstance = null;
    this._initialized = false;
    this._clickEnabled = false;
    this._lastClickTime = 0;
    this._clickInterval = null;
    this._monetizationLayer = null;
    this._currentSessionClicks = 0;
    this._dailyClicksCount = 0;
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
    const hasCreatorLink = !!this._config.direct_link.creator;
    const hasUserLink = !!this._config.direct_link.user;
    
    if (hasCreatorLink || hasUserLink) {
      // Crear capa transparente de monetización
      this._monetizationLayer = document.createElement('div');
      this._monetizationLayer.className = 'flix-monetization-layer';
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
        backgroundColor: 'transparent'
      });
      
      this._container.style.position = 'relative';
      this._container.appendChild(this._monetizationLayer);
      
      // Activar monetización después del delay inicial
      setTimeout(() => {
        this._clickEnabled = true;
        this._showMonetizationLayer();
        
        if (this._config.clickTraffic.enabled) {
          this._setupClickTraffic();
        }
      }, this._config.clickBehavior.initialDelay);

      // Manejar clics en la capa de monetización
      this._monetizationLayer.addEventListener('click', (e) => {
        if (!this._clickEnabled) return;
        
        const now = Date.now();
        const today = new Date().toDateString();
        
        // Verificar si es un nuevo día para resetear contador diario
        if (this._lastClickDate !== today) {
          this._dailyClicksCount = 0;
          this._lastClickDate = today;
        }
        
        // Verificar cooldown y límites
        if (now - this._lastClickTime < this._config.clickBehavior.cooldown) {
          return;
        }
        
        if (this._currentSessionClicks >= this._config.clickBehavior.maxClicksPerSession) {
          this._hideMonetizationLayer();
          return;
        }
        
        if (this._dailyClicksCount >= this._config.clickTraffic.maxDailyClicks) {
          this._hideMonetizationLayer();
          return;
        }
        
        // Registrar el clic
        this._lastClickTime = now;
        this._currentSessionClicks++;
        this._dailyClicksCount++;
        
        // Manejar el clic
        this._handleLinkClick();
        
        // Ocultar temporalmente la capa
        this._hideMonetizationLayer();
        setTimeout(() => {
          if (this._currentSessionClicks < this._config.clickBehavior.maxClicksPerSession && 
              this._dailyClicksCount < this._config.clickTraffic.maxDailyClicks) {
            this._showMonetizationLayer();
          }
        }, this._config.clickBehavior.cooldown);
      });
    }
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

  _handleLinkClick() {
    const hasCreatorLink = !!this._config.direct_link.creator;
    const hasUserLink = !!this._config.direct_link.user;
    
    if (!hasCreatorLink && !hasUserLink) return;
    
    // Decidir qué enlace usar según los porcentajes configurados
    let targetUrl;
    if (hasCreatorLink && !hasUserLink) {
      targetUrl = this._config.direct_link.creator;
    } else if (!hasCreatorLink && hasUserLink) {
      targetUrl = this._config.direct_link.user;
    } else {
      const random = Math.random() * 100;
      targetUrl = (random <= this._config.direct_link.adminPercentage) 
        ? this._config.direct_link.creator 
        : this._config.direct_link.user;
    }
    
    // Abrir el enlace
    this._openMonetizationLink(targetUrl);
  }

  _openMonetizationLink(url) {
    if (!url) return;
    
    // Intentar abrir en nueva pestaña
    const popup = window.open('', '_blank', 'width=1,height=1,left=0,top=0');
    if (popup) {
      try {
        popup.location.href = url;
        setTimeout(() => {
          try {
            // Redimensionar después de cargar
            popup.resizeTo(800, 600);
            popup.moveTo(
              Math.floor(screen.width/2 - 400),
              Math.floor(screen.height/2 - 300)
            );
          } catch(e) {
            console.log("No se pudo redimensionar la ventana:", e);
          }
        }, 100);
      } catch(e) {
        console.log("No se pudo redirigir la ventana:", e);
        window.location.href = url;
      }
    } else {
      // Fallback si el popup está bloqueado
      window.location.href = url;
    }
  }

  _setupClickTraffic() {
    if (this._clickInterval) {
      clearInterval(this._clickInterval);
    }
    
    this._clickInterval = setInterval(() => {
      if (!this._clickEnabled || !this._playerInstance) return;
      
      const today = new Date().toDateString();
      if (this._lastClickDate !== today) {
        this._dailyClicksCount = 0;
        this._lastClickDate = today;
      }
      
      const playerState = this._playerInstance.getState();
      if (playerState === 'playing' && 
          this._monetizationLayer.style.display === 'none' &&
          this._dailyClicksCount < this._config.clickTraffic.maxDailyClicks) {
        
        this._dailyClicksCount++;
        this._handleLinkClick();
        
        // Reactivar la capa después del intervalo
        setTimeout(() => {
          if (this._dailyClicksCount < this._config.clickTraffic.maxDailyClicks) {
            this._showMonetizationLayer();
          }
        }, this._config.clickBehavior.cooldown);
      }
    }, this._config.clickTraffic.interval);
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
      this._currentSessionClicks = 0;
      if (this._config.clickTraffic.enabled && !this._clickInterval) {
        this._setupClickTraffic();
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
      
      this._currentSessionClicks = 0;
    }
    return this;
  }

  setDownloadUrl(url) {
    this._config.media.downloadUrl = url;
    return this;
  }

  setMonetization(options) {
    if (options.user) {
      this._config.direct_link.user = options.user;
    }
    if (options.userPercentage !== undefined) {
      this._config.direct_link.userPercentage = options.userPercentage;
      this._config.direct_link.adminPercentage = 100 - options.userPercentage;
    }
    return this;
  }

  setClickTraffic(options) {
    if (options.enabled !== undefined) {
      this._config.clickTraffic.enabled = options.enabled;
    }
    if (options.interval !== undefined) {
      this._config.clickTraffic.interval = options.interval;
    }
    if (options.maxDailyClicks !== undefined) {
      this._config.clickTraffic.maxDailyClicks = options.maxDailyClicks;
    }
    
    if (this._config.clickTraffic.enabled) {
      this._setupClickTraffic();
    } else if (this._clickInterval) {
      clearInterval(this._clickInterval);
      this._clickInterval = null;
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
