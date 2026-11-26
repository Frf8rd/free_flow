// Descrierea scrisă pe pagina principală (înainte de cont) se păstrează până la crearea proiectului
const KEY = 'fm-draft';
export const saveDraft = (d) => { try { sessionStorage.setItem(KEY, JSON.stringify(d)); } catch { /* ignorat */ } };
export const readDraft = () => { try { return JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch { return null; } };
export const clearDraft = () => { try { sessionStorage.removeItem(KEY); } catch { /* ignorat */ } };
