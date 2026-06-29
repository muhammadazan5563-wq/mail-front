import React, { useEffect, useState } from 'react';
import { api, isAuthenticated, isAdmin, getStoredUser, authApi, AuthUser } from './api';
import AuthPage from './components/AuthPage';
import AccountsTab from './components/AccountsTab';
import ContactsTab from './components/ContactsTab';
import CampaignsTab from './components/CampaignsTab';
import DashboardTab from './components/DashboardTab';
import EmailValidationTab from './components/EmailValidationTab';
import AdminPanel from './components/AdminPanel';
import { GmailAccount, Contact, Campaign } from './types';
import { Mail, Users, Layers, RefreshCw, Menu, X, LayoutDashboard, ShieldCheck, Shield, LogOut } from 'lucide-react';

export default function App() {
  const [authenticated, setAuthenticated] = useState(isAuthenticated());
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(getStoredUser());
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [accounts, setAccounts] = useState<GmailAccount[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);

  useEffect(() => {
    const handleLogout = () => {
      setAuthenticated(false);
      setCurrentUser(null);
      setActiveTab('dashboard');
    };
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  const fetchAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const res = await api('/api/accounts');
      if (res.ok) setAccounts(await res.json());
    } catch (err) {
      console.error('Failed fetching Gmail accounts:', err);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const fetchContacts = async () => {
    setLoadingContacts(true);
    try {
      // Only fetch lightweight list summaries for Dashboard/Campaigns/Validator tabs
      // The ContactsTab handles its own paginated fetching internally
      const res = await api('/api/contacts/lists');
      if (res.ok) {
        const lists: { listName: string; count: number }[] = await res.json();
        // Build minimal contact-like objects for components that only need list names + counts
        // This avoids loading 50K+ contacts into memory
        const summaryContacts: Contact[] = lists.map((l, idx) => ({
          id: `summary-${idx}`,
          email: '',
          name: l.listName,
          listName: l.listName,
          _count: l.count,
        } as Contact));
        setContacts(summaryContacts);
      }
    } catch (err) {
      console.error('Failed fetching contacts:', err);
    } finally {
      setLoadingContacts(false);
    }
  };

  const fetchCampaigns = async () => {
    setLoadingCampaigns(true);
    try {
      const res = await api('/api/campaigns');
      if (res.ok) setCampaigns(await res.json());
    } catch (err) {
      console.error('Failed fetching campaigns:', err);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  useEffect(() => {
    if (authenticated) {
      fetchAccounts();
      fetchContacts();
      fetchCampaigns();
    }
  }, [authenticated]);

  useEffect(() => {
    const hasRunningCampaign = campaigns.some(c => c.status === 'running');
    if (!hasRunningCampaign) return;
    const interval = setInterval(() => { fetchCampaigns(); }, 4000);
    return () => clearInterval(interval);
  }, [campaigns]);

  const handleAuthSuccess = () => {
    setAuthenticated(true);
    setCurrentUser(getStoredUser());
  };

  const handleLogout = () => {
    authApi.logout();
    setAuthenticated(false);
    setCurrentUser(null);
    setAccounts([]);
    setContacts([]);
    setCampaigns([]);
  };

  // Refetch relevant data whenever the active tab changes
  useEffect(() => {
    if (!authenticated) return;
    // Fetch fresh data for the tab being switched to
    if (activeTab === 'accounts') fetchAccounts();
    if (activeTab === 'contacts' || activeTab === 'validator') fetchContacts();
    if (activeTab === 'campaigns' || activeTab === 'dashboard') {
      fetchCampaigns();
      fetchContacts(); // Campaigns needs fresh contact lists for dropdowns
    }
  }, [activeTab, authenticated]);

  if (!authenticated) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'campaigns', label: 'Campaigns', icon: Layers },
    { id: 'contacts', label: 'Contacts', icon: Users },
    { id: 'accounts', label: 'Accounts', icon: Mail },
    { id: 'validator', label: 'Email Validator', icon: ShieldCheck },
    ...(currentUser?.role === 'admin' ? [{ id: 'admin', label: 'Admin Panel', icon: Shield }] : []),
  ];

  return (
    <div className="min-h-screen bg-[#F5F4F8] flex flex-col md:flex-row">

      {/* ── DESKTOP SIDEBAR ─────────────────────────────── */}
      <aside className="hidden md:flex md:w-52 bg-white border-r border-[#ECEAF4] flex-col justify-between py-6 shrink-0 h-screen sticky top-0 overflow-hidden">

        {/* Logo */}
        <div className="space-y-6">
          <div className="flex items-center gap-2.5 px-5">
            <div className="w-7 h-7 rounded-lg eq-brand-gradient flex items-center justify-center shadow-sm" style={{boxShadow:'0 2px 8px rgba(124,92,252,0.35)'}}>
              <Mail className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-[14.5px] font-semibold text-[#1A1825] tracking-tight">
              Equinox<span className="text-[#7C5CFC]">Mail</span>
            </span>
          </div>

          {/* Nav */}
          <nav className="flex flex-col">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-2.5 pl-5 pr-4 py-2.5 text-[13.5px] font-medium transition-all cursor-pointer text-left ${
                    isActive ? 'eq-nav-active' : 'eq-nav-inactive'
                  }`}
                  style={isActive ? {borderLeftColor:'#7C5CFC'} : {}}
                >
                  <Icon className={`w-[15px] h-[15px] shrink-0 ${isActive ? 'text-[#7C5CFC]' : 'text-[#B0AFBD]'}`} />
                  <span className={isActive ? 'text-[#7C5CFC]' : ''}>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User */}
        <div className="px-4 space-y-2">
          {currentUser?.role === 'admin' && (
            <span className="eq-badge bg-[#EAE8F5] text-[#7C5CFC] text-[10px] mb-1">Admin</span>
          )}
          <div className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-[#F5F4F8] transition-colors">
            <div className="w-6 h-6 rounded-full eq-brand-gradient flex items-center justify-center text-white text-[10px] font-semibold shrink-0">
              {(currentUser?.name || currentUser?.email || '?')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12.5px] font-medium text-[#1A1825] truncate leading-tight">{currentUser?.name || 'User'}</p>
              <p className="text-[11px] text-[#B0AFBD] truncate">{currentUser?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-1.5 py-2 text-[12px] text-[#B0AFBD] hover:text-red-400 transition-colors cursor-pointer rounded-lg hover:bg-red-50"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* ── MOBILE HEADER ──────────────────────────────── */}
      <header className="md:hidden sticky top-0 z-50 bg-white border-b border-[#ECEAF4] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md eq-brand-gradient flex items-center justify-center">
            <Mail className="w-3 h-3 text-white" />
          </div>
          <span className="text-[13.5px] font-semibold text-[#1A1825]">
            Equinox<span className="text-[#7C5CFC]">Mail</span>
          </span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-1.5 rounded-lg text-[#8F8F9E] hover:bg-[#F5F4F8]">
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* ── MOBILE NAV ─────────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[49px] bg-white z-40 p-5 flex flex-col justify-between border-t border-[#ECEAF4]">
          <nav className="flex flex-col">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all ${
                    isActive ? 'eq-nav-active' : 'eq-nav-inactive'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#7C5CFC]' : 'text-[#B0AFBD]'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
          <div className="space-y-2 px-1">
            <div className="flex items-center gap-2.5 p-3 bg-[#F5F4F8] rounded-xl">
              <div className="w-7 h-7 rounded-full eq-brand-gradient flex items-center justify-center text-white text-[11px] font-semibold">
                {(currentUser?.name || currentUser?.email || '?')[0].toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-[#1A1825]">{currentUser?.name || 'User'}</p>
                <p className="text-xs text-[#B0AFBD]">{currentUser?.email}</p>
              </div>
            </div>
            <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs text-[#B0AFBD] hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors">
              <LogOut className="w-3.5 h-3.5" /><span>Sign out</span>
            </button>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT ───────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen">
        <main className="flex-1 w-full max-w-6xl mx-auto px-5 sm:px-8 py-8">

          <div style={{ display: activeTab === 'dashboard' ? 'block' : 'none' }}>
            <DashboardTab accounts={accounts} contacts={contacts} campaigns={campaigns} onRefreshAll={() => { fetchAccounts(); fetchContacts(); fetchCampaigns(); }} />
          </div>
          <div style={{ display: activeTab === 'accounts' ? 'block' : 'none' }}>
            <AccountsTab accounts={accounts} loading={loadingAccounts} onRefresh={fetchAccounts} isAdmin={isAdmin()} />
          </div>
          <div style={{ display: activeTab === 'contacts' ? 'block' : 'none' }}>
            <ContactsTab onRefresh={fetchContacts} />
          </div>
          <div style={{ display: activeTab === 'campaigns' ? 'block' : 'none' }}>
            <CampaignsTab campaigns={campaigns} accounts={accounts} contacts={contacts} onRefresh={fetchCampaigns} />
          </div>
          <div style={{ display: activeTab === 'validator' ? 'block' : 'none' }}>
            <EmailValidationTab contacts={contacts} onRefreshContacts={fetchContacts} />
          </div>
          {currentUser?.role === 'admin' && (
            <div style={{ display: activeTab === 'admin' ? 'block' : 'none' }}>
              <AdminPanel />
            </div>
          )}

        </main>

        <footer className="border-t border-[#ECEAF4] py-4 px-8 mt-8">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <span className="text-[11px] text-[#B0AFBD]">Equinox Mail</span>
            <a href="/privacy-policy-and-termsconditions" className="text-[11px] text-[#B0AFBD] hover:text-[#7C5CFC] transition-colors">Privacy & Terms</a>
          </div>
        </footer>
      </div>
    </div>
  );
}
