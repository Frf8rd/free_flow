const detailsByType = {
  NEW_MATCH: ['Potrivire nouă', 'sparkle', 'matches'],
  MATCH_INVITE: ['Invitație la proiect', 'userPlus', 'matches'],
  INVITED: ['Invitație la proiect', 'userPlus', 'matches'],
  MATCH_INTEREST: ['Freelancer interesat', 'handshake', 'matches'],
  FREELANCER_INTERESTED: ['Freelancer interesat', 'handshake', 'matches'],
  NEW_MESSAGE: ['Mesaj nou', 'chat', 'messages'],
  ENGAGEMENT_REQUESTED: ['Cerere nouă de colaborare', 'handshake', 'engagements'],
  ENGAGEMENT_STARTED: ['Colaborare începută', 'handshake', 'engagements'],
  ENGAGEMENT_ACCEPTED: ['Cerere acceptată', 'check', 'engagements'],
  ENGAGEMENT_REJECTED: ['Cerere respinsă', 'close', 'engagements'],
  ENGAGEMENT_DELIVERED: ['Lucrare predată', 'check', 'engagements'],
  ENGAGEMENT_COMPLETED: ['Colaborare finalizată', 'check', 'engagements'],
  ENGAGEMENT_CANCELLED: ['Colaborare anulată', 'close', 'engagements'],
  REVIEW_RECEIVED: ['Recenzie nouă', 'star', 'engagements'],
};

export function notificationDetails(item) {
  const data = item.data || {};
  const [fallbackTitle, icon, kind] = Object.hasOwn(detailsByType, item.type) ? detailsByType[item.type] : ['Notificare', 'bell', ''];
  const conversation = data.conversationId && `/messages/${encodeURIComponent(data.conversationId)}`;
  const engagement = data.engagementId && `/engagements/${encodeURIComponent(data.engagementId)}`;
  const project = data.projectId && `/projects/${encodeURIComponent(data.projectId)}`;
  const legacyLink = typeof data.link === 'string' && /^\/(messages|engagements|projects|recommendations)(?:[/?#]|$)/.test(data.link) && !data.link.includes('\\') ? data.link : '';

  let href;
  let action;
  if (item.type === 'MATCH_INTEREST' && project) {
    href = `/recommendations?project=${encodeURIComponent(data.projectId)}`;
    action = 'Vezi potrivirile proiectului';
  } else if (item.type === 'MATCH_INVITE' || item.type === 'INVITED') {
    href = conversation || legacyLink || '/recommendations';
    action = 'Vezi invitația';
  } else if (kind === 'messages') {
    href = conversation || legacyLink || '/messages';
    action = 'Deschide mesajele';
  } else if (kind === 'engagements') {
    href = engagement || legacyLink || '/engagements';
    action = 'Vezi colaborarea';
  } else if (kind === 'matches') {
    href = legacyLink || project || '/recommendations';
    action = 'Vezi potrivirea';
  } else {
    href = legacyLink || project || '';
    action = 'Vezi detaliile';
  }
  return { title: item.title || data.title || fallbackTitle, body: item.body || data.body || '', icon, kind, href, action };
}
