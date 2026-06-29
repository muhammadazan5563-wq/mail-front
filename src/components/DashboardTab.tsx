import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle2, AlertCircle, Shuffle, Send, RefreshCw, Layers, Users } from 'lucide-react';
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
      if (res.ok) setGlobalLogs(await res.json());
    } catch (err) {
      console.error('Failed fetching global logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => { fetchGlobalLogs(); }, [campaigns]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    onRefreshAll();
    await fetchGlobalLogs();
    setIsRefreshing(false);
  };

  const totalSent = campaigns.reduce((a, c) => a + (c.successCount||0) + (c.failedCount||0), 0) + globalLogs.length;
  const totalSuccess = campaigns.reduce((a, c) => a + (c.successCount||0), 0) + globalLogs.filter(l => l.status==='success').length;
  const totalFailed  = campaigns.reduce((a, c) => a + (c.failedCount||0), 0)  + globalLogs.filter(l => l.status==='failed').length;
  const successRate  = totalSent > 0 ? Math.round((totalSuccess / totalSent) * 100) : 100;
  const runningCount = campaigns.filter(c => c.status === 'running').length;
  const activeSenders = accounts.filter(a => a.status === 'active').length;
  const totalContacts = contacts.reduce((s, c) => s + (c._count || 1), 0);

  const senderLoads: Record<string, { success: number; failed: number }> = {};
  accounts.forEach(a => { senderLoads[a.email] = { success: 0, failed: 0 }; });
  globalLogs.forEach(log => {
    if (!senderLoads[log.sender]) senderLoads[log.sender] = { success: 0, failed: 0 };
    log.status === 'success' ? senderLoads[log.sender].success++ : senderLoads[log.sender].failed++;
  });
  const sortedSenders = Object.entries(senderLoads).sort((a, b) => (b[1].success + b[1].failed) - (a[1].success + a[1].failed));

  const stats = [
    { label: 'Emails sent',     value: totalSent,      sub: 'All time',              barClass: 'eq-stat-bar' },
    { label: 'Delivery rate',   value: `${successRate}%`, sub: `${totalSuccess} ok · ${totalFailed} failed`, barClass: 'eq-stat-bar-green' },
    { label: 'Active accounts', value: activeSenders,   sub: 'Connected senders',     barClass: 'eq-stat-bar-indigo' },
    { label: 'Contacts',        value: totalContacts.toLocaleString(), sub: 'Across all lists', barClass: 'eq-stat-bar-blue' },
  ];

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-[#1A1825] tracking-tight">Dashboard</h1>
          <p className="text-sm text-[#8F8F9E] mt-0.5">Campaign health and delivery overview</p>
        </div>
        <button onClick={handleManualRefresh} disabled={isRefreshing} className="eq-btn-ghost">
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Syncing…' : 'Refresh'}
        </button>
      </div>

      {/* Stat cards — left-border editorial style */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className={`eq-card p-5 ${s.barClass}`}>
            <p className="text-[11.5px] text-[#8F8F9E] font-medium uppercase tracking-wider mb-2">{s.label}</p>
            <p className="text-[28px] font-semibold text-[#1A1825] leading-none font-mono tracking-tight">{s.value}</p>
            <p className="text-[11.5px] text-[#B0AFBD] mt-1.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Body grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Campaigns + Senders */}
        <div className="lg:col-span-2 space-y-5">

          {/* Campaigns */}
          <div className="eq-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-[#1A1825]">
                <Layers className="w-4 h-4 text-[#7C5CFC]" />
                <span className="font-medium text-[14px]">Campaigns</span>
              </div>
              <span className="eq-badge" style={{background:'#EAE8F5', color:'#7C5CFC'}}>
                {runningCount} running
              </span>
            </div>

            {campaigns.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm text-[#8F8F9E]">No campaigns yet.</p>
                <p className="text-xs text-[#B0AFBD] mt-1">Create one in the Campaigns tab.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {campaigns.map((c) => {
                  const sent  = (c.successCount||0) + (c.failedCount||0);
                  const total = c.totalContacts || 500;
                  const pct   = total > 0 ? Math.round((sent / total) * 100) : 0;
                  return (
                    <div key={c.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3.5 rounded-lg border border-[#ECEAF4] bg-[#FDFCFF] hover:border-[#D8D4F5] transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            c.status==='running' ? 'bg-emerald-500' :
                            c.status==='paused'  ? 'bg-amber-400'  : 'bg-[#D0CFE0]'
                          }`} style={c.status==='running' ? {animation:'pulse 2s infinite'} : {}} />
                          <span className="text-[13.5px] font-medium text-[#1A1825] truncate">{c.name}</span>
                        </div>
                        <p className="text-[11.5px] text-[#B0AFBD] pl-3.5">
                          {c.contactListName}
                        </p>
                      </div>
                      <div className="sm:w-40 space-y-1 shrink-0">
                        <div className="flex justify-between text-[11px] text-[#8F8F9E]">
                          <span>Progress</span>
                          <span className="font-mono text-[#3D3D4A]">{pct}%</span>
                        </div>
                        <div className="eq-progress-track">
                          <div className="eq-progress-fill" style={{width:`${pct}%`}} />
                        </div>
                      </div>
                      <div className="flex gap-3 text-[12px] font-mono shrink-0">
                        <span className="text-emerald-600">✓ {c.successCount||0}</span>
                        <span className="text-red-400">✗ {c.failedCount||0}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Senders */}
          <div className="eq-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Shuffle className="w-4 h-4 text-[#7C5CFC]" />
                <span className="font-medium text-[14px] text-[#1A1825]">Sender accounts</span>
              </div>
              <span className="text-[11.5px] text-[#B0AFBD]">Round-robin</span>
            </div>

            {accounts.length === 0 ? (
              <p className="text-sm text-[#8F8F9E] text-center py-6">No Gmail accounts connected.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {sortedSenders.map(([email, load]) => {
                  const used = load.success + load.failed;
                  return (
                    <div key={email} className="p-3 rounded-lg border border-[#ECEAF4] bg-[#FDFCFF] hover:border-[#D8D4F5] transition-colors">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[12.5px] font-medium text-[#1A1825] truncate" title={email}>{email}</span>
                        <span className="eq-badge shrink-0" style={{background:'#ECFDF5', color:'#059669', fontSize:'10px'}}>Active</span>
                      </div>
                      <div className="flex items-center gap-3 text-[11.5px] font-mono">
                        <span className="text-[#8F8F9E]">{used} sent</span>
                        <span className="text-emerald-600">✓{load.success}</span>
                        <span className="text-red-400">✗{load.failed}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Live log */}
        <div className="eq-card flex flex-col" style={{height:'520px'}}>
          <div className="flex items-center justify-between p-5 border-b border-[#ECEAF4]">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#7C5CFC]" />
              <span className="font-medium text-[14px] text-[#1A1825]">Live log</span>
            </div>
            <span className="eq-dot-live" />
          </div>

          <div className="flex-1 overflow-hidden p-4">
            {loadingLogs ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-4 h-4 border-2 border-[#7C5CFC]/20 border-t-[#7C5CFC] rounded-full animate-spin" />
              </div>
            ) : globalLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-1.5">
                <p className="text-sm text-[#8F8F9E]">No activity yet.</p>
                <p className="text-xs text-[#B0AFBD] text-center max-w-[150px]">Sent emails appear here in real time.</p>
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto h-full pr-0.5">
                {globalLogs.slice(0, 20).map((log) => (
                  <div key={log.id} className="eq-log-entry p-3 rounded-lg border border-[#ECEAF4] bg-[#FDFCFF] space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[12.5px] font-medium text-[#1A1825] block truncate">{log.recipient}</span>
                        <span className="text-[11px] text-[#B0AFBD] block truncate">via {log.sender}</span>
                      </div>
                      {log.status === 'success' ? (
                        <span className="eq-badge shrink-0" style={{background:'#ECFDF5', color:'#059669', fontSize:'10px', gap:'3px'}}>
                          <CheckCircle2 className="w-2.5 h-2.5" /> Sent
                        </span>
                      ) : (
                        <span className="eq-badge shrink-0" style={{background:'#FEF2F2', color:'#DC2626', fontSize:'10px', gap:'3px'}} title={log.errorMessage}>
                          <AlertCircle className="w-2.5 h-2.5" /> Error
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#8F8F9E] truncate">"{log.subject}"</p>
                    {log.errorMessage && (
                      <p className="text-[10px] text-red-400 font-mono bg-red-50 rounded p-1.5 leading-snug">{log.errorMessage}</p>
                    )}
                    <p className="text-right text-[10px] font-mono text-[#C4C3D0]">
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
