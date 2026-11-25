const { MATCHING_CONFIG } = require('./config');

function cosineSimilarity(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right) || left.length === 0 || left.length !== right.length) return null;
  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;
  for (let index = 0; index < left.length; index += 1) {
    if (!Number.isFinite(left[index]) || !Number.isFinite(right[index])) return null;
    dot += left[index] * right[index];
    leftNorm += left[index] ** 2;
    rightNorm += right[index] ** 2;
  }
  if (leftNorm === 0 || rightNorm === 0) return null;
  return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
}

function projectText(project) {
  return [
    project.title,
    project.categoryName,
    ...(project.skills ?? []).map((skill) => skill.name),
    project.description,
  ].filter(Boolean).join('\n');
}

function portfolioText(item) {
  return [item.title, item.description].filter(Boolean).join('\n');
}

function createPortfolioEmbedder(config = MATCHING_CONFIG.embeddings) {
  if (!config?.enabled || !config.baseURL || !config.model || !config.apiKey) return null;
  return {
    async embed(texts) {
      const root = config.baseURL.replace(/\/+$/u, '').replace(/\/embeddings$/u, '');
      const results = [];
      for (let start = 0; start < texts.length; start += config.batchSize ?? 32) {
        const batch = texts.slice(start, start + (config.batchSize ?? 32));
        const response = await fetch(`${root}/embeddings`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(config.timeoutMs ?? 20000),
          body: JSON.stringify({
            model: config.model,
            input: batch,
            dimensions: config.dimensions,
          }),
        });
        if (!response.ok) throw new Error(`Serviciul embeddings a răspuns cu ${response.status}`);
        const payload = await response.json();
        const ordered = [...(payload.data ?? [])].sort((a, b) => a.index - b.index);
        if (ordered.length !== batch.length || ordered.some((item) => !Array.isArray(item.embedding))) {
          throw new Error('Răspuns embeddings invalid');
        }
        results.push(...ordered.map((item) => item.embedding));
      }
      return results;
    },
  };
}

async function rankFreelancersWithEmbeddings(
  project,
  freelancers,
  { rank = require('./scoring').rankFreelancers, config = MATCHING_CONFIG, fairnessContext = {}, embedder = createPortfolioEmbedder() } = {},
) {
  const candidates = Array.isArray(freelancers) ? freelancers : [];
  if (!embedder || candidates.every((freelancer) => !(freelancer.portfolio ?? []).length)) {
    return rank(project, candidates, config, fairnessContext);
  }

  try {
    const entries = candidates.flatMap((freelancer) => (freelancer.portfolio ?? [])
      .map((item, index) => ({ freelancerId: freelancer.id, index, item })));
    const texts = [projectText(project), ...entries.map(({ item }) => portfolioText(item))];
    const vectors = await embedder.embed(texts);
    if (!Array.isArray(vectors) || vectors.length !== texts.length) throw new Error('Număr invalid de vectori embeddings');
    const projectVector = vectors[0];
    let cursor = 1;
    const indexedSimilarities = new Map();
    for (const freelancer of candidates) {
      const items = freelancer.portfolio ?? [];
      indexedSimilarities.set(freelancer.id, items.map(() => null));
      for (let index = 0; index < items.length; index += 1) {
        indexedSimilarities.get(freelancer.id)[index] = cosineSimilarity(projectVector, vectors[cursor]);
        cursor += 1;
      }
    }

    const enriched = candidates.map((freelancer) => ({
      ...freelancer,
      portfolio: (freelancer.portfolio ?? []).map((item, index) => ({
        ...item,
        similarity: indexedSimilarities.get(freelancer.id)?.[index] ?? item.similarity,
      })),
    }));
    return rank(project, enriched, config, fairnessContext);
  } catch {
    // Furnizorul semantic este opțional; la eroare se păstrează rankingul lexical.
    return rank(project, candidates, config, fairnessContext);
  }
}

module.exports = {
  cosineSimilarity,
  projectText,
  portfolioText,
  createPortfolioEmbedder,
  rankFreelancersWithEmbeddings,
};
