import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import ExternalPlayer from '@/components/player/ExternalPlayer';
import VideoJSPlayer from '@/components/player/VideoJSPlayer';
import MoreLikeThis from '@/components/player/MoreLikeThis';
import PostWatchRating from '@/components/player/PostWatchRating';
import ResumePrompt from '@/components/player/ResumePrompt';
import { toast } from 'sonner';
import { SkipForward } from 'lucide-react';
import { canAccessAdultContent, isAdultRated } from '@/lib/content-safety';

const isDirectVideoSource = (url) => /\.(mp4|webm|ogg|ogv|m3u8|mpd)(\?.*)?$/i.test(url || '');

export default function WatchPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const playerRef = useRef(null);
  const saveTimerRef = useRef(null);
  const latestProgressRef = useRef(0);
  const latestDurationRef = useRef(0);

  const [media, setMedia] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedItems, setRelatedItems] = useState([]);
  const [historyRecord, setHistoryRecord] = useState(null);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [resumeChoice, setResumeChoice] = useState(null);
  const [autoNext, setAutoNext] = useState(true);

  const urlParams = new URLSearchParams(location.search);
  const season = parseInt(urlParams.get('season') || '1');
  const episode = parseInt(urlParams.get('episode') || '1');
  const resumeTime = parseFloat(urlParams.get('t') || '0');

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
      if (me?.email) {
        const [existingHistory, existingRatings] = await Promise.all([
          base44.entities.WatchHistory.filter({ user_email: me.email, media_id: id }, '-last_watched', 1),
          base44.entities.MediaRating.filter({ user_email: me.email, media_id: id }, '-updated_date', 1)
        ]);
        setHistoryRecord(existingHistory[0] || null);
        setUserRating(existingRatings[0]?.rating || 0);
      }
      const related = await base44.entities.Media.filter({ status: 'approved', is_adult: !!isAdultRated(item) }, '-views', 80);
      setRelatedItems(related);
      setLoading(false);
      base44.entities.Media.update(id, { views: (item.views || 0) + 1 }).catch(() => {});
    };
    load();
  }, [id]);

  // Resolve active video URL — episode-specific for TV shows, else media-level
  const episodeData = media?.type === 'tv_show'
    ? media.episodes?.find(e => e.season === season && e.episode === episode)
    : null;
  const activeVideoUrl = episodeData?.video_url || media?.video_url;
  const activeSubtitles = episodeData?.subtitles?.length ? episodeData.subtitles : episodeData?.subtitle_url ? [{ label: 'Subtitles', language: 'en', url: episodeData.subtitle_url, default: true }] : media?.subtitles?.length ? media.subtitles : media?.subtitle_url ? [{ label: 'Subtitles', language: media.language || 'en', url: media.subtitle_url, default: true }] : [];
  const useCleanPlayer = isDirectVideoSource(activeVideoUrl);
  const orderedEpisodes = media?.type === 'tv_show'
    ? [...(media.episodes || [])].sort((a, b) => (a.season - b.season) || (a.episode - b.episode))
    : [];
  const currentEpisodeIndex = orderedEpisodes.findIndex(e => e.season === season && e.episode === episode);
  const nextEpisode = currentEpisodeIndex >= 0 ? orderedEpisodes[currentEpisodeIndex + 1] : null;
  const playNextEpisode = () => {
    if (!nextEpisode) return;
    navigate(`/watch/${media.id}?season=${nextEpisode.season}&episode=${nextEpisode.episode}`);
  };

  const saveProgress = async (progressSeconds, duration = durationSeconds, completed = false) => {
    if (!user?.email || !media) return;
    latestProgressRef.current = Math.floor(progressSeconds || 0);
    latestDurationRef.current = Math.floor(duration || durationSeconds || 0);
    const data = {
      user_email: user.email,
      media_id: media.id,
      media_title: media.title,
      media_type: media.type,
      poster_url: media.poster_url,
      progress_seconds: latestProgressRef.current,
      duration_seconds: latestDurationRef.current,
      completed,
      season: media.type === 'tv_show' ? season : undefined,
      episode: media.type === 'tv_show' ? episode : undefined,
      last_watched: new Date().toISOString()
    };

    if (historyRecord?.id) {
      await base44.entities.WatchHistory.update(historyRecord.id, data);
      const updated = { ...historyRecord, ...data };
      setHistoryRecord(updated);
      return updated;
    } else {
      const created = await base44.entities.WatchHistory.create(data);
      setHistoryRecord(created);
      return created;
    }
  };

  const handleProgress = ({ playedSeconds }) => {
    latestProgressRef.current = Math.floor(playedSeconds || 0);
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => saveProgress(playedSeconds), 700);
  };

  useEffect(() => {
    latestDurationRef.current = durationSeconds;
  }, [durationSeconds]);

  useEffect(() => {
    return () => {
      clearTimeout(saveTimerRef.current);
      const exactTime = playerRef.current?.currentTime?.() || latestProgressRef.current;
      if (exactTime > 5) saveProgress(exactTime, latestDurationRef.current);
    };
  }, [user?.email, media?.id, season, episode]);

  useEffect(() => {
    const saveBeforeExit = () => {
      const exactTime = playerRef.current?.currentTime?.() || latestProgressRef.current;
      if (exactTime > 5) saveProgress(exactTime, latestDurationRef.current);
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') saveBeforeExit();
    };
    window.addEventListener('pagehide', saveBeforeExit);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('pagehide', saveBeforeExit);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.email, media?.id, season, episode]);

  const handleMarkWatched = async () => {
    const saved = await saveProgress(durationSeconds || historyRecord?.duration_seconds || 0, durationSeconds || historyRecord?.duration_seconds || 0, true);
    if (saved) setHistoryRecord({ ...saved, completed: true });
    toast.success('Marked as watched');
  };

  const handleRate = async (rating) => {
    if (!user?.email || !media) return;
    const existing = await base44.entities.MediaRating.filter({ user_email: user.email, media_id: media.id }, '-updated_date', 1);
    if (existing[0]?.id) {
      await base44.entities.MediaRating.update(existing[0].id, { rating, watched: true });
    } else {
      await base44.entities.MediaRating.create({ user_email: user.email, media_id: media.id, media_title: media.title, rating, watched: true });
    }

    const allRatings = await base44.entities.MediaRating.filter({ media_id: media.id }, '-updated_date', 500);
    const nextRatings = existing[0]?.id
      ? allRatings.map(item => item.id === existing[0].id ? { ...item, rating } : item)
      : [...allRatings, { rating }];
    const average = nextRatings.reduce((sum, item) => sum + Number(item.rating || 0), 0) / Math.max(nextRatings.length, 1);
    await base44.entities.Media.update(media.id, { user_rating_average: Number(average.toFixed(1)), user_rating_count: nextRatings.length });
    setUserRating(rating);
    toast.success('Rating saved');
  };

  if (loading) return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (!media) return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-4">
      <p className="text-white">Media not found</p>
      <button onClick={() => navigate('/')} className="text-primary hover:underline">Go Home</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-black">
      <div className="h-screen min-h-screen">
        {useCleanPlayer ? (
          <VideoJSPlayer
            url={activeVideoUrl}
            subtitles={activeSubtitles}
            startTime={resumeChoice === 'restart' ? 0 : resumeTime || historyRecord?.progress_seconds || 0}
            playerRef={playerRef}
            onProgress={handleProgress}
            onDuration={setDurationSeconds}
            onPause={() => saveProgress(playerRef.current?.currentTime?.() || historyRecord?.progress_seconds || 0)}
            onEnded={async () => {
              const saved = await saveProgress(durationSeconds, durationSeconds, true);
              if (saved) setHistoryRecord({ ...saved, completed: true });
              if (autoNext && nextEpisode) playNextEpisode();
            }}
          />
        ) : (
          <ExternalPlayer
            media={media}
            season={season}
            episode={episode}
            savedUrl={activeVideoUrl}
            onSourceSaved={(url) => setMedia(m => ({ ...m, video_url: url }))}
            fullScreen={true}
          />
        )}
      </div>
      {nextEpisode && (
        <div className="fixed right-5 top-5 z-50 flex flex-col items-end gap-2">
          <button
            onClick={playNextEpisode}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-2xl shadow-black/60 hover:bg-primary/90"
          >
            <SkipForward className="h-4 w-4" /> Next Episode
          </button>
          <label className="inline-flex items-center gap-2 rounded-xl bg-black/70 px-4 py-2 text-xs font-bold text-white backdrop-blur">
            <input type="checkbox" checked={autoNext} onChange={e => setAutoNext(e.target.checked)} className="h-4 w-4 accent-primary" /> Auto next
          </label>
        </div>
      )}
      <ResumePrompt
        progressSeconds={!resumeChoice ? (resumeTime || historyRecord?.progress_seconds || 0) : 0}
        onResume={() => setResumeChoice('resume')}
        onRestart={() => setResumeChoice('restart')}
      />
      <PostWatchRating
        media={media}
        completed={!!historyRecord?.completed}
        currentRating={userRating}
        onMarkWatched={handleMarkWatched}
        onRate={handleRate}
      />
      <MoreLikeThis current={media} items={relatedItems} />
    </div>
  );
}