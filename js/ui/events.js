/**
 * Controladores de Eventos e Interacciones de Usuario (UI Events)
 * 
 * Gestiona:
 * - Cambio de mazmorras y vista comparador
 * - Ajuste interactivo de modificadores de combate (retos, zona, gremio, poción, pergaminos)
 * - Edición de slots individuales de grupo y presets rápidos
 * - Edición y adición de niveles específicos (Set 1 vs Set 2)
 */

window.switchDungeon = function (dungeonId) {
  const state = window.AppState;
  if (!state) return;

  if (dungeonId === 'comparator') {
    state.activeView = 'comparator';
    const mainGrid = document.querySelector('.dashboard-grid');
    const heroGrid = document.querySelector('.results-hero-grid');
    const compSec = document.getElementById('comparator-section');

    if (mainGrid) mainGrid.style.display = 'none';
    if (heroGrid) heroGrid.style.display = 'none';
    if (compSec) compSec.style.display = 'flex';

    document.querySelectorAll('.dungeon-tab').forEach(btn => {
      if (btn.dataset.dungeon === 'comparator') {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    if (typeof renderComparatorView === 'function') renderComparatorView();
    return;
  }

  state.activeView = 'dungeon';
  const mainGrid = document.querySelector('.dashboard-grid');
  const heroGrid = document.querySelector('.results-hero-grid');
  const compSec = document.getElementById('comparator-section');

  if (mainGrid) mainGrid.style.display = 'grid';
  if (heroGrid) heroGrid.style.display = 'grid';
  if (compSec) compSec.style.display = 'none';

  if (state.activeDungeon && state.dungeonConfigs[state.activeDungeon]) {
    state.dungeonConfigs[state.activeDungeon] = {
      ...state.dungeonConfigs[state.activeDungeon],
      totalPlayers: state.totalPlayers,
      carryCount: state.carryCount,
      carryLevel: state.carryLevel,
      timePerRunMinutes: state.timePerRunMinutes,
      keyCostKamas: state.keyCostKamas,
      groupMembers: state.groupMembers ? state.groupMembers.map(m => ({ ...m })) : undefined
    };
  }

  state.activeDungeon = dungeonId;
  const dungeonsCatalog = window.DUNGEONS || {};
  const dungeon = dungeonsCatalog[dungeonId] || dungeonsCatalog.malefisk || {};
  const savedCfg = state.dungeonConfigs[dungeonId] || {};

  state.totalPlayers = savedCfg.totalPlayers ?? dungeon.defaultTotalPlayers ?? 8;
  state.carryCount = savedCfg.carryCount ?? dungeon.defaultCarries ?? 1;
  state.carryLevel = savedCfg.carryLevel ?? dungeon.defaultCarryLevel ?? 200;
  state.leechCount = Math.max(1, state.totalPlayers - state.carryCount);
  state.timePerRunMinutes = savedCfg.timePerRunMinutes ?? dungeon.defaultTimePerRunMinutes ?? 2.5;
  state.keyCostKamas = savedCfg.keyCostKamas ?? dungeon.defaultKeyCostKamas ?? 3000;

  if (Array.isArray(savedCfg.groupMembers) && savedCfg.groupMembers.length >= 8) {
    state.groupMembers = savedCfg.groupMembers.map(m => ({ ...m }));
  } else if (typeof getDefaultGroupMembers === 'function') {
    state.groupMembers = getDefaultGroupMembers(
      dungeonId,
      state.totalPlayers,
      state.carryCount,
      state.carryLevel,
      50
    );
    savedCfg.groupMembers = state.groupMembers.map(m => ({ ...m }));
  }

  if (state.groupMembers) {
    const activeMembers = state.groupMembers.slice(0, state.totalPlayers);
    state.startLevel = Math.min(...activeMembers.map(m => m.level));
  }

  if (typeof syncDOMFromAppState === 'function') syncDOMFromAppState();
  if (window.DatabaseManager && typeof window.DatabaseManager.autoSaveCurrent === 'function') {
    window.DatabaseManager.autoSaveCurrent();
  }
  if (typeof updateUI === 'function') updateUI();
};

window.setProgressionView = function (mode) {
  const state = window.AppState;
  if (!state) return;
  if (mode !== 'compare' && mode !== 'set1' && mode !== 'set2') mode = 'compare';
  state.progressionView = mode;
  if (typeof syncProgressionViewButtons === 'function') syncProgressionViewButtons();
  if (window.DatabaseManager) window.DatabaseManager.autoSaveCurrent();
  if (typeof updateUI === 'function') updateUI();
};

window.setActiveWisdomSet = function (setNum) {
  const state = window.AppState;
  if (!state) return;
  state.activeWisdomSet = (setNum === 2) ? 2 : 1;
  if (typeof syncDOMFromAppState === 'function') syncDOMFromAppState();
  if (window.DatabaseManager) window.DatabaseManager.autoSaveCurrent();
  if (typeof updateUI === 'function') updateUI();
};

window.applyGroupPreset = function (presetName) {
  const state = window.AppState;
  if (!state) return;

  if (presetName === 'malefisk_solo') {
    state.totalPlayers = 8;
    state.carryCount = 1;
    state.carryLevel = 200;
    state.leechCount = 7;
    state.groupMembers = getDefaultGroupMembers('malefisk', 8, 1, 200, 50);
    state.startLevel = 50;
  } else if (presetName === 'malefisk_mix') {
    state.totalPlayers = 8;
    state.carryCount = 1;
    state.carryLevel = 200;
    state.leechCount = 7;
    state.groupMembers = [
      { slot: 1, level: 200, role: 'carry', name: 'Carry' },
      { slot: 2, level: 100, role: 'leech', name: 'Mula 1 (Lvl 100)' },
      { slot: 3, level: 100, role: 'leech', name: 'Mula 2 (Lvl 100)' },
      { slot: 4, level: 50, role: 'leech', name: 'Mula 3' },
      { slot: 5, level: 50, role: 'leech', name: 'Mula 4' },
      { slot: 6, level: 50, role: 'leech', name: 'Mula 5' },
      { slot: 7, level: 50, role: 'leech', name: 'Mula 6' },
      { slot: 8, level: 50, role: 'target', name: 'Mula Objetivo' }
    ];
    state.startLevel = 50;
  } else if (presetName === 'nidas_classic' || presetName === 'classic_4_carries') {
    state.totalPlayers = 8;
    state.carryCount = 4;
    state.carryLevel = 200;
    state.leechCount = 4;
    state.groupMembers = getDefaultGroupMembers('nidas', 8, 4, 200, 50);
    state.startLevel = 50;
  } else if (presetName === 'all_equal') {
    const currentStart = 50;
    const carries = state.carryCount || 1;
    state.groupMembers = state.groupMembers.map((m, idx) => ({
      ...m,
      level: idx < carries ? (state.carryLevel || 200) : currentStart
    }));
    state.startLevel = currentStart;
  }

  if (!state.dungeonConfigs[state.activeDungeon]) {
    state.dungeonConfigs[state.activeDungeon] = {};
  }
  state.dungeonConfigs[state.activeDungeon].totalPlayers = state.totalPlayers;
  state.dungeonConfigs[state.activeDungeon].carryCount = state.carryCount;
  state.dungeonConfigs[state.activeDungeon].carryLevel = state.carryLevel;
  state.dungeonConfigs[state.activeDungeon].groupMembers = state.groupMembers.map(m => ({ ...m }));

  if (typeof syncDOMFromAppState === 'function') syncDOMFromAppState();
  if (window.DatabaseManager) window.DatabaseManager.autoSaveCurrent();
  if (typeof updateUI === 'function') updateUI();
};

window.onMemberLevelChange = function (slotIndex, newLevelVal) {
  const state = window.AppState;
  if (!state) return;

  let val = parseInt(newLevelVal, 10);
  if (isNaN(val) || val < 1) val = 1;
  if (val > 200) val = 200;

  if (!state.groupMembers || state.groupMembers.length < 8) {
    if (typeof getDefaultGroupMembers === 'function') {
      state.groupMembers = getDefaultGroupMembers(state.activeDungeon);
    }
  }

  if (state.groupMembers && state.groupMembers[slotIndex]) {
    state.groupMembers[slotIndex].level = val;
  }

  if (!state.dungeonConfigs[state.activeDungeon]) {
    state.dungeonConfigs[state.activeDungeon] = {};
  }
  state.dungeonConfigs[state.activeDungeon].groupMembers = state.groupMembers.map(m => ({ ...m }));

  const total = state.totalPlayers || 8;
  const activeMembers = state.groupMembers.slice(0, total);
  const lowestLvl = Math.min(...activeMembers.map(m => m.level));
  state.startLevel = lowestLvl;

  if (typeof syncDOMFromAppState === 'function') syncDOMFromAppState();
  if (window.DatabaseManager) window.DatabaseManager.autoSaveCurrent();
  if (typeof updateUI === 'function') updateUI();
};

window.setXpPotionPreset = function (val) {
  const state = window.AppState;
  if (!state) return;
  state.xpPotionPercent = val;
  state.xpPotionActive = true;
  if (typeof syncDOMFromAppState === 'function') syncDOMFromAppState();
  if (window.DatabaseManager) window.DatabaseManager.autoSaveCurrent();
  if (typeof updateUI === 'function') updateUI();
};

window.onLevelChange = function (index, value) {
  const state = window.AppState;
  if (!state) return;
  const parsed = parseInt(value, 10);
  if (!isNaN(parsed) && parsed >= 1 && parsed <= 200) {
    const sorted = [...state.specificLevels].sort((a, b) => a.level - b.level);
    sorted[index].level = parsed;
    sorted.sort((a, b) => a.level - b.level);
    state.specificLevels = sorted;
    if (typeof saveMasterWisdomSets === 'function') saveMasterWisdomSets(state.specificLevels);
    if (window.DatabaseManager) window.DatabaseManager.saveImmediately();
    if (typeof updateUI === 'function') updateUI();
  }
};

window.onGearWisdomChange = function (index, value, setIndex = 1) {
  const state = window.AppState;
  if (!state) return;
  const parsed = parseInt(value, 10);
  if (!isNaN(parsed) && parsed >= 0) {
    const sorted = [...state.specificLevels].sort((a, b) => a.level - b.level);
    if (setIndex === 2) {
      sorted[index].gearWisdom2 = parsed;
    } else {
      sorted[index].gearWisdom = parsed;
      if (sorted[index].gearWisdom2 === undefined) {
        sorted[index].gearWisdom2 = parsed;
      }
    }
    state.specificLevels = sorted;
    if (typeof saveMasterWisdomSets === 'function') saveMasterWisdomSets(state.specificLevels);
    if (window.DatabaseManager) window.DatabaseManager.saveImmediately();
    if (typeof updateUI === 'function') updateUI();
  }
};

window.commitTableInputsToState = function () {
  const state = window.AppState;
  if (!state || !state.specificLevels) return;
  const tbody = document.getElementById('specific-levels-tbody');
  if (!tbody) return;
  const rows = tbody.querySelectorAll('tr');
  const sorted = [...state.specificLevels].sort((a, b) => a.level - b.level);
  rows.forEach((tr, idx) => {
    if (!sorted[idx]) return;
    const lvlInput = tr.querySelector('input[type="number"].tier-input');
    const wis1Input = tr.querySelector('.tier-input-set1');
    const wis2Input = tr.querySelector('.tier-input-set2');
    const noteInput = tr.querySelector('.tier-note-input') || tr.querySelector('input[type="text"]');
    if (lvlInput && !isNaN(parseInt(lvlInput.value, 10))) {
      sorted[idx].level = parseInt(lvlInput.value, 10);
    }
    if (wis1Input && !isNaN(parseInt(wis1Input.value, 10))) {
      sorted[idx].gearWisdom = parseInt(wis1Input.value, 10);
    }
    if (wis2Input && !isNaN(parseInt(wis2Input.value, 10))) {
      sorted[idx].gearWisdom2 = parseInt(wis2Input.value, 10);
    }
    if (noteInput) {
      sorted[idx].note = noteInput.value.trim();
    }
  });
  sorted.sort((a, b) => a.level - b.level);
  state.specificLevels = sorted;
  if (typeof saveMasterWisdomSets === 'function') saveMasterWisdomSets(state.specificLevels);
};

window.onNoteChange = function (index, value) {
  const state = window.AppState;
  if (!state || !state.specificLevels) return;
  const sorted = [...state.specificLevels].sort((a, b) => a.level - b.level);
  if (sorted[index]) {
    sorted[index].note = value;
    state.specificLevels = sorted;
    if (typeof saveMasterWisdomSets === 'function') saveMasterWisdomSets(state.specificLevels);
    if (window.DatabaseManager) window.DatabaseManager.autoSaveCurrent();
  }
};

window.removeSpecificLevel = function (index) {
  const state = window.AppState;
  if (!state) return;
  const sorted = [...state.specificLevels].sort((a, b) => a.level - b.level);
  sorted.splice(index, 1);
  state.specificLevels = sorted;
  if (typeof saveMasterWisdomSets === 'function') saveMasterWisdomSets(state.specificLevels);
  if (window.DatabaseManager) window.DatabaseManager.saveImmediately();
  if (typeof updateUI === 'function') updateUI();
};

window.addNewSpecificLevel = function () {
  const state = window.AppState;
  if (!state) return;

  const lvlInput = document.getElementById('custom-level-input');
  const wisInput = document.getElementById('custom-wisdom-input');
  const wis2Input = document.getElementById('custom-wisdom2-input');
  const noteInput = document.getElementById('custom-note-input');

  if (!lvlInput || !wisInput) return;

  const level = parseInt(lvlInput.value, 10);
  const gearWisdom = parseInt(wisInput.value, 10);
  let gearWisdom2 = (wis2Input && wis2Input.value !== '') ? parseInt(wis2Input.value, 10) : gearWisdom;
  if (isNaN(gearWisdom2) || gearWisdom2 < 0) gearWisdom2 = gearWisdom;
  const note = noteInput ? noteInput.value.trim() : '';

  if (isNaN(level) || level < 1 || level > 200) {
    alert("Por favor ingresa un nivel válido entre 1 y 200.");
    lvlInput.focus();
    return;
  }
  if (isNaN(gearWisdom) || gearWisdom < 0) {
    alert("Por favor ingresa la sabiduría que aporta el Set 1 en ese nivel.");
    wisInput.focus();
    return;
  }

  const existingIdx = state.specificLevels.findIndex(s => s.level === level);
  if (existingIdx !== -1) {
    state.specificLevels[existingIdx].gearWisdom = gearWisdom;
    state.specificLevels[existingIdx].gearWisdom2 = gearWisdom2;
    if (note) state.specificLevels[existingIdx].note = note;
  } else {
    state.specificLevels.push({
      level,
      gearWisdom,
      gearWisdom2,
      note: note || `Set Nivel ${level}`
    });
  }

  state.specificLevels.sort((a, b) => a.level - b.level);
  if (typeof saveMasterWisdomSets === 'function') saveMasterWisdomSets(state.specificLevels);
  if (window.DatabaseManager) window.DatabaseManager.saveImmediately();

  lvlInput.value = '';
  wisInput.value = '';
  if (wis2Input) wis2Input.value = '';
  if (noteInput) noteInput.value = '';
  lvlInput.focus();

  if (typeof updateUI === 'function') updateUI();
};

window.clearAllSpecificLevels = function () {
  const state = window.AppState;
  if (!state) return;
  if (confirm("¿Deseas vaciar la lista de niveles para añadir tus propios niveles desde cero?")) {
    state.specificLevels = [];
    if (typeof saveMasterWisdomSets === 'function') saveMasterWisdomSets(state.specificLevels);
    if (window.DatabaseManager) window.DatabaseManager.saveImmediately();
    if (typeof updateUI === 'function') updateUI();
  }
};

window.restoreMasterWisdomSets = function () {
  const state = window.AppState;
  if (!state) return;
  if (confirm("¿Deseas restablecer los conjuntos de sabiduría predefinidos desde xp_sets.json (17 conjuntos, Nivel 50 a 199)?")) {
    const defaults = window.DEFAULT_WISDOM_SETS || [];
    state.specificLevels = JSON.parse(JSON.stringify(defaults));
    if (typeof saveMasterWisdomSets === 'function') saveMasterWisdomSets(state.specificLevels);
    if (window.DatabaseManager) window.DatabaseManager.saveImmediately();
    if (typeof updateUI === 'function') updateUI();
  }
};

function initEventListeners() {
  const state = window.AppState;
  if (!state) return;

  document.querySelectorAll('.dungeon-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const dungeonId = tab.dataset.dungeon;
      if (dungeonId) switchDungeon(dungeonId);
    });
  });

  document.querySelectorAll('.pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.accountMultiplier = parseInt(btn.dataset.mult, 10);
      if (window.DatabaseManager) window.DatabaseManager.autoSaveCurrent();
      if (typeof updateUI === 'function') updateUI();
    });
  });

  const autoStatsToggle = document.getElementById('auto-stats-toggle');
  const manualBaseRow = document.getElementById('manual-base-row');
  if (autoStatsToggle) {
    autoStatsToggle.addEventListener('change', (e) => {
      state.autoStatsWisdom = e.target.checked;
      if (manualBaseRow) manualBaseRow.style.display = state.autoStatsWisdom ? 'none' : 'block';
      if (window.DatabaseManager) window.DatabaseManager.autoSaveCurrent();
      if (typeof updateUI === 'function') updateUI();
    });
  }

  const manualBaseInput = document.getElementById('manual-base-input');
  if (manualBaseInput) {
    manualBaseInput.addEventListener('input', (e) => {
      state.manualBaseWisdom = Math.max(0, parseInt(e.target.value, 10) || 0);
      if (window.DatabaseManager) window.DatabaseManager.autoSaveCurrent();
      if (typeof updateUI === 'function') updateUI();
    });
  }

  const guildToggle = document.getElementById('guild-toggle');
  if (guildToggle) {
    guildToggle.addEventListener('change', (e) => {
      state.guildBonusActive = e.target.checked;
      if (window.DatabaseManager) window.DatabaseManager.autoSaveCurrent();
      if (typeof updateUI === 'function') updateUI();
    });
  }

  const scrollToggle = document.getElementById('scroll-toggle');
  if (scrollToggle) {
    scrollToggle.addEventListener('change', (e) => {
      state.scrollActive = e.target.checked;
      if (window.DatabaseManager) window.DatabaseManager.autoSaveCurrent();
      if (typeof updateUI === 'function') updateUI();
    });
  }

  const scrollInput = document.getElementById('scroll-input');
  if (scrollInput) {
    scrollInput.addEventListener('input', (e) => {
      state.scrollWisdom = Math.max(0, parseInt(e.target.value, 10) || 0);
      if (window.DatabaseManager) window.DatabaseManager.autoSaveCurrent();
      if (typeof updateUI === 'function') updateUI();
    });
  }

  const consumableToggle = document.getElementById('consumable-toggle');
  if (consumableToggle) {
    consumableToggle.addEventListener('change', (e) => {
      state.consumableActive = e.target.checked;
      if (window.DatabaseManager) window.DatabaseManager.autoSaveCurrent();
      if (typeof updateUI === 'function') updateUI();
    });
  }

  const consumableInput = document.getElementById('consumable-input');
  if (consumableInput) {
    consumableInput.addEventListener('input', (e) => {
      state.consumableWisdom = Math.max(0, parseInt(e.target.value, 10) || 0);
      if (window.DatabaseManager) window.DatabaseManager.autoSaveCurrent();
      if (typeof updateUI === 'function') updateUI();
    });
  }

  const xpPotionToggle = document.getElementById('xp-potion-toggle');
  if (xpPotionToggle) {
    xpPotionToggle.addEventListener('change', (e) => {
      state.xpPotionActive = e.target.checked;
      if (window.DatabaseManager) window.DatabaseManager.autoSaveCurrent();
      if (typeof updateUI === 'function') updateUI();
    });
  }

  const xpPotionInput = document.getElementById('xp-potion-input');
  if (xpPotionInput) {
    xpPotionInput.addEventListener('input', (e) => {
      let val = parseInt(e.target.value, 10);
      if (isNaN(val)) val = 0;
      state.xpPotionPercent = Math.max(0, val);
      if (window.DatabaseManager) window.DatabaseManager.autoSaveCurrent();
      if (typeof updateUI === 'function') updateUI();
    });
  }

  const retosRange = document.getElementById('retos-range');
  const retosInput = document.getElementById('retos-input');
  if (retosRange && retosInput) {
    retosRange.addEventListener('input', (e) => {
      state.challengesBonus = parseInt(e.target.value, 10) || 0;
      retosInput.value = state.challengesBonus;
      if (window.DatabaseManager) window.DatabaseManager.autoSaveCurrent();
      if (typeof updateUI === 'function') updateUI();
    });

    retosInput.addEventListener('input', (e) => {
      state.challengesBonus = Math.max(0, parseInt(e.target.value, 10) || 0);
      retosRange.value = state.challengesBonus;
      if (window.DatabaseManager) window.DatabaseManager.autoSaveCurrent();
      if (typeof updateUI === 'function') updateUI();
    });
  }

  const zonaRange = document.getElementById('zona-range');
  const zonaInput = document.getElementById('zona-input');
  if (zonaRange && zonaInput) {
    zonaRange.addEventListener('input', (e) => {
      state.zoneBonus = parseInt(e.target.value, 10) || 0;
      zonaInput.value = state.zoneBonus;
      if (window.DatabaseManager) window.DatabaseManager.autoSaveCurrent();
      if (typeof updateUI === 'function') updateUI();
    });

    zonaInput.addEventListener('input', (e) => {
      state.zoneBonus = Math.max(0, parseInt(e.target.value, 10) || 0);
      zonaRange.value = state.zoneBonus;
      if (window.DatabaseManager) window.DatabaseManager.autoSaveCurrent();
      if (typeof updateUI === 'function') updateUI();
    });
  }

  const timeInput = document.getElementById('time-input');
  if (timeInput) {
    timeInput.addEventListener('input', (e) => {
      state.timePerRunMinutes = Math.max(0.5, parseFloat(e.target.value) || 2.5);
      if (state.dungeonConfigs && state.dungeonConfigs[state.activeDungeon]) {
        state.dungeonConfigs[state.activeDungeon].timePerRunMinutes = state.timePerRunMinutes;
      }
      if (window.DatabaseManager) window.DatabaseManager.autoSaveCurrent();
      if (typeof updateUI === 'function') updateUI();
    });
  }

  const keyCostInput = document.getElementById('key-cost-input');
  if (keyCostInput) {
    keyCostInput.addEventListener('input', (e) => {
      state.keyCostKamas = Math.max(0, parseInt(e.target.value, 10) || 0);
      if (state.dungeonConfigs && state.dungeonConfigs[state.activeDungeon]) {
        state.dungeonConfigs[state.activeDungeon].keyCostKamas = state.keyCostKamas;
      }
      if (window.DatabaseManager) window.DatabaseManager.autoSaveCurrent();
      if (typeof updateUI === 'function') updateUI();
    });
  }

  document.querySelectorAll('.loot-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const loot = parseInt(btn.dataset.loot, 10);
      if (!isNaN(loot) && loot >= 2 && loot <= 8) {
        state.totalPlayers = loot;
        if (state.carryCount >= state.totalPlayers) {
          state.carryCount = Math.max(1, Math.min(4, state.totalPlayers - 1));
        }
        state.leechCount = Math.max(1, state.totalPlayers - state.carryCount);
        if (state.dungeonConfigs && state.dungeonConfigs[state.activeDungeon]) {
          state.dungeonConfigs[state.activeDungeon].totalPlayers = state.totalPlayers;
          state.dungeonConfigs[state.activeDungeon].carryCount = state.carryCount;
        }
        if (typeof syncDOMFromAppState === 'function') syncDOMFromAppState();
        if (window.DatabaseManager) window.DatabaseManager.autoSaveCurrent();
        if (typeof updateUI === 'function') updateUI();
      }
    });
  });

  const carryCountInput = document.getElementById('carry-count-input');
  if (carryCountInput) {
    carryCountInput.addEventListener('input', (e) => {
      let val = parseInt(e.target.value, 10);
      if (isNaN(val)) return;
      val = Math.max(1, Math.min(4, Math.min(val, state.totalPlayers - 1)));
      state.carryCount = val;
      state.leechCount = Math.max(1, state.totalPlayers - state.carryCount);
      const leechInput = document.getElementById('leech-count-input');
      if (leechInput) leechInput.value = state.leechCount;
      if (state.dungeonConfigs && state.dungeonConfigs[state.activeDungeon]) {
        state.dungeonConfigs[state.activeDungeon].carryCount = val;
      }
      if (state.groupMembers) {
        state.groupMembers = state.groupMembers.map((m, idx) => {
          const isCarry = idx < val;
          const isTarget = (!isCarry && idx === state.totalPlayers - 1);
          return {
            ...m,
            role: isCarry ? 'carry' : (isTarget ? 'target' : 'leech'),
            name: isCarry ? (val === 1 ? 'Carry' : `Carry ${idx + 1}`) : (isTarget ? 'Mula Objetivo' : `Mula ${idx - val + 1}`),
            level: isCarry ? Math.max(m.level, state.carryLevel || 200) : m.level
          };
        });
        if (state.dungeonConfigs && state.dungeonConfigs[state.activeDungeon]) {
          state.dungeonConfigs[state.activeDungeon].groupMembers = state.groupMembers.map(m => ({ ...m }));
        }
      }
      if (window.DatabaseManager) window.DatabaseManager.autoSaveCurrent();
      if (typeof updateUI === 'function') updateUI();
    });
  }

  const carryLevelInput = document.getElementById('carry-level-input');
  if (carryLevelInput) {
    carryLevelInput.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      if (!isNaN(val) && val >= 1 && val <= 200) {
        state.carryLevel = val;
        if (state.dungeonConfigs && state.dungeonConfigs[state.activeDungeon]) {
          state.dungeonConfigs[state.activeDungeon].carryLevel = val;
        }
        if (state.groupMembers) {
          state.groupMembers.forEach((m, idx) => {
            if (m.role === 'carry' || idx < state.carryCount) {
              m.level = val;
            }
          });
          if (state.dungeonConfigs && state.dungeonConfigs[state.activeDungeon]) {
            state.dungeonConfigs[state.activeDungeon].groupMembers = state.groupMembers.map(m => ({ ...m }));
          }
        }
        if (window.DatabaseManager) window.DatabaseManager.autoSaveCurrent();
        if (typeof updateUI === 'function') updateUI();
      }
    });
  }

  const leechCountInput = document.getElementById('leech-count-input');
  if (leechCountInput) {
    leechCountInput.addEventListener('input', (e) => {
      let val = parseInt(e.target.value, 10);
      if (isNaN(val)) return;
      val = Math.max(1, Math.min(7, val));
      state.leechCount = val;
      state.totalPlayers = Math.min(8, Math.max(2, state.carryCount + val));
      if (state.dungeonConfigs && state.dungeonConfigs[state.activeDungeon]) {
        state.dungeonConfigs[state.activeDungeon].totalPlayers = state.totalPlayers;
      }
      if (typeof syncDOMFromAppState === 'function') syncDOMFromAppState();
      if (window.DatabaseManager) window.DatabaseManager.autoSaveCurrent();
      if (typeof updateUI === 'function') updateUI();
    });
  }

  const totalPlayersInput = document.getElementById('total-players-input');
  if (totalPlayersInput) {
    totalPlayersInput.addEventListener('input', (e) => {
      let val = parseInt(e.target.value, 10);
      if (isNaN(val)) return;
      val = Math.max(2, Math.min(8, val));
      state.totalPlayers = val;
      if (state.carryCount >= state.totalPlayers) {
        state.carryCount = Math.max(1, Math.min(4, state.totalPlayers - 1));
      }
      state.leechCount = Math.max(1, state.totalPlayers - state.carryCount);
      if (state.dungeonConfigs && state.dungeonConfigs[state.activeDungeon]) {
        state.dungeonConfigs[state.activeDungeon].totalPlayers = state.totalPlayers;
        state.dungeonConfigs[state.activeDungeon].carryCount = state.carryCount;
      }
      if (state.groupMembers) {
        state.groupMembers = state.groupMembers.map((m, idx) => {
          const isCarry = idx < state.carryCount;
          const isTarget = (!isCarry && idx === val - 1);
          return {
            ...m,
            role: isCarry ? 'carry' : (isTarget ? 'target' : 'leech'),
            name: isCarry ? (state.carryCount === 1 ? 'Carry' : `Carry ${idx + 1}`) : (isTarget ? 'Mula Objetivo' : `Mula ${idx - state.carryCount + 1}`)
          };
        });
        if (state.dungeonConfigs && state.dungeonConfigs[state.activeDungeon]) {
          state.dungeonConfigs[state.activeDungeon].groupMembers = state.groupMembers.map(m => ({ ...m }));
        }
      }
      if (typeof syncDOMFromAppState === 'function') syncDOMFromAppState();
      if (window.DatabaseManager) window.DatabaseManager.autoSaveCurrent();
      if (typeof updateUI === 'function') updateUI();
    });
  }

  const startLvlInput = document.getElementById('start-level-input');
  if (startLvlInput) {
    startLvlInput.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      if (!isNaN(val) && val >= 1 && val <= 200) {
        state.startLevel = val;
        const startValDisplay = document.getElementById('start-level-val');
        if (startValDisplay) startValDisplay.textContent = `Nivel ${val}`;
        if (state.groupMembers) {
          const total = state.totalPlayers || 8;
          if (state.groupMembers[total - 1] && state.groupMembers[total - 1].role !== 'carry') {
            state.groupMembers[total - 1].level = val;
          }
          if (state.dungeonConfigs && state.dungeonConfigs[state.activeDungeon]) {
            state.dungeonConfigs[state.activeDungeon].groupMembers = state.groupMembers.map(m => ({ ...m }));
          }
        }
        if (window.DatabaseManager) window.DatabaseManager.autoSaveCurrent();
        if (typeof updateUI === 'function') updateUI();
      }
    });
  }

  const xpPercentInput = document.getElementById('current-xp-percent-input');
  if (xpPercentInput) {
    xpPercentInput.addEventListener('input', (e) => {
      let val = parseInt(e.target.value, 10);
      if (isNaN(val)) val = 0;
      val = Math.max(0, Math.min(99, val));
      state.currentXpPercent = val;
      const xpPercentVal = document.getElementById('xp-percent-val');
      if (xpPercentVal) xpPercentVal.textContent = `${val}%`;
      if (window.DatabaseManager) window.DatabaseManager.autoSaveCurrent();
      if (typeof updateUI === 'function') updateUI();
    });
  }
}

if (typeof window !== 'undefined') {
  window.initEventListeners = initEventListeners;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initEventListeners };
}
