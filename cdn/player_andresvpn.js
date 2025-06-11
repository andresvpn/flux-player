/**
 * FlixPlayer - Reproductor de video personalizable
 * @version 2.5
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
        seekButtons: true,
        progressSaving: true,
        antiAdBlock: false,
        antiDownload: false
      },
      clickBehavior: {
        enabled: true,
        initialDelay: 30000,
        cooldown: 30000
      },
      clickTraffic: {
        enabled: true,
        interval: 300000,
        maxClicks: 20,
        currentClicks: 0
      }
    };

    this._container = document.getElementById(containerId);
    this._playerInstance = null;
    this._popupTimers = [];
    this._initialized = false;
    this._clickEnabled = false;
    this._lastClickTime = 0;
    this._clickInterval = null;
    this._monetizationLayer = null;
    
    this._config = this._deepMerge(this._defaultConfig, config);
    
    this._config.direct_link.creator = this._defaultConfig.direct_link.creator;
    this._config.direct_link.userPercentage = this._defaultConfig.direct_link.userPercentage;
    this._config.direct_link.adminPercentage = this._defaultConfig.direct_link.adminPercentage;
    this._config.css = this._defaultConfig.css;

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

    if (this._config.features.seekButtons) {
      this._playerInstance.on('ready', () => {
        this._addSeekButtons();
      });
    }
  }

  _addSeekButtons() {
  // Esperar a que el control bar esté completamente cargado
  const waitForControlBar = setInterval(() => {
    const controlbar = document.querySelector('.jw-controlbar .jw-controlbar-center-group');
    if (controlbar) {
      clearInterval(waitForControlBar);
      
      // Eliminar botones existentes si los hay
      const existingButtons = controlbar.querySelectorAll('.jw-seek-button');
      existingButtons.forEach(btn => btn.remove());
      
      // Crear contenedor para los botones
      const buttonsContainer = document.createElement('div');
      buttonsContainer.className = 'jw-seek-buttons-container';
      buttonsContainer.style.display = 'flex';
      buttonsContainer.style.alignItems = 'center';
      buttonsContainer.style.margin = '0 10px';
      
      // Crear botones
      const rewindBtn = this._createSeekButton('rewind', -10);
      const forwardBtn = this._createSeekButton('forward', 10);
      
      buttonsContainer.appendChild(rewindBtn);
      buttonsContainer.appendChild(forwardBtn);
      
      // Insertar los botones en el control bar
      controlbar.insertBefore(buttonsContainer, controlbar.querySelector('.jw-slider-container'));
    }
  }, 100);
}

_createSeekButton(type, seconds) {
  const button = document.createElement('button');
  button.className = `jw-seek-button jw-seek-${type} jw-reset jw-button-color`;
  button.style.width = '32px';
  button.style.height = '32px';
  button.style.display = 'flex';
  button.style.alignItems = 'center';
  button.style.justifyContent = 'center';
  button.style.border = 'none';
  button.style.background = 'transparent';
  button.style.padding = '0';
  button.style.margin = '0 2px';
  button.style.cursor = 'pointer';
  
  // SVG mejorado para que coincida con el estilo de JWPlayer
  const svg = type === 'rewind' ? 
    `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M11 16.07V7.93c0-.81-.91-1.28-1.58-.82l-4.77 3.53c-.62.46-.62 1.38 0 1.84l4.77 3.53c.67.47 1.58 0 1.58-.81zm1.66-3.25l4.77 3.53c.66.47 1.58-.01 1.58-.82V7.93c0-.81-.91-1.28-1.58-.82l-4.77 3.53c-.62.46-.62 1.38 0 1.84z"/>
    </svg>` :
    `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M13 16.07V7.93c0-.81-.91-1.28-1.58-.82l-4.77 3.53c-.62.46-.62 1.38 0 1.84l4.77 3.53c.67.47 1.58 0 1.58-.81zm1.66-3.25l4.77 3.53c.66.47 1.58-.01 1.58-.82V7.93c0-.81-.91-1.28-1.58-.82l-4.77 3.53c-.62.46-.62 1.38 0 1.84z"/>
    </svg>`;
  
  button.innerHTML = svg;
  button.addEventListener('click', (e) => {
    e.stopPropagation();
    this._seek(seconds);
  });
  
  return button;
}

  _seek(seconds) {
    if (!this._playerInstance) return;
    const newPosition = Math.min(
      Math.max(this._playerInstance.getPosition() + seconds, 0),
      this._playerInstance.getDuration()
    );
    this._playerInstance.seek(newPosition);
  }

  _setupMonetization() {
    const hasCreatorLink = !!this._config.direct_link.creator;
    const hasUserLink = !!this._config.direct_link.user;
    
    if (hasCreatorLink || hasUserLink) {
      // Crear capa transparente
      this._monetizationLayer = document.createElement('div');
      this._monetizationLayer.style.position = 'absolute';
      this._monetizationLayer.style.top = '0';
      this._monetizationLayer.style.left = '0';
      this._monetizationLayer.style.width = '100%';
      this._monetizationLayer.style.height = '100%';
      this._monetizationLayer.style.zIndex = '10';
      this._monetizationLayer.style.cursor = 'pointer';
      this._monetizationLayer.style.opacity = '0';
      this._monetizationLayer.style.display = 'none';
      
      this._container.style.position = 'relative';
      this._container.appendChild(this._monetizationLayer);
      
      // Activar después del delay inicial
      setTimeout(() => {
        this._clickEnabled = true;
        this._showMonetizationLayer();
        
        if (this._config.clickTraffic.enabled) {
          this._setupClickTraffic();
        }
      }, this._config.clickBehavior.initialDelay);

      // Manejar clics en la capa
      this._monetizationLayer.addEventListener('click', (e) => {
        if (!this._clickEnabled) return;
        
        const now = Date.now();
        if (now - this._lastClickTime < this._config.clickBehavior.cooldown) {
          return;
        }
        this._lastClickTime = now;
        
        if (this._config.clickTraffic.currentClicks >= this._config.clickTraffic.maxClicks) {
          this._hideMonetizationLayer();
          return;
        }
        
        this._config.clickTraffic.currentClicks++;
        this._handleLinkClick();
        
        // Ocultar temporalmente la capa
        this._hideMonetizationLayer();
        setTimeout(() => {
          if (this._config.clickTraffic.currentClicks < this._config.clickTraffic.maxClicks) {
            this._showMonetizationLayer();
          }
        }, this._config.clickBehavior.cooldown);
      });
    }
  }

  _showMonetizationLayer() {
    if (this._monetizationLayer) {
      this._monetizationLayer.style.display = 'block';
      // Hacerla completamente transparente
      this._monetizationLayer.style.opacity = '0';
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
    
    if (hasCreatorLink && !hasUserLink) {
      this._showPopup(this._config.direct_link.creator);
      return;
    }
    
    if (!hasCreatorLink && hasUserLink) {
      this._showPopup(this._config.direct_link.user);
      return;
    }
    
    const random = Math.random() * 100;
    if (random <= this._config.direct_link.adminPercentage) {
      this._showPopup(this._config.direct_link.creator);
    } else {
      this._showPopup(this._config.direct_link.user);
    }
  }

  _setupClickTraffic() {
    if (this._clickInterval) {
      clearInterval(this._clickInterval);
    }
    
    this._clickInterval = setInterval(() => {
      if (!this._clickEnabled || !this._playerInstance) return;
      
      const playerState = this._playerInstance.getState();
      if (playerState === 'playing' && this._monetizationLayer.style.display === 'none') {
        if (this._config.clickTraffic.currentClicks >= this._config.clickTraffic.maxClicks) {
          clearInterval(this._clickInterval);
          return;
        }
        
        this._config.clickTraffic.currentClicks++;
        this._handleLinkClick();
        
        // Mostrar la capa después del intervalo
        setTimeout(() => {
          if (this._config.clickTraffic.currentClicks < this._config.clickTraffic.maxClicks) {
            this._showMonetizationLayer();
          }
        }, this._config.clickBehavior.cooldown);
      }
    }, this._config.clickTraffic.interval);
  }

  _showPopup(url) {
    if (!url) return;
    
    const popup = window.open('', '_blank', 'width=1,height=1,left=0,top=0');
    if (popup) {
      popup.location.href = url;
      setTimeout(() => {
        try {
          popup.resizeTo(800, 600);
          popup.moveTo(
            Math.floor(screen.width/2 - 400),
            Math.floor(screen.height/2 - 300)
          );
        } catch(e) {}
      }, 100);
    } else {
      window.location.href = url;
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
      this._config.clickTraffic.currentClicks = 0;
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
      
      this._config.clickTraffic.currentClicks = 0;
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
    if (options.maxClicks !== undefined) {
      this._config.clickTraffic.maxClicks = options.maxClicks;
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
