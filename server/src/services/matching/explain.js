const LEVEL_NAMES = {
  BEGINNER: 'începător',
  JUNIOR: 'junior',
  MID: 'mediu',
  SENIOR: 'senior',
};
const MAX_REASONS = 6;

function shortList(values) {
  return values.slice(0, 4).join(', ');
}

/** Produce explicații doar din datele folosite la scor; textul nu este generat de AI. */
function buildReasons(result, project, freelancer, { exploration = false } = {}) {
  if (!result?.eligible || !result.details || !result.components) {
    return { forClient: [], forFreelancer: [], components: result?.components ?? {} };
  }

  const { details, components } = result;
  const client = [];
  const freelancerReasons = [];
  const add = (code, clientText, freelancerText, positive = true) => {
    client.push({ code, text: clientText, positive });
    freelancerReasons.push({ code, text: freelancerText, positive });
  };

  if (details.matchedSkills.length) {
    add('SKILLS', `Abilități potrivite: ${shortList(details.matchedSkills)}`,
      `Ai abilitățile cerute: ${shortList(details.matchedSkills)}`);
  } else if (details.categoryOnly) {
    add('CATEGORY', 'Are abilități din categoria proiectului', 'Proiectul este în categoria abilităților tale');
  }
  if (details.missingEssential.length) {
    add('MISSING_SKILLS', `Îi lipsesc unele abilități esențiale: ${shortList(details.missingEssential)}`,
      `Îți lipsesc unele abilități esențiale: ${shortList(details.missingEssential)}`, false);
  }
  if (details.relevantPortfolio > 0) {
    const count = details.relevantPortfolio;
    add('PORTFOLIO', `${count} ${count === 1 ? 'lucrare relevantă' : 'lucrări relevante'} în portofoliu`,
      `Portofoliul tău conține ${count} ${count === 1 ? 'lucrare relevantă' : 'lucrări relevante'}`);
  }
  if (details.semanticPortfolio > 0) {
    add('PORTFOLIO_SEMANTIC', 'Portofoliul conține lucrări dintr-un domeniu apropiat',
      'Ai lucrări dintr-un domeniu apropiat de proiect');
  }
  if (details.verifiedSkills.length > 0) {
    add('VERIFIED', `Abilități verificate: ${shortList(details.verifiedSkills)}`,
      `Ai abilități verificate: ${shortList(details.verifiedSkills)}`);
  }
  if (details.budgetKnown) {
    if (details.overrun <= 1) {
      add('BUDGET', 'Tariful estimat se încadrează în buget', 'Bugetul proiectului se încadrează în tariful tău');
    } else {
      add('BUDGET', 'Tariful estimat depășește parțial bugetul', 'Bugetul este sub tariful tău', false);
    }
  }
  if (freelancer.availability === 'AVAILABLE') {
    add('AVAILABILITY', details.tightDeadline ? 'Este disponibil, dar termenul este strâns' : 'Este disponibil',
      details.tightDeadline ? 'Ești disponibil, dar termenul proiectului este strâns' : 'Ești disponibil');
  } else {
    add('AVAILABILITY', 'Are disponibilitate limitată', 'Disponibilitatea ta este limitată', false);
  }
  if (components.level >= 0.8) {
    const levelName = LEVEL_NAMES[freelancer.level] ?? 'potrivit';
    add('LEVEL', `Nivelul ${levelName} se potrivește proiectului`, 'Nivelul tău se potrivește proiectului');
  }
  if (freelancer.reviews?.count > 0 && freelancer.reviews.avg >= 4) {
    add('REVIEWS', `Recenzii bune: ${freelancer.reviews.avg.toFixed(1)}/5`, 'Ai recenzii bune');
  }
  if (details.languageOk === true) {
    add('LANGUAGE', 'Vorbește limba proiectului', 'Vorbești limba proiectului');
  }
  if (exploration) {
    add('EXPLORATION', 'Recomandat pentru potrivire și pentru a-i oferi expunere',
      'Ești recomandat pentru potrivire și pentru a primi mai multă expunere');
  }

  const priority = {
    SKILLS: 100, VERIFIED: 90, PORTFOLIO: 80, PORTFOLIO_SEMANTIC: 79,
    LEVEL: 70, BUDGET: 60, EXPLORATION: 55, AVAILABILITY: 40,
    LANGUAGE: 30, REVIEWS: 20, MISSING_SKILLS: 10,
  };
  const finalize = (reasons) => {
    const sort = (a, b) => (priority[b.code] ?? 0) - (priority[a.code] ?? 0);
    const positive = reasons.filter((reason) => reason.positive).sort(sort);
    const negative = reasons.filter((reason) => !reason.positive).sort(sort).slice(0, 2);
    return [...positive.slice(0, MAX_REASONS - negative.length), ...negative];
  };

  return {
    forClient: finalize(client),
    forFreelancer: finalize(freelancerReasons),
    components: { ...components },
    exploration,
  };
}

module.exports = { buildReasons };
