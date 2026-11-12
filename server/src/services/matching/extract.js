const { normalize, containsPhrase } = require('./text');

function parseAmount(raw) {
  const value = raw.replace(/\s/g, '');
  if (value.includes(',') && value.includes('.')) {
    return Number(value.lastIndexOf(',') > value.lastIndexOf('.')
      ? value.replace(/\./g, '').replace(',', '.')
      : value.replace(/,/g, ''));
  }
  if (value.includes(',')) return Number(value.replace(',', '.'));
  if (/\.\d{3}$/.test(value)) return Number(value.replace('.', ''));
  return Number(value);
}

function extractBudget(text, explicitMin, explicitMax) {
  if (Number.isFinite(explicitMin) || Number.isFinite(explicitMax)) {
    return {
      min: Number.isFinite(explicitMin) ? explicitMin : null,
      max: Number.isFinite(explicitMax) ? explicitMax : null,
    };
  }

  const range = text.match(/\b(?:intre|between|from)?\s*(\d[\d\s.,]*)\s*(?:-|–|si|and)\s*(\d[\d\s.,]*)\s*(lei|ron|eur|euro|€)/u);
  if (range) {
    const first = parseAmount(range[1]);
    const second = parseAmount(range[2]);
    if (Number.isFinite(first) && Number.isFinite(second) && first > 0 && second > 0) {
      return { min: Math.min(first, second), max: Math.max(first, second) };
    }
  }

  const matches = [...text.matchAll(/(\d[\d\s.,]*?)\s*(lei|ron|eur|euro|€)/giu)]
    .map((match) => parseAmount(match[1]))
    .filter((amount) => Number.isFinite(amount) && amount > 0);

  if (matches.length === 0) return { min: null, max: null };
  if (matches.length === 1) return { min: null, max: matches[0] };
  return { min: Math.min(...matches), max: Math.max(...matches) };
}

function extractDeadline(text, explicitDeadline, now) {
  if (explicitDeadline) {
    const date = new Date(explicitDeadline);
    if (!Number.isNaN(date.getTime())) return date;
  }

  const exact = text.match(/\b(\d{1,2})[./-](\d{1,2})[./-](\d{4})\b/);
  if (exact) {
    const date = new Date(Number(exact[3]), Number(exact[2]) - 1, Number(exact[1]));
    if (date.getFullYear() === Number(exact[3]) && date.getMonth() === Number(exact[2]) - 1 && date.getDate() === Number(exact[1])) {
      return date;
    }
  }

  const relative = text.match(/\b(?:in|peste|within)\s+(\d+)\s+(zile?|days?|saptamani|weeks?)\b/u);
  if (!relative) return null;
  const amount = Number(relative[1]);
  const unit = relative[2];
  const days = /saptamani|weeks?/u.test(unit) ? amount * 7 : amount;
  const date = new Date(now);
  date.setDate(date.getDate() + days);
  return date;
}

function extractRequiredLevel(text, explicitLevel) {
  if (explicitLevel) return explicitLevel;
  if (/\b(expert|avansat|senior)\b/u.test(text)) return 'EXPERT';
  if (/\b(intermediar|mediu|intermediate)\b/u.test(text)) return 'INTERMEDIATE';
  if (/\b(incepator|incepatoare|incepatori|junior|beginner|entry.level)\b/u.test(text)) return 'BEGINNER';
  return 'BEGINNER';
}

/**
 * Extrage câmpuri simple din brief folosind doar reguli locale.
 * Catalogul are forma [{ id, name }]; abilitățile declarate explicit au prioritate.
 */
function extractProjectData(project = {}, catalog = [], { now = new Date() } = {}) {
  const description = String(project.description ?? project.brief ?? '');
  const normalizedText = normalize(`${project.title ?? ''} ${description}`);
  const explicitSkills = Array.isArray(project.skills) ? project.skills : [];
  const skills = explicitSkills.length
    ? explicitSkills.map((skill) => ({ ...skill, essential: skill.essential !== false }))
    : catalog
      .filter((skill) => skill.name && containsPhrase(normalizedText, normalize(skill.name)))
      .map((skill) => ({ id: skill.id, name: skill.name, essential: false }));
  const budget = extractBudget(normalizedText, project.budgetMin, project.budgetMax);

  return {
    skills,
    budgetMin: budget.min,
    budgetMax: budget.max,
    deadline: extractDeadline(normalizedText, project.deadline, now),
    requiredLevel: extractRequiredLevel(normalizedText, project.requiredLevel),
    source: 'rules',
  };
}

module.exports = { extractProjectData };
