/**
 * Calculadora de XP - Dofus Unity
 * Fábrica de Malefíscof • Palacio del Rey Nidas • Trono de la Corte Tenebrosa • Coto del Venerable
 * 
 * Coordinador principal de la aplicación y estado reactivo (AppState).
 */

const AppState = {
  activeDungeon: 'malefisk',
  activeView: 'dungeon',
  activeWisdomSet: 1,
  progressionView: 'compare',

  totalPlayers: 8,
  carryCount: 1,
  carryLevel: 200,
  leechCount: 7,
  startLevel: 50,
  currentXpPercent: 0,
  midLevel: 199,
  targetLevel: 200,

  groupMembers: [
    { slot: 1, level: 200, role: 'carry', name: 'Carry' },
    { slot: 2, level: 50, role: 'leech', name: 'Mula 1' },
    { slot: 3, level: 50, role: 'leech', name: 'Mula 2' },
    { slot: 4, level: 50, role: 'leech', name: 'Mula 3' },
    { slot: 5, level: 50, role: 'leech', name: 'Mula 4' },
    { slot: 6, level: 50, role: 'leech', name: 'Mula 5' },
    { slot: 7, level: 50, role: 'leech', name: 'Mula 6' },
    { slot: 8, level: 50, role: 'target', name: 'Mula Objetivo' }
  ],

  accountMultiplier: 4,
  guildBonusActive: true,
  scrollActive: true,
  scrollWisdom: 25,
  consumableActive: true,
  consumableWisdom: 30,
  xpPotionActive: true,
  xpPotionPercent: 200,

  autoStatsWisdom: true,
  manualBaseWisdom: 0,

  specificLevels: (typeof getStoredMasterWisdomSets === 'function')
    ? getStoredMasterWisdomSets()
    : (window.DEFAULT_WISDOM_SETS || []),

  challengesBonus: 80,
  zoneBonus: 10,
  timePerRunMinutes: 3.0,
  keyCostKamas: 3000,

  dungeonConfigs: {
    malefisk: {
      totalPlayers: 8,
      carryCount: 1,
      carryLevel: 200,
      timePerRunMinutes: 3.0,
      keyCostKamas: 3000,
      groupMembers: (typeof getDefaultGroupMembers === 'function')
        ? getDefaultGroupMembers('malefisk', 8, 1, 200, 50)
        : []
    },
    nidas: {
      totalPlayers: 8,
      carryCount: 4,
      carryLevel: 200,
      timePerRunMinutes: 6.0,
      keyCostKamas: 35000,
      groupMembers: (typeof getDefaultGroupMembers === 'function')
        ? getDefaultGroupMembers('nidas', 8, 4, 200, 50)
        : []
    },
    reina: {
      totalPlayers: 8,
      carryCount: 4,
      carryLevel: 200,
      timePerRunMinutes: 7.5,
      keyCostKamas: 60000,
      groupMembers: (typeof getDefaultGroupMembers === 'function')
        ? getDefaultGroupMembers('reina', 8, 4, 200, 50)
        : []
    },
    venerable: {
      totalPlayers: 8,
      carryCount: 4,
      carryLevel: 200,
      timePerRunMinutes: 6.5,
      keyCostKamas: 40000,
      groupMembers: (typeof getDefaultGroupMembers === 'function')
        ? getDefaultGroupMembers('venerable', 8, 4, 200, 50)
        : []
    }
  }
};

window.AppState = AppState;

document.addEventListener('DOMContentLoaded', async () => {
  if (typeof initEventListeners === 'function') {
    initEventListeners();
  }

  if (typeof syncDOMFromAppState === 'function') {
    syncDOMFromAppState();
  }

  if (typeof updateUI === 'function') {
    updateUI();
  }

  if (window.DatabaseManager && typeof window.DatabaseManager.init === 'function') {
    await window.DatabaseManager.init();
  }
});
