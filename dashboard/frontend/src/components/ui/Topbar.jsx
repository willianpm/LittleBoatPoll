export default function Topbar({ user, onLogout }) {
  return (
    <header className="topbar">
      <div>
        <h1>Little Boat Poll</h1>
        <p role="status">
          Logado como <strong>{user?.username || '---'}</strong>
        </p>
      </div>
      <button className="button secondary" onClick={onLogout} type="button">
        Sair
      </button>
    </header>
  );
}
