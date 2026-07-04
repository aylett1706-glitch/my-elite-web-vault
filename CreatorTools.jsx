import Navbar from '@/components/layout/Navbar';
import WatchPartyManager from '@/components/tools/WatchPartyManager';
import KidsProfileManager from '@/components/tools/KidsProfileManager';
import StreamingAvailability from '@/components/tools/StreamingAvailability';
import AITrailerClipGenerator from '@/components/tools/AITrailerClipGenerator';
import ActorUniverseMap from '@/components/tools/ActorUniverseMap';
import OfflineDownloadManager from '@/components/tools/OfflineDownloadManager';
import VoiceSearchTool from '@/components/tools/VoiceSearchTool';
import AdminAnalyticsDashboard from '@/components/tools/AdminAnalyticsDashboard';
import LibraryHealthDashboard from '@/components/tools/LibraryHealthDashboard';
import SeoShareCardGenerator from '@/components/tools/SeoShareCardGenerator';
import ImprovementCommandCenter from '@/components/tools/improvements/ImprovementCommandCenter';
import { Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

const TOOL_MODULES = [
  { id: 'watch-parties', label: 'Watch Parties', Component: WatchPartyManager },
  { id: 'kids-profiles', label: 'Kids Profiles', Component: KidsProfileManager },
  { id: 'streaming', label: 'Streaming Availability', Component: StreamingAvailability },
  { id: 'trailers', label: 'AI Trailer Clips', Component: AITrailerClipGenerator },
  { id: 'actors', label: 'Actor Universe', Component: ActorUniverseMap },
  { id: 'offline', label: 'Offline Downloads', Component: OfflineDownloadManager },
  { id: 'voice', label: 'Voice Search', Component: VoiceSearchTool },
  { id: 'analytics', label: 'Analytics', Component: AdminAnalyticsDashboard },
  { id: 'health', label: 'Library Health', Component: LibraryHealthDashboard },
  { id: 'seo', label: 'SEO Share Cards', Component: SeoShareCardGenerator }
];

export default function CreatorTools() {
  const [user, setUser] = useState(null);
  const [activeTool, setActiveTool] = useState(null);
  useEffect(() => { base44.auth.me().then(setUser).catch(() => setUser(null)); }, []);

  const ActiveComponent = TOOL_MODULES.find(tool => tool.id === activeTool)?.Component;

  return <div className="min-h-screen bg-background text-foreground"><Navbar user={user} /><main className="mx-auto max-w-screen-2xl px-4 pb-16 pt-24 md:px-8"><div className="mb-8 rounded-3xl border border-primary/30 bg-card p-6 elite-panel"><p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary"><Sparkles className="h-4 w-4" /> Creator Studio Tools</p><h1 className="mt-2 text-4xl font-black">All new premium features and tools</h1><p className="mt-2 max-w-3xl text-muted-foreground">Manage watch parties, kids profiles, legal availability, AI clips, actor maps, offline queues, voice search, analytics, SEO, and library health from one place.</p></div><div className="space-y-6"><ImprovementCommandCenter /><section className="rounded-3xl border border-border bg-card p-5"><h2 className="text-2xl font-black text-foreground">Open a tool</h2><p className="mt-1 text-sm text-muted-foreground">Tools now load only when opened, preventing rate-limit errors.</p><div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">{TOOL_MODULES.map(tool => <button key={tool.id} type="button" onClick={() => setActiveTool(tool.id)} className={`min-h-11 rounded-2xl px-4 text-sm font-bold transition-colors ${activeTool === tool.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>{tool.label}</button>)}</div></section>{ActiveComponent && <ActiveComponent />}</div></main></div>;
}