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
    <div className="min-h-screen bg-[#FAFAFD] flex flex-col md:flex-row">
      
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex md:w-64 bg-white border-r border-[#EBEBEF] flex-col justify-between py-8 px-6 shrink-0 h-screen sticky top-0">
        <div className="space-y-8">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#7C5CFC] to-[#9175FE] flex items-center justify-center text-white font-medium shadow-sm">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-display font-black text-lg tracking-tight text-gray-950 flex items-center">
                EQUINOX<span className="text-[#96969B] font-[400] text-sm ml-0.5 tracking-wider">MAIL</span>
              </span>
            </div>
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-[#F2EFFE] text-[#7C5CFC] font-semibold'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#7C5CFC]' : 'text-gray-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#7C5CFC] flex items-center justify-center text-white text-xs font-bold">
                {(currentUser?.name || currentUser?.email || '?')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{currentUser?.name || 'User'}</p>
                <p className="text-xs text-gray-400 truncate">{currentUser?.email}</p>
              </div>
            </div>
            {currentUser?.role === 'admin' && (
              <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-600 uppercase tracking-wider">Admin</span>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-1.5 px-3 py-2.5 text-xs font-medium text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors border border-dashed border-red-200 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <header className="md:hidden sticky top-0 z-50 bg-white border-b border-[#EBEBEF] px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#7C5CFC] to-[#9175FE] flex items-center justify-center text-white">
            <Mail className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-base tracking-tight text-gray-950">
            EQUINOX<span className="text-[#96969B] font-[400] text-xs ml-0.5 tracking-wider">MAIL</span>
          </span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1 rounded-lg text-gray-500 hover:bg-gray-50"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* MOBILE NAVIGATION */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[53px] bg-white z-40 p-6 flex flex-col justify-between border-t border-[#EBEBEF]">
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    isActive ? 'bg-[#F2EFFE] text-[#7C5CFC]' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#7C5CFC]' : 'text-gray-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
          
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-2xl p-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#7C5CFC] flex items-center justify-center text-white text-xs font-bold">
                  {(currentUser?.name || currentUser?.email || '?')[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{currentUser?.name || 'User'}</p>
                  <p className="text-xs text-gray-400">{currentUser?.email}</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
              className="w-full flex items-center justify-center space-x-1.5 px-3 py-2.5 text-xs font-semibold text-red-500 hover:bg-red-50 rounded-xl border border-dashed border-red-200"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col justify-between min-h-screen">
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          <div style={{ display: activeTab === 'dashboard' ? 'block' : 'none' }}>
            <DashboardTab
              accounts={accounts}
              contacts={contacts}
              campaigns={campaigns}
              onRefreshAll={() => { fetchAccounts(); fetchContacts(); fetchCampaigns(); }}
            />
          </div>

          <div style={{ display: activeTab === 'accounts' ? 'block' : 'none' }}>
            <AccountsTab
              accounts={accounts}
              loading={loadingAccounts}
              onRefresh={fetchAccounts}
              isAdmin={isAdmin()}
            />
          </div>

          <div style={{ display: activeTab === 'contacts' ? 'block' : 'none' }}>
            <ContactsTab
              onRefresh={fetchContacts}
            />
          </div>

          <div style={{ display: activeTab === 'campaigns' ? 'block' : 'none' }}>
            <CampaignsTab
              campaigns={campaigns}
              accounts={accounts}
              contacts={contacts}
              onRefresh={fetchCampaigns}
            />
          </div>

          <div style={{ display: activeTab === 'validator' ? 'block' : 'none' }}>
            <EmailValidationTab
              contacts={contacts}
              onRefreshContacts={fetchContacts}
            />
          </div>

          {currentUser?.role === 'admin' && (
            <div style={{ display: activeTab === 'admin' ? 'block' : 'none' }}>
              <AdminPanel />
            </div>
          )}

        </main>

        <footer className="bg-white border-t border-[#F0F0F3] py-5 text-center text-[11px] text-[#A3A3AF] font-mono mt-12 shrink-0">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
            <span className="font-semibold text-[#7C5CFC]/85 flex items-center justify-center sm:justify-start gap-1">
              <Mail className="w-3 h-3" /> Equinox Mail v2.0
            </span>
            <div className="flex items-center gap-3">
              <span>Multi-Tenant Email Campaign Platform</span>
              <a href="/privacy-policy-and-termsconditions" className="text-[#7C5CFC] hover:underline">Privacy Policy & Terms</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
