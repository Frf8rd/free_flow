const STOPWORDS = new Set(
  'si sau de la in cu pe pentru un o din care sa se ca ce mai nu este sunt am vreau vrem the and for with that this from have want need our your are not but all can will you'.split(' '),
);

/** Normalizează textul pentru comparații simple, inclusiv text în română. */
function normalize(input) {
  if (input === null || input === undefined) return '';

  return String(input)
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .replace(/[^\p{L}\p{N}+#.\s]/gu, ' ')
    .replace(/(?<![\p{L}\p{N}])\.|\.(?![\p{L}\p{N}])/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Împarte textul în termeni utili, eliminând cuvintele foarte comune. */
function tokenize(input) {
  return normalize(input)
    .split(' ')
    .filter((word) => word.length >= 3 && !STOPWORDS.has(word));
}

/** Verifică o expresie ca secvență de cuvinte complete. */
function containsPhrase(normalizedText, normalizedPhrase) {
  if (!normalizedPhrase) return false;
  return ` ${normalizedText} `.includes(` ${normalizedPhrase} `);
}

module.exports = { normalize, tokenize, containsPhrase };
