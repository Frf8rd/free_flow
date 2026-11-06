/**
 * Scor inițial pentru compatibilitatea abilităților.
 * Project: { skills: [{ id, name, essential? }] }
 * Freelancer: { skills: [{ id, name }] }
 * Întoarce un rezultat explicabil; alte criterii vor fi adăugate în pașii următori.
 */
function scoreSkills(project, freelancer) {
  const requiredSkills = Array.isArray(project?.skills) ? project.skills : [];
  const freelancerSkills = Array.isArray(freelancer?.skills) ? freelancer.skills : [];

  if (requiredSkills.length === 0) {
    return {
      score: 0,
      matchedSkills: [],
      missingEssentialSkills: [],
      coverage: 0,
    };
  }

  const availableIds = new Set(freelancerSkills.map((skill) => skill.id).filter((id) => id != null));
  const matchedSkills = [];
  const missingEssentialSkills = [];
  let totalWeight = 0;
  let earnedWeight = 0;

  for (const skill of requiredSkills) {
    const weight = skill.essential === true ? 1 : 0.5;
    totalWeight += weight;

    if (skill.id != null && availableIds.has(skill.id)) {
      matchedSkills.push(skill.name ?? String(skill.id));
      earnedWeight += weight;
    } else if (skill.essential === true) {
      missingEssentialSkills.push(skill.name ?? String(skill.id ?? 'abilitate'));
    }
  }

  const coverage = totalWeight === 0 ? 0 : earnedWeight / totalWeight;

  return {
    score: Math.round(coverage * 100),
    matchedSkills,
    missingEssentialSkills,
    coverage,
  };
}

/** Sortează candidații descrescător după scorul inițial de abilități. */
function rankFreelancers(project, freelancers) {
  return (Array.isArray(freelancers) ? freelancers : [])
    .map((freelancer) => ({ freelancer, ...scoreSkills(project, freelancer) }))
    .sort((a, b) => b.score - a.score);
}

module.exports = { scoreSkills, rankFreelancers };
