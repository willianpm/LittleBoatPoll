// Validação de token do dashboard (feature #15)
// Implementação mínima para integração

function validateDashboardToken(token) {
  // TODO: Integrar com fluxo real de autenticação da feature #15
  if (!token || typeof token !== 'string') return false;
  return token.startsWith('Bearer ');
}

module.exports = { validateDashboardToken };
