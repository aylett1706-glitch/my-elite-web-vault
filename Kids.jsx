import { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import Navbar from '@/components/layout/Navbar';
import MediaCarousel from '@/components/home/MediaCarousel';
import { Link } from 'react-router-dom';
import { Film, Play, Plus, Search, Sparkles } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import KidsContentModal from '@/components/kids/KidsContentModal';

const KIDS_CACHE_KEY = 'ev_kids_family_cache_v1';
const AGE_GROUPS = ['All', 'All Ages', '3+', '7+', '10+', '13+'];
const AGE_ORDER = { 'All Ages': 0, '3+': 3, '7+': 7, '10+': 10, '13+': 13 };
const RATING_TO_AGE = {
  G: 'All Ages',
  PG: '7+',
  M: '13+',
  'TV-Y': 'All Ages',
  'TV-Y7': '7+',
  'TV-G': 'All Ages',
  'TV-PG': '10+',
  'TV-14': '13+'
};

const getItemAgeGroup = (item) => item.kids_age_group || RATING_TO_AGE[item.content_rating] || 'All Ages';

const getCache = () => {
  const cached = sessionStorage.getItem(KIDS_CACHE_KEY);
  return cached ? JSON.parse(cached) : [];
};

const isKidsFamily = (item) => item.is_kids === true && item.is_adult !== true;

export default function Kids() {
  const [user, setUser] = useState(null);
  const [items, setItems] = useState(getCache);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAge, setSelectedAge] = useState('All');
  const [selectedType, setSelectedType] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [me, media] = await Promise.all([
        base44.auth.me().catch(() => null),
        base44.entities.Media.filter({ status: 'approved' }, '-created_date', 200)
      ]);
      const safeItems = media.filter(isKidsFamily);
      setUser(me);
      setItems(safeItems);
      sessionStorage.setItem(KIDS_CACHE_KEY, JSON.stringify(safeItems));
    };
    load();
  }, []);

  const filteredItems = useMemo(() => items.filter(item => {
    const selectedAgeValue = AGE_ORDER[selectedAge];
    const itemAgeValue = AGE_ORDER[getItemAgeGroup(item)] ?? 0;
    const ageMatch = selectedAge === 'All' || itemAgeValue <= selectedAgeValue;
    const typeMatch = selectedType === 'all' || item.type === selectedType;
    const text = `${item.title || ''} ${item.synopsis || ''} ${(item.genres || []).join(' ')} ${item.content_rating || ''}`.toLowerCase();
    const searchMatch = !searchQuery.trim() || text.includes(searchQuery.trim().toLowerCase());
    return ageMatch && typeMatch && searchMatch;
  }), [items, searchQuery, selectedAge, selectedType]);

  const featured = useMemo(() => filteredItems.filter(item => item.is_featured).slice(0, 8), [filteredItems]);
  const movies = useMemo(() => filteredItems.filter(item => item.type === 'movie'), [filteredItems]);
  const shows = useMemo(() => filteredItems.filter(item => item.type === 'tv_show'), [filteredItems]);
  const recent = useMemo(() => [...filteredItems].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 20), [filteredItems]);
  const hero = featured[0] || recent[0];

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      <AnimatePresence>
        {showAddModal && (
          <KidsContentModal
            onClose={() => setShowAddModal(false)}
            onAdded={(item) => setItems(prev => [item, ...prev])}
          />
        )}
      </AnimatePresence>
      <section className="relative overflow-hidden px-4 pb-12 pt-28 md:px-8 md:pt-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(245,184,61,0.18),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(147,51,234,0.16),transparent_30%)]" />
        <div className="relative mx-auto grid max-w-screen-2xl gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary">
              <Sparkles className="h-4 w-4" /> Kids & Family
            </div>
            <h1 className="font-bebas text-6xl tracking-wider text-foreground md:text-8xl">Family Movie Time</h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
              A dedicated safe space for animation, family adventures, fun shows, and kid-friendly movies only.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              {hero && (
                <>
                  <Link to={`/watch/${hero.id}`} className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90">
                    <Play className="h-4 w-4 fill-current" /> Watch Now
                  </Link>
                  <Link to={`/media/${hero.id}`} className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary px-6 py-3 text-sm font-semibold text-foreground hover:bg-secondary/70">
                    More Info
                  </Link>
                </>
              )}
              <button onClick={() => setShowAddModal(true)} className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-bold text-accent-foreground hover:bg-accent/90">
                <Plus className="h-4 w-4" /> Add Kids Content
              </button>
            </div>
          </div>
          <div className="relative aspect-video overflow-hidden rounded-[2rem] border border-primary/20 bg-secondary shadow-2xl">
            {hero?.backdrop_url || hero?.poster_url ? (
              <img src={hero.backdrop_url || hero.poster_url} alt={hero.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center"><Film className="h-16 w-16 text-muted-foreground" /></div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Featured Pick</p>
              <h2 className="mt-1 text-2xl font-bold text-white">{hero?.title || 'Add family content to begin'}</h2>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-screen-2xl px-4 md:px-8 pb-6">
        <div className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-foreground">
            <Search className="h-4 w-4 text-primary" /> Filter Kids Library
          </div>
          <div className="relative min-w-0 flex-1 md:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search kids titles, genres, ratings..."
              className="w-full rounded-full border border-border bg-secondary py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {AGE_GROUPS.map(age => (
              <button key={age} onClick={() => setSelectedAge(age)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${selectedAge === age ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>{age === 'All' ? 'All ages' : `Up to ${age}`}</button>
            ))}
          </div>
          <div className="flex gap-2">
            {[
              ['all', 'All'],
              ['movie', 'Movies'],
              ['tv_show', 'TV Shows']
            ].map(([value, label]) => (
              <button key={value} onClick={() => setSelectedType(value)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${selectedType === value ? 'bg-accent text-accent-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>{label}</button>
            ))}
          </div>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="mx-auto max-w-xl px-4 py-20 text-center">
          <Film className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="text-2xl font-bold text-foreground">No kids or family titles yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">Use the Add Kids Content button to add kids movies and kids TV shows separately from the main library.</p>
          <button onClick={() => setShowAddModal(true)} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Add Kids Content
          </button>
        </div>
      ) : (
        <div className="pb-16">
          <MediaCarousel title="Family Favourites" items={featured.length ? featured : recent} />
          <MediaCarousel title="Kids Movies" items={movies} />
          <MediaCarousel title="Family TV Shows" items={shows} />
          <MediaCarousel title="Recently Added for Kids" items={recent} />
        </div>
      )}
    </div>
  );
}