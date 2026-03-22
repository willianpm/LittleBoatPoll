export default function GuildChannelSelector({
  guilds,
  guildsLoading,
  selectedGuildId,
  setSelectedGuildId,
  selectedChannelId,
  setSelectedChannelId,
  channels,
}) {
  return (
    <div>
      <h2>Servidor</h2>
      {guildsLoading ? (
        <p>Carregando servidores...</p>
      ) : (
        <>
          <div className="guild-cards">
            {guilds.map((guild) => (
              <button
                key={guild.id}
                type="button"
                className={`guild-card ${selectedGuildId === guild.id ? 'selected' : ''}`}
                onClick={() => setSelectedGuildId(guild.id)}
              >
                {guild.icon ? <img src={guild.icon} alt={guild.name} className="guild-avatar" /> : <span>🛳️</span>}
                <div>
                  <strong>{guild.name}</strong>
                  <p>{guild.isActive ? 'Servidor ativo' : 'Servidor disponível'}</p>
                </div>
              </button>
            ))}
          </div>

          {selectedGuildId && (
            <div className={`channel-selector-row ${!selectedChannelId ? 'channel-required' : ''}`}>
              <label htmlFor="global-channel-select">Canal de publicação</label>
              <select
                id="global-channel-select"
                value={selectedChannelId}
                onChange={(event) => setSelectedChannelId(event.target.value)}
              >
                <option value="">Selecione um canal...</option>
                {channels.map((channel) => (
                  <option key={channel.id} value={channel.id}>
                    #{channel.name}
                  </option>
                ))}
              </select>
              {!selectedChannelId && (
                <p className="channel-hint">⚠️ Selecione um canal antes de executar comandos de slash.</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
