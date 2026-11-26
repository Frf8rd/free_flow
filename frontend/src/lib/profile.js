// Cât de complet e profilul unui freelancer: determină calitatea potrivirilor (README 9.2: dovezi, abilități)
export function profileCompleteness(p) {
  const items = [
    { key: 'avatar', label: 'Adaugă o poză de profil', done: !!p?.avatarUrl },
    { key: 'title', label: 'Scrie un titlu clar', done: (p?.title || '').trim().length >= 3 },
    { key: 'bio', label: 'Descrie-te în câteva fraze', done: (p?.bio || '').trim().length >= 30 },
    { key: 'skills', label: 'Alege cel puțin 3 abilități', done: (p?.skills?.length || 0) >= 3 },
    { key: 'rate', label: 'Setează tariful orar', done: p?.hourlyRate != null },
    { key: 'portfolio', label: 'Adaugă 3 lucrări în portofoliu', done: (p?.portfolio?.length || 0) >= 3, partial: Math.min(3, p?.portfolio?.length || 0) / 3 },
  ];
  const score = items.reduce((s, i) => s + (i.done ? 1 : i.partial || 0), 0);
  return { items, percent: Math.round((score / items.length) * 100), next: items.find((i) => !i.done) };
}
