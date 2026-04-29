import { useEffect, useState } from 'react';
import { Brain, RefreshCcw, AlertTriangle, CheckCircle2, Loader2, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getOrganizationSuggestions, getDuplicates, cleanupDuplicates, semanticSearch } from '../api/ai';

interface DuplicateFile {
  _id: string;
  originalName: string;
  size: number;
  tags: string[];
  createdAt: string;
}

interface DuplicateGroup {
  _id: string; // checksum
  count: number;
  files: DuplicateFile[];
}

interface OrgSummary {
  totalFiles: number;
  totalSize: number;
  topTags: { tag: string; count: number }[];
  typeDistribution: { type: string; count: number }[];
}

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B','KB','MB','GB','TB'];
  const i = Math.floor(Math.log(bytes)/Math.log(k));
  return parseFloat((bytes/Math.pow(k,i)).toFixed(2)) + ' ' + sizes[i];
};

const AIDashboard = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('userToken') || '';
  const navigate = useNavigate();
  const [loadingOrg, setLoadingOrg] = useState(true);
  const [loadingDup, setLoadingDup] = useState(true);
  const [orgError, setOrgError] = useState<string | null>(null);
  const [dupError, setDupError] = useState<string | null>(null);
  const [summary, setSummary] = useState<OrgSummary | null>(null);
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [keepers, setKeepers] = useState<Record<string,string>>({}); // checksum -> fileId
  const [cleaning, setCleaning] = useState<string | null>(null);
  const [cleanupResult, setCleanupResult] = useState<string | null>(null);
  const [searchQ, setSearchQ] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const loadOrg = async () => {
    setLoadingOrg(true); setOrgError(null);
    try {
      const res = await getOrganizationSuggestions(token);
      setSummary(res.data.summary);
    } catch (e:any) {
      setOrgError(e?.response?.data?.message || 'Failed to load organization suggestions');
    } finally { setLoadingOrg(false); }
  };

  const loadDup = async () => {
    setLoadingDup(true); setDupError(null);
    try {
      const res = await getDuplicates(token);
      setDuplicateGroups(res.data.duplicateGroups || []);
      const defaults: Record<string,string> = {};
      (res.data.duplicateGroups || []).forEach((g: DuplicateGroup) => { if (g.files[0]) defaults[g._id] = g.files[0]._id; });
      setKeepers(defaults);
    } catch (e:any) {
      setDupError(e?.response?.data?.message || 'Failed to load duplicates');
    } finally { setLoadingDup(false); }
  };

  const handleCleanup = async (checksum: string, keepId: string) => {
    setCleaning(checksum); setCleanupResult(null);
    try {
      await cleanupDuplicates(token, { checksum, keepFileId: keepId, mergeTags: true });
      setCleanupResult('Cleanup successful');
      await loadDup();
    } catch (e:any) {
      setCleanupResult(e?.response?.data?.message || 'Cleanup failed');
    } finally {
      setCleaning(null);
      setTimeout(()=> setCleanupResult(null), 4000);
    }
  };

  useEffect(() => { if (token) { loadOrg(); loadDup(); } }, [token]);

  const runSemanticSearch = async () => {
    setSearching(true);
    try {
      const res = await semanticSearch(token, searchQ, 10);
      setSearchResults(res.data.results || []);
    } catch (e:any) {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="pt-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white">
          <Brain className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Insights</h1>
          <p className="text-gray-500">Smart organization, duplicates, and tagging intelligence.</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={()=> navigate('/ai/chat')} className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition">
            <MessageSquare className="w-4 h-4" /> Chat Assistant
          </button>
          <button onClick={()=> navigate('/ai/hf-chat')} className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-gray-900 text-white hover:bg-black transition">
            <MessageSquare className="w-4 h-4" /> HF Chat (Free)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white shadow border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Organization Overview</h2>
            <button onClick={loadOrg} className="text-sm flex items-center gap-1 text-blue-600 hover:underline disabled:opacity-50" disabled={loadingOrg}>
              <RefreshCcw className="w-4 h-4" /> Refresh
            </button>
          </div>
          {loadingOrg && <p className="text-sm text-gray-500">Loading organization insights...</p>}
          {orgError && <p className="text-sm text-red-600">{orgError}</p>}
          {summary && !loadingOrg && !orgError && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-blue-50">
                  <p className="text-xs uppercase text-blue-600 font-semibold">Files</p>
                  <p className="text-lg font-bold">{summary.totalFiles}</p>
                </div>
                <div className="p-4 rounded-xl bg-purple-50">
                  <p className="text-xs uppercase text-purple-600 font-semibold">Total Size</p>
                  <p className="text-lg font-bold">{formatBytes(summary.totalSize)}</p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50">
                  <p className="text-xs uppercase text-emerald-600 font-semibold">Top Tag</p>
                  <p className="text-lg font-bold">{summary.topTags[0]?.tag || '—'}</p>
                </div>
                <div className="p-4 rounded-xl bg-amber-50">
                  <p className="text-xs uppercase text-amber-600 font-semibold">Types</p>
                  <p className="text-lg font-bold">{summary.typeDistribution.length}</p>
                </div>
              </div>
              <div>
                <h3 className="font-medium mb-2">Top Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {summary.topTags.map(t => (
                    <span key={t.tag} className="px-3 py-1 rounded-full bg-gray-100 text-sm text-gray-700">{t.tag} <span className="text-gray-400">({t.count})</span></span>
                  ))}
                  {!summary.topTags.length && <span className="text-sm text-gray-500">No tags yet.</span>}
                </div>
              </div>
              <div>
                <h3 className="font-medium mb-2">Type Distribution</h3>
                <div className="flex flex-wrap gap-2">
                  {summary.typeDistribution.map(td => (
                    <span key={td.type} className="px-3 py-1 rounded-md bg-blue-100 text-blue-700 text-sm">{td.type} ({td.count})</span>
                  ))}
                  {!summary.typeDistribution.length && <span className="text-sm text-gray-500">No data.</span>}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="p-6 rounded-2xl bg-white shadow border border-gray-100">
          <h2 className="text-xl font-semibold mb-4">Semantic Search</h2>
          <div className="flex items-center gap-2 mb-3">
            <input value={searchQ} onChange={e=> setSearchQ(e.target.value)} placeholder="Search by name, tags..." className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm" />
            <button onClick={runSemanticSearch} disabled={!searchQ || searching} className="px-3 py-2 text-sm rounded-md bg-blue-600 text-white disabled:opacity-50">{searching ? 'Searching…' : 'Search'}</button>
          </div>
          <div className="space-y-2 max-h-64 overflow-auto">
            {searchResults.map(item => (
              <div key={item._id} className="text-sm border border-gray-200 rounded-md p-2">
                <div className="font-medium text-gray-800 truncate" title={item.originalName}>{item.originalName}</div>
                <div className="text-xs text-gray-500">{(item.tags||[]).slice(0,6).join(', ')}</div>
              </div>
            ))}
            {!searching && searchResults.length === 0 && <p className="text-xs text-gray-400">No results yet.</p>}
          </div>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-white shadow border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">Duplicate Groups {duplicateGroups.length > 0 && <span className="text-sm font-normal text-gray-500">({duplicateGroups.length})</span>}</h2>
          <button onClick={loadDup} className="text-sm flex items-center gap-1 text-blue-600 hover:underline disabled:opacity-50" disabled={loadingDup}>
            <RefreshCcw className="w-4 h-4" /> Refresh
          </button>
        </div>
        {loadingDup && <p className="text-sm text-gray-500">Scanning for duplicates...</p>}
        {dupError && <p className="text-sm text-red-600">{dupError}</p>}
        {!loadingDup && !dupError && duplicateGroups.length === 0 && (
          <div className="flex items-center gap-2 text-sm text-emerald-600"><span>No duplicates detected.</span></div>
        )}
        <div className="space-y-6">
          {cleanupResult && (
            <div className="p-3 rounded-md text-sm mb-4 flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4" /> {cleanupResult}
            </div>
          )}
          {duplicateGroups.map(group => {
            const selectedKeeper = keepers[group._id] || group.files[0]?._id;
            const totalSize = group.files.reduce((acc,f)=> acc+f.size,0);
            const keepSize = group.files.find(f=> f._id===selectedKeeper)?.size || 0;
            const reclaim = totalSize - keepSize;
            return (
            <div key={group._id} className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium text-gray-800">Checksum: <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">{group._id.slice(0,16)}…</span></p>
                  <p className="text-xs text-gray-500">{group.count} copies • Reclaim: <span className="text-emerald-600 font-medium">{formatBytes(reclaim)}</span></p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Keep selected</span>
                  <button 
                    className="text-xs px-3 py-1 rounded-md bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 flex items-center gap-1 disabled:opacity-50"
                    disabled={cleaning === group._id}
                    onClick={() => handleCleanup(group._id, selectedKeeper!)}
                  >
                    {cleaning === group._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <AlertTriangle className="w-3 h-3" />} Cleanup
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500">
                      <th className="py-1 pr-4">Keep</th>
                      <th className="py-1 pr-4">Name</th>
                      <th className="py-1 pr-4">Size</th>
                      <th className="py-1 pr-4">Tags</th>
                      <th className="py-1 pr-4">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.files.map(f => (
                      <tr key={f._id} className="border-t border-gray-100">
                        <td className="py-1 pr-4">
                          <input
                            type="radio"
                            name={`keeper-${group._id}`}
                            className="accent-blue-600"
                            checked={selectedKeeper === f._id}
                            onChange={() => setKeepers(prev => ({ ...prev, [group._id]: f._id }))}
                          />
                        </td>
                        <td className="py-1 pr-4 max-w-[220px] truncate" title={f.originalName}>{f.originalName}</td>
                        <td className="py-1 pr-4">{formatBytes(f.size)}</td>
                        <td className="py-1 pr-4">
                          <div className="flex flex-wrap gap-1 max-w-[180px] truncate">
                            {f.tags.slice(0,4).map(t => <span key={t} className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-xs">{t}</span>)}
                            {f.tags.length > 4 && <span className="text-xs text-gray-400">+{f.tags.length-4}</span>}
                          </div>
                        </td>
                        <td className="py-1 pr-4">{new Date(f.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AIDashboard;
