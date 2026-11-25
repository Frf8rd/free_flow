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
    .replace(/[^\p{L}\p{N}+#.€\s]/gu, ' ')
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

const languageCache = new Map();
function languageNames(code) {
  if (languageCache.has(code)) return languageCache.get(code);
  const names = new Set([normalize(code)]);
  for (const locale of ['ro', 'en', 'ru']) {
    try {
      const name = new Intl.DisplayNames([locale], { type: 'language' }).of(code);
      if (name && name !== code) names.add(normalize(name));
    } catch {
      // Cod de limbă necunoscut: păstrăm doar codul introdus.
    }
  }
  languageCache.set(code, names);
  return names;
}

function languageMatches(code, languages = []) {
  if (!code) return false;
  const wanted = languageNames(code);
  return languages.some((language) => wanted.has(normalize(language)));
}

function detectLanguage(input) {
  const raw = String(input ?? '');
  if (raw.length < 20) return null;
  const letters = raw.match(/\p{L}/gu) ?? [];
  if (!letters.length) return null;
  const cyrillicCount = (raw.match(/[\u0400-\u04FF]/g) ?? []).length;
  if (cyrillicCount / letters.length > 0.4) return 'ru';
  const words = new Set(normalize(raw).split(' '));
  const count = (list) => list.reduce((total, word) => total + Number(words.has(word)), 0);
  const ro = count(['pentru', 'vreau', 'de', 'cu', 'care', 'este', 'sunt', 'nevoie', 'buget']);
  const en = count(['the', 'and', 'for', 'with', 'need', 'want', 'is', 'are', 'budget']);
  if (ro >= 3 && ro > en) return 'ro';
  if (en >= 3 && en > ro) return 'en';
  return null;
}

module.exports = { normalize, tokenize, containsPhrase, languageMatches, detectLanguage };
