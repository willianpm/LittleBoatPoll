export default function CommandPanel({
  command,
  expanded,
  onToggle,
  onSubmit,
  renderCommandForm,
  loading,
  feedback,
  disabled,
  fallbackDescription,
  commandTypeLabel,
  getDisplayCommandLabel,
}) {
  const commandKey = `${command.type}:${command.name}`;
  const displayCommandName = getDisplayCommandLabel(command.name);

  return (
    <div key={commandKey} className={`command-option ${expanded ? 'selected' : ''}`}>
      <button
        type="button"
        className={`command-item ${expanded ? 'selected' : ''} ${disabled ? 'command-item-disabled' : ''}`}
        onClick={() => {
          if (disabled) return;
          onToggle(commandKey);
        }}
        aria-expanded={expanded}
        disabled={disabled}
      >
        <div className="command-item-header">
          <strong>{displayCommandName}</strong>
        </div>
        <span>{command.description || fallbackDescription}</span>
      </button>

      <div className={`command-panel ${expanded ? 'expanded' : ''}`} aria-hidden={!expanded}>
        <div className="command-panel-inner">
          <form onSubmit={(event) => onSubmit(event, command)} className="form-grid command-panel-content">
            <div className="command-meta">
              <strong>{displayCommandName}</strong>
              <span>{commandTypeLabel(command.type)}</span>
            </div>

            {renderCommandForm(command)}

            <button className="button" type="submit" disabled={loading || disabled}>
              {loading ? 'Executando...' : 'Executar comando'}
            </button>
          </form>

          <div className={`status-alert-slot ${feedback ? 'visible' : ''}`}>
            {feedback && (
              <div className={`status-alert ${feedback === 'success' ? 'success' : 'error'}`}>
                {feedback === 'success' ? 'Sucesso' : 'Falhou'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
