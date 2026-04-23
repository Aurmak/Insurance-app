import { useNavigate, useLocation } from 'react-router';
import { Home, Plus, History, User } from 'lucide-react';

export default function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = sessionStorage.getItem('userRole') || 'policyholder';
  const currentView = new URLSearchParams(location.search).get('view');

  const navItems = role === 'field-agent'
    ? [
        { to: '/dashboard', icon: Home, label: 'Home' },
        { to: '/reports-history?view=agent-info-requests', icon: Plus, label: 'Assess' },
        { to: '/reports-history', icon: History, label: 'Assigned' },
        { to: '/profile', icon: User, label: 'Account' },
      ]
    : [
        { to: '/dashboard', icon: Home, label: 'Home' },
        { to: '/inspection-type', icon: Plus, label: 'New Claim' },
        { to: '/reports-history', icon: History, label: 'Track' },
        { to: '/profile', icon: User, label: 'Account' },
      ];

  const isActive = (to: string) => {
    if (to === '/reports-history?view=agent-info-requests') {
      return location.pathname === '/reports-history' && currentView === 'agent-info-requests';
    }

    if (to === '/reports-history') {
      return (
        (location.pathname === '/reports-history' && currentView !== 'agent-info-requests') ||
        location.pathname.includes('/report/')
      );
    }

    return (
      location.pathname === to ||
      (to === '/inspection-type' &&
        (location.pathname.includes('/inspection') || location.pathname.includes('/vehicle') || location.pathname.includes('/ai-')))
    );
  };

  return (
    <div className="bottom-navigation">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.to);
        return (
          <button
            key={item.to}
            className={`bottom-nav-item ${active ? 'active' : ''}`}
            onClick={() => navigate(item.to)}
          >
            <Icon size={24} />
            <span className="bottom-nav-label">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
