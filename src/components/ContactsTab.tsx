import React, { useState, useEffect, useCallback } from 'react';
import { Users, Upload, Plus, Trash2, FileSpreadsheet, Check, CheckCircle2, AlertTriangle, ChevronRight, LayoutList, Mail, Edit2, X, Loader2 } from 'lucide-react';
import { Contact } from '../types';
import { api } from '../api';

interface ContactsTabProps {
  onRefresh?: () => void;
}

interface ListSummary {
  listName: string;
  count: number;
}

export default function ContactsTab({ onRefresh }: ContactsTabProps) {
  // Navigation & list states
  const [selectedList, setSelectedList] = useState<string | null>(null);
  const [newListName, setNewListName] = useState('');
  const [newContactName, setNewContactName] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');

  // Editing contact states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editFirstName, setEditFirstName] = useState('');

  // Dynamic column mapping states
  const [parsingFile, setParsingFile] = useState<boolean>(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  // Store only preview rows (first 5) for display — full data kept as raw text ref
  const [csvPreviewRows, setCsvPreviewRows] = useState<string[][]>([]);
  const [csvTotalRowCount, setCsvTotalRowCount] = useState<number>(0);
  const [csvRawText, setCsvRawText] = useState<string>('');
  const [showMappingPanel, setShowMappingPanel] = useState<boolean>(false);
  const [mappingEmailIdx, setMappingEmailIdx] = useState<number>(-1);
  const [mappingNameIdx, setMappingNameIdx] = useState<number>(-1);
  const [mappingFirstNameIdx, setMappingFirstNameIdx] = useState<number>(-1);
  const [mappingCompanyIdx, setMappingCompanyIdx] = useState<number>(-1);
  const [includeAllColumnsAsVars, setIncludeAllColumnsAsVars] = useState<boolean>(true);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  // CSV Drag and drop states
  const [dragActive, setDragActive] = useState(false);
  const [csvUploadSuccess, setCsvUploadSuccess] = useState<string | null>(null);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [selectedUploadList, setSelectedUploadList] = useState('');
  const [customListName, setCustomListName] = useState('');

  // Server-side pagination state
  const PAGE_SIZE = 500;
  const [currentPage, setCurrentPage] = useState(1);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [totalContacts, setTotalContacts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingContacts, setLoadingContacts] = useState(false);

  // List summary (lightweight — just names + counts)
  const [listSummaries, setListSummaries] = useState<ListSummary[]>([]);

  // Fetch list summaries from server
  const fetchListSummaries = useCallback(async () => {
    try {
      const res = await api('/api/contacts/lists');
      if (res.ok) {
        const data = await res.json();
        setListSummaries(data);
      }
    } catch (err) {
      console.error('Failed to fetch list summaries:', err);
    }
  }, []);

  // Fetch paginated contacts for the selected list
  const fetchPaginatedContacts = useCallback(async () => {
    if (!selectedList) {
      setContacts([]);
      setTotalContacts(0);
      setTotalPages(1);
      return;
    }
    setLoadingContacts(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(PAGE_SIZE),
        listName: selectedList,
      });
      const res = await api(`/api/contacts?${params}`);
      if (res.ok) {
        const data = await res.json();
        setContacts(data.contacts || []);
        setTotalContacts(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch contacts:', err);
    } finally {
      setLoadingContacts(false);
    }
  }, [selectedList, currentPage]);

  // Load list summaries on mount
  useEffect(() => {
    fetchListSummaries();
  }, [fetchListSummaries]);

  // Fetch contacts when list or page changes
  useEffect(() => {
    fetchPaginatedContacts();
  }, [fetchPaginatedContacts]);

  const listKeys = listSummaries.map(l => l.listName);
  const getListCount = (name: string) => listSummaries.find(l => l.listName === name)?.count || 0;

  // Create empty List
  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    const listNameClean = newListName.trim();
    if (!listNameClean) return;

    if (listSummaries.some(l => l.listName === listNameClean)) {
      alert('A contact list with this name already exists.');
      return;
    }

    setSelectedList(listNameClean);
    setCurrentPage(1);
    setNewListName('');
  };

  // Delete entire List
  const handleDeleteList = async (listName: string) => {
    const count = getListCount(listName);
    const confirmed = window.confirm(`Are you sure you want to delete the ENTIRE contact list "${listName}"? This will delete ${count} contact(s).`);
    if (!confirmed) return;

    try {
      const res = await api(`/api/contacts/${encodeURIComponent(listName)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchListSummaries();
        if (selectedList === listName) {
          setSelectedList(null);
          setCurrentPage(1);
          setContacts([]);
          setTotalContacts(0);
          setTotalPages(1);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add Single contact to list
  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedList) {
      alert('Please select or create a contact list first.');
      return;
    }

    const email = newContactEmail.trim();
    const name = newContactName.trim();

    if (!email) {
      alert('Email address is required.');
      return;
    }

    // Basic email validation
    if (!/\S+@\S+\.\S+/.test(email)) {
      alert('Invalid email address format.');
      return;
    }

    try {
      const res = await api('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name,
          listName: selectedList,
        }),
      });

      if (res.ok) {
        fetchPaginatedContacts();
        fetchListSummaries();
        setNewContactEmail('');
        setNewContactName('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save edited contact
  const handleSaveEdit = async (contact: Contact) => {
    if (!editEmail.trim()) {
      alert('Email cannot be empty.');
      return;
    }

    try {
      const res = await api(`/api/contacts/${encodeURIComponent(contact.listName)}/${contact.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          company: editCompany,
          firstName: editFirstName,
        }),
      });

      if (res.ok) {
        fetchPaginatedContacts();
        setEditingId(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete single contact
  const handleDeleteContact = async (contact: Contact) => {
    const confirmed = window.confirm(`Delete contact "${contact.email}"?`);
    if (!confirmed) return;

    try {
      const res = await api(`/api/contacts/${encodeURIComponent(contact.listName)}/${contact.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchPaginatedContacts();
        fetchListSummaries();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Drag & Drop Events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const rawFile = e.dataTransfer.files[0];
      processFile(rawFile);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // CSV Client-side parsing algorithm — optimized to avoid holding all rows in React state
  const processFile = (file: File) => {
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      setCsvError('Invalid file type. Please upload a structured .CSV file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) {
        setCsvError('The uploaded file appears to be empty.');
        return;
      }

      // Store raw text in state ref for later processing during upload
      setCsvRawText(text);

      // Split lines — only parse headers + first few rows for preview
      const firstNewline = text.indexOf('\n');
      const firstLine = (firstNewline > 0 ? text.substring(0, firstNewline) : text).trim();
      const separator = firstLine.includes(';') ? ';' : ',';

      // Parse headers
      const headers = firstLine.split(separator).map(t => t.replace(/['"]/g, '').trim());

      // Count total rows efficiently (just count newlines)
      let rowCount = 0;
      for (let i = 0; i < text.length; i++) {
        if (text[i] === '\n') rowCount++;
      }
      // Subtract header line
      if (rowCount > 0) rowCount--;

      // Parse only first 5 rows for preview display
      const previewRows: string[][] = [];
      let lineStart = firstNewline + 1;
      for (let r = 0; r < Math.min(5, rowCount); r++) {
        let lineEnd = text.indexOf('\n', lineStart);
        if (lineEnd === -1) lineEnd = text.length;
        const line = text.substring(lineStart, lineEnd).trim();
        if (line.length > 0) {
          const values: string[] = [];
          let cur = '';
          let insideQuotes = false;
          for (let charIdx = 0; charIdx < line.length; charIdx++) {
            const char = line[charIdx];
            if (char === '"' || char === "'") {
              insideQuotes = !insideQuotes;
            } else if (char === separator && !insideQuotes) {
              values.push(cur.trim());
              cur = '';
            } else {
              cur += char;
            }
          }
          values.push(cur.trim());
          previewRows.push(values);
        }
        lineStart = lineEnd + 1;
      }

      setCsvHeaders(headers);
      setCsvPreviewRows(previewRows);
      setCsvTotalRowCount(rowCount);
      setUploadedFileName(file.name);

      // Guess indexes
      const lowerCols = headers.map(h => h.toLowerCase());
      const emailIdx = lowerCols.findIndex(col => col.includes('email') || col.includes('mail'));
      const nameIdx = lowerCols.findIndex(col => col.includes('name') || col.includes('user') || col.includes('contact'));
      const firstNameIdx = lowerCols.findIndex(col => col.includes('first') || col.includes('fname') || col.includes('given'));
      const companyIdx = lowerCols.findIndex(col => col.includes('company') || col.includes('org') || col.includes('firm') || col.includes('corporation'));

      setMappingEmailIdx(emailIdx >= 0 ? emailIdx : 0);
      setMappingNameIdx(nameIdx >= 0 ? nameIdx : -1);
      setMappingFirstNameIdx(firstNameIdx >= 0 ? firstNameIdx : -1);
      setMappingCompanyIdx(companyIdx >= 0 ? companyIdx : -1);

      setShowMappingPanel(true);
      setCsvUploadSuccess(null);
      setCsvError(null);
    };

    reader.onerror = () => {
      setCsvError('Error reading file contents.');
    };

    reader.readAsText(file);
  };

  const handleApplyMapping = async () => {
    if (mappingEmailIdx < 0 || mappingEmailIdx >= csvHeaders.length) {
      setCsvError('Please specify a valid CSV column containing recipient emails.');
      return;
    }

    const targetListName = (customListName ? customListName.trim() : uploadedFileName.replace(/\.(csv|txt)$/i, '')).trim() || 'Imported Recipients';

    try {
      setParsingFile(true);
      setUploadProgress('Parsing and uploading...');

      // Stream-parse the raw CSV text and upload in chunks
      // This avoids building a 50K-item array in memory
      const separator = csvRawText.includes(';') ? ';' : ',';
      const lines = csvRawText.split(/\r?\n/);
      const CHUNK_SIZE = 2000;
      let chunk: any[] = [];
      let totalUploaded = 0;
      let totalValid = 0;
      let failed = false;

      // Skip header line (index 0)
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Parse line
        const values: string[] = [];
        let cur = '';
        let insideQuotes = false;
        for (let charIdx = 0; charIdx < line.length; charIdx++) {
          const char = line[charIdx];
          if (char === '"' || char === "'") {
            insideQuotes = !insideQuotes;
          } else if (char === separator && !insideQuotes) {
            values.push(cur.trim());
            cur = '';
          } else {
            cur += char;
          }
        }
        values.push(cur.trim());

        // Extract mapped fields
        const emailRaw = values[mappingEmailIdx] || '';
        const emailClean = emailRaw.replace(/['"]/g, '').trim();

        if (emailClean && /\S+@\S+\.\S+/.test(emailClean)) {
          const nameClean = mappingNameIdx >= 0 && values[mappingNameIdx] ? values[mappingNameIdx].replace(/['"]/g, '').trim() : '';
          const firstNameClean = mappingFirstNameIdx >= 0 && values[mappingFirstNameIdx] ? values[mappingFirstNameIdx].replace(/['"]/g, '').trim() : '';
          const companyClean = mappingCompanyIdx >= 0 && values[mappingCompanyIdx] ? values[mappingCompanyIdx].replace(/['"]/g, '').trim() : '';

          const customVars: Record<string, string> = {};
          if (includeAllColumnsAsVars) {
            csvHeaders.forEach((header, index) => {
              if (
                index !== mappingEmailIdx &&
                index !== mappingNameIdx &&
                index !== mappingFirstNameIdx &&
                index !== mappingCompanyIdx &&
                values[index] !== undefined
              ) {
                const cleanKey = header.replace(/[^a-zA-Z0-9_]/g, '');
                if (cleanKey) {
                  const valClean = values[index].replace(/['"]/g, '').trim();
                  customVars[cleanKey] = valClean;
                  customVars[cleanKey.toLowerCase()] = valClean;
                }
              }
            });
          }

          chunk.push({
            email: emailClean,
            name: nameClean,
            firstName: firstNameClean || nameClean.split(' ')[0],
            company: companyClean,
            listName: targetListName,
            variables: customVars
          });
          totalValid++;

          // When chunk is full, upload it
          if (chunk.length >= CHUNK_SIZE) {
            setUploadProgress(`Uploading... ${totalUploaded + chunk.length} of ~${csvTotalRowCount} contacts`);
            const res = await api('/api/contacts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(chunk),
            });

            if (!res.ok) {
              const errData = await res.json().catch(() => ({}));
              setCsvError(`Failed at batch ${Math.floor(totalUploaded / CHUNK_SIZE) + 1}: ${(errData as any).error || 'Upload failed'}`);
              failed = true;
              break;
            }
            totalUploaded += chunk.length;
            chunk = [];
          }
        }
      }

      // Upload remaining chunk
      if (!failed && chunk.length > 0) {
        setUploadProgress(`Uploading final batch... ${totalUploaded + chunk.length} contacts`);
        const res = await api('/api/contacts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(chunk),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          setCsvError(`Failed at final batch: ${(errData as any).error || 'Upload failed'}`);
          failed = true;
        } else {
          totalUploaded += chunk.length;
        }
      }

      if (!failed) {
        if (totalValid === 0) {
          setCsvError('No valid contacts found. Verify that the mapped column has valid email addresses.');
        } else {
          setCsvUploadSuccess(`Successfully imported ${totalUploaded} contacts with custom customizer tags into campaign segment "${targetListName}"!`);
          setCsvError(null);
          setCustomListName('');
          setShowMappingPanel(false);
          setCsvHeaders([]);
          setCsvPreviewRows([]);
          setCsvRawText('');
          setCsvTotalRowCount(0);
          setSelectedList(targetListName);
          setCurrentPage(1);
          fetchListSummaries();
        }
      }
    } catch (err) {
      setCsvError('Server offline or network timeout.');
    } finally {
      setParsingFile(false);
      setUploadProgress('');
    }
  };

  // Pagination display helpers (data comes paginated from server)
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStart = totalContacts === 0 ? 0 : (safeCurrentPage - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(safeCurrentPage * PAGE_SIZE, totalContacts);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      {/* Sidebar: Lists Directory */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Create list panel */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 card-shadow">
          <h3 className="font-display font-bold text-gray-900 mb-3 text-base flex items-center gap-1.5">
            <LayoutList className="w-4 h-4 text-[#7C5CFC]" /> Contact Folders
          </h3>
          <form onSubmit={handleCreateList} className="flex gap-2">
            <input
              type="text"
              placeholder="E.g. Newsletter List"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              className="flex-1 bg-gray-50 border border-gray-150 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#7C5CFC] transition-colors"
            />
            <button
              type="submit"
              className="bg-brand-gradient hover:opacity-95 text-white p-2.5 rounded-xl text-xs font-semibold cursor-pointer shrink-0"
              title="Create List"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Directory listing of Lists */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 card-shadow space-y-2">
          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Folders Directory</h4>
          
          {listKeys.length === 0 ? (
            <p className="text-gray-400 text-xs text-center py-6">No contact lists saved</p>
          ) : (
            <div className="space-y-1">
              {listKeys.map((name) => {
                const count = getListCount(name);
                const isSelected = selectedList === name;
                return (
                  <div
                    key={name}
                    className={`group flex items-center justify-between p-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/50 border-l-4 border-l-[#7C5CFC] font-semibold text-[#7C5CFC]'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    onClick={() => { setSelectedList(name); setCurrentPage(1); }}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <Users className="w-3.5 h-3.5 opacity-70" />
                      <span className="truncate">{name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="bg-gray-100 text-gray-500 font-mono scale-90 px-1.5 py-0.5 rounded-full text-[10px]">
                        {count}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteList(name);
                        }}
                        className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete Entire List"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* CSV importer */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 card-shadow space-y-4">
          <div className="space-y-1">
            <h3 className="font-display font-bold text-gray-950 text-base flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-[#7C5CFC]" /> CSV Bulk Upload
            </h3>
            <p className="text-[11px] text-gray-400 leading-normal">
              Drag spreadsheet list. It parses column names matching Email and Name automatically.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">Target Directory / List Name</label>
              <input
                type="text"
                placeholder="Defaults to CSV file name"
                value={customListName}
                onChange={(e) => setCustomListName(e.target.value)}
                className="w-full bg-gray-50 border border-gray-150 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#7C5CFC] transition-colors"
              />
            </div>

            {/* Drag & Drop Area */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-[#7C5CFC] bg-[#7C5CFC]/5'
                  : 'border-gray-200 hover:border-gray-300 bg-gray-50'
              }`}
            >
              <input
                type="file"
                id="csv-file-input"
                className="hidden"
                accept=".csv,.txt"
                onChange={handleFileInputChange}
              />
              <label htmlFor="csv-file-input" className="cursor-pointer space-y-2 block">
                <div className="mx-auto w-10 h-10 rounded-full bg-blue-50 text-[#7C5CFC] flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-700">Drop your file here, or <span className="text-[#7C5CFC] underline hover:text-[#9B7EFD]">browse</span></p>
                  <p className="text-[10px] text-gray-400 mt-1">Supports CSV, headers or plain records</p>
                </div>
              </label>
            </div>

            {csvUploadSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{csvUploadSuccess}</span>
              </div>
            )}

            {csvError && (
              <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{csvError}</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Main Content Area: List Viewer & Add Contact */}
      <div className="lg:col-span-8 space-y-6">
        
        {selectedList ? (
          <>
            {/* Header with quick statistics and inline creation */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 card-shadow space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-50">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="p-1 px-2.5 text-[11px] font-bold tracking-wider text-[#7C5CFC] bg-blue-50 border border-blue-100 rounded-full font-mono uppercase">
                      Current List
                    </span>
                    <span className="text-xs text-gray-400 font-mono">
                      {totalContacts.toLocaleString()} contacts
                      {totalPages > 1 ? ` · Page ${safeCurrentPage} of ${totalPages}` : ''}
                    </span>
                    {loadingContacts && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#7C5CFC] ml-1" />}
                  </div>
                  <h2 className="font-display font-bold text-gray-950 text-xl tracking-tight">{selectedList}</h2>
                </div>
              </div>

              {/* Add Single contact manual input */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Add Single Recipient</h4>
                
                <form onSubmit={handleAddContact} className="flex flex-col sm:flex-row gap-2.5">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Name (optional)"
                      value={newContactName}
                      onChange={(e) => setNewContactName(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-150 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#7C5CFC]"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="email"
                      placeholder="Email address"
                      value={newContactEmail}
                      onChange={(e) => setNewContactEmail(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-150 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#7C5CFC]"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-brand-gradient hover:opacity-95 text-white font-medium text-xs px-4 py-2 rounded-xl flex items-center justify-center space-x-1.5 shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to list</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Recipient Contacts grid details */}
            <div className="bg-white rounded-2xl border border-gray-100 card-shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-400 font-bold text-[10px] uppercase tracking-wider">
                      <th className="px-6 py-3.5">Recipient Info</th>
                      <th className="px-6 py-3.5">Email Destination</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-xs text-gray-700">
                    {loadingContacts ? (
                      <tr>
                        <td colSpan={3} className="text-center py-12 text-gray-400">
                          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#7C5CFC]" />
                          Loading contacts...
                        </td>
                      </tr>
                    ) : contacts.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="text-center py-12 text-gray-400">
                          This contact list is empty. Add a custom contact or drop a CSV file above.
                        </td>
                      </tr>
                    ) : (
                      contacts.map((contact) => {
                        const isEditing = editingId === contact.id;
                        return (
                          <tr key={contact.id} className="hover:bg-gray-50/40 transition-colors">
                            <td className="px-6 py-3.5 font-medium text-gray-900">
                              {isEditing ? (
                                <div className="space-y-1.5 min-w-[150px]">
                                  <label className="text-[9px] text-[#7C5CFC] font-bold block uppercase tracking-wider">Full Name</label>
                                  <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    placeholder="Full Name"
                                    className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-[#7C5CFC]"
                                  />
                                  <label className="text-[9px] text-[#7C5CFC] font-bold block uppercase tracking-wider">First Name</label>
                                  <input
                                    type="text"
                                    value={editFirstName}
                                    onChange={(e) => setEditFirstName(e.target.value)}
                                    placeholder="First Name"
                                    className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-[#7C5CFC]"
                                  />
                                </div>
                              ) : (
                                <div>
                                  <div className="font-bold text-gray-950">{contact.name || <span className="text-gray-300 italic">No name provided</span>}</div>
                                  {contact.firstName && contact.firstName !== contact.name && (
                                    <div className="text-[9.5px] text-[#7C5CFC] font-mono leading-none mt-1">
                                      Tag <code>{"{{firstName}}"}</code>: "{contact.firstName}"
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-3.5 font-mono text-gray-500">
                              {isEditing ? (
                                <div className="space-y-1.5 min-w-[200px]">
                                  <label className="text-[9px] text-amber-600 font-bold block uppercase tracking-wider">Email Direction</label>
                                  <input
                                    type="email"
                                    value={editEmail}
                                    onChange={(e) => setEditEmail(e.target.value)}
                                    placeholder="Email Address"
                                    className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-[#7C5CFC]"
                                  />
                                  <label className="text-[9px] text-amber-600 font-bold block uppercase tracking-wider">Company Name</label>
                                  <input
                                    type="text"
                                    value={editCompany}
                                    onChange={(e) => setEditCompany(e.target.value)}
                                    placeholder="Company"
                                    className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-[#7C5CFC]"
                                  />
                                </div>
                              ) : (
                                <div>
                                  <div className="text-xs text-gray-700 font-bold">{contact.email}</div>
                                  {contact.company && (
                                    <div className="text-[9.5px] text-amber-700 bg-amber-50 inline-block px-1.5 py-0.5 rounded-md font-sans font-bold border border-amber-100 mt-1">
                                      Tag <code>{"{{company}}"}</code>: "{contact.company}"
                                    </div>
                                  )}
                                  {/* Custom Mapped Columns */}
                                  {contact.variables && Object.keys(contact.variables).length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {Object.entries(contact.variables)
                                        .filter(([k]) => k.toLowerCase() !== 'company' && k.toLowerCase() !== 'firstname')
                                        .slice(0, 8)
                                        .map(([k, v]) => (
                                          <span key={k} className="text-[8.5px] bg-[#F2EFFE] text-[#7C5CFC] px-1.5 py-0.5 rounded-md border border-[#E3DCFD] font-mono leading-none" title={`Tag {{${k}}}: "${v}"`}>
                                            {"{{"}{k}{"}}"}: "{v}"
                                          </span>
                                        ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-3.5 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                {isEditing ? (
                                  <>
                                    <button
                                      onClick={() => handleSaveEdit(contact)}
                                      className="text-emerald-500 hover:bg-emerald-50 p-1.5 rounded-lg border border-emerald-100"
                                      title="Save Changes"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => setEditingId(null)}
                                      className="text-gray-400 hover:bg-gray-100 p-1.5 rounded-lg border border-gray-150"
                                      title="Cancel"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => {
                                        setEditingId(contact.id);
                                        setEditName(contact.name || '');
                                        setEditEmail(contact.email);
                                        setEditCompany(contact.company || '');
                                        setEditFirstName(contact.firstName || '');
                                      }}
                                      className="text-gray-400 hover:text-[#7C5CFC] hover:bg-blue-50 p-1.5 rounded-lg transition-colors border border-gray-100 whitespace-nowrap"
                                      title="Edit Contact"
                                    >
                                      <Edit2 className="w-3 h-3 inline mr-1" /> Edit
                                    </button>
                                    <button
                                      onClick={() => handleDeleteContact(contact)}
                                      className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors border border-gray-100"
                                      title="Delete Contact"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-gray-50/50">
                  <span className="text-[11px] text-gray-500">
                    Showing {pageStart}&ndash;{pageEnd} of {totalContacts.toLocaleString()} contacts
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={safeCurrentPage === 1}
                      className="px-2 py-1 text-[10px] font-semibold rounded-lg border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      First
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={safeCurrentPage === 1}
                      className="px-2.5 py-1 text-[10px] font-semibold rounded-lg border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Prev
                    </button>
                    {(() => {
                      const pages: number[] = [];
                      const maxVisible = 5;
                      let start = Math.max(1, safeCurrentPage - Math.floor(maxVisible / 2));
                      let end = Math.min(totalPages, start + maxVisible - 1);
                      if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
                      for (let i = start; i <= end; i++) pages.push(i);
                      return pages.map(p => (
                        <button
                          key={p}
                          onClick={() => setCurrentPage(p)}
                          className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg border cursor-pointer ${
                            p === safeCurrentPage
                              ? 'bg-[#7C5CFC] text-white border-[#7C5CFC]'
                              : 'border-gray-200 text-gray-500 hover:bg-white'
                          }`}
                        >
                          {p}
                        </button>
                      ));
                    })()}
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={safeCurrentPage === totalPages}
                      className="px-2.5 py-1 text-[10px] font-semibold rounded-lg border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Next
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={safeCurrentPage === totalPages}
                      className="px-2 py-1 text-[10px] font-semibold rounded-lg border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Last
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 card-shadow flex flex-col justify-center items-center py-20 text-center">
            <div className="w-16 h-16 bg-blue-50 text-[#7C5CFC] rounded-full flex items-center justify-center mb-4 border border-blue-100">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="font-display font-semibold text-lg text-gray-900 mb-1">No folders selected</h3>
            <p className="text-gray-500 text-xs max-w-sm leading-normal">
              Create a fresh folders directory on the left sidebar, or upload a structured CSV sheet to bulk import contacts instantly into a target segment.
            </p>
          </div>
        )}

      </div>

      {showMappingPanel && (
        <div className="fixed inset-0 z-50 bg-gray-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#EBEBEF] w-full max-w-2xl shadow-xl flex flex-col overflow-hidden max-h-[90vh]">
            
            {/* Header */}
            <div className="bg-gray-50/55 px-6 py-4 border-b border-gray-100 flex justify-between items-center shrink-0">
              <div>
                <dt className="text-[10px] text-[#7C5CFC] font-mono tracking-wider font-bold uppercase">
                  Step 2: CSV Data Mapping Wizard
                </dt>
                <h3 className="font-display font-black text-gray-950 text-base flex items-center gap-1.5">
                  ✦ Dynamic Header & Field Importer
                </h3>
              </div>
              <button 
                onClick={() => setShowMappingPanel(false)} 
                className="text-gray-400 hover:text-gray-700 bg-white shadow-sm p-1.5 rounded-full border border-gray-150 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content area */}
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="bg-blue-50/40 border border-blue-100 rounded-2xl p-4 text-xs space-y-1.5 text-blue-900">
                <span className="font-bold block text-[#7C5CFC]">💡 System parsed {csvHeaders.length} columns and detected ~{csvTotalRowCount.toLocaleString()} contacts</span>
                <p className="text-[11px] leading-relaxed text-slate-600">
                  Select which columns map to system parameters. Check the option below to preserve all additional columns as dynamic personalization variables (such as <code>{"{{City}}"}</code>, <code>{"{{JobTitle}}"}</code> or custom tags) in your email templates!
                </p>
              </div>

              {/* Grid mappings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Email (Required) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-[#7C5CFC] font-mono uppercase font-bold tracking-wider block">
                    Recipient Email Address <span className="text-red-500 font-bold">*</span>
                  </label>
                  <select
                    className="w-full bg-[#FAFAFD] border border-[#EBEBEF] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#7C5CFC]"
                    value={mappingEmailIdx}
                    onChange={(e) => setMappingEmailIdx(parseInt(e.target.value))}
                  >
                    <option value="">-- Choose Email Column --</option>
                    {csvHeaders.map((header, idx) => (
                      <option key={idx} value={idx}>
                        {header} (e.g. "{csvPreviewRows[0]?.[idx] || '...'}")
                      </option>
                    ))}
                  </select>
                </div>

                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 font-mono uppercase font-bold tracking-wider block">
                    Full Name <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <select
                    className="w-full bg-[#FAFAFD] border border-[#EBEBEF] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#7C5CFC]"
                    value={mappingNameIdx}
                    onChange={(e) => setMappingNameIdx(parseInt(e.target.value))}
                  >
                    <option value="-1">-- None / Match Empty --</option>
                    {csvHeaders.map((header, idx) => (
                      <option key={idx} value={idx}>
                        {header} (e.g. "{csvPreviewRows[0]?.[idx] || '...'}")
                      </option>
                    ))}
                  </select>
                </div>

                {/* First Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-[#7C5CFC] font-mono uppercase font-bold tracking-wider block">
                    First Name <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <select
                    className="w-full bg-[#FAFAFD] border border-[#EBEBEF] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#7C5CFC]"
                    value={mappingFirstNameIdx}
                    onChange={(e) => setMappingFirstNameIdx(parseInt(e.target.value))}
                  >
                    <option value="-1">-- Extract Automatically from full name --</option>
                    {csvHeaders.map((header, idx) => (
                      <option key={idx} value={idx}>
                        {header} (e.g. "{csvPreviewRows[0]?.[idx] || '...'}")
                      </option>
                    ))}
                  </select>
                </div>

                {/* Company Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-amber-600 font-mono uppercase font-bold tracking-wider block">
                    Company Name <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <select
                    className="w-full bg-[#FAFAFD] border border-[#EBEBEF] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#7C5CFC]"
                    value={mappingCompanyIdx}
                    onChange={(e) => setMappingCompanyIdx(parseInt(e.target.value))}
                  >
                    <option value="-1">-- None --</option>
                    {csvHeaders.map((header, idx) => (
                      <option key={idx} value={idx}>
                        {header} (e.g. "{csvPreviewRows[0]?.[idx] || '...'}")
                      </option>
                    ))}
                  </select>
                </div>

              </div>

              {/* Include unmapped check */}
              <div className="flex items-start gap-2.5 pt-2 border-t border-gray-100">
                <input
                  type="checkbox"
                  id="includeUnmappedCheck"
                  checked={includeAllColumnsAsVars}
                  onChange={(e) => setIncludeAllColumnsAsVars(e.target.checked)}
                  className="mt-0.5 rounded text-[#7C5CFC] border-gray-300 focus:ring-[#7C5CFC] w-4 h-4 cursor-pointer"
                />
                <label htmlFor="includeUnmappedCheck" className="text-xs text-gray-600 select-none cursor-pointer">
                  <span className="font-bold text-gray-800 block">Include all unmapped columns as template merge tags</span>
                  <span className="text-[10px] text-[#7C5CFC] block">
                    Every additional column in your spreadsheet (e.g., job title, balance, referral code) will be available instantly as a <code>{"{{tag}}"}</code> personalization parameter!
                  </span>
                </label>
              </div>

              {/* Small preview table */}
              <div className="border border-gray-150 rounded-2xl overflow-hidden bg-gray-50/50">
                <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                  <span className="text-[9.5px] text-gray-500 font-mono font-bold uppercase tracking-wider">Spreadsheet Header Preview (Row 1-2)</span>
                  <span className="text-[9px] text-[#7C5CFC] font-semibold">{uploadedFileName}</span>
                </div>
                <div className="p-3 text-[10px] font-mono whitespace-nowrap overflow-x-auto space-y-1 bg-white">
                  <div className="text-[#7C5CFC] font-bold border-b border-gray-100 pb-1 mb-1">
                    {csvHeaders.map(h => `[ ${h} ]`).join(' | ')}
                  </div>
                  {csvPreviewRows.slice(0, 2).map((row, rIdx) => (
                    <div key={rIdx} className="text-gray-600">
                      Row #{rIdx + 1}: {row.map(cell => `"${cell}"`).join(' | ')}
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 p-4 bg-gray-50/50 flex justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setShowMappingPanel(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-500 hover:text-gray-800 bg-white border border-gray-205 rounded-full cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyMapping}
                disabled={parsingFile}
                className="bg-[#7C5CFC] hover:bg-[#6c4be0] text-white font-bold text-xs px-8 py-2 rounded-full cursor-pointer flex items-center gap-1 shadow-md hover:scale-[1.01] transition-all disabled:opacity-50"
              >
                {parsingFile ? (uploadProgress || 'Saving mapped contacts...') : 'Import Mapped Contacts'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
