const DB_STORAGE_KEY = 'dofus_xp_database_profiles';
const ACTIVE_PROFILE_KEY = 'dofus_xp_active_profile_id';

function getApiEndpoint() {
  if (typeof window !== 'undefined') {
    if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
      return '/api/db';
    }
    return 'http://localhost:5173/api/db';
  }
  return '/api/db';
}

const DatabaseManager = {
  profiles: [],
  activeProfileId: null,
  saveTimeout: null,
  source: 'desconectado',

  generateId() {
    return 'prof_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
  },

  createDefaultProfile(name = "Configuración Principal", specificLevels = null, settings = null) {
    const masterSets = (typeof getStoredMasterWisdomSets === 'function')
      ? getStoredMasterWisdomSets()
      : (window.DEFAULT_WISDOM_SETS || []);

    return {
      id: this.generateId(),
      name: name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      settings: settings || {
        activeDungeon: 'malefisk',
        activeWisdomSet: 1,
        totalPlayers: 8,
        carryCount: 1,
        carryLevel: 200,
        leechCount: 7,
        startLevel: 50,
        currentXpPercent: 0,
        accountMultiplier: 4,
        guildBonusActive: true,
        scrollActive: true,
        scrollWisdom: 25,
        consumableActive: true,
        consumableWisdom: 30,
        xpPotionActive: true,
        xpPotionPercent: 200,
        progressionView: 'set1',
        autoStatsWisdom: true,
        manualBaseWisdom: 0,
        challengesBonus: 80,
        zoneBonus: 10,
        timePerRunMinutes: 3.0,
        keyCostKamas: 3000,
        dungeonConfigs: {
          malefisk: { totalPlayers: 8, carryCount: 1, carryLevel: 200, timePerRunMinutes: 3.0, keyCostKamas: 3000 },
          nidas: { totalPlayers: 8, carryCount: 4, carryLevel: 200, timePerRunMinutes: 6.0, keyCostKamas: 35000 },
          reina: { totalPlayers: 8, carryCount: 4, carryLevel: 200, timePerRunMinutes: 7.5, keyCostKamas: 60000 },
          venerable: { totalPlayers: 8, carryCount: 4, carryLevel: 200, timePerRunMinutes: 6.5, keyCostKamas: 40000 }
        }
      },
      specificLevels: (Array.isArray(specificLevels) && specificLevels.length > 0)
        ? specificLevels
        : masterSets
    };
  },

  async init() {
    let loadedData = null;

    const statusEl = document.getElementById('db-status-badge');
    if (statusEl) {
      statusEl.textContent = "Detectando xp_sets.json...";
      statusEl.className = "db-status-badge loading";
    }

    try {
      const resp = await fetch(`${getApiEndpoint()}?t=${Date.now()}`, { cache: 'no-store' });
      if (resp.ok) {
        const data = await resp.json();
        if (data && Array.isArray(data.profiles) && data.profiles.length > 0) {
          loadedData = data;
          this.source = 'disk';
        }
      }
    } catch (e) {}

    if (!loadedData) {
      try {
        const resp = await fetch(`xp_sets.json?t=${Date.now()}`, { cache: 'no-store' });
        if (resp.ok) {
          const data = await resp.json();
          if (data && Array.isArray(data.profiles) && data.profiles.length > 0) {
            loadedData = data;
            this.source = 'json_file';
          }
        }
      } catch (e) {}
    }

    if (!loadedData) {
      try {
        const raw = localStorage.getItem(DB_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            loadedData = {
              profiles: parsed,
              activeProfileId: localStorage.getItem(ACTIVE_PROFILE_KEY)
            };
            this.source = 'localStorage';
          }
        }
      } catch (e) {
        console.warn("Error cargando base de datos de localStorage:", e);
      }
    }

    if (!loadedData) {
      loadedData = JSON.parse(JSON.stringify(window.EMBEDDED_XP_SETS_DB || {}));
      this.source = 'embedded';
    }

    if (loadedData && Array.isArray(loadedData.profiles) && loadedData.profiles.length > 0) {
      this.profiles = loadedData.profiles;
      const savedActiveId = loadedData.activeProfileId || localStorage.getItem(ACTIVE_PROFILE_KEY);
      const exists = this.profiles.find(p => p.id === savedActiveId);
      this.activeProfileId = exists ? exists.id : this.profiles[0].id;
    } else {
      const initialProfile = this.createDefaultProfile("Configuración Principal");
      this.profiles = [initialProfile];
      this.activeProfileId = initialProfile.id;
      this.source = 'default';
      this.saveToStorage();
    }

    localStorage.setItem(ACTIVE_PROFILE_KEY, this.activeProfileId);
    this.applyProfileToAppState(this.getActiveProfile(), true);
    this.renderProfileSelect();
    this.bindEvents();

    if (statusEl) {
      statusEl.className = "db-status-badge";
      if (this.source === 'disk') {
        statusEl.textContent = "Conectado a xp_sets.json (disco)";
        statusEl.classList.add('status-connected');
        statusEl.title = "Sincronizado en tiempo real con el archivo xp_sets.json en disco.";
      } else if (this.source === 'json_file') {
        statusEl.textContent = "Cargado de xp_sets.json";
        statusEl.classList.add('status-connected');
        statusEl.title = "Cargado correctamente desde el archivo estático xp_sets.json.";
      } else if (this.source === 'embedded') {
        statusEl.textContent = "Conectado a xp_sets.json (integrado)";
        statusEl.classList.add('status-connected');
        statusEl.title = "Cargado usando la plantilla base idéntica a xp_sets.json.";
      } else if (this.source === 'localStorage') {
        statusEl.textContent = "Guardado local (localStorage)";
        statusEl.classList.add('status-warning');
        statusEl.title = "Usando datos del navegador. Para recargar desde xp_sets.json, pulsa Importar o inicia el servidor.";
      } else {
        statusEl.textContent = "Guardado automático";
      }
    }
  },

  saveToStorage() {
    try {
      localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(this.profiles));
      if (this.activeProfileId) {
        localStorage.setItem(ACTIVE_PROFILE_KEY, this.activeProfileId);
      }
    } catch (e) {
      console.warn("Error guardando en localStorage:", e);
    }
  },

  async saveToDisk() {
    const payload = {
      version: "1.0",
      app: "Calculadora XP Dofus Unity",
      exportedAt: new Date().toISOString(),
      activeProfileId: this.activeProfileId,
      profiles: this.profiles
    };

    try {
      const resp = await fetch(getApiEndpoint(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload, null, 2)
      });
      if (resp.ok) {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const statusEl = document.getElementById('db-status-badge');
        if (statusEl) {
          statusEl.textContent = `Guardado en xp_sets.json (${timeStr})`;
          statusEl.className = 'db-status-badge status-connected';
          statusEl.title = 'Sincronizado inmediatamente con el archivo xp_sets.json en disco.';
        }
        return true;
      }
    } catch (e) {}

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const statusEl = document.getElementById('db-status-badge');
    if (statusEl) {
      statusEl.textContent = `Guardado en navegador (${timeStr})`;
      statusEl.className = 'db-status-badge status-warning';
      statusEl.title = 'Guardado local en navegador. Para guardar en disco en xp_sets.json, mantén el servidor activo o pulsa Exportar.';
    }
    return false;
  },

  getActiveProfile() {
    return this.profiles.find(p => p.id === this.activeProfileId) || this.profiles[0];
  },

  applyProfileToAppState(profile, shouldUpdateUI = true) {
    if (!profile || !window.AppState) return;

    if (profile.settings) {
      if (profile.settings.activeDungeon && window.DUNGEONS && window.DUNGEONS[profile.settings.activeDungeon]) {
        window.AppState.activeDungeon = profile.settings.activeDungeon;
      }
      if (profile.settings.dungeonConfigs) {
        window.AppState.dungeonConfigs = { ...window.AppState.dungeonConfigs, ...profile.settings.dungeonConfigs };
      }

      window.AppState.totalPlayers = profile.settings.totalPlayers ?? 8;
      window.AppState.carryCount = profile.settings.carryCount ?? 1;
      window.AppState.carryLevel = profile.settings.carryLevel ?? 200;
      window.AppState.leechCount = profile.settings.leechCount ?? Math.max(1, window.AppState.totalPlayers - window.AppState.carryCount);
      window.AppState.startLevel = profile.settings.startLevel ?? 67;
      window.AppState.currentXpPercent = profile.settings.currentXpPercent ?? 0;
      window.AppState.accountMultiplier = profile.settings.accountMultiplier ?? 1;
      window.AppState.guildBonusActive = !!profile.settings.guildBonusActive;
      window.AppState.scrollActive = profile.settings.scrollActive ?? true;
      window.AppState.scrollWisdom = profile.settings.scrollWisdom ?? 80;
      window.AppState.consumableActive = profile.settings.consumableActive ?? true;
      window.AppState.consumableWisdom = profile.settings.consumableWisdom ?? 30;
      window.AppState.xpPotionActive = profile.settings.xpPotionActive ?? true;
      window.AppState.xpPotionPercent = profile.settings.xpPotionPercent ?? 200;
      window.AppState.progressionView = profile.settings.progressionView ?? 'compare';
      window.AppState.autoStatsWisdom = profile.settings.autoStatsWisdom ?? true;
      window.AppState.manualBaseWisdom = profile.settings.manualBaseWisdom ?? 0;
      window.AppState.challengesBonus = profile.settings.challengesBonus ?? 80;
      window.AppState.zoneBonus = profile.settings.zoneBonus ?? 0;
      window.AppState.timePerRunMinutes = profile.settings.timePerRunMinutes ?? 2.5;
      window.AppState.keyCostKamas = profile.settings.keyCostKamas ?? 3000;
      window.AppState.activeWisdomSet = profile.settings.activeWisdomSet ?? 1;

      const defaultDungeons = ['malefisk', 'nidas', 'reina', 'venerable'];
      defaultDungeons.forEach(dId => {
        if (!window.AppState.dungeonConfigs[dId]) {
          window.AppState.dungeonConfigs[dId] = {};
        }
        const dCfg = window.AppState.dungeonConfigs[dId];
        const dungeonObj = (window.DUNGEONS && window.DUNGEONS[dId]) || {};
        if (!Array.isArray(dCfg.groupMembers) || dCfg.groupMembers.length < 8) {
          if (typeof getDefaultGroupMembers === 'function') {
            dCfg.groupMembers = getDefaultGroupMembers(
              dId,
              dCfg.totalPlayers || dungeonObj.defaultTotalPlayers || 8,
              dCfg.carryCount !== undefined ? dCfg.carryCount : dungeonObj.defaultCarries,
              dCfg.carryLevel || dungeonObj.defaultCarryLevel || 200,
              50
            );
          }
        }
      });

      const currentActiveCfg = window.AppState.dungeonConfigs[window.AppState.activeDungeon];
      if (currentActiveCfg && Array.isArray(currentActiveCfg.groupMembers) && currentActiveCfg.groupMembers.length >= 8) {
        window.AppState.groupMembers = currentActiveCfg.groupMembers.map(m => ({ ...m }));
      } else if (typeof getDefaultGroupMembers === 'function') {
        window.AppState.groupMembers = getDefaultGroupMembers(
          window.AppState.activeDungeon,
          window.AppState.totalPlayers,
          window.AppState.carryCount,
          window.AppState.carryLevel,
          50
        );
        if (currentActiveCfg) currentActiveCfg.groupMembers = window.AppState.groupMembers.map(m => ({ ...m }));
      }

      if (window.AppState.groupMembers) {
        const activeMembers = window.AppState.groupMembers.slice(0, window.AppState.totalPlayers);
        window.AppState.startLevel = Math.min(...activeMembers.map(m => m.level));
      }
    }

    if (Array.isArray(profile.specificLevels) && profile.specificLevels.length > 0) {
      window.AppState.specificLevels = profile.specificLevels.map(s => ({
        level: Number(s.level),
        gearWisdom: Number(s.gearWisdom) || 0,
        gearWisdom2: (s.gearWisdom2 !== undefined && s.gearWisdom2 !== null) ? Number(s.gearWisdom2) : (Number(s.gearWisdom) || 0),
        note: s.note || `Set Nivel ${s.level}`
      })).sort((a, b) => a.level - b.level);
    } else if (typeof getStoredMasterWisdomSets === 'function') {
      window.AppState.specificLevels = getStoredMasterWisdomSets();
    }

    if (typeof saveMasterWisdomSets === 'function') {
      saveMasterWisdomSets(window.AppState.specificLevels);
    }

    if (typeof syncDOMFromAppState === 'function') syncDOMFromAppState();
    if (shouldUpdateUI && typeof updateUI === 'function') updateUI();
  },

  autoSaveCurrent(immediate = false) {
    if (typeof commitTableInputsToState === 'function') {
      commitTableInputsToState();
    }
    const active = this.getActiveProfile();
    if (!active || !window.AppState) return;

    if (window.AppState.activeDungeon && window.AppState.dungeonConfigs[window.AppState.activeDungeon]) {
      window.AppState.dungeonConfigs[window.AppState.activeDungeon].totalPlayers = window.AppState.totalPlayers;
      window.AppState.dungeonConfigs[window.AppState.activeDungeon].carryCount = window.AppState.carryCount;
      window.AppState.dungeonConfigs[window.AppState.activeDungeon].carryLevel = window.AppState.carryLevel;
      window.AppState.dungeonConfigs[window.AppState.activeDungeon].timePerRunMinutes = window.AppState.timePerRunMinutes;
      window.AppState.dungeonConfigs[window.AppState.activeDungeon].keyCostKamas = window.AppState.keyCostKamas;
      if (window.AppState.groupMembers) {
        window.AppState.dungeonConfigs[window.AppState.activeDungeon].groupMembers = window.AppState.groupMembers.map(m => ({ ...m }));
      }
    }

    active.updatedAt = new Date().toISOString();
    active.settings = {
      activeDungeon: window.AppState.activeDungeon,
      activeWisdomSet: window.AppState.activeWisdomSet || 1,
      dungeonConfigs: window.AppState.dungeonConfigs,
      totalPlayers: window.AppState.totalPlayers,
      carryCount: window.AppState.carryCount,
      carryLevel: window.AppState.carryLevel,
      leechCount: window.AppState.leechCount,
      startLevel: window.AppState.startLevel,
      currentXpPercent: window.AppState.currentXpPercent,
      accountMultiplier: window.AppState.accountMultiplier,
      guildBonusActive: window.AppState.guildBonusActive,
      scrollActive: window.AppState.scrollActive,
      scrollWisdom: window.AppState.scrollWisdom,
      consumableActive: window.AppState.consumableActive,
      consumableWisdom: window.AppState.consumableWisdom,
      xpPotionActive: window.AppState.xpPotionActive,
      xpPotionPercent: window.AppState.xpPotionPercent,
      progressionView: window.AppState.progressionView,
      autoStatsWisdom: window.AppState.autoStatsWisdom,
      manualBaseWisdom: window.AppState.manualBaseWisdom,
      challengesBonus: window.AppState.challengesBonus,
      zoneBonus: window.AppState.zoneBonus,
      timePerRunMinutes: window.AppState.timePerRunMinutes,
      keyCostKamas: window.AppState.keyCostKamas,
      groupMembers: window.AppState.groupMembers
    };
    active.specificLevels = [...(window.AppState.specificLevels || [])].sort((a, b) => a.level - b.level);

    if (typeof saveMasterWisdomSets === 'function') {
      saveMasterWisdomSets(active.specificLevels);
    }

    this.saveToStorage();
    this.renderProfileSelect();

    if (immediate) {
      if (this.saveTimeout) {
        clearTimeout(this.saveTimeout);
        this.saveTimeout = null;
      }
      this.saveToDisk();
    } else {
      if (this.saveTimeout) {
        clearTimeout(this.saveTimeout);
      }
      this.saveTimeout = setTimeout(() => {
        this.saveToDisk();
      }, 150);
    }
  },

  async saveImmediately() {
    if (typeof commitTableInputsToState === 'function') {
      commitTableInputsToState();
    }
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    this.autoSaveCurrent(false);
    return await this.saveToDisk();
  },

  async switchProfile(id) {
    this.autoSaveCurrent();
    const target = this.profiles.find(p => p.id === id);
    if (!target) return;

    this.activeProfileId = id;
    localStorage.setItem(ACTIVE_PROFILE_KEY, id);
    this.applyProfileToAppState(target, true);
    this.renderProfileSelect();
    await this.saveImmediately();
  },

  async createNewProfile() {
    this.autoSaveCurrent();
    const profileName = prompt("Nombre de la nueva configuración:", `Configuración ${this.profiles.length + 1}`);
    if (!profileName || !profileName.trim()) return;

    const newProfile = this.createDefaultProfile(profileName.trim());
    this.profiles.push(newProfile);
    this.activeProfileId = newProfile.id;
    this.saveToStorage();
    this.applyProfileToAppState(newProfile, true);
    this.renderProfileSelect();
    await this.saveImmediately();
  },

  async duplicateCurrentProfile() {
    this.autoSaveCurrent();
    const active = this.getActiveProfile();
    const copyName = prompt("Nombre para el perfil duplicado:", `${active.name} (Copia)`);
    if (!copyName || !copyName.trim()) return;

    const copyProfile = {
      id: this.generateId(),
      name: copyName.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      settings: JSON.parse(JSON.stringify(active.settings)),
      specificLevels: JSON.parse(JSON.stringify(active.specificLevels))
    };

    this.profiles.push(copyProfile);
    this.activeProfileId = copyProfile.id;
    this.saveToStorage();
    this.applyProfileToAppState(copyProfile, true);
    this.renderProfileSelect();
    await this.saveImmediately();
  },

  async renameCurrentProfile() {
    const active = this.getActiveProfile();
    const newName = prompt("Nuevo nombre para este perfil:", active.name);
    if (newName && newName.trim() && newName.trim() !== active.name) {
      active.name = newName.trim();
      active.updatedAt = new Date().toISOString();
      this.saveToStorage();
      this.renderProfileSelect();
      await this.saveImmediately();
    }
  },

  async deleteCurrentProfile() {
    if (this.profiles.length <= 1) {
      alert("No puedes eliminar el único perfil de la base de datos.");
      return;
    }
    const active = this.getActiveProfile();
    if (confirm(`¿Deseas eliminar permanentemente el perfil "${active.name}"?`)) {
      this.profiles = this.profiles.filter(p => p.id !== active.id);
      this.activeProfileId = this.profiles[0].id;
      this.saveToStorage();
      this.applyProfileToAppState(this.getActiveProfile(), true);
      this.renderProfileSelect();
      await this.saveImmediately();
    }
  },

  exportJSON() {
    this.autoSaveCurrent();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      version: "1.0",
      app: "Calculadora XP Dofus Unity",
      exportedAt: new Date().toISOString(),
      activeProfileId: this.activeProfileId,
      profiles: this.profiles
    }, null, 2));

    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `xp_sets.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  },

  importJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data && Array.isArray(data.profiles) && data.profiles.length > 0) {
        this.profiles = data.profiles;
        this.activeProfileId = data.activeProfileId && this.profiles.find(p => p.id === data.activeProfileId)
          ? data.activeProfileId
          : this.profiles[0].id;
        this.saveToStorage();
        this.saveToDisk();
        this.applyProfileToAppState(this.getActiveProfile(), true);
        this.renderProfileSelect();
        alert("Base de datos importada y sincronizada correctamente.");
      } else {
        alert("El archivo no contiene un formato de perfiles válido.");
      }
    } catch (err) {
      alert("Error al leer el archivo JSON: " + err.message);
    }
  },

  renderProfileSelect() {
    const select = document.getElementById('profile-select');
    if (!select) return;
    select.innerHTML = '';
    this.profiles.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = `${p.name} (${p.specificLevels?.length || 0} niveles)`;
      if (p.id === this.activeProfileId) opt.selected = true;
      select.appendChild(opt);
    });
  },

  bindEvents() {
    if (this._eventsBound) return;
    this._eventsBound = true;

    const select = document.getElementById('profile-select');
    if (select) {
      select.addEventListener('change', (e) => this.switchProfile(e.target.value));
    }

    const btnSave = document.getElementById('btn-save-profile');
    if (btnSave) {
      btnSave.addEventListener('click', async () => {
        const statusEl = document.getElementById('db-status-badge');
        if (statusEl) {
          statusEl.textContent = 'Guardando en xp_sets.json...';
          statusEl.className = 'db-status-badge loading';
        }
        await this.saveImmediately();
      });
    }

    const btnNew = document.getElementById('btn-new-profile');
    if (btnNew) {
      btnNew.addEventListener('click', () => this.createNewProfile());
    }

    const btnDup = document.getElementById('btn-duplicate-profile');
    if (btnDup) {
      btnDup.addEventListener('click', () => this.duplicateCurrentProfile());
    }

    const btnRename = document.getElementById('btn-rename-profile');
    if (btnRename) {
      btnRename.addEventListener('click', () => this.renameCurrentProfile());
    }

    const btnDel = document.getElementById('btn-delete-profile');
    if (btnDel) {
      btnDel.addEventListener('click', () => this.deleteCurrentProfile());
    }

    const btnExport = document.getElementById('btn-export-profile');
    if (btnExport) {
      btnExport.addEventListener('click', () => this.exportJSON());
    }

    const btnImport = document.getElementById('btn-import-profile');
    const fileInput = document.getElementById('import-file-input');
    if (btnImport && fileInput) {
      btnImport.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
          this.importJSON(event.target.result);
          fileInput.value = '';
        };
        reader.readAsText(file);
      });
    }
  }
};

if (typeof window !== 'undefined') {
  window.DatabaseManager = DatabaseManager;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DatabaseManager };
}
