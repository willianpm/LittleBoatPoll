import Sidebar from './Sidebar';

export default function Layout({ currentSection, onNavigate, sidebarConfig, isMobile, children }) {
  return (
    <div className="dashboard-shell">
      <Sidebar currentSection={currentSection} onNavigate={onNavigate} isMobile={isMobile} {...sidebarConfig} />
      <div className="dashboard-main">
        <div className="dashboard-content">{children}</div>
      </div>
    </div>
  );
}
