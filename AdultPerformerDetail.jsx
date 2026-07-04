import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit3, Film, Loader2, Lock, Play, Plus, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import PerformerProfileEditor from '@/components/vault/PerformerProfileEditor';
import PerformerMetaBadges from '@/components/vault/PerformerMetaBadges';
import { toDisplayImageUrl } from '@/components/vault/imageUrl';

const SESSION_KEY = 'ev_vault_unlocked';
const SAVED_CACHE_KEY = 'ev_saved_performers_cache_v1';
const profileCacheKey = (name) => `ev_performer_profile_${name}`;

const getProfileCache = (name) => {
  const cached = sessionStorage.getItem(profileCacheKey(name));
  if (cached) return JSON.parse(cached);
  const saved = JSON.parse(sessionStorage.getItem(SAVED_CACHE_KEY) || '[]');
  const performer = saved.find(item => item.name === name || item.stage_name === name);
  return performer ? { performer: { ...performer, portrait_url: performer.photo_url || performer.portrait_url, categories: performer.tags || [] }, videos: performer.video_examples || [] } : { performer: null, videos: [] };
};

export default function AdultPerformerDetail() {
  const { name } = useParams();
  const navigate = useNavigate();
  const performerName = decodeURIComponent(name || '');
  const cachedProfile = getProfileCache(performerName);
  const [performer, setPerformer] = useState(cachedProfile.performer);
  const [videos, setVideos] = useState(cachedProfile.videos || []);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [added, setAdded] = useState(new Set());
  const [performerRecord, setPerformerRecord] = useState(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) !== 'true') {
      navigate('/vault');
      return;
    }
    loadProfile({ nextPage: 1 });
  }, [performerName]);

  const loadProfile = async () => {
    setLoading(true);
    const cachedSaved = JSON.parse(sessionStorage.getItem(SAVED_CACHE_KEY) || '[]');
    const instantSaved = cachedSaved.find(item => item.name === performerName || item.stage_name === performerName);
    if (instantSaved) {
      setPerformerRecord(instantSaved);
      setPerformer({ ...instantSaved, portrait_url: instantSaved.photo_url || instantSaved.portrait_url, categories: instantSaved.tags || [] });
      setVideos(instantSaved.video_examples || []);
    }

    const savedProfiles = await base44.entities.Performer.filter({ name: performerName }, '-updated_date', 1);
    const savedProfile = savedProfiles?.[0] || null;
    if (savedProfile) setPerformerRecord(savedProfile);
    const savedPerformer = savedProfile ? { ...savedProfile, portrait_url: savedProfile.photo_url, categories: savedProfile.tags || [] } : null;
    const nextPerformer = savedPerformer || performer || { name: performerName, categories: [] };
    setPerformer(nextPerformer);
    const localVideos = savedProfile?.video_examples?.length ? savedProfile.video_examples : (cachedProfile.videos || []);
    setVideos(localVideos);
    if (savedProfile) {
      const cachedSaved = JSON.parse(sessionStorage.getItem(SAVED_CACHE_KEY) || '[]');
      sessionStorage.setItem(SAVED_CACHE_KEY, JSON.stringify([savedProfile, ...cachedSaved].filter((item, index, arr) => arr.findIndex(other => other.id === item.id) === index)));
      sessionStorage.setItem(profileCacheKey(performerName), JSON.stringify({ performer: savedPerformer, videos: localVideos }));
    }
    setHasMore(false);
    setLoading(false);
  };

  const loadOnlineVideos = async ({ nextPage = 1, append = false } = {}) => {
    setLoading(true);
    const res = await base44.functions.invoke('adultPerformerSearch', { performer: performerName, page: nextPage });
    const nextPerformer = res.data?.performer || performer || { name: performerName, categories: [] };
    if (nextPerformer) setPerformer(nextPerformer);
    const nextVideos = res.data?.videos || [];
    setVideos(prev => {
      const merged = append ? [...prev, ...nextVideos] : nextVideos;
      if (!append) sessionStorage.setItem(profileCacheKey(performerName), JSON.stringify({ performer: nextPerformer, videos: merged }));
      return merged;
    });
    setPage(nextPage);
    setHasMore(nextVideos.length > 0);
    setLoading(false);
  };

  const addVideo = async (item, shouldPlay = false) => {
    const created = await base44.entities.Media.create({
      title: item.title || `${performerName} Video`,
      type: 'movie',
      synopsis: item.synopsis || `Adult video featuring ${performerName}.`,
      year: item.year || new Date().getFullYear(),
      rating: 0,
      genres: item.categories?.length ? item.categories : ['Adult'],
      cast: [performerName],
      director: '',
      poster_url: item.poster_url || performer?.portrait_url || '',
      backdrop_url: performer?.cover_url || item.poster_url || '',
      video_url: item.video_url || item.source_url || '',
      trailer_url: '',
      duration_minutes: null,
      status: 'approved',
      is_adult: true,
      views: 0,
      language: 'en'
    });
    setAdded(prev => new Set([...prev, item.title]));
    toast.success('Added to Private Vault');
    if (shouldPlay) navigate(`/watch/${created.id}`);
  };

  const cover = performer?.cover_url || performer?.portrait_url;

  return (
    <div className="min-h-screen bg-background">
      <div className="relative min-h-[48vh] overflow-hidden border-b border-red-900/30">
        {cover ? <img src={toDisplayImageUrl(cover, 1600, 700)} alt={performerName} referrerPolicy="no-referrer" className="absolute inset-0 w-full h-full object-cover opacity-50" /> : <div className="absolute inset-0 bg-gradient-to-br from-red-950 via-background to-black" />}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/65 to-black/40" />
        <div className="absolute top-5 left-5 z-30 flex flex-wrap gap-2 pointer-events-auto">
          <button type="button" onClick={() => navigate('/vault')} className="inline-flex items-center gap-2 rounded-xl bg-black/70 px-4 py-2 text-sm font-semibold text-white hover:bg-black/90">
            <ArrowLeft className="w-4 h-4" /> Vault
          </button>
          <button type="button" onClick={() => setEditing(value => !value)} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white ${editing ? 'bg-secondary hover:bg-secondary/80' : 'bg-red-600 hover:bg-red-500'}`}>
            <Edit3 className="w-4 h-4" /> {editing ? 'Done Editing' : 'Edit Profile'}
          </button>
        </div>
        <div className="relative z-10 max-w-screen-xl mx-auto px-4 md:px-8 pt-28 pb-10 flex flex-col md:flex-row gap-6 items-end">
          <div className="w-40 h-56 rounded-3xl overflow-hidden border border-white/15 bg-card shadow-2xl shrink-0">
            {performer?.portrait_url ? <img src={toDisplayImageUrl(performer.portrait_url, 420, 560)} alt={performerName} referrerPolicy="no-referrer" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><UserRound className="w-14 h-14 text-muted-foreground" /></div>}
          </div>
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-bold text-red-300 mb-3">
              <Lock className="w-3 h-3" /> 18+ Performer Profile
            </div>
            <h1 className="font-bebas text-5xl md:text-7xl tracking-wide text-white mb-3">{performer?.name || performerName}</h1>
            <p className="max-w-2xl text-sm md:text-base text-white/65 leading-relaxed">{performer?.bio || 'Loading performer biography and video collection...'}</p>
            <div className="mt-4">
              <PerformerMetaBadges performer={performer} />
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-screen-xl mx-auto px-4 md:px-8 py-8">
        {editing && (
          <PerformerProfileEditor
            performerRecord={performerRecord}
            performerName={performerName}
            currentPerformer={performer}
            currentVideos={videos}
            onClose={() => setEditing(false)}
            onSaved={(saved) => {
              setPerformerRecord(saved);
              setPerformer({ ...saved, portrait_url: saved.photo_url, categories: saved.tags || [] });
              setVideos(saved.video_examples || []);
              sessionStorage.removeItem(profileCacheKey(performerName));
            }}
          />
        )}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold text-foreground">Pornography / Video Collection</h2>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setEditing(value => !value)} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500">
              <Edit3 className="w-4 h-4" /> {editing ? 'Close Editor' : 'Edit / Add Content'}
            </button>
            <button onClick={() => loadOnlineVideos({ nextPage: 1 })} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/20 disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Film className="w-4 h-4" />}
              Load Online Videos
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {videos.map((item, index) => {
              const isAdded = added.has(item.title);
              return (
                <div key={`${item.title}-${index}`} className="flex gap-3 rounded-2xl border border-border bg-card p-3">
                  <div className="w-24 h-32 rounded-xl overflow-hidden bg-secondary shrink-0 border border-white/10">
                    {item.poster_url ? <img src={item.poster_url} alt={item.title} className="w-full h-full object-cover" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center"><Film className="w-7 h-7 text-muted-foreground" /></div>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-foreground line-clamp-2">{item.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{item.synopsis}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button onClick={() => !isAdded && addVideo(item)} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${isAdded ? 'bg-green-500/20 text-green-400' : 'bg-red-600 text-white hover:bg-red-500'}`}>
                        <Plus className="w-3 h-3" /> {isAdded ? 'Added' : 'Add'}
                      </button>
                      <button onClick={() => addVideo(item, true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90">
                        <Play className="w-3 h-3 fill-current" /> Add & Play
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        {hasMore && videos.length > 0 && (
          <div className="mt-6 flex justify-center">
            <button onClick={() => loadOnlineVideos({ nextPage: page + 1, append: true })} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-2.5 text-sm font-semibold text-red-300 hover:bg-red-500/20 disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Film className="w-4 h-4" />}
              Load More Videos
            </button>
          </div>
        )}
      </main>
    </div>
  );
}