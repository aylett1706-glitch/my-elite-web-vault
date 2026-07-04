import { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import Navbar from '@/components/layout/Navbar';
import LivePlayer from '@/components/live-tv/LivePlayer';
import ChannelCard from '@/components/live-tv/ChannelCard';
import ChannelForm from '@/components/live-tv/ChannelForm';
import M3UImportPanel from '@/components/live-tv/M3UImportPanel';
import LiveAISearchPanel from '@/components/live-tv/LiveAISearchPanel';
import { Radio, Search, Signal } from 'lucide-react';
import HubContentRow from '@/components/hubs/HubContentRow';

const OFFICIAL_IN_APP_CHANNELS = [
  {
    id: 'official-abc-news-australia-live',
    name: 'ABC News Australia Live',
    description: 'Official ABC News Australia live stream, playable inside EliteVault via YouTube embed.',
    category: 'News',
    country: 'Australia',
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/ABC_Logo.svg/512px-ABC_Logo.svg.png',
    stream_url: 'https://www.youtube.com/watch?v=vOTiJkg1voo',
    embed_url: 'https://www.youtube.com/embed/vOTiJkg1voo?autoplay=1&playsinline=1',
    source_type: 'embed',
    is_featured: true,
    status: 'approved'
  }
];

const mergeOfficialChannels = (items) => {
  const existingUrls = new Set(items.flatMap(item => [item.stream_url, item.embed_url]).filter(Boolean));
  const missingOfficial = OFFICIAL_IN_APP_CHANNELS.filter(channel => !existingUrls.has(channel.stream_url) && !existingUrls.has(channel.embed_url));
  return [...missingOfficial, ...items];
};

export default function LiveTV() {
  const [user, setUser] = useState(null);
  const [channels, setChannels] = useState([]);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const me = await base44.auth.me().catch(() => null);
      const items = await base44.entities.LiveChannel.filter({ status: 'approved' }, '-is_featured', 300);
      const mergedChannels = mergeOfficialChannels(items);
      setUser(me);
      setChannels(mergedChannels);
      setSelected(mergedChannels[0] || null);
      setLoading(false);
    };
    load();
  }, []);

  const categories = useMemo(() => ['all', ...new Set(channels.map(channel => channel.category || 'General'))], [channels]);

  const filteredChannels = useMemo(() => {
    const lower = query.toLowerCase();
    return channels.filter(channel => {
      const categoryMatch = category === 'all' || (channel.category || 'General') === category;
      const text = `${channel.name || ''} ${channel.description || ''} ${channel.category || ''} ${channel.country || ''}`.toLowerCase();
      return categoryMatch && (!lower || text.includes(lower));
    });
  }, [channels, query, category]);

  const channelRows = [
    { title: 'Featured Live', description: 'Priority in-app live streams and official embeds.', items: channels.filter(channel => channel.is_featured) },
    { title: 'News', description: 'Live news and information channels.', items: channels.filter(channel => (channel.category || '').toLowerCase().includes('news')) },
    { title: 'Entertainment', description: 'General entertainment and variety streams.', items: channels.filter(channel => /(entertainment|general|music|movies)/i.test(channel.category || '')) }
  ];

  const addChannels = (newChannels) => {
    const items = Array.isArray(newChannels) ? newChannels : [newChannels];
    setChannels(prev => [...items, ...prev]);
    if (!selected && items[0]) setSelected(items[0]);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />

      <section className="relative overflow-hidden px-4 pb-8 pt-28 md:px-8 md:pt-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(245,184,61,0.18),transparent_34%),radial-gradient(circle_at_85%_10%,rgba(239,68,68,0.16),transparent_30%)]" />
        <div className="relative mx-auto max-w-screen-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary">
            <Signal className="h-4 w-4" /> Live TV
          </div>
          <h1 className="font-bebas text-6xl tracking-wider text-foreground md:text-8xl">Watch Live TV</h1>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
            Watch free and paid/provider TV inside EliteVault using direct streams, official embeds, or M3U playlists.
          </p>
        </div>
      </section>

      <main className="mx-auto grid max-w-screen-2xl gap-6 px-4 pb-16 md:px-8 xl:grid-cols-[1fr_420px]">
        <div className="space-y-6">
          <LivePlayer channel={selected} />

          <div className="space-y-6">
            {channelRows.map(row => (
              <HubContentRow key={row.title} title={row.title} description={row.description} items={row.items}>
                {(channel) => (
                  <div key={channel.id} className="w-72 shrink-0">
                    <ChannelCard channel={channel} active={selected?.id === channel.id} onSelect={setSelected} />
                  </div>
                )}
              </HubContentRow>
            ))}
          </div>

          <LiveAISearchPanel onAdded={addChannels} />

          <div className="grid gap-4 lg:grid-cols-2">
            <ChannelForm onAdded={addChannels} />
            <M3UImportPanel onImported={addChannels} />
          </div>
        </div>

        <aside className="rounded-3xl border border-border bg-card p-4 xl:sticky xl:top-24 xl:max-h-[calc(100vh-7rem)] xl:overflow-auto">
          <div className="mb-4 flex items-center gap-2">
            <Radio className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Channels</h2>
          </div>

          <div className="mb-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search channels…" className="w-full rounded-full border border-border bg-secondary py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground" />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {categories.map(item => (
                <button key={item} onClick={() => setCategory(item)} className={`shrink-0 rounded-full px-3 py-2 text-xs font-bold ${category === item ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
                  {item === 'all' ? 'All' : item}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><div className="h-7 w-7 animate-spin rounded-full border-2 border-primary/30 border-t-primary" /></div>
          ) : filteredChannels.length === 0 ? (
            <div className="rounded-2xl border border-border bg-secondary p-6 text-center">
              <Radio className="mx-auto mb-3 h-8 w-8 text-primary" />
              <p className="font-bold text-foreground">No channels yet</p>
              <p className="text-sm text-muted-foreground">Add a channel or import an M3U playlist.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredChannels.map(channel => (
                <ChannelCard key={channel.id} channel={channel} active={selected?.id === channel.id} onSelect={setSelected} />
              ))}
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}