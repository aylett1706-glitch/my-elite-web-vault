import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import Navbar from '@/components/layout/Navbar';
import { Check, Film, Loader2, Plus, RefreshCw, Search, Sparkles, Star, TrendingUp, Tv } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { filterMainAppSafeMedia, isAdultRated } from '@/lib/content-safety';

const GENRES = ['Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary', 'Drama', 'Family', 'Fantasy', 'Horror', 'Mystery', 'Romance', 'Science Fiction', 'Thriller'];

export default function Spotlight() {
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [libraryItems, setLibraryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(new Set());
  const [type, setType] = useState('');
  const [genre, setGenre] = useState('');

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const loadSpotlight = async () => {
    setLoading(true);
    const [popular, library] = await Promise.all([
      base44.functions.invoke('tmdbSearch', { mode: 'popular', type, genres: genre ? [genre] : [], limit: 72 }),
      base44.entities.Media.filter({ status: 'approved' }, '-created_date', 500)
    ]);
    setItems(filterMainAppSafeMedia(popular.data?.results || []));
    setLibraryItems(library || []);
    setLoading(false);
  };

  useEffect(() => {
    loadSpotlight();
  }, [type, genre]);

  const libraryKeys = useMemo(() => new Set(libraryItems.map(item => `${item.type}:${String(item.tmdb_id || item.title).toLowerCase()}`)), [libraryItems]);

  const addToLibrary = async (item) => {
    setAdding(prev => new Set([...prev, item.title]));
    const created = await base44.entities.Media.create({
      title: item.title,
      type: item.type,
      synopsis: item.synopsis,
      year: item.year,
      rating: item.rating,
      imdb_rating: item.imdb_rating,
      genres: item.genres,
      cast: item.cast,
      director: item.director,
      poster_url: item.poster_url,
      backdrop_url: item.backdrop_url,
      video_url: item.video_url || '',
      trailer_url: item.trailer_url || '',
      content_rating: item.content_rating || '',
      age_rating_country: item.age_rating_country || '',
      tmdb_id: item.tmdb_id || '',
      imdb_id: item.imdb_id || '',
      duration_minutes: item.duration_minutes,
      seasons: item.seasons,
      collection_name: item.collection_name || '',
      collection_key: item.collection_key || '',
      related_keywords: item.related_keywords || [],
      streaming_platforms: item.streaming_platforms || [],
      watch_provider_region: item.watch_provider_region || 'AU',
      source_url: item.source_url || '',
      status: 'approved',
      is_adult: isAdultRated(item),
      views: 0,
      language: item.language || 'en'
    });
    setLibraryItems(prev => [created, ...prev]);
    setAdding(prev => { const next = new Set(prev); next.delete(item.title); return next; });
    toast.success(`"${item.title}" added to library`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar user={user} />
      <main className="mx-auto max-w-screen-2xl px-4 pb-20 pt-24 md:px-8">
        <section className="mb-6 overflow-hidden rounded-3xl border border-primary/25 bg-card/80 p-5 elite-panel md:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] text-primary"><TrendingUp className="h-4 w-4" /> Spotlight Hub</p>
              <h1 className="mt-2 text-4xl font-black md:text-6xl">Popular right now</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">Browse trending movies and TV shows, filter by type or genre, then add anything you want straight into your library.</p>
            </div>
            <Link to="/search" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-primary/30 bg-primary/15 px-5 text-sm font-bold text-primary hover:bg-primary/25">
              <Search className="h-4 w-4" /> Advanced Search
            </Link>
          </div>
        </section>

        <section className="mb-6 rounded-3xl border border-border bg-card/70 p-4 md:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              {[
                ['', 'All'],
                ['movie', 'Movies'],
                ['tv_show', 'TV Shows']
              ].map(([value, label]) => (
                <button key={label} type="button" onClick={() => setType(value)} className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-black ${type === value ? 'bg-primary text-primary-foreground' : 'border border-border bg-secondary text-muted-foreground hover:text-foreground'}`}>
                  {value === 'movie' ? <Film className="h-4 w-4" /> : value === 'tv_show' ? <Tv className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}{label}
                </button>
              ))}
            </div>
            <button type="button" onClick={loadSpotlight} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border bg-secondary px-4 text-sm font-bold text-muted-foreground hover:text-foreground">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button type="button" onClick={() => setGenre('')} className={`shrink-0 rounded-full px-4 py-2 text-xs font-black ${!genre ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>All genres</button>
            {GENRES.map(item => <button key={item} type="button" onClick={() => setGenre(item)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-black ${genre === item ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>{item}</button>)}
          </div>
        </section>

        {loading ? (
          <div className="flex min-h-[360px] items-center justify-center rounded-3xl border border-border bg-card/50">
            <div className="text-center"><Loader2 className="mx-auto h-9 w-9 animate-spin text-primary" /><p className="mt-3 text-sm text-muted-foreground">Loading what’s popular...</p></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {items.map((item, index) => {
              const key = `${item.type}:${String(item.tmdb_id || item.title).toLowerCase()}`;
              const inLibrary = libraryKeys.has(key);
              const isAdding = adding.has(item.title);
              return (
                <motion.article key={`${item.type}-${item.tmdb_id || item.title}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.025, 0.35) }} className="group overflow-hidden rounded-3xl border border-border bg-card/80">
                  <Link to={`/search?q=${encodeURIComponent(item.title)}`} className="block">
                    <div className="relative aspect-[2/3] bg-secondary">
                      {item.poster_url ? <img src={item.poster_url} alt={item.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" /> : <div className="flex h-full w-full items-center justify-center"><Film className="h-8 w-8 text-muted-foreground" /></div>}
                      <div className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-1 text-[10px] font-black uppercase text-white backdrop-blur">{item.type === 'tv_show' ? 'TV' : 'Movie'}</div>
                      {item.rating ? <div className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-[10px] font-black text-yellow-300 backdrop-blur"><Star className="h-3 w-3 fill-yellow-300" />{Number(item.rating).toFixed(1)}</div> : null}
                    </div>
                  </Link>
                  <div className="space-y-2 p-3">
                    <h2 className="line-clamp-2 min-h-[2.5rem] text-sm font-black text-foreground">{item.title}</h2>
                    <p className="text-xs text-muted-foreground">{item.year || 'Popular'}{item.collection_name ? ` • ${item.collection_name}` : ''}</p>
                    <button type="button" disabled={inLibrary || isAdding} onClick={() => addToLibrary(item)} className={`inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-2xl text-xs font-black ${inLibrary ? 'bg-green-500/15 text-green-300' : 'bg-primary text-primary-foreground hover:bg-primary/90'} disabled:cursor-default`}>
                      {isAdding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : inLibrary ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                      {inLibrary ? 'In Library' : isAdding ? 'Adding...' : 'Add'}
                    </button>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}