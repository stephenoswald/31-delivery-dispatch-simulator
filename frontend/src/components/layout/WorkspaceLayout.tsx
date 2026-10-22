import { useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  MapPin,
  Users,
  Bike,
  ChartNoAxesCombined,
  FileText,
  MessageSquare,
  Plus,
  History,
  LogOut,
  Search,
  ChevronDown,
  Menu,
  X,
  UserRound,
  CalendarDays,
  MoreHorizontal,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Avatar, Brand } from '../ui';
import type { Role } from '../../types/user';
const nav = {
  admin: [
    ['Dashboard', '', LayoutDashboard],
    ['Orders', 'orders', Package],
    ['Tracking', 'tracking', MapPin],
    ['Riders', 'riders', Bike],
    ['Customers', 'customers', Users],
    ['Reviews', 'reviews', MessageSquare],
    ['Support tickets', 'support', MessageSquare],
    ['Analytics', 'analytics', ChartNoAxesCombined],
    ['Reports', 'reports', FileText],
  ],
  customer: [
    ['Home', '', LayoutDashboard],
    ['New delivery', 'new', Plus],
    ['Support', 'support', MessageSquare],
    ['My deliveries', 'orders', Package],
    ['History', 'history', History],
    ['Profile', 'profile', UserRound],
  ],
  rider: [
    ['Dashboard', '', LayoutDashboard],
    ['Nearby requests', 'requests', Package],
    ['Active delivery', 'active', MapPin],
    ['History', 'history', History],
    ['Profile', 'profile', UserRound],
  ],
} as const;
export function WorkspaceLayout({ role }: { role: Role }) {
  const { user, logout } = useAuth();
  const [search, setSearch] = useState('');
  const menu = useRef<HTMLDialogElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const current =
    nav[role].find((n) => location.pathname === `/${role}${n[1] ? '/' + n[1] : ''}`)?.[0] ??
    (location.pathname.includes('/profile') ? 'Profile' : 'Delivery details');
  const close = () => menu.current?.close();
  function signOut() {
    close();
    logout();
  }
  const links = nav[role].map(([label, path, Icon]) => (
    <NavLink
      key={path}
      to={`/${role}${path ? '/' + path : ''}`}
      end={!path}
      onClick={close}
      className={({ isActive }) => `nav-link ${isActive ? 'nav-active' : ''}`}
    >
      <Icon size={19} />
      <span>{label}</span>
    </NavLink>
  ));
  return (
    <div className="workspace">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <aside className="sidebar">
        <Link to={`/${role}`} className="sidebar-brand">
          <Brand />
        </Link>
        <div className="workspace-label">
          {role === 'admin' ? 'OPERATIONS' : role === 'rider' ? 'RIDER PORTAL' : 'CUSTOMER PORTAL'}
        </div>
        <nav aria-label="Main navigation">{links}</nav>
        <div className="sidebar-bottom">
          <div className="zone-card">
            <MapPin size={19} />
            <div>
              <span>DELIVERY ZONE</span>
              <strong>Port Harcourt</strong>
            </div>
            <i />
          </div>
          <Link className="sidebar-user" to={`/${role}/profile`}>
            <Avatar name={user!.full_name} />
            <span>
              <strong>{user!.full_name}</strong>
              <small>
                {role === 'admin'
                  ? 'Administrator'
                  : role === 'rider'
                    ? 'Delivery partner'
                    : 'Customer'}
              </small>
            </span>
          </Link>
          <button className="logout" onClick={signOut}>
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>
      <div className="workspace-main">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu"
              aria-label="Open navigation"
              onClick={() => menu.current?.showModal()}
            >
              <Menu size={22} />
            </button>
            <Link className="mobile-brand" to={`/${role}`}>
              <Brand />
            </Link>
            <span className="breadcrumb">
              Workspace <span>/</span>
              <strong>{current}</strong>
            </span>
          </div>
          <form
            className="global-search"
            onSubmit={(e) => {
              e.preventDefault();
              navigate(
                `/${role}/${role === 'rider' ? 'history' : 'orders'}?q=${encodeURIComponent(search)}`,
              );
              setSearch('');
            }}
          >
            <Search size={17} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search deliveries"
              placeholder="Search deliveries…"
            />
            <kbd>↵</kbd>
          </form>
          <div className="topbar-right">
            <span className="date-pill">
              <CalendarDays size={15} />
              {new Date().toLocaleDateString('en-GB', {
                timeZone: 'Africa/Lagos',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
            <details className="account-menu">
              <summary aria-label="Account menu">
                <Avatar name={user!.full_name} />
                <span>{user!.full_name}</span>
                <ChevronDown size={14} />
              </summary>
              <div>
                <Link to={`/${role}/profile`}>
                  <UserRound size={16} />
                  My profile
                </Link>
                <button onClick={signOut}>
                  <LogOut size={16} />
                  Sign out
                </button>
              </div>
            </details>
          </div>
        </header>
        <main id="main-content" className="page-content" tabIndex={-1} key={location.pathname}>
          <Outlet />
        </main>
        <footer className="workspace-footer">
          <span>© {new Date().getFullYear()} SwiftDispatch</span>
          <span>
            <i />
            Simulated locations · Port Harcourt
          </span>
        </footer>
      </div>
      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        {nav[role].slice(0, role === 'admin' ? 4 : 5).map(([label, path, Icon]) => (
          <NavLink
            key={path}
            to={`/${role}${path ? '/' + path : ''}`}
            end={!path}
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            <Icon size={20} />
            <span>
              {label === 'Nearby requests'
                ? 'Requests'
                : label === 'Active delivery'
                  ? 'Active'
                  : label === 'My deliveries'
                    ? 'Deliveries'
                    : label === 'New delivery'
                      ? 'New'
                      : label}
            </span>
          </NavLink>
        ))}
        {role === 'admin' && (
          <button onClick={() => menu.current?.showModal()}>
            <MoreHorizontal size={21} />
            <span>More</span>
          </button>
        )}
      </nav>
      <dialog ref={menu} className="mobile-nav-dialog" aria-labelledby="nav-title">
        <div className="mobile-nav-heading">
          <h2 id="nav-title">Your workspace</h2>
          <button aria-label="Close navigation" onClick={close}>
            <X size={22} />
          </button>
        </div>
        <nav aria-label="More navigation">
          {links}
          <Link className="nav-link" to={`/${role}/profile`} onClick={close}>
            <UserRound size={19} />
            My profile
          </Link>
          <button className="nav-link logout" onClick={signOut}>
            <LogOut size={19} />
            Sign out
          </button>
        </nav>
      </dialog>
    </div>
  );
}
