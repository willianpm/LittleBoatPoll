// Validação de token do dashboard (feature #15)
// Implementação mínima para integração

function isValidDashboardToken(token) {
  // TODO: Integrar com fluxo real de autenticação da feature #15
  if (!token || typeof token !== 'string') return false;
  return token.startsWith('Bearer ');
}

function validateDashboardToken(reqOrToken, res, next) {
  // Compatibilidade:
  // 1) Uso como função: validateDashboardToken('Bearer ...') -> boolean
  // 2) Uso como middleware Express: validateDashboardToken(req, res, next)
  if (typeof reqOrToken === 'string' || reqOrToken == null) {
    return isValidDashboardToken(reqOrToken);
  }

  const req = reqOrToken;
  const token = req && req.headers ? req.headers.authorization : undefined;

  if (!isValidDashboardToken(token)) {
    return res.status(401).json({ error: 'Token inválido ou ausente' });
  }

  return next();
}

module.exports = { validateDashboardToken, isValidDashboardToken };
