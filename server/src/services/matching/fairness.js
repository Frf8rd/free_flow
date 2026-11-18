function tieHash(seed, key) {
  let hash = 0x811c9dc5;
  const value = `${seed}:${key}`;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

/** Reordonează candidații apropiați ca scor pentru a împărți expunerea mai echilibrat. */
function applyFairness(items, options = {}) {
  const {
    topK = 5,
    explorationSlots = 0,
    explorationMinScore = 50,
    explorationBand = null,
    mainBand = null,
    lowExposure = 2,
    maxActive = null,
    seed = '',
  } = options;
  const tie = (key) => seed ? tieHash(seed, key) : String(key);
  const exposure = (item) => Number.isFinite(item.exposure) ? item.exposure : 0;
  const lastSeen = (item) => {
    const value = item.lastExposureAt ? new Date(item.lastExposureAt).getTime() : 0;
    return Number.isFinite(value) ? value : 0;
  };
  const fairTie = (a, b) => exposure(a) - exposure(b)
    || lastSeen(a) - lastSeen(b)
    || tie(a.key).localeCompare(tie(b.key));
  const byScore = (a, b) => b.score - a.score || fairTie(a, b);
  let pool = [...items].sort(byScore);

  if (maxActive != null) {
    const available = [];
    const overloaded = [];
    for (const item of pool) {
      ((item.activeLoad ?? item.exposure ?? 0) > maxActive ? overloaded : available).push(item);
    }
    while (available.length < topK && overloaded.length) available.push(overloaded.shift());
    pool = available.sort(byScore);
  }

  const count = Math.min(topK, pool.length);
  const slots = Math.min(explorationSlots, count);
  const mainCount = count - slots;
  const naturalTop = new Set(pool.slice(0, count).map((item) => item.key));
  let main;
  let rest;
  if (mainBand && mainCount > 0) {
    const remaining = [...pool];
    main = [];
    while (main.length < mainCount && remaining.length) {
      const bestScore = remaining[0].score;
      const near = remaining
        .filter((item) => item.score >= bestScore - mainBand)
        .sort((a, b) => fairTie(a, b) || b.score - a.score);
      const selected = near[0];
      main.push(selected);
      remaining.splice(remaining.indexOf(selected), 1);
    }
    rest = remaining;
  } else {
    main = pool.slice(0, mainCount);
    rest = pool.slice(mainCount);
  }

  let eligible = rest.filter((item) => item.score >= explorationMinScore
    && (item.isNewcomer || exposure(item) <= lowExposure));
  if (explorationBand != null && eligible.length) {
    const possible = pool.filter((item) => item.score >= explorationMinScore
      && (item.isNewcomer || exposure(item) <= lowExposure));
    const newcomers = possible.filter((item) => item.isNewcomer);
    const reference = newcomers.length ? newcomers : possible;
    const best = Math.max(...reference.map((item) => item.score));
    eligible = eligible.filter((item) => item.score >= best - explorationBand);
  }
  eligible.sort((a, b) => fairTie(a, b)
    || Number(b.isNewcomer) - Number(a.isNewcomer)
    || b.score - a.score
    || tie(a.key).localeCompare(tie(b.key)));
  const picks = eligible.slice(0, slots);
  const picked = new Set(picks.map((item) => item.key));
  const fillers = rest.filter((item) => !picked.has(item.key)).slice(0, slots - picks.length);
  const fillerKeys = new Set(fillers.map((item) => item.key));
  const head = [...main, ...picks, ...fillers].sort(byScore);
  const tail = rest.filter((item) => !picked.has(item.key) && !fillerKeys.has(item.key));

  return [...head, ...tail].map((item, index) => ({
    ...item,
    rank: index + 1,
    exploration: picked.has(item.key) && !naturalTop.has(item.key),
  }));
}

module.exports = { applyFairness };
