function writeAuditLog(event, { actorId, resourceId } = {}) {
  console.info(JSON.stringify({
    type: "security_audit",
    event,
    actorId: actorId || null,
    resourceId: resourceId || null,
    timestamp: new Date().toISOString(),
  }));
}

module.exports = { writeAuditLog };
