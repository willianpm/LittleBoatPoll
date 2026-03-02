/**
 * Obtém rascunhos do usuário ordenados por data de edição
 * @param {Map} draftPolls - Mapa de rascunhos (client.draftPolls)
 * @param {string} userId - ID do usuário
 * @returns {Array} Array de rascunhos ordenados
 */
function getUserDrafts(draftPolls, userId) {
  return Array.from(draftPolls.values())
    .filter((draft) => draft.criadorId === userId)
    .sort((a, b) => new Date(b.editadoEm || b.criadoEm) - new Date(a.editadoEm || a.criadoEm));
}

/**
 * Obtém o rascunho mais recente do usuário
 * @param {Map} draftPolls - Mapa de rascunhos
 * @param {string} userId - ID do usuário
 * @returns {Object|null} Rascunho mais recente ou null
 */
function getLatestUserDraft(draftPolls, userId) {
  const drafts = getUserDrafts(draftPolls, userId);
  return drafts.length > 0 ? drafts[0] : null;
}

/**
 * Obtém um rascunho por ID
 * @param {Map} draftPolls - Mapa de rascunhos
 * @param {string} draftId - ID do rascunho
 * @returns {Object|null} Rascunho encontrado ou null
 */
function getDraftById(draftPolls, draftId) {
  return draftPolls.get(draftId) || null;
}

/**
 * Valida se o usuário pode editar um rascunho
 * @param {string} draftCreatorId - ID do criador do rascunho
 * @param {string} userId - ID do usuário tentando editar
 * @param {boolean} isCriador - Se o usuário tem cargo Criador
 * @returns {boolean} true se pode editar
 */
function canEditDraft(draftCreatorId, userId, isCriador) {
  return draftCreatorId === userId || isCriador;
}

module.exports = {
  getUserDrafts,
  getLatestUserDraft,
  getDraftById,
  canEditDraft,
};
