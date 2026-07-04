import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Film, Tv, Star, ArrowLeft, SlidersHorizontal, X, Search, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import AISearchModalAdvanced from '@/components/admin/AISearchModalAdvanced';
import EmptyState from '@/components/common/EmptyState';
import MediaBadges from '@/components/media/MediaBadges';
import HubCategoryChips from '@/components/hubs/HubCategoryChips';
import HubContentRow from '@/components/hubs/HubContentRow';
import { deriveMediaTopics, getLibraryTopics } from '@/lib/media-classification';
import { filterMainAppSafeMedia } from '@/lib/content-safety';

const DEFAULT_GENRES = ['Action', 'Adventure', 'Animation', 'Anime', 'Award Winning', 'Comedy', 'Crime', 'Documentary', 'Drama', 'Family', 'Fantasy', 'Gourmet', 'Horror', 'Kids', 'Music', 'Mystery', 'Nature', 'Reality', 'Romance', 'Sci-Fi', 'Science Fiction', 'Sports', 'Supernatural', 'Suspense', 'Talk', 'Thriller', 'War', 'Western'];

const isCleanGenre = (value) => {
  const genre = String(value || '').trim();
  if (!genre) return false;
  if (DEFAULT_GENRES.includes(genre)) return true;
  if (genre.length > 24) return false;
  if (/[:;!?()]/.test(genre)) return false;
  if (genre.split(/\s+/).length > 3) return false;
  if (/\b(movie|film|episode|season|naruto|dragon ball|pokemon|yu-gi-oh|one piece|boruto)\b/i.test(genre)) return false;
  return /^[a-z0-9&' -]+$/i.test(genre);
};

const SORT_OPTIONS = [
  { label: 'Newest Added', value: 'newest' },
  { label: 'Highest TMDB Rated', value: 'rating' },
  { label: 'Highest IMDb Rated', value: 'imdb' },
  { label: 'Highest User Rated', value: 'user_rating' },
  { label: 'Most Viewed', value: 'views' },
  { label: 'Year (Newest)', value: 'year_desc' },
  { label: 'Year (Oldest)', value: 'year_asc' },
  { label: 'A–Z', value: 'az' },
  { label: 'Z–A', value: 'za' },
];

const BROWSE_CATEGORIES = [
  { label: 'All', value: 'all' },
  { label: 'Featured', value: 'featured' },
  { label: 'Trending', value: 'trending' },
  { label: 'Movies', value: 'movies' },
  { label: 'Series', value: 'series' },
];

const sortItems = (items, sort) => {
  const arr = [...items];
  switch (sort) {
    case 'rating': return arr.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    case 'imdb': return arr.sort((a, b) => (b.imdb_rating || b.rating || 0) - (a.imdb_rating || a.rating || 0));
    case 'user_rating': return arr.sort((a, b) => (b.user_rating_average || 0) - (a.user_rating_average || 0));
    case 'views': return arr.sort((a, b) => (b.views || 0) - (a.views || 0));
    case 'year_desc': return arr.sort((a, b) => (b.year || 0) - (a.year || 0));
    case 'year_asc': return arr.sort((a, b) => (a.year || 0) - (b.year || 0));
    case 'az': return arr.sort((a, b) => a.title.localeCompare(b.title));
    case 'za': return arr.sort((a, b) => b.title.localeCompare(a.title));
    default: return arr.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  }
};

export default function Browse({ mediaType }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(true);
  const [showAISearch, setShowAISearch] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');

  // Filters
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  const [minRating, setMinRating] = useState('');
  const [sort, setSort] = useState('newest');

  useEffect(() => {
    const load = async () => {
      const [me, media] = await Promise.all([
        base44.auth.me().catch(() => null),
        (async () => {
          const filter = { status: 'approved' };
          if (mediaType) filter.type = mediaType;
          return await base44.entities.Media.filter(filter, '-created_date', 200);
        })()
      ]);
      setUser(me);
      setItems(filterMainAppSafeMedia(media));
      setLoading(false);
    };
    load();
  }, [mediaType]);

  const availableGenres = useMemo(() => {
    const fromLibrary = items.flatMap(item => item.genres || []).filter(isCleanGenre);
    return [...new Set([...DEFAULT_GENRES, ...fromLibrary])].sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filtered = useMemo(() => {
    let result = items;

    if (selectedGenres.length > 0) {
      result = result.filter(item => selectedGenres.some(g => item.genres?.includes(g) || deriveMediaTopics(item).includes(g)));
    }
    if (yearFrom) result = result.filter(item => (item.year || 0) >= parseInt(yearFrom));
    if (yearTo) result = result.filter(item => (item.year || 0) <= parseInt(yearTo));
    if (minRating) result = result.filter(item => (item.rating || 0) >= parseFloat(minRating));

    return sortItems(result, sort);
  }, [items, selectedGenres, yearFrom, yearTo, minRating, sort]);

  const toggleGenre = (g) => {
    setSelectedGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
  };

  const clearFilters = () => {
    setSelectedGenres([]);
    setYearFrom('');
    setYearTo('');
    setMinRating('');
    setSort('newest');
  };

  const categoryFiltered = useMemo(() => filtered.filter(item => {
    if (activeCategory === 'featured') return item.is_featured;
    if (activeCategory === 'trending') return item.is_trending || (item.views || 0) > 0;
    if (activeCategory === 'movies') return item.type === 'movie';
    if (activeCategory === 'series') return item.type === 'tv_show';
    return true;
  }), [filtered, activeCategory]);

  const featured = filtered.filter(item => item.is_featured);
  const trending = filtered.filter(item => item.is_trending || (item.views || 0) > 0).slice(0, 20);
  const recent = filtered.slice(0, 20);
  
  const browseRows = [
    { title: 'Featured', description: 'Highlighted picks from this hub.', items: featured },
    { title: 'Trending', description: 'Popular and recently watched titles.', items: trending },
    { title: 'Recently Added', description: 'Newest titles added to the library.', items: recent }
  ];

  const activeFilterCount = selectedGenres.length + (yearFrom ? 1 : 0) + (yearTo ? 1 : 0) + (minRating ? 1 : 0) + (sort !== 'newest' ? 1 : 0);

  const reloadItems = async () => {
    const filter = { status: 'approved' };
    if (mediaType) filter.type = mediaType;
    const media = await base44.entities.Media.filter(filter, '-created_date', 200);
    setItems(filterMainAppSafeMedia(media));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      <AnimatePresence>
        {showAISearch && (
          <AISearchModalAdvanced onClose={() => setShowAISearch(false)} onAdded={reloadItems} defaultType={mediaType} />
        )}
      </AnimatePresence>
      <div className="pt-24 max-w-screen-2xl mx-auto px-4 md:px-8 pb-16">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="p-2 hover:bg-secondary rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-muted-foreground hover:text-foreground" />
            </button>
            {mediaType === 'movie' ? <Film className="w-6 h-6 text-primary" /> : mediaType === 'tv_show' ? <Tv className="w-6 h-6 text-primary" /> : null}
            <h1 className="font-bebas text-5xl text-foreground">
              {mediaType === 'movie' ? 'Movies' : mediaType === 'tv_show' ? 'TV Shows' : 'All Media'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAISearch(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/20 border border-primary/30 text-primary text-sm font-medium hover:bg-primary/30 transition-colors"
            >
              <Search className="w-4 h-4" />
              Search & Add
            </button>
          <button
            onClick={() => setShowFilters(f => !f)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${
              showFilters || activeFilterCount > 0
                ? 'bg-primary/10 border-primary/40 text-primary'
                : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl p-6 mb-6 space-y-5"
          >
            {/* Sort + Year + Rating row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Sort By</label>
                <select value={sort} onChange={e => setSort(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/60">
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Year From</label>
                <input type="number" placeholder="e.g. 2000" value={yearFrom} onChange={e => setYearFrom(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Year To</label>
                <input type="number" placeholder="e.g. 2024" value={yearTo} onChange={e => setYearTo(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Min Rating</label>
                <select value={minRating} onChange={e => setMinRating(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/60">
                  <option value="">Any</option>
                  {[9, 8, 7, 6, 5].map(r => <option key={r} value={r}>⭐ {r}+</option>)}
                </select>
              </div>
            </div>

            {/* Genres */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-2">Genres</label>
              <div className="max-h-28 overflow-y-auto pr-1 flex flex-wrap gap-2 scrollbar-hide">
                {availableGenres.map(g => (
                  <button key={g} onClick={() => toggleGenre(g)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      selectedGenres.includes(g)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                    }`}>
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear */}
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-3.5 h-3.5" /> Clear all filters
              </button>
            )}
          </motion.div>
        )}

        <div className="mb-6 space-y-6">
          <HubCategoryChips categories={BROWSE_CATEGORIES} active={activeCategory} onChange={setActiveCategory} />
          {browseRows.map(row => (
            <HubContentRow key={row.title} title={row.title} description={row.description} items={row.items}>
              {(item) => (
                <Link key={item.id} to={`/media/${item.id}`} className="group w-36 shrink-0">
                  <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-secondary shadow-lg transition-transform group-hover:scale-105">
                    {item.poster_url ? <img src={item.poster_url} alt={item.title} className="h-full w-full object-cover" loading="lazy" /> : <div className="flex h-full items-center justify-center"><Film className="h-8 w-8 text-muted-foreground" /></div>}
                  </div>
                  <h3 className="mt-2 truncate text-sm font-bold text-foreground group-hover:text-primary">{item.title}</h3>
                </Link>
              )}
            </HubContentRow>
          ))}
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">{categoryFiltered.length} title{categoryFiltered.length !== 1 ? 's' : ''}</p>
            {categoryFiltered.length === 0 ? (
              <EmptyState
                icon={Film}
                title="No results"
                message="Try adjusting your filters to discover more titles."
                action={<button onClick={clearFilters} className="text-sm font-bold text-primary hover:underline">Clear filters</button>}
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4">
                {categoryFiltered.map((item, i) => (
                  <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.02, 0.4) }}>
                    <Link to={`/media/${item.id}`} className="group block">
                      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-secondary mb-2 group-hover:scale-105 transition-all duration-300 shadow-md group-hover:shadow-xl">
                        {item.poster_url
                          ? <img src={item.poster_url} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
                          : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary to-muted"><Film className="w-8 h-8 text-muted-foreground" /></div>
                        }
                        <div className="absolute left-2 top-2">
                          <MediaBadges item={item} compact />
                        </div>
                        {item.rating && (
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 flex items-center justify-center">
                            <span className="flex items-center gap-1 text-yellow-400 font-bold text-sm">
                              <Star className="w-4 h-4 fill-yellow-400" />{item.rating.toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">{item.title}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {[...new Set([...(item.genres || []), ...deriveMediaTopics(item)])].slice(0, 3).map(genre => (
                          <span key={genre} className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">{genre}</span>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">{item.year}{(item.imdb_rating || item.rating) ? ` • IMDb ${(item.imdb_rating || item.rating).toFixed(1)}` : ''}</p>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}