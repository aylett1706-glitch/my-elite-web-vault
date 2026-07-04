import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import Navbar from '@/components/layout/Navbar';
import { Check, Database, Film, Loader2, Plus, Search, Sparkles, Star, Tv } from 'lucide-react';
import HubCategoryChips from '@/components/hubs/HubCategoryChips';
import HubContentRow from '@/components/hubs/HubContentRow';

const animeTerms = ['anime', 'manga', 'japanese animation', 'japanimation', 'shonen', 'shojo', 'seinen', 'isekai', 'studio ghibli', 'crunchyroll'];
const ANIME_CATEGORIES = [
  { label: 'All Anime', value: 'all' },
  { label: 'Series', value: 'series' },
  { label: 'Movies', value: 'movies' },
  { label: 'Featured', value: 'featured' },
  { label: 'Recent', value: 'recent' }
];

export default function Anime() {
  const [user, setUser] = useState(null);
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiQuery, setAiQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResults, setAiResults] = useState([]);
  const [deepSearch, setDeepSearch] = useState(true);
  const [addedTitles, setAddedTitles] = useState(new Set());
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    const load = async () => {
      const [me, items] = await Promise.all([
        base44.auth.me().catch(() => null),
        base44.entities.Media.filter({ status: 'approved' }, '-created_date', 200)
      ]);
      setUser(me);
      setMedia(items.filter(item => !item.is_adult));
      setLoading(false);
    };
    load();
  }, []);

  const anime = useMemo(() => media.filter(item => {
    const haystack = [item.title, item.synopsis, item.collection_name, ...(item.genres || []), ...(item.related_keywords || [])].join(' ').toLowerCase();
    return animeTerms.some(term => haystack.includes(term));
  }), [media]);

  const featured = anime.find(item => item.is_featured) || anime[0];
  const categoryAnime = useMemo(() => anime.filter(item => {
    if (activeCategory === 'series') return item.type === 'tv_show';
    if (activeCategory === 'movies') return item.type === 'movie';
    if (activeCategory === 'featured') return item.is_featured;
    if (activeCategory === 'recent') return true;
    return true;
  }), [anime, activeCategory]);
  const animeRows = [
    { title: 'Anime Series', description: 'Multi-episode anime and long-running shows.', items: anime.filter(item => item.type === 'tv_show') },
    { title: 'Anime Movies', description: 'Standalone films, specials, and cinematic anime.', items: anime.filter(item => item.type === 'movie') },
    { title: 'Featured Picks', description: 'Highlighted anime from your library.', items: anime.filter(item => item.is_featured) }
  ];

  const searchAnime = async (e) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    const res = await base44.functions.invoke('animeMangaSearch', { query: aiQuery, type: 'anime', deep: deepSearch, limit: deepSearch ? 24 : 12 });
    setAiResults(res.data?.results || []);
    setAiLoading(false);
  };

  const addAnime = async (item) => {
    const created = await base44.entities.Media.create({ ...item, status: 'approved', is_adult: false, views: 0 });
    setMedia(prev => [created, ...prev]);
    setAddedTitles(prev => new Set([...prev, item.title]));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      <main className="mx-auto max-w-screen-2xl px-4 pb-16 pt-24 md:px-8">
        <section className="mb-8 overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-card via-card to-violet-500/10 p-6 md:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Anime Vault
          </div>
          <div className="mt-5 grid gap-6 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
            <div>
              <h1 className="font-bebas text-5xl tracking-wider text-foreground md:text-7xl">Anime</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">A dedicated home for anime movies, series, hidden gems, Japanese animation, and anime-inspired collections inside EliteVault — separate from Kids movies and TV shows.</p>
            </div>
            {featured && (
              <Link to={`/media/${featured.id}`} className="group rounded-3xl border border-white/10 bg-black/25 p-4 hover:border-primary/40">
                <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary"><Star className="h-3.5 w-3.5" /> Featured Anime</p>
                <div className="flex gap-4">
                  <div className="h-28 w-20 overflow-hidden rounded-2xl bg-secondary">
                    {featured.poster_url ? <img src={featured.poster_url} alt={featured.title} className="h-full w-full object-cover" /> : <Film className="m-auto mt-10 h-7 w-7 text-muted-foreground" />}
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate text-xl font-black text-foreground group-hover:text-primary">{featured.title}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">{featured.year} · {featured.type === 'tv_show' ? 'Series' : 'Movie'}</p>
                    <p className="mt-2 line-clamp-3 text-xs text-muted-foreground">{featured.synopsis}</p>
                  </div>
                </div>
              </Link>
            )}
          </div>
        </section>

        <section className="mb-8 rounded-3xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" />
              <h2 className="text-lg font-black text-foreground">AI Anime Search & Add</h2>
            </div>
            <form onSubmit={searchAnime} className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input value={aiQuery} onChange={e => setAiQuery(e.target.value)} placeholder="Deep search anime, studios, genres, themes, characters..." className="w-full rounded-xl border border-border bg-secondary py-3 pl-10 pr-4 text-sm text-foreground" />
                </div>
                <button disabled={aiLoading || !aiQuery.trim()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-black text-primary-foreground disabled:opacity-50">
                  {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} {deepSearch ? 'Deep Search' : 'Search'}
                </button>
              </div>
              <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                <input type="checkbox" checked={deepSearch} onChange={e => setDeepSearch(e.target.checked)} className="h-4 w-4 accent-primary" />
                Deep search: expands results with themes, studios, rankings, popularity, episodes, source material and extra matches.
              </label>
            </form>
            {aiResults.length > 0 && (
              <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {aiResults.map(item => {
                  const added = addedTitles.has(item.title) || anime.some(existing => existing.title?.toLowerCase() === item.title?.toLowerCase());
                  return (
                    <div key={item.title} className="flex gap-3 rounded-2xl border border-border bg-secondary/50 p-3">
                      <div className="h-24 w-16 shrink-0 overflow-hidden rounded-xl bg-secondary">{item.poster_url && <img src={item.poster_url} alt={item.title} className="h-full w-full object-cover" />}</div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-bold text-foreground">{item.title}</h3>
                        <p className="text-xs text-muted-foreground">{item.year || 'Anime'} · ⭐ {item.rating || '—'} · {item.type === 'tv_show' ? 'Series' : 'Movie'}</p>
                        <p className="mt-1 line-clamp-3 text-xs text-muted-foreground whitespace-pre-line">{item.synopsis}</p>
                        {item.genres?.length > 0 && <p className="mt-2 line-clamp-1 text-[11px] font-bold text-primary">{item.genres.slice(0, 5).join(' • ')}</p>}
                        <button onClick={() => !added && addAnime(item)} className={`mt-2 inline-flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-bold ${added ? 'bg-green-500/20 text-green-400' : 'bg-primary text-primary-foreground'}`}>
                          {added ? <><Check className="h-3 w-3" /> Added</> : <><Plus className="h-3 w-3" /> Add Anime</>}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

        <div className="mb-6 space-y-6">
          <HubCategoryChips categories={ANIME_CATEGORIES} active={activeCategory} onChange={setActiveCategory} />
          {animeRows.map(row => (
            <HubContentRow key={row.title} title={row.title} description={row.description} items={row.items}>
              {(item) => (
                <Link key={item.id} to={`/media/${item.id}`} className="group w-36 shrink-0">
                  <div className="aspect-[2/3] overflow-hidden rounded-2xl bg-secondary shadow-lg transition-transform group-hover:scale-105">
                    {item.poster_url ? <img src={item.poster_url} alt={item.title} className="h-full w-full object-cover" loading="lazy" /> : <div className="flex h-full items-center justify-center"><Film className="h-8 w-8 text-muted-foreground" /></div>}
                  </div>
                  <h3 className="mt-2 truncate text-sm font-bold text-foreground group-hover:text-primary">{item.title}</h3>
                </Link>
              )}
            </HubContentRow>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="h-9 w-9 animate-spin rounded-full border-2 border-primary/30 border-t-primary" /></div>
        ) : anime.length === 0 ? (
          <div className="rounded-3xl border border-border bg-card p-10 text-center">
            <Tv className="mx-auto mb-3 h-10 w-10 text-primary" />
            <h2 className="text-xl font-black text-foreground">No anime added yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">Add titles with Anime-specific genres, tags, or keywords and they’ll appear here automatically.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
            {categoryAnime.map(item => (
              <Link key={item.id} to={`/media/${item.id}`} className="group">
                <div className="aspect-[2/3] overflow-hidden rounded-2xl bg-secondary shadow-lg transition-transform group-hover:scale-105">
                  {item.poster_url ? <img src={item.poster_url} alt={item.title} className="h-full w-full object-cover" loading="lazy" /> : <div className="flex h-full items-center justify-center"><Film className="h-8 w-8 text-muted-foreground" /></div>}
                </div>
                <h3 className="mt-2 truncate text-sm font-bold text-foreground group-hover:text-primary">{item.title}</h3>
                <p className="text-xs text-muted-foreground">{item.year} · {item.type === 'tv_show' ? 'Series' : 'Movie'}</p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}