/**
 * Capa de Renderizado de Interfaz de Usuario (UI Renderer)
 * 
 * Gestiona el dibujado y actualización reactiva de:
 * - KPIs principales (combates a 199, a 200, tiempos y kamas)
 * - Barra de progreso visual
 * - Cuadrícula de tarjetas de monstruos (renderMobsGrid)
 * - Tabla técnica de monstruos y experiencia por rango (renderMobsTable)
 * - Editor de niveles específicos (Set 1 vs Set 2)
 * - Editor de slots y miembros del grupo con umbral del tercio
 * - Tabla de hitos acumulados combate a combate
 * - Comparador de rentabilidad entre las 4 mazmorras
 */

function syncDOMFromAppState() {
  const state = window.AppState || {};
  const dungeonsCatalog = window.DUNGEONS || {};
  const dungeon = dungeonsCatalog[state.activeDungeon] || dungeonsCatalog.malefisk || {};

  const headingEl = document.getElementById('main-dungeon-heading');
  const tagEl = document.getElementById('main-dungeon-tag');
  if (headingEl) headingEl.textContent = `Calculadora XP • ${dungeon.name}`;
  if (tagEl) tagEl.textContent = `${dungeon.dimension} • Nivel ${dungeon.bossLevel}`;

  const startLvlInput = document.getElementById('start-level-input');
  const startValDisplay = document.getElementById('start-level-val');
  if (startLvlInput) startLvlInput.value = state.startLevel;
  if (startValDisplay) startValDisplay.textContent = `Nivel ${state.startLevel}`;

  const xpPercentInput = document.getElementById('current-xp-percent-input');
  const xpPercentVal = document.getElementById('xp-percent-val');
  if (xpPercentInput) xpPercentInput.value = state.currentXpPercent || 0;
  if (xpPercentVal) xpPercentVal.textContent = `${state.currentXpPercent || 0}%`;

  const carryCountInput = document.getElementById('carry-count-input');
  const carryLevelInput = document.getElementById('carry-level-input');
  const leechCountInput = document.getElementById('leech-count-input');
  const totalPlayersInput = document.getElementById('total-players-input');
  const lootValDisplay = document.getElementById('loot-selected-val');
  const groupLootBadge = document.getElementById('group-loot-badge');

  if (carryCountInput) carryCountInput.value = state.carryCount;
  if (carryLevelInput) carryLevelInput.value = state.carryLevel;
  if (leechCountInput) leechCountInput.value = state.leechCount;
  if (totalPlayersInput) totalPlayersInput.value = state.totalPlayers;

  const groupCoeffs = window.DOFUS_GROUP_COEFFS || {};
  const mult = groupCoeffs[state.totalPlayers] || 1.0;
  if (lootValDisplay) lootValDisplay.textContent = `B${state.totalPlayers} (${state.totalPlayers} Jugadores)`;
  if (groupLootBadge) {
    groupLootBadge.textContent = `Botín ${state.totalPlayers} (x${mult})`;
    groupLootBadge.className = `panel-badge ${dungeon.badgeClass || 'badge-enutrof'}`;
  }

  document.querySelectorAll('.loot-btn').forEach(btn => {
    const loot = parseInt(btn.dataset.loot, 10);
    if (loot === state.totalPlayers) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  document.querySelectorAll('.pill-btn').forEach(btn => {
    const pmult = parseInt(btn.dataset.mult, 10);
    if (pmult === state.accountMultiplier) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  const guildToggle = document.getElementById('guild-toggle');
  if (guildToggle) guildToggle.checked = state.guildBonusActive;

  const scrollToggle = document.getElementById('scroll-toggle');
  const scrollInput = document.getElementById('scroll-input');
  if (scrollToggle) scrollToggle.checked = state.scrollActive;
  if (scrollInput) scrollInput.value = state.scrollWisdom;

  const consumableToggle = document.getElementById('consumable-toggle');
  const consumableInput = document.getElementById('consumable-input');
  if (consumableToggle) consumableToggle.checked = state.consumableActive;
  if (consumableInput) consumableInput.value = state.consumableWisdom;

  const xpPotionToggle = document.getElementById('xp-potion-toggle');
  const xpPotionInput = document.getElementById('xp-potion-input');
  if (xpPotionToggle) xpPotionToggle.checked = state.xpPotionActive;
  if (xpPotionInput) xpPotionInput.value = state.xpPotionPercent;

  const autoStatsToggle = document.getElementById('auto-stats-toggle');
  const manualBaseRow = document.getElementById('manual-base-row');
  const manualBaseInput = document.getElementById('manual-base-input');
  if (autoStatsToggle) autoStatsToggle.checked = state.autoStatsWisdom;
  if (manualBaseRow) manualBaseRow.style.display = state.autoStatsWisdom ? 'none' : 'block';
  if (manualBaseInput) manualBaseInput.value = state.manualBaseWisdom;

  const retosRange = document.getElementById('retos-range');
  const retosInput = document.getElementById('retos-input');
  if (retosRange) retosRange.value = state.challengesBonus;
  if (retosInput) retosInput.value = state.challengesBonus;

  const zonaRange = document.getElementById('zona-range');
  const zonaInput = document.getElementById('zona-input');
  if (zonaRange) zonaRange.value = state.zoneBonus;
  if (zonaInput) zonaInput.value = state.zoneBonus;

  const timeInput = document.getElementById('time-input');
  if (timeInput) timeInput.value = state.timePerRunMinutes;

  const keyCostInput = document.getElementById('key-cost-input');
  if (keyCostInput) keyCostInput.value = state.keyCostKamas;

  document.querySelectorAll('.dungeon-tab').forEach(btn => {
    if (btn.dataset.dungeon === state.activeDungeon && state.activeView !== 'comparator') {
      btn.classList.add('active');
    } else if (btn.dataset.dungeon === 'comparator' && state.activeView === 'comparator') {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  const activeSet = state.activeWisdomSet || 1;
  const p1 = document.getElementById('btn-set-pill-1');
  const p2 = document.getElementById('btn-set-pill-2');
  if (p1 && p2) {
    if (activeSet === 2) {
      p1.className = 'btn-set-pill';
      p2.className = 'btn-set-pill active-set2';
    } else {
      p1.className = 'btn-set-pill active-set1';
      p2.className = 'btn-set-pill';
    }
  }

  syncProgressionViewButtons();
  renderMobsGrid();
  renderMobsTable();
  renderGroupMembersUI();
}

function syncProgressionViewButtons() {
  const state = window.AppState || {};
  const mode = state.progressionView || 'compare';
  const btnComp = document.getElementById('prog-view-compare');
  const btn1 = document.getElementById('prog-view-set1');
  const btn2 = document.getElementById('prog-view-set2');
  if (btnComp) btnComp.className = (mode === 'compare') ? 'btn-set-pill active-set1' : 'btn-set-pill';
  if (btn1) btn1.className = (mode === 'set1') ? 'btn-set-pill active-set1' : 'btn-set-pill';
  if (btn2) btn2.className = (mode === 'set2') ? 'btn-set-pill active-set2' : 'btn-set-pill';
}

function renderGroupMembersUI() {
  const state = window.AppState || {};
  const container = document.getElementById('slots-grid-container');
  const summaryEl = document.getElementById('group-composition-summary');
  const badgeEl = document.getElementById('group-tier-threshold-badge');
  if (!container) return;

  if (!state.groupMembers || state.groupMembers.length < 8) {
    if (typeof getDefaultGroupMembers === 'function') {
      state.groupMembers = getDefaultGroupMembers(
        state.activeDungeon,
        state.totalPlayers,
        state.carryCount,
        state.carryLevel,
        state.startLevel
      );
    }
  }

  const total = state.totalPlayers || 8;
  const activeMembers = (state.groupMembers || []).slice(0, total);
  const highestLvl = activeMembers.length > 0 ? Math.max(...activeMembers.map(m => m.level)) : 200;
  const minTierLevel = Math.ceil(highestLvl / 3);

  if (badgeEl) {
    badgeEl.textContent = `Umbral 1/3: Lvl ${minTierLevel}`;
  }

  const lowestLvl = activeMembers.length > 0 ? Math.min(...activeMembers.map(m => m.level)) : 50;

  container.innerHTML = '';
  activeMembers.forEach((member, index) => {
    const isLowest = (member.level === lowestLvl);
    const isSignificant = (member.level >= minTierLevel);
    const isCarry = (member.role === 'carry' || index < state.carryCount);
    const roleLabel = isCarry
      ? (state.carryCount === 1 ? 'Carry' : `Carry ${index + 1}`)
      : (member.role === 'target' ? 'Mula Obj.' : `Mula ${index - state.carryCount + 1}`);

    const card = document.createElement('div');
    card.className = `slot-card ${isLowest ? 'is-lowest' : ''} ${isCarry ? 'is-carry' : ''}`;

    const statusBadge = isSignificant
      ? `<span style="color: #34d399; font-size: 0.65rem;" title="Alcanza el tercio del nivel máximo (${minTierLevel}). Aporta al multiplicador de grupo.">&ge;${minTierLevel}</span>`
      : `<span style="color: #f87171; font-size: 0.65rem;" title="Por debajo del tercio (${minTierLevel}). No aporta al multiplicador de grupo hasta subir a Lvl ${minTierLevel}.">Malus &lt;${minTierLevel}</span>`;

    const tagText = isLowest
      ? `Slot ${index + 1} (${roleLabel}) [Principal]`
      : `Slot ${index + 1} (${roleLabel})`;

    card.innerHTML = `
      <div class="slot-info-box">
        <span class="slot-title">${tagText}</span>
        <span class="slot-subtext">${statusBadge}</span>
      </div>
      <input 
        type="number" 
        class="slot-input" 
        min="1" 
        max="200" 
        value="${member.level}" 
        onchange="onMemberLevelChange(${index}, this.value)"
        title="Nivel de este miembro del grupo (1 a 200)"
      />
    `;
    container.appendChild(card);
  });

  const groupCoeffs = window.DOFUS_GROUP_COEFFS || {};
  const significantCount = activeMembers.filter(m => m.level >= minTierLevel).length;
  const initialGroupCoeff = groupCoeffs[significantCount] || 1.0;
  const maxGroupCoeff = groupCoeffs[total] || 1.0;
  const totalGroupLevel = activeMembers.reduce((sum, m) => sum + m.level, 0);

  if (summaryEl) {
    const malusNotice = (significantCount < total)
      ? `Hay <strong>${total - significantCount} miembros con malus (&lt;${minTierLevel})</strong>. Multiplicador inicial de grupo: <strong>x${initialGroupCoeff}</strong>. Al subir a Lvl ${minTierLevel}, se desbloquea el botín completo <strong>x${maxGroupCoeff}</strong>.`
      : `Todos los miembros cumplen la regla del tercio (&ge;${minTierLevel}). Multiplicador de grupo: <strong>x${initialGroupCoeff}</strong>.`;

    summaryEl.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
        <span style="color: var(--gold-light); font-weight: 700;">Personaje objetivo: Nivel ${lowestLvl}</span>
        <span style="font-family: var(--font-mono); font-size: 0.72rem; color: #6ee7b7;">Nivel total del grupo: ${totalGroupLevel}</span>
      </div>
      <span style="display: block; font-size: 0.71rem; line-height: 1.4;">
        ${malusNotice}
      </span>
    `;
  }
}

/**
 * Renderiza la cuadrícula de tarjetas de monstruos
 */
function renderMobsGrid() {
  const grid = document.getElementById('mobs-grid');
  const heading = document.getElementById('dungeon-mobs-heading');
  const badge = document.getElementById('dungeon-mobs-badge');
  if (!grid) return;

  const state = window.AppState || {};
  const dungeonsCatalog = window.DUNGEONS || {};
  const dungeon = dungeonsCatalog[state.activeDungeon] || dungeonsCatalog.malefisk || {};
  const totalMobs = 5 * (state.totalPlayers || 8);
  const totalDungeonBaseXP = (dungeon.bossBaseXpAvg || 0) + (totalMobs - 1) * (dungeon.mobsBaseXpAvg || 0);

  if (heading) {
    heading.innerHTML = `
      <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
      </svg>
      Monstruos: ${dungeon.name}
    `;
  }

  if (badge) {
    badge.className = `panel-badge ${dungeon.badgeClass || 'badge-enutrof'}`;
    badge.innerHTML = `${totalMobs} Monstruos &bull; ${formatCompactXP(totalDungeonBaseXP)} XP Base (B${state.totalPlayers || 8})`;
  }

  grid.innerHTML = '';
  (dungeon.mobs || []).forEach(mob => {
    const card = document.createElement('div');
    card.className = mob.isBoss ? 'mob-card is-boss' : 'mob-card';

    const imgTag = mob.image
      ? `<img src="${encodeURI(mob.image)}" class="mob-thumb" alt="${mob.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" /><span class="mob-thumb-fallback" style="display: none;">${mob.name.slice(0, 2).toUpperCase()}</span>`
      : `<span class="mob-thumb-fallback">${mob.name.slice(0, 2).toUpperCase()}</span>`;

    const noteTag = mob.scalingType === 'fixed'
      ? `<span style="font-size: 0.72rem; color: #fca5a5; font-weight: 600;">XP Fija (Sin escala en rango alto)</span>`
      : (mob.isBoss ? `<span style="font-size: 0.72rem; color: var(--gold-light); font-weight: 600;">Jefe de Mazmorra</span>` : '');

    const rangeTag = mob.xpRange
      ? `<span class="mob-range-text" style="font-size: 0.72rem; color: var(--text-dim); margin-top: 2px;">${mob.xpRange}</span>`
      : '';

    card.innerHTML = `
      <div class="mob-icon">${imgTag}</div>
      <div class="mob-info">
        <h4>${mob.name}</h4>
        <span>${mob.level} &bull; ${mob.isBoss ? '1 mob (Jefe)' : 'Oleadas 1 a 5'}</span>
        ${noteTag}
        <span class="mob-xp-badge">${formatNumber(mob.xp)} XP Base Promedio</span>
        ${rangeTag}
      </div>
    `;
    grid.appendChild(card);
  });
}

/**
 * Renderiza la Tabla Técnica Detallada de Monstruos (con rangos R1-Rmax, notas de escala y XP editable)
 */
function renderMobsTable() {
  const tbody = document.getElementById('mobs-table-tbody');
  const tfoot = document.getElementById('mobs-table-tfoot');
  if (!tbody) return;

  const state = window.AppState || {};
  const dungeonsCatalog = window.DUNGEONS || {};
  const dungeon = dungeonsCatalog[state.activeDungeon] || dungeonsCatalog.malefisk || {};
  const totalMobs = 5 * (state.totalPlayers || 8);
  const totalDungeonBaseXP = (dungeon.bossBaseXpAvg || 0) + (totalMobs - 1) * (dungeon.mobsBaseXpAvg || 0);

  tbody.innerHTML = '';
  (dungeon.mobs || []).forEach(mob => {
    const tr = document.createElement('tr');
    if (mob.isBoss) tr.className = 'is-boss';

    const imgTag = mob.image
      ? `<img src="${encodeURI(mob.image)}" class="mob-table-thumb" alt="${mob.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" /><span class="mob-thumb-fallback" style="display: none; font-size: 0.75rem;">${mob.name.slice(0, 2).toUpperCase()}</span>`
      : `<span class="mob-thumb-fallback" style="font-size: 0.75rem;">${mob.name.slice(0, 2).toUpperCase()}</span>`;

    let scalingBadge = '';
    let scalingNoteClass = 'mob-scaling-note-text';
    if (mob.scalingType === 'fixed') {
      scalingBadge = '<span class="badge-mob-scaling fixed">XP Fija</span>';
      scalingNoteClass = 'mob-scaling-note-text warn';
    } else if (mob.scalingType === 'boss') {
      scalingBadge = '<span class="badge-mob-scaling boss">Jefe</span>';
    } else {
      scalingBadge = '<span class="badge-mob-scaling scaling">Escalable</span>';
    }

    const roleBadge = mob.isBoss
      ? '<span class="badge-mob-role boss">Jefe de Mazmorra</span>'
      : '<span class="badge-mob-role regular">Oleadas 1-5</span>';

    tr.innerHTML = `
      <td>
        <div class="mob-cell-flex">
          <div class="mob-table-thumb-wrap">${imgTag}</div>
          <div class="mob-table-name-wrap">
            <span class="mob-table-name">${mob.name}</span>
            <span class="mob-table-sub">${mob.frenchName || ''} &bull; ID ${mob.dofusDbId || 'N/A'}</span>
          </div>
        </div>
      </td>
      <td>${roleBadge}</td>
      <td><span style="font-family: var(--font-mono); font-size: 0.8rem; color: #cbd5e1;">${mob.level}</span></td>
      <td><span style="font-family: var(--font-mono); color: var(--text-dim);">${formatNumber(mob.xpR1 || mob.xp)} XP</span></td>
      <td><span style="font-family: var(--font-mono); color: var(--text-dim);">${formatNumber(mob.xpRmax || mob.xp)} XP</span></td>
      <td><strong style="font-family: var(--font-mono); color: var(--emerald);">${formatNumber(mob.xp)} XP</strong></td>
      <td>
        <div style="display: flex; flex-direction: column; gap: 3px;">
          <div>${scalingBadge}</div>
          <span class="${scalingNoteClass}">${mob.scalingNote || mob.xpRange || ''}</span>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  if (tfoot) {
    tfoot.innerHTML = `
      <tr>
        <td colspan="3">
          <strong style="color: var(--text-gold);">Total Combate (${dungeon.name}):</strong>
          <span> 5 oleadas &times; B${state.totalPlayers || 8} = ${totalMobs} criaturas</span>
        </td>
        <td colspan="4" style="text-align: right;">
          <span style="color: var(--text-dim); margin-right: 12px;">XP Base Ponderada por Combate:</span>
          <strong style="color: var(--emerald); font-family: var(--font-mono); font-size: 0.95rem;">${formatNumber(totalDungeonBaseXP)} XP</strong>
          <span style="color: var(--text-dim); font-size: 0.75rem; margin-left: 6px;">(${formatCompactXP(totalDungeonBaseXP)})</span>
        </td>
      </tr>
    `;
  }
}

function renderSpecificLevelsTable() {
  const tbody = document.getElementById('specific-levels-tbody');
  const compSummaryEl = document.getElementById('set-comparison-summary');
  if (!tbody) return;

  const state = window.AppState || {};
  const sorted = [...(state.specificLevels || [])].sort((a, b) => a.level - b.level);
  const scrollVal = state.scrollActive ? (state.scrollWisdom || 0) : 0;

  tbody.innerHTML = '';

  if (sorted.length === 0) {
    if (compSummaryEl) compSummaryEl.style.display = 'none';
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 28px 14px; color: var(--text-dim);">
          <div style="font-size: 1.05rem; margin-bottom: 6px; color: var(--gold-light); font-weight: 600;">
            No hay conjuntos de sabiduría configurados
          </div>
          <p style="font-size: 0.85rem; max-width: 480px; margin: 0 auto; color: var(--text-muted);">
            Utiliza el botón "Restablecer Conjuntos (xp_sets.json)" o el formulario superior para añadir tramos de nivel.
          </p>
        </td>
      </tr>
    `;
    return;
  }

  const sim1 = runSimulationForDungeon(state.activeDungeon, 1);
  const sim2 = runSimulationForDungeon(state.activeDungeon, 2);

  if (compSummaryEl) {
    compSummaryEl.style.display = 'block';
    const rounds1 = sim1.totalRounds;
    const rounds2 = sim2.totalRounds;
    const diffRounds = rounds1 - rounds2;
    const timeSavedMin = diffRounds * (state.timePerRunMinutes || 2.5);
    const kamasSaved = diffRounds * (state.keyCostKamas || 0);

    let sumWis1 = 0, sumWis2 = 0;
    sorted.forEach(s => {
      const w1 = s.gearWisdom || 0;
      const w2 = (s.gearWisdom2 !== undefined && s.gearWisdom2 !== null) ? s.gearWisdom2 : w1;
      sumWis1 += w1;
      sumWis2 += w2;
    });
    const avgWis1 = Math.round(sumWis1 / sorted.length);
    const avgWis2 = Math.round(sumWis2 / sorted.length);
    const diffAvgWis = avgWis2 - avgWis1;

    let verdictHtml = '';
    if (diffRounds > 0) {
      verdictHtml = `
        <div style="display: flex; align-items: flex-start; gap: 10px;">
          <div>
            <strong style="color: var(--emerald); font-size: 0.88rem; display: block; margin-bottom: 3px;">
              Evaluación: Set 2 optimiza ${diffRounds} combates (${formatDuration(timeSavedMin)})
            </strong>
            <span style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.45; display: block;">
              Ahorro equivalente a <strong>${formatCompactXP(kamasSaved)} Kamas</strong> en llaves de ${sim1.dungeon.bossName}.
            </span>
          </div>
        </div>
      `;
    } else if (diffRounds === 0) {
      verdictHtml = `
        <div style="display: flex; align-items: flex-start; gap: 10px;">
          <div>
            <strong style="color: var(--gold-light); font-size: 0.88rem; display: block; margin-bottom: 3px;">
              Rendimiento equivalente (${rounds1} combates requeridos)
            </strong>
            <span style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.45; display: block;">
              Ambos conjuntos completan la progresión en el mismo número de combates para este tramo.
            </span>
          </div>
        </div>
      `;
    } else {
      verdictHtml = `
        <div style="display: flex; align-items: flex-start; gap: 10px;">
          <div>
            <strong style="color: var(--danger); font-size: 0.88rem; display: block; margin-bottom: 3px;">
              Set 1 requiere ${Math.abs(diffRounds)} combates menos
            </strong>
            <span style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.45; display: block;">
              La configuración del Set 1 aporta mayor sabiduría total en el intervalo analizado.
            </span>
          </div>
        </div>
      `;
    }

    compSummaryEl.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 8px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 0.95rem; font-weight: 700; color: var(--text-gold);">Análisis Comparativo (${sim1.dungeon.name})</span>
          <span class="panel-badge ${state.activeWisdomSet === 2 ? 'badge-emerald' : 'badge-enutrof'}">
            Simulando con Set ${state.activeWisdomSet || 1}
          </span>
        </div>
        <span style="font-size: 0.75rem; color: var(--text-dim);">
          Nivel ${state.startLevel} &rarr; 200 &bull; Botín ${state.totalPlayers}
        </span>
      </div>

      <div class="set-comparison-grid">
        <div class="set-col-box set1">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="font-weight: 700; color: #93c5fd; font-size: 0.82rem;">Set 1 (Base)</span>
            <span style="font-size: 0.72rem; color: var(--text-dim); font-family: var(--font-mono);">${avgWis1} Sab prom.</span>
          </div>
          <span class="set-metric-value" style="color: #93c5fd;">${formatNumber(rounds1)} <span style="font-size: 0.75rem; font-weight: normal; color: var(--text-muted);">runs</span></span>
          <span class="set-metric-label">${formatDuration(rounds1 * (state.timePerRunMinutes || 2.5))} &bull; ${formatCompactXP(rounds1 * (state.keyCostKamas || 0))} k</span>
        </div>

        <div style="text-align: center; font-weight: 800; font-size: 0.85rem; color: var(--text-dim); padding: 0 2px;">
          VS
        </div>

        <div class="set-col-box set2">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="font-weight: 700; color: #6ee7b7; font-size: 0.82rem;">Set 2 (Optimizado)</span>
            <span style="font-size: 0.72rem; color: var(--text-dim); font-family: var(--font-mono);">${avgWis2} Sab prom.</span>
          </div>
          <span class="set-metric-value" style="color: #6ee7b7;">${formatNumber(rounds2)} <span style="font-size: 0.75rem; font-weight: normal; color: var(--text-muted);">runs</span></span>
          <span class="set-metric-label">${formatDuration(rounds2 * (state.timePerRunMinutes || 2.5))} &bull; ${formatCompactXP(rounds2 * (state.keyCostKamas || 0))} k</span>
        </div>

        <div style="text-align: center; min-width: 80px;">
          <div style="font-size: 0.7rem; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.5px;">AHORRO SET 2</div>
          <div style="font-family: var(--font-mono); font-weight: 800; font-size: 1.1rem; margin-top: 2px; color: ${diffRounds > 0 ? 'var(--emerald)' : (diffRounds === 0 ? 'var(--text-dim)' : 'var(--danger)')};">
            ${diffRounds > 0 ? '-' + diffRounds : (diffRounds === 0 ? '0' : '+' + Math.abs(diffRounds))} runs
          </div>
          <div style="font-size: 0.72rem; color: ${diffAvgWis > 0 ? 'var(--gold-light)' : 'var(--text-dim)'}; font-family: var(--font-mono);">
            ${diffAvgWis > 0 ? '+' + diffAvgWis + ' Sab' : (diffAvgWis === 0 ? 'Misma Sab' : diffAvgWis + ' Sab')}
          </div>
        </div>

        <div class="set-col-box verdict">
          ${verdictHtml}
        </div>
      </div>
    `;
  }

  sorted.forEach((item, index) => {
    const tr = document.createElement('tr');
    const autoBase = getBaseWisdomForLevel(item.level);
    const wis1 = item.gearWisdom || 0;
    const wis2 = (item.gearWisdom2 !== undefined && item.gearWisdom2 !== null) ? item.gearWisdom2 : wis1;
    const diff = wis2 - wis1;

    const tot1 = wis1 + scrollVal + autoBase;
    const tot2 = wis2 + scrollVal + autoBase;
    const xpMult1 = 1 + (tot1 / 100);
    const xpMult2 = 1 + (tot2 / 100);
    const xpDiffPct = ((xpMult2 / xpMult1) - 1) * 100;

    let diffBadge = '';
    if (diff > 0) {
      diffBadge = `<span class="badge-diff-pos">+${diff} Sab</span>`;
    } else if (diff === 0) {
      diffBadge = `<span class="badge-diff-zero">= 0</span>`;
    } else {
      diffBadge = `<span class="badge-diff-neg">${diff} Sab</span>`;
    }

    let xpGainBadge = '';
    if (diff > 0) {
      xpGainBadge = `<span class="badge-xp-gain" title="Set 2 aporta +${xpDiffPct.toFixed(1)}% más XP por combate">+${xpDiffPct.toFixed(1)}% XP</span>`;
    } else if (diff === 0) {
      xpGainBadge = `<span style="color: var(--text-dim); font-size: 0.76rem; font-family: var(--font-mono);">= 0%</span>`;
    } else {
      xpGainBadge = `<span style="color: var(--danger); font-size: 0.76rem; font-family: var(--font-mono); font-weight: 700;">${xpDiffPct.toFixed(1)}% XP</span>`;
    }

    const nextItem = sorted[index + 1];
    const rangeText = nextItem
      ? `Lvl ${item.level} &rarr; ${nextItem.level - 1}`
      : `Lvl ${item.level} &rarr; 200`;

    tr.innerHTML = `
      <td>
        <div style="display: flex; align-items: center; gap: 4px;">
          <span style="font-size: 0.72rem; color: var(--text-dim); font-weight: 600;">NV.</span>
          <input 
            type="number" 
            class="tier-input" 
            style="width: 54px; text-align: center; font-weight: 700; color: var(--gold-light); background: rgba(245, 184, 61, 0.08); border-color: rgba(245, 184, 61, 0.25);"
            value="${item.level}" 
            min="1" 
            max="200" 
            onchange="onLevelChange(${index}, this.value)"
            title="Haz clic para modificar el nivel"
          />
        </div>
      </td>
      <td>
        <div style="display: flex; align-items: center; gap: 4px;">
          <input 
            type="number" 
            class="tier-input tier-input-set1" 
            style="width: 68px;"
            value="${wis1}" 
            min="0" 
            max="1500" 
            onchange="onGearWisdomChange(${index}, this.value, 1)"
            title="Sabiduría de Set 1 (Económico/Base) para este nivel"
          />
          <span style="font-size: 0.75rem; color: #93c5fd; font-family: var(--font-mono);">Sab</span>
        </div>
      </td>
      <td>
        <div style="display: flex; align-items: center; gap: 4px;">
          <input 
            type="number" 
            class="tier-input tier-input-set2" 
            style="width: 68px;"
            value="${wis2}" 
            min="0" 
            max="1500" 
            onchange="onGearWisdomChange(${index}, this.value, 2)"
            title="Sabiduría de Set 2 (Óptimo/Caro) para este nivel"
          />
          <span style="font-size: 0.75rem; color: #6ee7b7; font-family: var(--font-mono);">Sab</span>
        </div>
      </td>
      <td>${diffBadge}</td>
      <td>${xpGainBadge}</td>
      <td>
        <span style="font-family: var(--font-mono); color: var(--gold-light); font-weight: 600; font-size: 0.8rem;">+${autoBase}</span>
        <span style="font-size: 0.68rem; color: var(--text-dim); display: block;">Base auto</span>
      </td>
      <td><span class="range-badge">${rangeText}</span></td>
      <td>
        <input 
          type="text" 
          class="input-field tier-note-input" 
          style="padding: 4px 8px; font-size: 0.8rem; width: 100%;" 
          value="${item.note || ''}" 
          placeholder="Ej. Set Nivel ${item.level}"
          oninput="onNoteChange(${index}, this.value)"
          onchange="onNoteChange(${index}, this.value)"
        />
      </td>
      <td style="text-align: right;">
        <button class="btn-remove-tier" onclick="removeSpecificLevel(${index})" title="Eliminar este nivel">
          <svg width="17" height="17" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderMilestonesTable(result) {
  const thead = document.getElementById('milestones-thead');
  const tbody = document.getElementById('milestones-tbody');
  if (!tbody) return;

  const state = window.AppState || {};
  const mode = state.progressionView || 'compare';
  const xpMap = window.XP_MAP || [];

  const sim1 = runSimulationForDungeon(state.activeDungeon, 1);
  const sim2 = runSimulationForDungeon(state.activeDungeon, 2);

  const activeMembers = state.groupMembers || [];
  const highestPlayerLevelInitial = activeMembers.length > 0 ? Math.max(...activeMembers.map(m => m.level)) : 200;
  const minTierLevel = Math.ceil(highestPlayerLevelInitial / 3);
  const userLevels = (state.specificLevels || []).map(s => s.level);
  const tierMilestone = (state.startLevel < minTierLevel && minTierLevel < 199) ? [minTierLevel] : [];
  const standardMilestones = [state.startLevel, ...userLevels, ...tierMilestone, 199, 200];
  const milestones = [...new Set(standardMilestones)]
    .filter(m => m >= state.startLevel)
    .sort((a, b) => a - b);

  if (!milestones || milestones.length <= 1) {
    if (thead) {
      thead.innerHTML = `<tr><th>Hito de Nivel</th><th>Estado</th></tr>`;
    }
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 24px; color: var(--text-dim);">El nivel actual ya alcanzó el objetivo o no hay hitos adicionales.</td></tr>`;
    return;
  }

  const timePerRun = state.timePerRunMinutes || 2.5;

  if (mode === 'compare') {
    if (thead) {
      thead.innerHTML = `
        <tr>
          <th>Hito de Nivel</th>
          <th>Sabiduría</th>
          <th>Rondas Tramo</th>
          <th>Rondas Acum.</th>
          <th>Tiempo Acum.</th>
          <th>Ahorro S2</th>
          <th>XP / Combate</th>
          <th>XP Tramo</th>
        </tr>
      `;
    }

    tbody.innerHTML = '';

    for (let i = 0; i < milestones.length - 1; i++) {
      const fromLvl = milestones[i];
      const toLvl = milestones[i + 1];

      const fromObj1 = sim1.milestoneMap.get(fromLvl);
      const toObj1 = sim1.milestoneMap.get(toLvl);
      const fromObj2 = sim2.milestoneMap.get(fromLvl);
      const toObj2 = sim2.milestoneMap.get(toLvl);

      const fromRound1 = fromObj1 ? fromObj1.reachedRound : 0;
      const toRound1 = toObj1 ? toObj1.reachedRound : 0;
      const fromRound2 = fromObj2 ? fromObj2.reachedRound : 0;
      const toRound2 = toObj2 ? toObj2.reachedRound : 0;

      const intervalRounds1 = Math.max(0, toRound1 - fromRound1);
      const intervalRounds2 = Math.max(0, toRound2 - fromRound2);

      const cumulativeRounds1 = toRound1;
      const cumulativeRounds2 = toRound2;

      const cumulativeMinutes1 = cumulativeRounds1 * timePerRun;
      const cumulativeMinutes2 = cumulativeRounds2 * timePerRun;

      const gearWisdom1 = getGearWisdomForLevel(fromLvl, 1);
      const gearWisdom2 = getGearWisdomForLevel(fromLvl, 2);
      const totWisdom1 = getTotalWisdomForLevel(fromLvl, 1);
      const totWisdom2 = getTotalWisdomForLevel(fromLvl, 2);
      const diffWis = totWisdom2 - totWisdom1;

      const xpNeededInterval = (xpMap[toLvl] || 0) - (xpMap[fromLvl] || 0);

      const isSameCombat1 = (fromRound1 === toRound1 && toRound1 > 0);
      const isSameCombat2 = (fromRound2 === toRound2 && toRound2 > 0);

      const combatXP1 = toObj1?.roundFinalXP || 0;
      const combatXP2 = toObj2?.roundFinalXP || 0;
      const levelAfterRound1 = getLevelForXP(toObj1?.xpAtReach || 0);
      const levelAfterRound2 = getLevelForXP(toObj2?.xpAtReach || 0);

      const isSuperado1 = (toRound1 > 0 && levelAfterRound1 > toLvl);
      const isSuperado2 = (toRound2 > 0 && levelAfterRound2 > toLvl);

      let s1RoundsHtml = '';
      let avgXp1 = 0;
      if (intervalRounds1 > 1) {
        s1RoundsHtml = `<span>${formatNumber(intervalRounds1)} runs</span>`;
        avgXp1 = xpNeededInterval / intervalRounds1;
      } else if (isSameCombat1 || isSuperado1) {
        s1RoundsHtml = `<span style="color: var(--emerald); font-weight: 600;">&lt; 1 (Ronda #${toRound1})</span>`;
        avgXp1 = combatXP1;
      } else {
        s1RoundsHtml = `<span>1 run</span>`;
        avgXp1 = combatXP1 || (xpNeededInterval / 1);
      }

      let s2RoundsHtml = '';
      let avgXp2 = 0;
      if (intervalRounds2 > 1) {
        s2RoundsHtml = `<span>${formatNumber(intervalRounds2)} runs</span>`;
        avgXp2 = xpNeededInterval / intervalRounds2;
      } else if (isSameCombat2 || isSuperado2) {
        s2RoundsHtml = `<span style="color: var(--emerald); font-weight: 600;">&lt; 1 (Ronda #${toRound2})</span>`;
        avgXp2 = combatXP2;
      } else {
        s2RoundsHtml = `<span>1 run</span>`;
        avgXp2 = combatXP2 || (xpNeededInterval / 1);
      }

      const diffCumulRounds = cumulativeRounds1 - cumulativeRounds2;
      const diffCumulMinutes = diffCumulRounds * timePerRun;

      const tr = document.createElement('tr');
      if (toLvl === 199) tr.className = 'highlight-target';
      if (toLvl === 200) tr.className = 'highlight-target-200';

      let wisDiffBadge = '';
      if (diffWis > 0) {
        wisDiffBadge = `<span class="badge-diff-pos" style="font-size: 0.68rem; margin-top: 2px;">+${diffWis} Sab</span>`;
      } else if (diffWis === 0) {
        wisDiffBadge = `<span class="badge-diff-zero" style="font-size: 0.68rem; margin-top: 2px;">= Misma Sab</span>`;
      } else {
        wisDiffBadge = `<span class="badge-diff-neg" style="font-size: 0.68rem; margin-top: 2px;">${diffWis} Sab</span>`;
      }

      let tierBadge = '';
      if (toLvl === minTierLevel && fromLvl < minTierLevel) {
        tierBadge = ` <span class="badge-pill" style="font-size: 0.65rem; background: rgba(52, 211, 153, 0.15); color: #34d399; margin-left: 4px;" title="Alcanza nivel ${minTierLevel}: Se elimina el malus de grupo">Fin Malus 1/3</span>`;
      } else if (toLvl <= minTierLevel && fromLvl < minTierLevel) {
        tierBadge = ` <span style="font-size: 0.65rem; color: #f87171; margin-left: 4px;" title="Por debajo de nivel ${minTierLevel}: Malus de grupo activo">Malus 1/3</span>`;
      }

      let ahorroBadge = '';
      if (diffCumulRounds > 0) {
        ahorroBadge = `<span class="badge-round-saved">-${diffCumulRounds} runs (-${formatDuration(diffCumulMinutes)})</span>`;
      } else if (diffCumulRounds === 0) {
        ahorroBadge = `<span class="badge-round-equal">= Mismo combate</span>`;
      } else {
        ahorroBadge = `<span class="badge-diff-neg" style="padding: 3px 8px; border-radius: 4px; font-family: var(--font-mono); font-size: 0.75rem;">+${Math.abs(diffCumulRounds)} runs</span>`;
      }

      tr.innerHTML = `
        <td><strong style="color: var(--gold-light);">Lvl ${fromLvl} &rarr; ${toLvl}</strong>${tierBadge}</td>
        <td>
          <div class="milestones-dual-val">
            <div class="milestones-dual-row set1">
              <span>S1: +${totWisdom1}</span>
              <span style="font-size: 0.7rem; color: var(--text-dim);">(Eq +${gearWisdom1})</span>
            </div>
            <div class="milestones-dual-row set2">
              <span>S2: +${totWisdom2}</span>
              <span style="font-size: 0.7rem; color: var(--text-dim);">(Eq +${gearWisdom2})</span>
            </div>
            ${wisDiffBadge}
          </div>
        </td>
        <td>
          <div class="milestones-dual-val">
            <div class="milestones-dual-row set1"><span>S1:</span>${s1RoundsHtml}</div>
            <div class="milestones-dual-row set2"><span>S2:</span>${s2RoundsHtml}</div>
          </div>
        </td>
        <td>
          <div class="milestones-dual-val">
            <div class="milestones-dual-row set1"><span>S1:</span><span>${formatNumber(cumulativeRounds1)}</span></div>
            <div class="milestones-dual-row set2"><span>S2:</span><strong style="color: #6ee7b7;">${formatNumber(cumulativeRounds2)}</strong></div>
          </div>
        </td>
        <td>
          <div class="milestones-dual-val">
            <div class="milestones-dual-row set1"><span>S1:</span><span>${formatDuration(cumulativeMinutes1)}</span></div>
            <div class="milestones-dual-row set2"><span>S2:</span><strong style="color: var(--emerald);">${formatDuration(cumulativeMinutes2)}</strong></div>
          </div>
        </td>
        <td>${ahorroBadge}</td>
        <td>
          <div class="milestones-dual-val">
            <div class="milestones-dual-row set1"><span>S1:</span><span>${formatCompactXP(avgXp1)}</span></div>
            <div class="milestones-dual-row set2"><span>S2:</span><span style="color: var(--gold-light); font-weight: 700;">${formatCompactXP(avgXp2)}</span></div>
          </div>
        </td>
        <td><span style="font-family: var(--font-mono); color: var(--text-muted);">${formatCompactXP(xpNeededInterval)}</span></td>
      `;
      tbody.appendChild(tr);
    }
  } else {
    const activeSetNum = (mode === 'set2') ? 2 : 1;
    const sim = (activeSetNum === 2) ? sim2 : sim1;

    if (thead) {
      thead.innerHTML = `
        <tr>
          <th>Hito de Nivel</th>
          <th>Sabiduría (${activeSetNum === 2 ? 'Set 2' : 'Set 1'})</th>
          <th>Rondas Tramo</th>
          <th>Rondas Acum.</th>
          <th>Tiempo Tramo</th>
          <th>Tiempo Acum.</th>
          <th>XP / Combate</th>
          <th>XP Tramo</th>
        </tr>
      `;
    }

    tbody.innerHTML = '';

    for (let i = 0; i < milestones.length - 1; i++) {
      const fromLvl = milestones[i];
      const toLvl = milestones[i + 1];

      const fromObj = sim.milestoneMap.get(fromLvl);
      const toObj = sim.milestoneMap.get(toLvl);

      const fromRound = fromObj ? fromObj.reachedRound : 0;
      const toRound = toObj ? toObj.reachedRound : 0;

      const intervalRounds = Math.max(0, toRound - fromRound);
      const cumulativeRounds = toRound;

      const gearWisdom = getGearWisdomForLevel(fromLvl, activeSetNum);
      const autoBaseStart = getBaseWisdomForLevel(fromLvl);
      const autoBaseEnd = getBaseWisdomForLevel(toLvl);
      const totalWisdomStart = getTotalWisdomForLevel(fromLvl, activeSetNum);

      const intervalMinutes = intervalRounds * timePerRun;
      const cumulativeMinutes = cumulativeRounds * timePerRun;

      const xpNeededInterval = (xpMap[toLvl] || 0) - (xpMap[fromLvl] || 0);
      const isSameCombat = (fromRound === toRound && toRound > 0);
      const combatXP = toObj?.roundFinalXP || 0;
      const levelAfterRound = getLevelForXP(toObj?.xpAtReach || 0);
      const isSuperado = (toRound > 0 && levelAfterRound > toLvl);

      let roundsTramoHtml = '';
      let tiempoTramoHtml = '';
      let xpPerCombatHtml = '';
      let avgXpPerCombat = 0;

      if (intervalRounds > 1) {
        roundsTramoHtml = `<span style="font-family: var(--font-mono); font-weight: 700; color: #fff;">${formatNumber(intervalRounds)} runs</span>`;
        tiempoTramoHtml = `<span style="color: var(--text-muted); font-size: 0.85rem;">${formatDuration(intervalMinutes)}</span>`;
        avgXpPerCombat = xpNeededInterval / intervalRounds;
        xpPerCombatHtml = `<span style="font-family: var(--font-mono); color: var(--text-gold);">${formatCompactXP(avgXpPerCombat)}</span>`;
      } else if (isSameCombat || isSuperado) {
        roundsTramoHtml = `<span style="font-family: var(--font-mono); font-weight: 700; color: var(--emerald);" title="Superado durante la ronda ${toRound}">&lt; 1</span><span style="font-size: 0.70rem; color: var(--emerald); display: block; font-weight: 500;">(Ronda #${toRound})</span>`;
        tiempoTramoHtml = `<span style="color: var(--text-muted); font-size: 0.85rem;">&lt; 1 min</span><span style="font-size: 0.70rem; color: var(--emerald); display: block;">(Mismo combate)</span>`;
        avgXpPerCombat = combatXP;
        xpPerCombatHtml = `<span style="font-family: var(--font-mono); color: var(--text-gold); font-weight: 700;">${formatCompactXP(combatXP)}</span><span style="font-size: 0.70rem; color: var(--emerald); display: block;">(Combate #${toRound})</span>`;
      } else {
        roundsTramoHtml = `<span style="font-family: var(--font-mono); font-weight: 700; color: #fff;">1 run</span>`;
        tiempoTramoHtml = `<span style="color: var(--text-muted); font-size: 0.85rem;">${formatDuration(timePerRun)}</span>`;
        avgXpPerCombat = combatXP || (xpNeededInterval / 1);
        xpPerCombatHtml = `<span style="font-family: var(--font-mono); color: var(--text-gold); font-weight: 700;">${formatCompactXP(avgXpPerCombat)}</span><span style="font-size: 0.70rem; color: var(--text-dim); display: block;">(Combate #${toRound})</span>`;
      }

      const tr = document.createElement('tr');
      if (toLvl === 199) tr.className = 'highlight-target';
      if (toLvl === 200) tr.className = 'highlight-target-200';

      let tierBadge = '';
      if (toLvl === minTierLevel && fromLvl < minTierLevel) {
        tierBadge = ` <span class="badge-pill" style="font-size: 0.65rem; background: rgba(52, 211, 153, 0.15); color: #34d399; margin-left: 4px;" title="Alcanza nivel ${minTierLevel}: Se elimina el malus de grupo">Fin Malus 1/3</span>`;
      } else if (toLvl <= minTierLevel && fromLvl < minTierLevel) {
        tierBadge = ` <span style="font-size: 0.65rem; color: #f87171; margin-left: 4px;" title="Por debajo de nivel ${minTierLevel}: Malus de grupo activo">Malus 1/3</span>`;
      }

      const baseGrowthText = autoBaseStart !== autoBaseEnd
        ? `Base: +${autoBaseStart} &rarr; +${autoBaseEnd}`
        : `Base: +${autoBaseStart}`;

      tr.innerHTML = `
        <td><strong style="color: var(--gold-light);">Lvl ${fromLvl} &rarr; ${toLvl}</strong>${tierBadge}</td>
        <td>
          <span class="tier-total-badge" style="color: ${activeSetNum === 2 ? '#6ee7b7' : '#93c5fd'};">+${totalWisdomStart} Sab</span>
          <span style="font-size: 0.72rem; color: var(--text-dim); display: block;">Equipo: +${gearWisdom} | ${baseGrowthText}</span>
        </td>
        <td>${roundsTramoHtml}</td>
        <td><strong style="font-family: var(--font-mono); font-weight: 700; color: var(--gold-light);">${formatNumber(cumulativeRounds)}</strong></td>
        <td>${tiempoTramoHtml}</td>
        <td><strong style="color: var(--emerald); font-weight: 700; font-size: 0.85rem;">${formatDuration(cumulativeMinutes)}</strong></td>
        <td>${xpPerCombatHtml}</td>
        <td><span style="font-family: var(--font-mono); color: var(--text-muted);">${formatCompactXP(xpNeededInterval)}</span></td>
      `;
      tbody.appendChild(tr);
    }
  }
}

function renderComparatorView() {
  const malefiskRes = runSimulationForDungeon('malefisk');
  const nidasRes = runSimulationForDungeon('nidas');
  const reinaRes = runSimulationForDungeon('reina');
  const venerableRes = runSimulationForDungeon('venerable');

  const all = [malefiskRes, nidasRes, reinaRes, venerableRes];
  const fastest = [...all].sort((a, b) => a.totalMinutes - b.totalMinutes)[0];
  const cheapest = [...all].sort((a, b) => a.kamasSpentLeech - b.kamasSpentLeech)[0];
  const highestSpeed = [...all].sort((a, b) => b.xpPerHour - a.xpPerHour)[0];

  const quickStatsEl = document.getElementById('comparator-quick-stats');
  if (quickStatsEl) {
    const kamasDiffM = (Math.abs(reinaRes.kamasSpentLeech - malefiskRes.kamasSpentLeech) / 1000000).toFixed(2);

    quickStatsEl.innerHTML = `
      <div class="quick-stat-card winner-time">
        <div class="quick-stat-header">
          <span class="quick-stat-label">Menor Tiempo Estimado</span>
          <span class="quick-stat-badge badge-emerald">Óptimo Tiempo</span>
        </div>
        <div class="quick-stat-dungeon">${fastest.dungeon.name}</div>
        <div class="quick-stat-value" style="color: var(--emerald);">${formatDuration(fastest.totalMinutes)}</div>
        <div class="quick-stat-detail">Requiere ${formatNumber(fastest.totalRounds)} combates totales hasta Nivel 200.</div>
      </div>

      <div class="quick-stat-card winner-kamas">
        <div class="quick-stat-header">
          <span class="quick-stat-label">Menor Inversión en Kamas</span>
          <span class="quick-stat-badge badge-enutrof">Menor Coste</span>
        </div>
        <div class="quick-stat-dungeon">${cheapest.dungeon.name}</div>
        <div class="quick-stat-value" style="color: var(--gold-light);">${formatCompactXP(cheapest.kamasSpentLeech)} K</div>
        <div class="quick-stat-detail">Diferencia de ~${kamasDiffM} MM Kamas frente a la opción de mayor coste.</div>
      </div>

      <div class="quick-stat-card winner-speed">
        <div class="quick-stat-header">
          <span class="quick-stat-label">Mayor Tasa XP / Hora</span>
          <span class="quick-stat-badge badge-sram">Rendimiento XP</span>
        </div>
        <div class="quick-stat-dungeon">${highestSpeed.dungeon.name}</div>
        <div class="quick-stat-value" style="color: #c4b5fd;">${(highestSpeed.xpPerHour / 1000000).toFixed(1)} M/h</div>
        <div class="quick-stat-detail">${formatCompactXP(highestSpeed.firstCombatXP)} XP estimada en el primer combate.</div>
      </div>
    `;
  }

  const tbody = document.getElementById('comparator-tbody');
  if (tbody) {
    const getFastestCol = () => {
      if (fastest.dungeon.id === 'malefisk') return 0;
      if (fastest.dungeon.id === 'nidas') return 1;
      if (fastest.dungeon.id === 'reina') return 2;
      return 3;
    };
    const fastestCol = getFastestCol();

    const state = window.AppState || {};
    const rows = [
      {
        label: "Nivel de Mazmorra y Dimensión",
        m: "Nivel 100 &bull; Anutropía",
        n: "Nivel 220 &bull; Anutropía",
        r: "Nivel 220 &bull; Sramvil",
        v: "Nivel 220 &bull; Osavora"
      },
      {
        label: "Composición de Grupo",
        m: `${malefiskRes.carryCount} Carry (${malefiskRes.carryLvl}) + ${malefiskRes.leechCount} Mulas`,
        n: `${nidasRes.carryCount} Carries (${nidasRes.carryLvl}) + ${nidasRes.leechCount} Mulas`,
        r: `${reinaRes.carryCount} Carries (${reinaRes.carryLvl}) + ${reinaRes.leechCount} Mulas`,
        v: `${venerableRes.carryCount} Carries (${venerableRes.carryLvl}) + ${venerableRes.leechCount} Mulas`
      },
      {
        label: "XP Base del Combate (5 Oleadas B8)",
        m: `${formatCompactXP(malefiskRes.totalCombatBaseXP)} XP`,
        n: `${formatCompactXP(nidasRes.totalCombatBaseXP)} XP`,
        r: `${formatCompactXP(reinaRes.totalCombatBaseXP)} XP`,
        v: `${formatCompactXP(venerableRes.totalCombatBaseXP)} XP`
      },
      {
        label: "Tiempo Estimado por Ronda",
        m: `${malefiskRes.timePerRun} min`,
        n: `${nidasRes.timePerRun} min`,
        r: `${reinaRes.timePerRun} min`,
        v: `${venerableRes.timePerRun} min`
      },
      {
        label: "Coste de Llave (Unidad)",
        m: `${formatNumber(malefiskRes.keyCost)} Kamas`,
        n: `${formatNumber(nidasRes.keyCost)} Kamas`,
        r: `${formatNumber(reinaRes.keyCost)} Kamas`,
        v: `${formatNumber(venerableRes.keyCost)} Kamas`,
        highlight: 'cheapest',
        col: 0
      },
      {
        label: `Rondas Nivel ${state.startLevel} a 199`,
        m: formatNumber(malefiskRes.roundsTo199),
        n: formatNumber(nidasRes.roundsTo199),
        r: formatNumber(reinaRes.roundsTo199),
        v: formatNumber(venerableRes.roundsTo199)
      },
      {
        label: "Rondas Tramo 199 a 200",
        m: formatNumber(malefiskRes.roundsFrom199To200),
        n: formatNumber(nidasRes.roundsFrom199To200),
        r: formatNumber(reinaRes.roundsFrom199To200),
        v: formatNumber(venerableRes.roundsFrom199To200)
      },
      {
        label: `Rondas Totales (${state.startLevel} a 200)`,
        m: `<strong style="font-size: 1.05rem;">${formatNumber(malefiskRes.totalRounds)}</strong>`,
        n: `<strong style="font-size: 1.05rem;">${formatNumber(nidasRes.totalRounds)}</strong>`,
        r: `<strong style="font-size: 1.05rem;">${formatNumber(reinaRes.totalRounds)}</strong>`,
        v: `<strong style="font-size: 1.05rem;">${formatNumber(venerableRes.totalRounds)}</strong>`
      },
      {
        label: `Tiempo Total (${state.startLevel} a 200)`,
        m: `<strong style="color: ${fastest.dungeon.id === 'malefisk' ? 'var(--emerald)' : 'inherit'};">${formatDuration(malefiskRes.totalMinutes)}</strong>`,
        n: `<strong style="color: ${fastest.dungeon.id === 'nidas' ? 'var(--emerald)' : 'inherit'};">${formatDuration(nidasRes.totalMinutes)}</strong>`,
        r: `<strong style="color: ${fastest.dungeon.id === 'reina' ? 'var(--emerald)' : 'inherit'};">${formatDuration(reinaRes.totalMinutes)}</strong>`,
        v: `<strong style="color: ${fastest.dungeon.id === 'venerable' ? 'var(--emerald)' : 'inherit'};">${formatDuration(venerableRes.totalMinutes)}</strong>`,
        highlight: 'winner',
        col: fastestCol
      },
      {
        label: "Velocidad de Leveo (M XP / hora)",
        m: `<strong>${(malefiskRes.xpPerHour / 1000000).toFixed(1)} M XP/h</strong>`,
        n: `<strong>${(nidasRes.xpPerHour / 1000000).toFixed(1)} M XP/h</strong>`,
        r: `<strong>${(reinaRes.xpPerHour / 1000000).toFixed(1)} M XP/h</strong>`,
        v: `<strong>${(venerableRes.xpPerHour / 1000000).toFixed(1)} M XP/h</strong>`
      },
      {
        label: "Gasto en Llaves (1 Mula)",
        m: `<strong style="color: var(--gold-light);">${formatCompactXP(malefiskRes.kamasSpentLeech)} K</strong> (${formatNumber(malefiskRes.kamasSpentLeech)} k)`,
        n: `<strong style="color: var(--gold-light);">${formatCompactXP(nidasRes.kamasSpentLeech)} K</strong> (${formatNumber(nidasRes.kamasSpentLeech)} k)`,
        r: `<strong style="color: var(--gold-light);">${formatCompactXP(reinaRes.kamasSpentLeech)} K</strong> (${formatNumber(reinaRes.kamasSpentLeech)} k)`,
        v: `<strong style="color: var(--gold-light);">${formatCompactXP(venerableRes.kamasSpentLeech)} K</strong> (${formatNumber(venerableRes.kamasSpentLeech)} k)`,
        highlight: 'cheapest',
        col: 0
      },
      {
        label: "Gasto en Llaves Grupo (8 PJs)",
        m: `${formatCompactXP(malefiskRes.kamasSpentGroup)} K`,
        n: `${formatCompactXP(nidasRes.kamasSpentGroup)} K`,
        r: `${formatCompactXP(reinaRes.kamasSpentGroup)} K`,
        v: `${formatCompactXP(venerableRes.kamasSpentGroup)} K`
      },
      {
        label: "Eficiencia de Coste (Kamas / M XP)",
        m: `<strong style="color: var(--emerald);">${formatNumber(malefiskRes.kamasPerMillionXP)} K / M XP</strong>`,
        n: `<strong>${formatNumber(nidasRes.kamasPerMillionXP)} K / M XP</strong>`,
        r: `<strong>${formatNumber(reinaRes.kamasPerMillionXP)} K / M XP</strong>`,
        v: `<strong>${formatNumber(venerableRes.kamasPerMillionXP)} K / M XP</strong>`,
        highlight: 'cheapest',
        col: 0
      }
    ];

    tbody.innerHTML = '';
    rows.forEach(r => {
      const tr = document.createElement('tr');
      const tdMClass = (r.highlight === 'winner' && r.col === 0) ? 'cell-winner' : ((r.highlight === 'cheapest' && r.col === 0) ? 'cell-cheapest' : '');
      const tdNClass = (r.highlight === 'winner' && r.col === 1) ? 'cell-winner' : ((r.highlight === 'cheapest' && r.col === 1) ? 'cell-cheapest' : '');
      const tdRClass = (r.highlight === 'winner' && r.col === 2) ? 'cell-winner' : ((r.highlight === 'cheapest' && r.col === 2) ? 'cell-cheapest' : '');
      const tdVClass = (r.highlight === 'winner' && r.col === 3) ? 'cell-winner' : ((r.highlight === 'cheapest' && r.col === 3) ? 'cell-cheapest' : '');

      tr.innerHTML = `
        <td>${r.label}</td>
        <td class="${tdMClass}">${r.m}</td>
        <td class="${tdNClass}">${r.n}</td>
        <td class="${tdRClass}">${r.r}</td>
        <td class="${tdVClass}">${r.v}</td>
      `;
      tbody.appendChild(tr);
    });
  }
}

function updateControlLabels() {
  const state = window.AppState || {};

  const retosVal = document.getElementById('retos-val');
  if (retosVal) retosVal.textContent = `+${state.challengesBonus}%`;

  const zonaVal = document.getElementById('zona-val');
  if (zonaVal) zonaVal.textContent = `+${state.zoneBonus}%`;

  const guildStatus = document.getElementById('guild-status-badge');
  if (guildStatus) {
    guildStatus.textContent = state.guildBonusActive ? "ACTIVO (+50%)" : "INACTIVO (0%)";
    guildStatus.className = state.guildBonusActive ? "guild-active-badge" : "panel-badge";
  }

  const scrollStatus = document.getElementById('scroll-status-badge');
  if (scrollStatus) {
    scrollStatus.textContent = state.scrollActive ? `+${state.scrollWisdom}` : "+0";
  }

  const consumableStatus = document.getElementById('consumable-status-badge');
  if (consumableStatus) {
    consumableStatus.textContent = state.consumableActive ? `+${state.consumableWisdom}` : "+0";
  }

  const xpPotionStatus = document.getElementById('xp-potion-status-badge');
  if (xpPotionStatus) {
    xpPotionStatus.textContent = state.xpPotionActive ? `+${state.xpPotionPercent}%` : "INACTIVA (0%)";
    xpPotionStatus.style.background = state.xpPotionActive ? "rgba(168, 85, 247, 0.2)" : "rgba(255, 255, 255, 0.05)";
    xpPotionStatus.style.color = state.xpPotionActive ? "#d8b4fe" : "var(--text-dim)";
  }

  const combatBonusHint = document.getElementById('total-combat-bonus-hint');
  if (combatBonusHint) {
    const pVal = state.xpPotionActive ? (state.xpPotionPercent || 0) : 0;
    const totalComb = (state.challengesBonus || 0) + pVal;
    combatBonusHint.innerHTML = `Total combate: <strong>+${totalComb}%</strong> (${state.challengesBonus || 0}% retos + ${pVal}% poción${state.xpPotionActive ? '' : ' <span style="color:var(--text-dim);">(inactiva)</span>'})`;
  }
}

function updateUI() {
  const result = runSimulation();
  const state = window.AppState || {};

  const kpiRounds199El = document.getElementById('kpi-rounds-199');
  const kpiRounds200El = document.getElementById('kpi-rounds-200');
  const kpiTotalRoundsEl = document.getElementById('kpi-total-rounds');
  const kpiTotalTimeEl = document.getElementById('kpi-total-time');
  const kpiTotalKeysEl = document.getElementById('kpi-total-keys');
  const kpiTitle199El = document.getElementById('kpi-title-199');
  const kpiTitle200El = document.getElementById('kpi-title-200');
  const kpiTitleTotalEl = document.getElementById('kpi-title-total');
  const kpiSubtextTotalEl = document.getElementById('kpi-subtext-total');

  const kpiTotalKamasLeechEl = document.getElementById('kpi-total-kamas-leech');
  const kpiTotalKamasGroupEl = document.getElementById('kpi-total-kamas-group');
  const kpiKamasPerMXpEl = document.getElementById('kpi-kamas-per-m-xp');
  const kpiLootDisplayEl = document.getElementById('kpi-loot-display');
  const kpiKeysLabelEl = document.getElementById('kpi-keys-label');

  if (state.startLevel < 199) {
    if (kpiTitle199El) kpiTitle199El.innerHTML = `Nivel ${state.startLevel} &rarr; 199`;
    if (kpiTitle200El) kpiTitle200El.innerHTML = `Nivel 199 &rarr; 200`;
    if (kpiRounds199El) kpiRounds199El.textContent = formatNumber(result.roundsTo199);
    if (kpiRounds200El) kpiRounds200El.textContent = formatNumber(result.roundsFrom199To200);
  } else {
    if (kpiTitle199El) kpiTitle199El.innerHTML = `Nivel 199 (Completado)`;
    if (kpiTitle200El) kpiTitle200El.innerHTML = `Nivel ${state.startLevel} &rarr; 200`;
    if (kpiRounds199El) kpiRounds199El.textContent = '0';
    if (kpiRounds200El) kpiRounds200El.textContent = formatNumber(result.totalRounds);
  }

  if (kpiTitleTotalEl) kpiTitleTotalEl.innerHTML = `Total Nivel ${state.startLevel} &rarr; 200`;
  if (kpiTotalRoundsEl) kpiTotalRoundsEl.textContent = formatNumber(result.totalRounds);
  if (kpiTotalTimeEl) kpiTotalTimeEl.textContent = formatDuration(result.totalMinutes);

  if (kpiKeysLabelEl) {
    kpiKeysLabelEl.textContent = `Llaves (${result.dungeon.bossName}):`;
  }
  if (kpiTotalKeysEl) {
    kpiTotalKeysEl.textContent = `${formatNumber(result.keysNeededLeech)}`;
  }
  if (kpiTotalKamasLeechEl) {
    kpiTotalKamasLeechEl.textContent = `${formatCompactXP(result.kamasSpentLeech)} Kamas`;
  }
  if (kpiTotalKamasGroupEl) {
    kpiTotalKamasGroupEl.textContent = `${formatCompactXP(result.kamasSpentGroup)} Kamas`;
  }
  if (kpiKamasPerMXpEl) {
    kpiKamasPerMXpEl.textContent = `${formatNumber(result.kamasPerMillionXP)} K`;
  }
  if (kpiLootDisplayEl) {
    kpiLootDisplayEl.textContent = `B${state.totalPlayers}`;
  }

  const subtext199 = document.getElementById('kpi-subtext-199');
  const subtext200 = document.getElementById('kpi-subtext-200');
  if (subtext199) subtext199.textContent = `${formatCompactXP(result.xpNeededTo199)} XP requerida`;
  if (subtext200) subtext200.textContent = `${formatCompactXP(result.xpNeeded199To200)} XP requerida`;
  if (kpiSubtextTotalEl) kpiSubtextTotalEl.textContent = `${formatCompactXP(result.totalXpNeeded)} XP total`;

  const barTo199 = document.getElementById('progress-bar-to-199');
  const bar199To200 = document.getElementById('progress-bar-199-200');
  const labelPercent199 = document.getElementById('progress-pct-199');
  const labelPercent200 = document.getElementById('progress-pct-200');
  const progressSubtext = document.getElementById('progress-subtext');
  const progressLegend199 = document.getElementById('progress-legend-label-199');

  if (progressSubtext) {
    progressSubtext.textContent = state.startLevel < 199
      ? `Nivel ${state.startLevel}-199 vs 199-200`
      : `Nivel ${state.startLevel}-200`;
  }

  if (result.totalRounds > 0) {
    const pct199 = state.startLevel < 199 ? ((result.roundsTo199 / result.totalRounds) * 100).toFixed(1) : "0.0";
    const pct200 = state.startLevel < 199 ? ((result.roundsFrom199To200 / result.totalRounds) * 100).toFixed(1) : "100.0";

    if (barTo199) barTo199.style.width = `${pct199}%`;
    if (bar199To200) bar199To200.style.width = `${pct200}%`;
    if (labelPercent199) labelPercent199.textContent = `${pct199}% (${formatNumber(result.roundsTo199)} combates)`;
    if (labelPercent200) labelPercent200.textContent = `${pct200}% (${formatNumber(result.roundsFrom199To200)} combates)`;
    if (progressLegend199) {
      progressLegend199.innerHTML = `${state.startLevel} &rarr; 199: <strong id="progress-pct-199" style="color: var(--gold-light);">${pct199}% (${formatNumber(result.roundsTo199)} combates)</strong>`;
    }
  }

  renderSpecificLevelsTable();
  renderGroupMembersUI();
  renderMobsGrid();
  renderMobsTable();
  renderMilestonesTable(result);
  updateControlLabels();
}

// Exposición global
if (typeof window !== 'undefined') {
  window.syncDOMFromAppState = syncDOMFromAppState;
  window.syncProgressionViewButtons = syncProgressionViewButtons;
  window.renderGroupMembersUI = renderGroupMembersUI;
  window.renderMobsGrid = renderMobsGrid;
  window.renderMobsTable = renderMobsTable;
  window.renderSpecificLevelsTable = renderSpecificLevelsTable;
  window.renderMilestonesTable = renderMilestonesTable;
  window.renderComparatorView = renderComparatorView;
  window.updateControlLabels = updateControlLabels;
  window.updateUI = updateUI;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    syncDOMFromAppState,
    syncProgressionViewButtons,
    renderGroupMembersUI,
    renderMobsGrid,
    renderMobsTable,
    renderSpecificLevelsTable,
    renderMilestonesTable,
    renderComparatorView,
    updateControlLabels,
    updateUI
  };
}
