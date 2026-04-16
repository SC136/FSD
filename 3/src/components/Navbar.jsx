function Navbar({ title, onOpenMenu }) {
  return (
    <header className="top-navbar">
      <div className="navbar-left">
        <button type="button" className="menu-button" onClick={onOpenMenu} aria-label="Open navigation menu">
          Menu
        </button>
        <div>
          <p className="eyebrow">Finance Workspace</p>
          <h2>{title}</h2>
        </div>
      </div>

      <div className="navbar-meta">
        <p>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
      </div>
    </header>
  )
}

export default Navbar
