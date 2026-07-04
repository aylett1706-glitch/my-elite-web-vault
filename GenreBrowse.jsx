import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Film, Star, ArrowLeft, SlidersHorizontal, X } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import { motion } from 'framer-motion';
import { deriveMediaTopics } from '@/lib/media-classification';

const SORT_OPTIONS = [
  { label: 'Newest Added', value: 'newest' },
  { label: 'Highest Rated', value: 'rating' },
  { label: 'Most Viewed', value: 'views' },
  { label: 'Year (Newest)', value: 'year_desc' },
  { label: 'A–Z', value: 'az' },
];

const sortItems = (items, sort) => {
  const arr = [...items];
  switch (sort) {
    case 'rating': return arr.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    case 'views': return arr.sort((a, b) => (b.views || 0) - (a.views || 0));
    case 'year_desc': return arr.sort((a, b) => (b.year || 0) - (a.year || 0));
    case 'az': return arr.sort((a, b) => a.title.localeCompare(b.title));
    default: return arr.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  }
};

export default function GenreBrowse() {
  const { genre } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('newest');
  const [typeFilter, setTypeFilter] = useState('all');

  const decodedGenre = decodeURIComponent(genre || '');

  useEffect(() => {
    const load = async () => {
      const [me, media] = await Promise.all([
        base44.auth.me().catch(() => null),
        base44.entities.Media.filter({ status: 'approved' }, '-created_date', 300)
      ]);
      setUser(me);
      // Filter by genre or topic and exclude adult
      setItems(media.filter(m => !m.is_adult && (m.genres?.includes(decodedGenre) || deriveMediaTopics(m).includes(decodedGenre))));
      setLoading(false);
    };
    load();
  }, [decodedGenre]);

  const filtered = useMemo(() => {
    let result = typeFilter === 'all' ? items : items.filter(m => m.type === typeFilter);
    return sortItems(result, sort);
  }, [items, sort, typeFilter]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      <div className="pt-24 max-w-screen-2xl mx-auto px-4 md:px-8 pb-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-secondary rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <h1 className="font-bebas text-5xl text-foreground">{decodedGenre}</h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Type toggle */}
            <div className="flex bg-secondary rounded-xl p-1 gap-1">
              {[{ label: 'All', value: 'all' }, { label: 'Movies', value: 'movie' }, { label: 'Shows', value: 'tv_show' }].map(t => (
                <button key={t.value} onClick={() => setTypeFilter(t.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${typeFilter === t.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                  {t.label}
                </button>
              ))}
            </div>

            <select value={sort} onChange={e => setSort(e.target.value)}
              className="bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/60">
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Film className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-semibold text-foreground mb-2">No {decodedGenre} titles yet</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">{filtered.length} title{filtered.length !== 1 ? 's' : ''}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4">
              {filtered.map((item, i) => (
                <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.02, 0.4) }}>
                  <Link to={`/media/${item.id}`} className="group block">
                    <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-secondary mb-2 group-hover:scale-105 transition-all duration-300 shadow-md group-hover:shadow-xl">
                      {item.poster_url
                        ? <img src={item.poster_url} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
                        : <div className="w-full h-full flex items-center justify-center"><Film className="w-8 h-8 text-muted-foreground" /></div>
                      }
                      {item.rating && (
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 flex items-center justify-center">
                          <span className="flex items-center gap-1 text-yellow-400 font-bold text-sm">
                            <Star className="w-4 h-4 fill-yellow-400" />{item.rating.toFixed(1)}
                          </span>
                        </div>
                      )}
                      {item.type === 'tv_show' && (
                        <div className="absolute top-2 left-2 px-2 py-0.5 bg-primary/80 text-primary-foreground text-xs font-bold rounded-lg">TV</div>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">{item.title}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {[...new Set([...(item.genres || []), ...deriveMediaTopics(item)])].slice(0, 3).map(label => (
                        <span key={label} className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">{label}</span>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">{item.year}</p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}