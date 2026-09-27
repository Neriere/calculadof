/**
 * Motor de Simulación y Fórmulas Matemáticas de Experiencia (Dofus Unity)
 * 
 * Modela el cálculo de experiencia combate a combate:
 * - Regla del tercio: ceil(MaxLevel / 3) para miembros significativos
 * - Multiplicadores de grupo oficiales según miembros válidos (DOFUS_GROUP_COEFFS)
 * - Distribución de cuota por nivel: (Level / TotalGroupLevel)
 * - Coeficiente de relación nivel grupo vs monstruos
 * - Bonificaciones acumulativas: Gremio, Retos, Poción combate, Anomalía y Cuenta
 * - Progresión de sabiduría: Capital automático + Set 1 / Set 2 + Pergamino + Consumible
 */

function formatNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return '0';
  return Math.round(num).toLocaleString('es-ES');
}

function formatCompactXP(num) {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(3) + ' MM';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + ' M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + ' k';
  }
  return formatNumber(num);
}

function formatDuration(totalMinutes) {
  if (totalMinutes <= 0) return '0 min';
  const hours = Math.floor(totalMinutes / 60);
  const mins = Math.round(totalMinutes % 60);
  if (hours >= 24) {
    const days = (hours / 24).toFixed(1);
    return `${days} días (${hours}h ${mins}m)`;
  }
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins} min`;
}

function getLevelForXP(xp) {
  const map = window.XP_MAP || [];
  for (let lvl = 200; lvl >= 1; lvl--) {
    if (xp >= (map[lvl] || 0)) return lvl;
  }
  return 1;
}

function getDefaultGroupMembers(dungeonId = 'malefisk', totalPlayers = 8, carryCount = null, carryLevel = 200, startLevel = 50) {
  const d = (window.DUNGEONS && window.DUNGEONS[dungeonId]) || {};
  const carries = (carryCount !== null && carryCount !== undefined) ? carryCount : (d.defaultCarries || 1);
  const members = [];
  for (let i = 1; i <= 8; i++) {
    const isCarry = i <= carries;
    const isTarget = (!isCarry && i === totalPlayers);
    members.push({
      slot: i,
      level: isCarry ? carryLevel : startLevel,
      role: isCarry ? 'carry' : (isTarget ? 'target' : 'leech'),
      name: isCarry ? (carries === 1 ? 'Carry' : `Carry ${i}`) : (isTarget ? 'Mula Objetivo' : `Mula ${i - carries}`)
    });
  }
  return members;
}

function getBaseWisdomForLevel(level) {
  const state = window.AppState || {};
  if (!state.autoStatsWisdom) {
    return state.manualBaseWisdom || 0;
  }
  return Math.floor(((level - 1) * 5) / 3);
}

function getGearWisdomForLevel(level, setIndex = 1) {
  const state = window.AppState || {};
  if (!state.specificLevels || state.specificLevels.length === 0) {
    return 0;
  }
  const sorted = [...state.specificLevels].sort((a, b) => a.level - b.level);
  let activeGear = 0;
  for (const item of sorted) {
    if (level >= item.level) {
      if (setIndex === 2) {
        activeGear = (item.gearWisdom2 !== undefined && item.gearWisdom2 !== null)
          ? item.gearWisdom2
          : item.gearWisdom;
      } else {
        activeGear = item.gearWisdom;
      }
    } else {
      break;
    }
  }
  return activeGear;
}

function getExtraWisdomBonus() {
  const state = window.AppState || {};
  const scroll = state.scrollActive ? (state.scrollWisdom || 0) : 0;
  const consumable = state.consumableActive ? (state.consumableWisdom || 0) : 0;
  return scroll + consumable;
}

function getTotalWisdomForLevel(level, setIndex = 1) {
  const gear = getGearWisdomForLevel(level, setIndex);
  const extra = getExtraWisdomBonus();
  const base = getBaseWisdomForLevel(level);
  return gear + extra + base;
}

function runSimulationForDungeon(dungeonId, setIndex = 1) {
  const dungeonsCatalog = window.DUNGEONS || {};
  const dungeon = dungeonsCatalog[dungeonId] || dungeonsCatalog.malefisk || {};
  const state = window.AppState || {};
  const cfg = (state.dungeonConfigs && state.dungeonConfigs[dungeonId]) || {};

  const isCurrentActive = (state.activeDungeon === dungeonId);

  const totalPlayers = isCurrentActive
    ? Math.max(2, Math.min(8, state.totalPlayers || 8))
    : (cfg.totalPlayers || dungeon.defaultTotalPlayers || 8);

  const carryCount = isCurrentActive
    ? Math.max(1, Math.min(4, state.carryCount || dungeon.defaultCarries || 1))
    : (cfg.carryCount || dungeon.defaultCarries || 1);

  const carryLvl = isCurrentActive
    ? Math.max(1, Math.min(200, state.carryLevel || 200))
    : (cfg.carryLevel || dungeon.defaultCarryLevel || 200);

  const timePerRun = isCurrentActive
    ? (state.timePerRunMinutes || dungeon.defaultTimePerRunMinutes || 2.5)
    : (cfg.timePerRunMinutes || dungeon.defaultTimePerRunMinutes || 2.5);

  const keyCost = isCurrentActive
    ? (state.keyCostKamas !== undefined ? state.keyCostKamas : (dungeon.defaultKeyCostKamas || 3000))
    : (cfg.keyCostKamas !== undefined ? cfg.keyCostKamas : (dungeon.defaultKeyCostKamas || 3000));

  let activeMembers;
  if (isCurrentActive && state.groupMembers && state.groupMembers.length >= totalPlayers) {
    activeMembers = state.groupMembers.slice(0, totalPlayers);
  } else if (cfg.groupMembers && Array.isArray(cfg.groupMembers) && cfg.groupMembers.length >= totalPlayers) {
    activeMembers = cfg.groupMembers.slice(0, totalPlayers);
  } else {
    activeMembers = getDefaultGroupMembers(dungeonId, totalPlayers, carryCount, carryLvl, 50);
  }

  const lowestLvl = Math.min(...activeMembers.map(m => m.level));
  const calcStartLevel = lowestLvl;

  const xpMap = window.XP_MAP || [];
  const baseLevelXP = xpMap[calcStartLevel] || 0;
  const nextLevelXP = xpMap[calcStartLevel + 1] || baseLevelXP;
  const xpSpan = Math.max(0, nextLevelXP - baseLevelXP);
  const xpOffset = Math.floor(xpSpan * ((state.currentXpPercent || 0) / 100));
  const startXP = baseLevelXP + xpOffset;

  const target199XP = xpMap[state.midLevel || 199] || 0;
  const target200XP = xpMap[state.targetLevel || 200] || 0;

  const totalDungeonMobs = totalPlayers * 5;
  const totalCombatBaseXP = (dungeon.bossBaseXpAvg || 0) + ((totalDungeonMobs - 1) * (dungeon.mobsBaseXpAvg || 0));
  const waveMobLevel = (dungeon.bossLevel || 100) + ((totalPlayers - 1) * (dungeon.mobLevelAvg || 96));

  let simMembers = activeMembers.map((m) => ({
    slot: m.slot,
    role: m.role,
    level: m.level,
    xp: (m.level === calcStartLevel) ? startXP : (xpMap[m.level] || 0),
    isTarget: false
  }));

  const targetIdx = simMembers.findIndex(m => m.level === calcStartLevel);
  if (targetIdx !== -1) {
    simMembers[targetIdx].isTarget = true;
  } else {
    simMembers[simMembers.length - 1].isTarget = true;
  }

  const leechCount = activeMembers.filter(m => m.role !== 'carry').length || Math.max(1, totalPlayers - carryCount);

  let rounds = 0;
  let roundsTo199 = 0;
  let roundsTo200 = 0;
  let firstCombatXP = 0;

  const highestPlayerLevelInitial = Math.max(...activeMembers.map(m => m.level));
  const minTierLevelInitial = Math.ceil(highestPlayerLevelInitial / 3);

  const userLevels = (state.specificLevels || []).map(s => s.level);
  const tierMilestone = (calcStartLevel < minTierLevelInitial && minTierLevelInitial < 199) ? [minTierLevelInitial] : [];
  const standardMilestones = [calcStartLevel, ...userLevels, ...tierMilestone, 199, 200];
  const uniqueMilestones = [...new Set(standardMilestones)]
    .filter(m => m >= calcStartLevel)
    .sort((a, b) => a - b);

  const milestoneMap = new Map();
  uniqueMilestones.forEach(m => {
    milestoneMap.set(m, {
      level: m,
      reachedRound: 0,
      xpAtReach: 0
    });
  });

  milestoneMap.set(calcStartLevel, {
    level: calcStartLevel,
    reachedRound: 0,
    xpAtReach: startXP
  });

  const MAX_ROUNDS = 50000;
  const groupCoeffs = window.DOFUS_GROUP_COEFFS || {};

  while (simMembers.some(m => m.isTarget && m.xp < target200XP) && rounds < MAX_ROUNDS) {
    rounds++;

    const highestPlayerLevel = Math.max(...simMembers.map(m => m.level));
    const minTierLevel = Math.ceil(highestPlayerLevel / 3);

    const significantCount = simMembers.filter(m => m.level >= minTierLevel).length;
    const effectiveGroupCoeff = groupCoeffs[significantCount] || 1.0;

    const totalGroupLevel = simMembers.reduce((sum, m) => sum + m.level, 0);
    const levelRatio = Math.min(1.0, totalGroupLevel / waveMobLevel);

    const guildMultiplier = state.guildBonusActive ? 1.50 : 1.0;
    const accountMultiplier = state.accountMultiplier || 1;
    const potionBonus = state.xpPotionActive ? (state.xpPotionPercent || 0) : 0;
    const challengesBonus = state.challengesBonus || 0;
    const totalCombatPercent = challengesBonus + potionBonus;
    const challengesMultiplier = 1 + (totalCombatPercent / 100);
    const zoneMultiplier = 1 + ((state.zoneBonus || 0) / 100);

    let roundFinalXPTarget = 0;

    for (let i = 0; i < simMembers.length; i++) {
      const m = simMembers[i];
      if (m.role === 'carry' && m.level >= 200) {
        continue;
      }

      const memberShare = m.level / totalGroupLevel;
      const memberNetBaseXP = totalCombatBaseXP * effectiveGroupCoeff * levelRatio * memberShare;

      const totalWisdom = getTotalWisdomForLevel(m.level, setIndex);
      const wisdomMultiplier = 1 + (totalWisdom / 100);

      const memberFinalXP = memberNetBaseXP * wisdomMultiplier * guildMultiplier * accountMultiplier * challengesMultiplier * zoneMultiplier;
      m.xp += memberFinalXP;
      m.level = Math.min(200, getLevelForXP(m.xp));

      if (m.isTarget) {
        roundFinalXPTarget = memberFinalXP;
      }
    }

    if (rounds === 1) {
      firstCombatXP = roundFinalXPTarget;
    }

    const currentTargetMember = simMembers.find(m => m.isTarget) || simMembers[0];
    const currentTargetLevel = currentTargetMember.level;
    const currentTargetXP = currentTargetMember.xp;

    uniqueMilestones.forEach(m => {
      const mObj = milestoneMap.get(m);
      if (mObj && mObj.reachedRound === 0 && currentTargetLevel >= m && m > calcStartLevel) {
        mObj.reachedRound = rounds;
        mObj.xpAtReach = currentTargetXP;
        mObj.roundFinalXP = roundFinalXPTarget;
      }
    });

    if (startXP < target199XP && currentTargetXP >= target199XP && roundsTo199 === 0) {
      roundsTo199 = rounds;
    }
  }

  roundsTo200 = rounds;
  if (startXP < target199XP && roundsTo199 === 0) {
    roundsTo199 = roundsTo200;
  }

  if (milestoneMap.has(199)) {
    const m199 = milestoneMap.get(199);
    if (startXP >= target199XP) {
      m199.reachedRound = 0;
      m199.xpAtReach = startXP;
    } else if (m199.reachedRound === 0) {
      m199.reachedRound = roundsTo199;
    }
  }
  if (milestoneMap.has(200)) {
    const m200 = milestoneMap.get(200);
    if (m200.reachedRound === 0) m200.reachedRound = roundsTo200;
  }

  const roundsFrom199To200 = (startXP >= target199XP) ? roundsTo200 : Math.max(0, roundsTo200 - roundsTo199);
  const xpNeededTo199 = Math.max(0, target199XP - startXP);
  const xpNeeded199To200 = Math.max(0, target200XP - Math.max(startXP, target199XP));
  const totalXpNeeded = Math.max(0, target200XP - startXP);

  const totalMinutes = roundsTo200 * timePerRun;
  const keysNeededLeech = roundsTo200;
  const keysNeededGroup = roundsTo200 * totalPlayers;
  const kamasSpentLeech = keysNeededLeech * keyCost;
  const kamasSpentGroup = keysNeededGroup * keyCost;
  const xpPerHour = totalMinutes > 0 ? (totalXpNeeded / (totalMinutes / 60)) : 0;
  const kamasPerMillionXP = totalXpNeeded > 0 ? (kamasSpentLeech / (totalXpNeeded / 1000000)) : 0;

  return {
    dungeon,
    startLevel: calcStartLevel,
    totalPlayers,
    carryCount,
    carryLvl,
    leechCount,
    timePerRun,
    keyCost,
    totalCombatBaseXP,
    firstCombatXP,
    roundsTo199,
    roundsFrom199To200,
    totalRounds: roundsTo200,
    xpNeededTo199,
    xpNeeded199To200,
    totalXpNeeded,
    totalMinutes,
    keysNeededLeech,
    keysNeededGroup,
    kamasSpentLeech,
    kamasSpentGroup,
    xpPerHour,
    kamasPerMillionXP,
    milestoneMap,
    milestones: uniqueMilestones
  };
}

function runSimulation(setIndex = 1) {
  const activeDungeon = (window.AppState && window.AppState.activeDungeon) || 'malefisk';
  return runSimulationForDungeon(activeDungeon, setIndex);
}

// Exposición global
if (typeof window !== 'undefined') {
  window.formatNumber = formatNumber;
  window.formatCompactXP = formatCompactXP;
  window.formatDuration = formatDuration;
  window.getLevelForXP = getLevelForXP;
  window.getDefaultGroupMembers = getDefaultGroupMembers;
  window.getBaseWisdomForLevel = getBaseWisdomForLevel;
  window.getGearWisdomForLevel = getGearWisdomForLevel;
  window.getExtraWisdomBonus = getExtraWisdomBonus;
  window.getTotalWisdomForLevel = getTotalWisdomForLevel;
  window.runSimulationForDungeon = runSimulationForDungeon;
  window.runSimulation = runSimulation;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    formatNumber,
    formatCompactXP,
    formatDuration,
    getLevelForXP,
    getDefaultGroupMembers,
    getBaseWisdomForLevel,
    getGearWisdomForLevel,
    getExtraWisdomBonus,
    getTotalWisdomForLevel,
    runSimulationForDungeon,
    runSimulation
  };
}
