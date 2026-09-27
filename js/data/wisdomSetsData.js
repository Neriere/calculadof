/**
 * Sets Maestros de Sabiduría y Base de Datos por Defecto
 * Sincronizados con xp_sets.json (Soporte Set 1 y Set 2 para 17 tiers de progresión)
 */

const MASTER_WISDOM_SETS_KEY = 'dofus_xp_master_wisdom_sets_v1';

const DEFAULT_WISDOM_SETS = [
  { level: 50, gearWisdom: 303, gearWisdom2: 318, note: "Set Nivel 50" },
  { level: 60, gearWisdom: 363, gearWisdom2: 378, note: "Set Nivel 60" },
  { level: 66, gearWisdom: 383, gearWisdom2: 398, note: "Set Nivel 70" },
  { level: 71, gearWisdom: 390, gearWisdom2: 405, note: "Set Nivel 71" },
  { level: 80, gearWisdom: 397, gearWisdom2: 412, note: "Set Nivel 80" },
  { level: 98, gearWisdom: 405, gearWisdom2: 420, note: "Set Nivel 98" },
  { level: 100, gearWisdom: 405, gearWisdom2: 450, note: "Set Nivel 100" },
  { level: 109, gearWisdom: 417, gearWisdom2: 462, note: "Set Nivel 109" },
  { level: 113, gearWisdom: 451, gearWisdom2: 496, note: "Set Nivel 113" },
  { level: 120, gearWisdom: 471, gearWisdom2: 516, note: "Set Nivel 120" },
  { level: 127, gearWisdom: 476, gearWisdom2: 521, note: "Set Nivel 127" },
  { level: 136, gearWisdom: 483, gearWisdom2: 528, note: "Set Nivel 136" },
  { level: 150, gearWisdom: 510, gearWisdom2: 615, note: "Set Nivel 150" },
  { level: 161, gearWisdom: 533, gearWisdom2: 638, note: "Set Nivel 161" },
  { level: 181, gearWisdom: 540, gearWisdom2: 645, note: "Set Nivel 181" },
  { level: 194, gearWisdom: 570, gearWisdom2: 675, note: "Set Nivel 194" },
  { level: 199, gearWisdom: 653, gearWisdom2: 758, note: "Set Nivel 199" }
];

const EMBEDDED_XP_SETS_DB = {
  version: "1.0",
  app: "Calculadora XP Dofus Unity",
  activeProfileId: "prof_1788918086710_a0xwj",
  profiles: [
    {
      id: "prof_1788918086710_a0xwj",
      name: "Configuración Principal",
      createdAt: "2026-09-09T01:41:26.710Z",
      updatedAt: "2026-09-20T05:01:03.088Z",
      settings: {
        activeDungeon: "malefisk",
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
        progressionView: "set1",
        autoStatsWisdom: true,
        manualBaseWisdom: 0,
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
            groupMembers: [
              { slot: 1, level: 200, role: "carry", name: "Carry" },
              { slot: 2, level: 50, role: "leech", name: "Mula 1" },
              { slot: 3, level: 50, role: "leech", name: "Mula 2" },
              { slot: 4, level: 50, role: "leech", name: "Mula 3" },
              { slot: 5, level: 50, role: "leech", name: "Mula 4" },
              { slot: 6, level: 50, role: "leech", name: "Mula 5" },
              { slot: 7, level: 50, role: "leech", name: "Mula 6" },
              { slot: 8, level: 50, role: "target", name: "Mula Objetivo" }
            ]
          }
        },
        groupMembers: [
          { slot: 1, level: 200, role: "carry", name: "Carry" },
          { slot: 2, level: 50, role: "leech", name: "Mula 1" },
          { slot: 3, level: 50, role: "leech", name: "Mula 2" },
          { slot: 4, level: 50, role: "leech", name: "Mula 3" },
          { slot: 5, level: 50, role: "leech", name: "Mula 4" },
          { slot: 6, level: 50, role: "leech", name: "Mula 5" },
          { slot: 7, level: 50, role: "leech", name: "Mula 6" },
          { slot: 8, level: 50, role: "target", name: "Mula Objetivo" }
        ]
      },
      specificLevels: DEFAULT_WISDOM_SETS
    }
  ]
};

function getStoredMasterWisdomSets() {
  try {
    const raw = localStorage.getItem(MASTER_WISDOM_SETS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(s => ({
          level: Number(s.level),
          gearWisdom: Number(s.gearWisdom) || 0,
          gearWisdom2: (s.gearWisdom2 !== undefined && s.gearWisdom2 !== null) ? Number(s.gearWisdom2) : (Number(s.gearWisdom) || 0),
          note: s.note || `Set Nivel ${s.level}`
        }));
      }
    }
  } catch (e) {
    console.warn("Error leyendo sets maestros de sabiduría:", e);
  }
  return JSON.parse(JSON.stringify(DEFAULT_WISDOM_SETS));
}

function saveMasterWisdomSets(sets) {
  try {
    if (Array.isArray(sets) && sets.length > 0) {
      localStorage.setItem(MASTER_WISDOM_SETS_KEY, JSON.stringify(sets));
    }
  } catch (e) {
    console.warn("Error guardando sets maestros de sabiduría:", e);
  }
}

// Compatibilidad con navegador global y módulos
if (typeof window !== 'undefined') {
  window.MASTER_WISDOM_SETS_KEY = MASTER_WISDOM_SETS_KEY;
  window.DEFAULT_WISDOM_SETS = DEFAULT_WISDOM_SETS;
  window.EMBEDDED_XP_SETS_DB = EMBEDDED_XP_SETS_DB;
  window.getStoredMasterWisdomSets = getStoredMasterWisdomSets;
  window.saveMasterWisdomSets = saveMasterWisdomSets;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MASTER_WISDOM_SETS_KEY,
    DEFAULT_WISDOM_SETS,
    EMBEDDED_XP_SETS_DB,
    getStoredMasterWisdomSets,
    saveMasterWisdomSets
  };
}
