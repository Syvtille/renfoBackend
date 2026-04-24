export function welcomeEmailHtml(username: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#f8fafc; margin:0; padding:2rem; color:#1e293b; }
  .card { max-width:560px; margin:0 auto; background:white; border-radius:12px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,.08); }
  .hd { background:linear-gradient(135deg,#6366f1,#8b5cf6); padding:2rem; text-align:center; color:white; }
  .hd h1 { margin:0; font-size:1.6rem; }
  .bd { padding:2rem; line-height:1.55; }
  .btn { display:inline-block; background:#6366f1; color:white; padding:.75rem 2rem; border-radius:8px; text-decoration:none; font-weight:600; margin:1rem 0; }
  .ft { text-align:center; padding:1.25rem 2rem; background:#f8fafc; color:#94a3b8; font-size:.82rem; }
</style></head><body>
<div class="card">
  <div class="hd"><h1>ClashChat</h1><p style="margin:.35rem 0 0;opacity:.85">Bienvenue, ${username}!</p></div>
  <div class="bd">
    <p>Votre compte est créé. Vous pouvez maintenant rejoindre l'arène, défier d'autres joueurs et grimper dans le classement.</p>
    <p>Préparez vos arguments — la rhétorique ne pardonne pas.</p>
  </div>
  <div class="ft">© 2026 ClashChat — Débattez. Gagnez. Évoluez.</div>
</div>
</body></html>`;
}
