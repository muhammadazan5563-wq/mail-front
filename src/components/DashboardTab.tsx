import React, { useState, useEffect } from 'react';
import { 
  Users, Layers, Activity, CheckCircle2, 
  AlertCircle, Shuffle, Send, RefreshCw
} from 'lucide-react';
import { Campaign, GmailAccount, Contact, CampaignLog } from '../types';
import { api } from '../api';

interface DashboardTabProps {
  accounts: GmailAccount[];
  contacts: Contact[];
  campaigns: Campaign[];
  onRefreshAll: () => void;
}

export default function DashboardTab({ accounts, contacts, campaigns, onRefreshAll }: DashboardTabProps) {
  const [globalLogs, setGlobalLogs] = useState<CampaignLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchGlobalLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await api('/api/global-logs');
      if (res.ok) {
        const data = await res.json();
        setGlobalLogs(data);
      }
    } catch (err) {
      console.error('Failed fetching global logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchGlobalLogs();
  }, [campaigns]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    onRefreshAll();
    await fetchGlobalLogs();
    setIsRefreshing(false);
  };

  const totalEmailsSent = campaigns.reduce((acc, curr) => acc + (curr.successCount || 0) + (curr.failedCount || 0), 0) +
                         globalLogs.length;
  const totalSuccess = campaigns.reduce((acc, curr) => acc + (curr.successCount || 0), 0) + 
                       globalLogs.filter(l => l.status === 'success').length;
  const totalFailed = campaigns.reduce((acc, curr) => acc + (curr.failedCount || 0), 0) + 
                      globalLogs.filter(l => l.status === 'failed').length;

  const successRate = totalEmailsSent > 0 
    ? Math.round((totalSuccess / totalEmailsSent) * 100) 
    : 100;

  const runningCampaignsCount = campaigns.filter(c => c.status === 'running').length;
  const activeSendersCount = accounts.filter(a => a.status === 'active').length;

  const senderLoads: Record<string, { success: number; failed: number }> = {};
  accounts.forEach(a => {
    senderLoads[a.email] = { success: 0, failed: 0 };
  });
  globalLogs.forEach(log => {
    if (!senderLoads[log.sender]) {
      senderLoads[log.sender] = { success: 0, failed: 0 };
    }
    if (log.status === 'success') {
      senderLoads[log.sender].success += 1;
    } else {
      senderLoads[log.sender].failed += 1;
    }
  });

  const sortedSenderLoads = Object.entries(senderLoads).sort(
    (a, b) => (b[1].success + b[1].failed) - (a[1].success + a[1].failed)
  );

  return (
    <div className="space-y-8">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-[#0F0F10]">
            Dashboard
          </h2>
          <p className="text-sm text-[#9999A6] mt-1">
            Campaign health, delivery stats, and sender activity.
          </p>
        </div>
        
        <button
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="bg-white hover:bg-[#F7F7F8] border border-[#E8E8EC] text-[#3A3A44] text-xs font-semibold px-4 py-2.5 rounded-full transition-all inline-flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50 self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white border border-[#E8E8EC] rounded-lg p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-[#F2EFFE] flex items-center justify-center text-[#7C5CFC] shrink-0">
            <Send className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-[10px] font-semibold tracking-widest text-[#9999A6] uppercase">Emails Sent</p>
            <h3 className="text-2xl font-bold text-[#0F0F10] tracking-tight leading-none mt-0.5">{totalEmailsSent}</h3>
            <p className="text-[10px] text-[#9999A6] mt-0.5">All time total</p>
          </div>
        </div>

        <div className="bg-white border border-[#E8E8EC] rounded-lg p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <Activity className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-[10px] font-semibold tracking-widest text-[#9999A6] uppercase">Delivery Rate</p>
            <h3 className="text-2xl font-bold text-[#0F0F10] tracking-tight leading-none mt-0.5">{successRate}%</h3>
            <p className="text-[10px] text-[#9999A6] mt-0.5">{totalSuccess} sent · {totalFailed} failed</p>
          </div>
        </div>

        <div className="bg-white border border-[#E8E8EC] rounded-lg p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0">
            <Shuffle className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-[10px] font-semibold tracking-widest text-[#9999A6] uppercase">Active Accounts</p>
            <h3 className="text-2xl font-bold text-[#0F0F10] tracking-tight leading-none mt-0.5">{activeSendersCount}</h3>
            <p className="text-[10px] text-[#9999A6] mt-0.5">Connected senders</p>
          </div>
        </div>

        <div className="bg-white border border-[#E8E8EC] rounded-lg p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
            <Users className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-[10px] font-semibold tracking-widest text-[#9999A6] uppercase">Total Contacts</p>
            <h3 className="text-2xl font-bold text-[#0F0F10] tracking-tight leading-none mt-0.5">{contacts.reduce((sum, c) => sum + (c._count || 1), 0)}</h3>
            <p className="text-[10px] text-[#9999A6] mt-0.5">Across all lists</p>
          </div>
        </div>

      </div>

      {/* MAIN CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        <div className="lg:col-span-2 space-y-6">
          
          {/* CAMPAIGNS */}
          <div className="bg-white border border-[#E8E8EC] rounded-lg p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-[#0F0F10] text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#7C5CFC]" /> Campaigns
              </h3>
              <span className="text-xs bg-[#F2EFFE] text-[#7C5CFC] font-semibold px-2.5 py-1 rounded-full">
                {runningCampaignsCount} running
              </span>
            </div>

            <div className="border-t border-[#EBEBEF]" />

            {campaigns.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-[#9999A6]">No campaigns yet.</p>
                <p className="text-xs text-[#9999A6] mt-1">Create a campaign to see activity here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {campaigns.map((c) => {
                  const sent = (c.successCount || 0) + (c.failedCount || 0);
                  const total = c.totalContacts || 500;
                  const percent = total > 0 ? Math.round((sent / total) * 100) : 0;
                  
                  return (
                    <div key={c.id} className="border border-[#EBEBEF] bg-[#FAFAFD] rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${
                            c.status === 'running' ? 'bg-emerald-500 animate-pulse' :
                            c.status === 'paused' ? 'bg-amber-500' : 'bg-gray-300'
                          }`} />
                          <h4 className="font-semibold text-[#0F0F10] text-sm truncate">{c.name}</h4>
                        </div>
                        <p className="text-[11px] text-[#9999A6]">
                          List: <span className="font-medium text-[#6B6B78]">{c.contactListName}</span>
                        </p>
                      </div>

                      <div className="flex-1 max-w-xs md:mx-4 space-y-1">
                        <div className="flex justify-between text-[10px] text-[#9999A6]">
                          <span>Progress</span>
                          <span className="font-semibold text-[#3A3A44]">{percent}% ({sent}/{total})</span>
                        </div>
                        <div className="w-full h-1.5 bg-[#F0F0F3] rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[#7C5CFC] to-[#9175FE] rounded-full" style={{ width: `${percent}%` }} />
                        </div>
                      </div>

                      <div className="flex items-center text-xs gap-3 shrink-0">
                        <span className="text-emerald-600 font-semibold">✓ {c.successCount || 0}</span>
                        <span className="text-red-400 font-semibold">✗ {c.failedCount || 0}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SENDER LOADS */}
          <div className="bg-white border border-[#E8E8EC] rounded-lg p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-[#0F0F10] text-sm flex items-center gap-2">
                <Shuffle className="w-4 h-4 text-[#7C5CFC]" /> Sender Accounts
              </h3>
              <p className="text-[10px] text-[#9999A6]">Round-robin rotation</p>
            </div>

            <div className="border-t border-[#EBEBEF]" />

            {accounts.length === 0 ? (
              <p className="text-sm text-[#9999A6] text-center py-6">No Gmail accounts connected yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sortedSenderLoads.map(([email, load]) => {
                  const totalUsed = load.success + load.failed;
                  return (
                    <div key={email} className="bg-[#FAFAFD] border border-[#EBEBEF] rounded-lg p-3.5 space-y-2 hover:border-gray-200 transition-all">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-[#1A1A20] truncate max-w-[140px]" title={email}>{email}</span>
                        <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 tracking-wider">
                          Active
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-[#6B6B78]">
                        <span className="font-medium text-[#3A3A44]">{totalUsed} sent</span>
                        <span className="text-emerald-600">✓ {load.success}</span>
                        <span className="text-red-400">✗ {load.failed}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* LIVE LOG */}
        <div className="bg-white border border-[#E8E8EC] rounded-lg p-6 space-y-4 h-[520px] flex flex-col">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-[#0F0F10] text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#7C5CFC]" /> Live Log
            </h3>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>

          <div className="border-t border-[#EBEBEF]" />

          <div className="flex-1 overflow-hidden">
            {loadingLogs ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-5 h-5 border-2 border-[#7C5CFC]/20 border-t-[#7C5CFC] rounded-full animate-spin" />
              </div>
            ) : globalLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-2">
                <p className="text-sm text-[#9999A6]">No activity yet.</p>
                <p className="text-xs text-[#C4C4CE] max-w-[160px]">Sent emails will appear here in real time.</p>
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto h-full pr-1">
                {globalLogs.slice(0, 20).map((log) => (
                  <div 
                    key={log.id} 
                    className="p-3 border border-[#EBEBEF] bg-[#FAFAFD] rounded-lg text-[11px] space-y-1"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <span className="font-semibold text-[#0F0F10] block truncate">{log.recipient}</span>
                        <span className="text-[9px] text-[#9999A6] block truncate">via {log.sender}</span>
                      </div>
                      
                      {log.status === 'success' ? (
                        <span className="text-emerald-600 bg-emerald-50 border border-emerald-100 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Sent
                        </span>
                      ) : (
                        <span className="text-red-500 bg-red-50 border border-red-100 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0" title={log.errorMessage}>
                          <AlertCircle className="w-2.5 h-2.5" /> Error
                        </span>
                      )}
                    </div>
                    
                    <p className="text-[#9999A6] truncate text-[10px]">"{log.subject}"</p>
                    {log.errorMessage && (
                      <p className="text-red-400 text-[9px] font-mono bg-red-50 p-1.5 rounded leading-tight">
                        {log.errorMessage}
                      </p>
                    )}
                    <p className="text-right text-[9px] text-[#C4C4CE]">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
