import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Play, Star, Clock, Film, Trash2, ChevronDown, Sparkles } from 'lucide-react';
import TVSeriesSearchModal from '@/components/media/TVSeriesSearchModal';
import TVEpisodeManager from '@/components/admin/TVEpisodeManager';
import TrailerEmbed from '@/components/media/TrailerEmbed';
import LinkedMediaSection from '@/components/media/LinkedMediaSection';
import MediaBadges from '@/components/media/MediaBadges';
import TrustedMediaLinks from '@/components/media/TrustedMediaLinks';
import Navbar from '@/components/layout/Navbar';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { canAccessAdultContent, isAdultRated, filterMainAppSafeMedia } from '@/lib/content-safety';

export default function MediaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [media, setMedia] = useState(null);
  const [user, setUser] = useState(null);
  const [related, setRelated] = useState([]);
  const [linkedItems, setLinkedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [showSeriesSearch, setShowSeriesSearch] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [me, item] = await Promise.all([
        base44.auth.me().catch(() => null),
        base44.entities.Media.get(id)
      ]);
      setUser(me);
      if (item && isAdultRated(item) && !canAccessAdultContent()) {
        navigate('/vault');
        return;
      }
      setMedia(item);
      if (item) {
        const rel = await base44.entities.Media.filter({ type: item.type, status: 'approved' }, '-views', 10);
        setRelated(filterMainAppSafeMedia(rel).filter(r => r.id !== id).slice(0, 6));
        if (item.collection_key) {
          const linked = await base44.entities.Media.filter({ collection_key: item.collection_key, status: 'approved' }, 'year', 30);
          setLinkedItems(filterMainAppSafeMedia(linked).filter(r => r.id !== id));
        } else {
          setLinkedItems([]);
        }
      }
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) return (
    <div className="fixed inset-0 bg-background flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (!media) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-muted-foreground">Media not found</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      {showSeriesSearch && media && (
        <TVSeriesSearchModal
          media={media}
          onClose={() => setShowSeriesSearch(false)}
          onEpisodeSaved={(episodes) => setMedia(m => ({ ...m, episodes }))}
        />
      )}

      {/* Backdrop */}
      <div className="relative h-[60vh] w-full overflow-hidden">
        {media.backdrop_url ? (
          <img src={media.backdrop_url} alt={media.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-secondary to-background" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/40" />
      </div>

      {/* Content */}
      <div className="max-w-screen-xl mx-auto px-4 md:px-8 -mt-72 relative z-10 pb-16">
        <button
          onClick={() => navigate(-1)}
          className="mb-5 inline-flex items-center gap-2 rounded-xl border border-border bg-background/70 px-4 py-2 text-sm font-semibold text-foreground backdrop-blur hover:bg-secondary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row gap-8"
        >
          {/* Poster */}
          <div className="shrink-0">
            <div className="w-48 md:w-64 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl shadow-black/60 border border-white/10">
              {media.poster_url ? (
                <img src={media.poster_url} alt={media.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-secondary flex items-center justify-center">
                  <Film className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 pt-4 md:pt-32">
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <span className="px-2 py-0.5 bg-primary/20 border border-primary/30 text-primary text-xs font-bold rounded uppercase tracking-wider">
                {media.type === 'tv_show' ? 'TV Show' : 'Movie'}
              </span>
              {media.year && <span className="text-muted-foreground text-sm">{media.year}</span>}
              <MediaBadges item={media} />
            </div>

            <h1 className="font-bebas text-5xl md:text-6xl tracking-wide text-foreground mb-4">{media.title}</h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 mb-5 text-sm text-muted-foreground">
              {media.rating && (
                <span className="flex items-center gap-1.5 text-yellow-400 font-semibold">
                  <Star className="w-4 h-4 fill-yellow-400" />
                  TMDB {media.rating.toFixed(1)} / 10
                </span>
              )}
              {(media.imdb_rating || media.rating) && (
                <span className="flex items-center gap-1.5 text-yellow-400 font-semibold">
                  <Star className="w-4 h-4 fill-yellow-400" />
                  IMDb {(media.imdb_rating || media.rating).toFixed(1)} / 10
                </span>
              )}
              {media.user_rating_average > 0 && (
                <span className="flex items-center gap-1.5 text-primary font-semibold">
                  <Star className="w-4 h-4 fill-primary" />
                  Users {media.user_rating_average.toFixed(1)} / 5 ({media.user_rating_count || 0})
                </span>
              )}
              {media.duration_minutes && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {Math.floor(media.duration_minutes / 60)}h {media.duration_minutes % 60}m
                </span>
              )}
              {media.language && (
                <span className="uppercase">{media.language}</span>
              )}
            </div>

            {/* Genres */}
            {media.genres?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {media.genres.map(g => (
                  <span key={g} className="px-3 py-1 bg-secondary border border-border rounded-full text-xs text-muted-foreground">
                    {g}
                  </span>
                ))}
              </div>
            )}

            <p className="text-muted-foreground leading-relaxed mb-6 max-w-2xl">{media.synopsis}</p>

            {media.collection_name && (
              <p className="text-sm text-muted-foreground mb-2"><span className="text-foreground font-medium">Linked collection:</span> {media.collection_name}</p>
            )}
            {media.director && (
              <p className="text-sm text-muted-foreground mb-2"><span className="text-foreground font-medium">Director:</span> {media.director}</p>
            )}
            {media.cast?.length > 0 && (
              <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span className="text-foreground font-medium">Cast:</span>
                {media.cast.slice(0, 8).map(actor => (
                  <Link key={actor} to={`/actors/${encodeURIComponent(actor)}`} className="rounded-full border border-border bg-secondary px-3 py-1 text-xs font-bold text-muted-foreground hover:border-primary/50 hover:text-primary">
                    {actor}
                  </Link>
                ))}
              </div>
            )}

            {/* Season/Episode Picker for TV Shows */}
            {media.type === 'tv_show' && (
              <div className="flex items-center gap-3 mb-5 flex-wrap">
                {/* Season selector */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground font-medium">Season</span>
                  <div className="relative">
                    <select
                      value={selectedSeason}
                      onChange={e => { setSelectedSeason(Number(e.target.value)); setSelectedEpisode(1); }}
                      className="appearance-none bg-secondary border border-border rounded-xl px-3 py-2 pr-8 text-sm text-foreground focus:outline-none focus:border-primary/60 cursor-pointer"
                    >
                      {Array.from({ length: media.seasons || 1 }, (_, i) => i + 1).map(s => (
                        <option key={s} value={s}>Season {s}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
                {/* Episode selector */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground font-medium">Episode</span>
                  <div className="relative">
                    <select
                      value={selectedEpisode}
                      onChange={e => setSelectedEpisode(Number(e.target.value))}
                      className="appearance-none bg-secondary border border-border rounded-xl px-3 py-2 pr-8 text-sm text-foreground focus:outline-none focus:border-primary/60 cursor-pointer"
                    >
                      {(() => {
                        const eps = media.episodes?.filter(e => e.season === selectedSeason);
                        if (eps?.length > 0) {
                          return eps.map(e => (
                            <option key={e.episode} value={e.episode}>
                              Ep {e.episode}{e.title ? ` — ${e.title}` : ''}
                            </option>
                          ));
                        }
                        return Array.from({ length: 20 }, (_, i) => i + 1).map(n => (
                          <option key={n} value={n}>Episode {n}</option>
                        ));
                      })()}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 flex-wrap">
              <Link
                to={media.type === 'tv_show'
                  ? `/watch/${media.id}?season=${selectedSeason}&episode=${selectedEpisode}`
                  : `/watch/${media.id}`
                }
                className="flex items-center gap-2 bg-primary text-primary-foreground px-7 py-3.5 rounded-xl font-semibold hover:bg-primary/90 transition-all hover:scale-105 shadow-lg shadow-primary/30"
              >
                <Play className="w-4 h-4 fill-current" />
                {media.type === 'tv_show' ? `Play S${selectedSeason}E${selectedEpisode}` : 'Play Now'}
              </Link>
              {media.type === 'tv_show' && (
                <button
                  onClick={() => setShowSeriesSearch(true)}
                  className="flex items-center gap-2 bg-secondary border border-border text-foreground px-5 py-3.5 rounded-xl font-semibold text-sm hover:bg-secondary/70 hover:border-primary/40 transition-all"
                >
                  <Sparkles className="w-4 h-4 text-primary" />
                  Find & Watch Episode
                </button>
              )}
              <button
                onClick={async () => {
                  if (!confirm(`Delete "${media.title}"? This cannot be undone.`)) return;
                  setDeleting(true);
                  await base44.entities.Media.delete(media.id);
                  toast.success(`"${media.title}" deleted`);
                  navigate('/');
                }}
                disabled={deleting}
                className="flex items-center gap-2 bg-red-500/15 border border-red-500/30 text-red-400 px-5 py-3.5 rounded-xl font-semibold text-sm hover:bg-red-500/25 transition-all disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </motion.div>

        <TrailerEmbed trailerUrl={media.trailer_url} title={media.title} />

        <TrustedMediaLinks media={media} />

        <LinkedMediaSection title={media.collection_name ? `${media.collection_name} Collection` : 'Linked Titles'} items={linkedItems} />

        {/* TV Episode Manager — admin only */}
        {user?.role === 'admin' && media.type === 'tv_show' && (
          <div className="mt-10">
            <TVEpisodeManager
              media={media}
              onSave={(episodes) => setMedia(m => ({ ...m, episodes }))}
            />
          </div>
        )}

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-foreground mb-6">More Like This</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {related.map(item => (
                <Link key={item.id} to={`/media/${item.id}`} className="group">
                  <div className="aspect-[2/3] rounded-xl overflow-hidden bg-secondary mb-2 group-hover:scale-105 transition-transform">
                    {item.poster_url
                      ? <img src={item.poster_url} alt={item.title} className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-secondary" />
                    }
                  </div>
                  <p className="text-xs font-medium text-foreground truncate">{item.title}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}