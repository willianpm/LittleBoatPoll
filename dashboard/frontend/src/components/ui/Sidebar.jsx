const items = [
  { key: 'painel', label: 'Painel' },
  { key: 'comandos', label: 'Comandos' },
  { key: 'importacao', label: 'Importação CSV' },
];

export default function Sidebar({
  currentSection,
  onNavigate,
  guilds = [],
  guildsLoading = false,
  selectedGuildId,
  setSelectedGuildId,
  channels = [],
  channelsLoading = false,
  selectedChannelId,
  setSelectedChannelId,
  isMobile = false,
}) {
  return (
    <aside className={`sidebar ${isMobile ? 'mobile' : ''}`}>
      <h2 className="sidebar-title">Little Boat Poll</h2>
      <nav aria-label="Menu principal">
        <ul className="sidebar-list">
          {items.map((item) => (
            <li key={item.key}>
              <button
                type="button"
                className={`sidebar-item ${currentSection === item.key ? 'active' : ''}`}
                onClick={() => onNavigate(item.key)}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {!isMobile && (
        <section className="sidebar-server-channel">
          <h3>Servidor e Canal</h3>
          {guildsLoading ? (
            <p>Carregando...</p>
          ) : (
            <>
              <label htmlFor="sidebar-guild-select">Servidor</label>
              <select
                id="sidebar-guild-select"
                value={selectedGuildId || ''}
                onChange={(event) => setSelectedGuildId(event.target.value)}
              >
                <option value="">Escolha um servidor</option>
                {guilds.map((guild) => (
                  <option key={guild.id} value={guild.id}>
                    {guild.name}
                  </option>
                ))}
              </select>

              <select
                id="sidebar-channel-select"
                aria-label="Canal"
                value={selectedChannelId || ''}
                onChange={(event) => setSelectedChannelId(event.target.value)}
                disabled={!selectedGuildId || channelsLoading}
              >
                <option value="" disabled>
                  {selectedGuildId
                    ? channelsLoading
                      ? 'Carregando canais...'
                      : 'Escolha um canal'
                    : 'Escolha um servidor'}
                </option>
                {!channelsLoading &&
                  channels.map((channel) => (
                    <option key={channel.id} value={channel.id}>
                      #{channel.name}
                    </option>
                  ))}
              </select>
            </>
          )}

          {(!selectedGuildId || !selectedChannelId) && (
            <div className="sidebar-warning">Selecione um servidor e canal</div>
          )}
        </section>
      )}
    </aside>
  );
}
