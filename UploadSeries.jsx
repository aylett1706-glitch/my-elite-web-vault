import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  ArrowLeft, ChevronDown, ChevronUp, Plus, Trash2,
  Sparkles, Loader2, Check, Tv, Film
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';

const GENRES = ['Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Thriller', 'Western'];

const STEPS = ['Overview', 'Seasons & Episodes', 'Review'];

function EpisodeRow({ ep, onChange, onDelete, seasonNum }) {
  return (
    <div className="flex items-center gap-3 bg-background/50 border border-border rounded-xl p-3">
      <div className="w-7 h-7 rounded-lg bg-primary/20 text-primary text-xs font-bold flex items-center justify-center shrink-0">
        {ep.episode}
      </div>
      <input
        value={ep.title}
        onChange={e => onChange({ ...ep, title: e.target.value })}
        placeholder={`Episode ${ep.episode} title`}
        className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
      />
      <input
        value={ep.video_url || ''}
        onChange={e => onChange({ ...ep, video_url: e.target.value })}
        placeholder="Video URL"
        className="w-48 bg-secondary border border-border rounded-lg px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60"
      />
      <button onClick={onDelete} className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors shrink-0">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function SeasonPanel({ season, index, onChange, onDelete, onAIFillEpisodes, seriesTitle }) {
  const [expanded, setExpanded] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);

  const addEpisode = () => {
    const nextNum = (season.episodes?.length || 0) + 1;
    onChange({ ...season, episodes: [...(season.episodes || []), { episode: nextNum, title: '', video_url: '' }] });
  };

  const updateEpisode = (i, ep) => {
    const eps = [...season.episodes];
    eps[i] = ep;
    onChange({ ...season, episodes: eps });
  };

  const deleteEpisode = (i) => {
    const eps = season.episodes.filter((_, idx) => idx !== i).map((e, idx) => ({ ...e, episode: idx + 1 }));
    onChange({ ...season, episodes: eps });
  };

  const handleAIFill = async () => {
    if (!seriesTitle) { toast.error('Add a series title first'); return; }
    setAiLoading(true);
    const result = await base44.functions.invoke('tmdbSearch', { query: seriesTitle });
    const show = result.data?.results?.find(r => r.type === 'tv_show');
    if (show?.tmdb_id) {
      const episodes = Array.from({ length: show.episodes_per_season || 10 }, (_, i) => ({
        episode: i + 1,
        title: `Episode ${i + 1}`,
        video_url: ''
      }));
      onChange({ ...season, episodes });
      toast.success(`Auto-filled ${episodes.length} episodes for Season ${season.season}`);
    } else {
      toast.error('Could not find episode data');
    }
    setAiLoading(false);
  };

  return (
    <div className="border border-border rounded-2xl overflow-hidden">
      {/* Season Header */}
      <div
        className="flex items-center justify-between px-5 py-4 bg-secondary/50 cursor-pointer hover:bg-secondary/70 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary font-bold text-sm flex items-center justify-center">
            S{season.season}
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">Season {season.season}</p>
            <p className="text-xs text-muted-foreground">{season.episodes?.length || 0} episode{(season.episodes?.length || 0) !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={e => { e.stopPropagation(); onDelete(); }}
            className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>

      {/* Season Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-3 bg-card">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">Episodes</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleAIFill}
                    disabled={aiLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary rounded-lg text-xs font-medium hover:bg-primary/20 transition-colors disabled:opacity-50"
                  >
                    {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    AI Fill
                  </button>
                  <button
                    onClick={addEpisode}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary border border-border text-foreground rounded-lg text-xs font-medium hover:bg-secondary/70 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Add Episode
                  </button>
                </div>
              </div>

              {(season.episodes || []).map((ep, i) => (
                <EpisodeRow
                  key={i}
                  ep={ep}
                  seasonNum={season.season}
                  onChange={ep => updateEpisode(i, ep)}
                  onDelete={() => deleteEpisode(i)}
                />
              ))}

              {(!season.episodes || season.episodes.length === 0) && (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  No episodes yet. Add episodes or use AI Fill.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function UploadSeries() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [step, setStep] = useState(0);
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [overview, setOverview] = useState({
    title: '', synopsis: '', year: '', director: '', cast: '',
    genres: [], poster_url: '', backdrop_url: '', trailer_url: '',
    rating: '', tmdb_id: '', imdb_id: ''
  });
  const [seasons, setSeasons] = useState([
    { season: 1, episodes: [] }
  ]);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const handleAIFillOverview = async () => {
    if (!overview.title) { toast.error('Enter a series title first'); return; }
    setAiLoading(true);
    const result = await base44.functions.invoke('tmdbSearch', { query: overview.title });
    const show = result.data?.results?.find(r => r.type === 'tv_show') || result.data?.results?.[0];
    if (show) {
      setOverview(o => ({
        ...o,
        synopsis: show.synopsis || o.synopsis,
        year: show.year?.toString() || o.year,
        director: show.director || o.director,
        cast: show.cast?.join(', ') || o.cast,
        genres: show.genres || o.genres,
        poster_url: show.poster_url || o.poster_url,
        backdrop_url: show.backdrop_url || o.backdrop_url,
        trailer_url: show.trailer_url || o.trailer_url,
        rating: show.rating?.toString() || o.rating,
        tmdb_id: show.tmdb_id || o.tmdb_id,
        imdb_id: show.imdb_id || o.imdb_id,
      }));
      if (show.seasons) {
        const newSeasons = Array.from({ length: show.seasons }, (_, i) => ({
          season: i + 1,
          episodes: []
        }));
        setSeasons(newSeasons);
        toast.success(`Found ${show.seasons} season(s) — add episodes per season`);
      } else {
        toast.success('Series metadata loaded!');
      }
    } else {
      toast.error('No results found');
    }
    setAiLoading(false);
  };

  const addSeason = () => {
    setSeasons(s => [...s, { season: s.length + 1, episodes: [] }]);
  };

  const updateSeason = (i, s) => {
    setSeasons(prev => { const arr = [...prev]; arr[i] = s; return arr; });
  };

  const deleteSeason = (i) => {
    setSeasons(prev => prev.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, season: idx + 1 })));
  };

  const handleSubmit = async () => {
    if (!overview.title) { toast.error('Series title is required'); return; }
    setSaving(true);
    const allEpisodes = seasons.flatMap(s =>
      (s.episodes || []).map(ep => ({
        season: s.season,
        episode: ep.episode,
        title: ep.title,
        video_url: ep.video_url,
        duration_minutes: ep.duration_minutes
      }))
    );
    await base44.entities.Media.create({
      title: overview.title,
      type: 'tv_show',
      synopsis: overview.synopsis,
      year: overview.year ? parseInt(overview.year) : undefined,
      rating: overview.rating ? parseFloat(overview.rating) : undefined,
      director: overview.director,
      cast: overview.cast ? overview.cast.split(',').map(c => c.trim()) : [],
      genres: overview.genres,
      poster_url: overview.poster_url,
      backdrop_url: overview.backdrop_url,
      trailer_url: overview.trailer_url,
      tmdb_id: overview.tmdb_id,
      imdb_id: overview.imdb_id,
      seasons: seasons.length,
      episodes: allEpisodes,
      status: 'approved',
      views: 0
    });
    toast.success(`"${overview.title}" series added to library!`);
    navigate('/admin');
  };

  const inputCls = "w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60";

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      <div className="pt-24 max-w-3xl mx-auto px-4 pb-16">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate('/admin')} className="p-2 hover:bg-secondary rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Tv className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-bebas text-4xl text-foreground">Upload TV Series</h1>
            <p className="text-sm text-muted-foreground">Add a complete series with seasons & episodes</p>
          </div>
        </div>

        {/* Step Pills */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <button
                onClick={() => i < step && setStep(i)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  step === i ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                  : step > i ? 'bg-green-500/20 text-green-400'
                  : 'bg-secondary text-muted-foreground'
                }`}
              >
                {step > i && <Check className="w-3.5 h-3.5" />}
                {s}
              </button>
              {i < STEPS.length - 1 && <div className={`w-8 h-px ${step > i ? 'bg-green-500' : 'bg-border'}`} />}
            </div>
          ))}
        </div>

        {/* Step 0: Overview */}
        {step === 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex gap-3">
              <input value={overview.title} onChange={e => setOverview(o => ({ ...o, title: e.target.value }))}
                placeholder="Series Title *" className={`${inputCls} flex-1`} autoFocus />
              <button onClick={handleAIFillOverview} disabled={aiLoading}
                className="flex items-center gap-2 px-4 bg-primary/20 border border-primary/30 text-primary rounded-xl text-sm font-medium hover:bg-primary/30 transition-colors disabled:opacity-50 shrink-0">
                {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                AI Auto-fill
              </button>
            </div>

            <textarea value={overview.synopsis} onChange={e => setOverview(o => ({ ...o, synopsis: e.target.value }))}
              placeholder="Series synopsis..." rows={4}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 resize-none" />

            <div className="grid grid-cols-3 gap-3">
              <input value={overview.year} onChange={e => setOverview(o => ({ ...o, year: e.target.value }))}
                type="number" placeholder="Year" className={inputCls} />
              <input value={overview.rating} onChange={e => setOverview(o => ({ ...o, rating: e.target.value }))}
                type="number" placeholder="Rating (0-10)" className={inputCls} />
              <input value={overview.director} onChange={e => setOverview(o => ({ ...o, director: e.target.value }))}
                placeholder="Creator/Director" className={inputCls} />
            </div>

            <input value={overview.cast} onChange={e => setOverview(o => ({ ...o, cast: e.target.value }))}
              placeholder="Main cast (comma separated)" className={inputCls} />
            <input value={overview.poster_url} onChange={e => setOverview(o => ({ ...o, poster_url: e.target.value }))}
              placeholder="Poster URL" className={inputCls} />
            <input value={overview.backdrop_url} onChange={e => setOverview(o => ({ ...o, backdrop_url: e.target.value }))}
              placeholder="Backdrop URL" className={inputCls} />
            <input value={overview.trailer_url} onChange={e => setOverview(o => ({ ...o, trailer_url: e.target.value }))}
              placeholder="Trailer URL" className={inputCls} />

            {/* Genres */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Genres</p>
              <div className="flex flex-wrap gap-2">
                {GENRES.map(g => (
                  <button key={g} type="button"
                    onClick={() => setOverview(o => ({ ...o, genres: o.genres.includes(g) ? o.genres.filter(x => x !== g) : [...o.genres, g] }))}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${overview.genres.includes(g) ? 'bg-primary text-primary-foreground' : 'bg-secondary border border-border text-muted-foreground hover:border-primary/40'}`}>
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview poster */}
            {overview.poster_url && (
              <div className="flex items-center gap-4 p-4 bg-secondary/50 border border-border rounded-xl">
                <img src={overview.poster_url} alt="Poster" className="w-16 h-24 rounded-lg object-cover" />
                <div>
                  <p className="font-semibold text-foreground">{overview.title || 'Untitled Series'}</p>
                  <p className="text-sm text-muted-foreground">{overview.year} • TV Show</p>
                  {overview.genres.length > 0 && <p className="text-xs text-muted-foreground mt-1">{overview.genres.slice(0, 3).join(', ')}</p>}
                </div>
              </div>
            )}

            <button onClick={() => setStep(1)} disabled={!overview.title}
              className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40">
              Continue to Seasons →
            </button>
          </motion.div>
        )}

        {/* Step 1: Seasons & Episodes */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">{seasons.length} season{seasons.length !== 1 ? 's' : ''} configured</p>
              <button onClick={addSeason}
                className="flex items-center gap-2 px-4 py-2 bg-primary/20 border border-primary/30 text-primary rounded-xl text-sm font-medium hover:bg-primary/30 transition-colors">
                <Plus className="w-3.5 h-3.5" />
                Add Season
              </button>
            </div>

            {seasons.map((s, i) => (
              <SeasonPanel
                key={i}
                season={s}
                index={i}
                seriesTitle={overview.title}
                onChange={updated => updateSeason(i, updated)}
                onDelete={() => deleteSeason(i)}
              />
            ))}

            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep(0)} className="flex-1 py-3 rounded-xl border border-border text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
                ← Back
              </button>
              <button onClick={() => setStep(2)}
                className="flex-1 bg-primary text-primary-foreground py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors">
                Review & Publish →
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Review */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-bold text-foreground mb-4">Series Overview</h3>
              <div className="flex gap-4">
                {overview.poster_url && (
                  <img src={overview.poster_url} alt={overview.title} className="w-20 h-28 rounded-xl object-cover shrink-0" />
                )}
                <div className="flex-1 space-y-1">
                  <p className="font-bold text-foreground text-lg">{overview.title}</p>
                  <p className="text-sm text-muted-foreground">{overview.year} • TV Show {overview.rating ? `• ⭐ ${overview.rating}` : ''}</p>
                  {overview.genres.length > 0 && <p className="text-xs text-muted-foreground">{overview.genres.join(', ')}</p>}
                  <p className="text-sm text-muted-foreground line-clamp-3 mt-2">{overview.synopsis}</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-bold text-foreground mb-4">Seasons Summary</h3>
              <div className="space-y-3">
                {seasons.map(s => (
                  <div key={s.season} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <p className="text-sm font-medium text-foreground">Season {s.season}</p>
                    <p className="text-sm text-muted-foreground">{s.episodes?.length || 0} episodes</p>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground pt-1">
                  Total: {seasons.reduce((acc, s) => acc + (s.episodes?.length || 0), 0)} episodes across {seasons.length} season{seasons.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl border border-border text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
                ← Back
              </button>
              <button onClick={handleSubmit} disabled={saving}
                className="flex-1 bg-primary text-primary-foreground py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {saving ? 'Publishing...' : 'Publish Series'}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}