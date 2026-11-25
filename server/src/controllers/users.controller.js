const usersService = require("../services/users.service");
const { clearRefreshCookie } = require("../utils/refreshCookie");
const { writeAuditLog } = require("../utils/auditLog");

async function patchMe(req, res) {
  const result = await usersService.updateMe(req.user, req.body);
  writeAuditLog(result.emailChanged ? "account.email_changed" : "account.profile_updated", {
    actorId: req.user.id,
    resourceId: req.user.id,
  });
  if (result.emailChanged) {
    // Sesiunile s-au invalidat: clientul trebuie să se autentifice din nou după verificarea emailului.
    clearRefreshCookie(res);
    return res.json({
      user: result.user,
      emailChanged: true,
      verificationEmailSent: result.verificationEmailSent,
      message: "Adresa a fost schimbată. Verifică noul email, apoi autentifică-te din nou.",
    });
  }
  return res.json({ user: result.user });
}

module.exports = { patchMe };
