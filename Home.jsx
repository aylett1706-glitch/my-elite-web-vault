import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import Navbar from '@/components/layout/Navbar';
import HeroBanner from '@/components/home/HeroBanner';
import MediaCarousel from '@/components/home/MediaCarousel';
import ContinueWatching from '@/components/home/ContinueWatching';
import CollectionTabs from '@/components/home/CollectionTabs';
import TrendingNow from '@/components/home/TrendingNow';
import GenreSection from '@/components/home/GenreSection';
import SmartLists from '@/components/home/SmartLists';
import ResumeEverything from '@/components/home/ResumeEverything';
import SmartCollectionFolders from '@/components/home/SmartCollectionFolders';
import AiRecommendations from '@/components/home/AiRecommendations';
import { Link } from 'react-router-dom';
import { Baby, Gamepad2, Plus, Search, Sparkles } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import AISearchModalAdvanced from '@/components/admin/AISearchModalAdvanced';
import { loadGlobalEliteSettings, readEliteSettings } from '@/lib/elite-settings';
import { deriveMediaTopics, getLibraryTopics } from '@/lib/media-classification';
import { filterMainAppSafeMedia } from '@/lib/content-safety';

const HOME_CACHE_KEY = 'ev_home_cache_v1';
const HOME_GENRES = ['Action', 'Adventure', 'Animation', 'Anime', 'Comedy', 'Crime', 'Documentary', 'Drama', 'Family', 'Fantasy', 'Horror', 'Kids', 'Mystery', 'Romance', 'Sci-Fi', 'Science Fiction', 'Sports', 'Thriller'];

const getHomeCache = () => {
  const cached = sessionStorage.getItem(HOME_CACHE_KEY);
  return cached ? JSON.parse(cached) : { media: [], watchHistory: [] };
};

export default function Home() {
  const cachedHome = getHomeCache();
  const [user, setUser] = useState(null);
  const [media, setMedia] = useState(cachedHome.media || []);
  const [games, setGames] = useState([]);
  const [books, setBooks] = useState([]);
  const [watchHistory, setWatchHistory] = useState(cachedHome.watchHistory || []);
  const [mediaRatings, setMediaRatings] = useState([]);
  const [gameSaves, setGameSaves] = useState([]);
  const [gameProgress, setGameProgress] = useState([]);
  const [eliteSettings, setEliteSettings] = useState(readEliteSettings);
  const [showAISearch, setShowAISearch] = useState(false);

  useEffect(() => {
    const load = async () => {
      const me = await base44.auth.me().catch(() => null);
      const [allMedia, allGames, allBooks, history, ratings, saves, progress] = await Promise.all([
        base44.entities.Media.filter({ status: 'approved' }),
        base44.entities.Game.filter({ status: 'approved' }, '-created_date', 200),
        base44.entities.Book.filter({ status: 'approved' }, '-created_date', 200),
        me ? base44.entities.WatchHistory.filter({ user_email: me.email }, '-last_watched', 20) : [],
        me ? base44.entities.MediaRating.filter({ user_email: me.email }, '-updated_date', 200) : [],
        me ? base44.entities.GameSave.filter({ user_email: me.email }, '-last_played', 20) : [],
        me ? base44.entities.GameProgress.filter({ user_email: me.email }, '-last_played', 20) : []
      ]);
      setUser(me);
      setMedia(filterMainAppSafeMedia(allMedia));
      setGames(allGames);
      setBooks(allBooks);
      setWatchHistory(history);
      setMediaRatings(ratings);
      setGameSaves(saves);
      setGameProgress(progress);
      sessionStorage.setItem(HOME_CACHE_KEY, JSON.stringify({ media: filterMainAppSafeMedia(allMedia), watchHistory: history }));
    };
    load();
    loadGlobalEliteSettings().then(({ settings }) => setEliteSettings(settings));
    const onEliteSettings = (event) => setEliteSettings(event.detail || readEliteSettings());
    window.addEventListener('elite-settings-updated', onEliteSettings);
    return () => window.removeEventListener('elite-settings-updated', onEliteSettings);
  }, []);

  const safeMedia = filterMainAppSafeMedia(media);
  const featured = safeMedia.filter(m => m.is_featured);
  const trending = safeMedia.filter(m => m.is_trending);
  const movies = safeMedia.filter(m => m.type === 'movie').sort((a, b) => (b.year || 0) - (a.year || 0));
  const tvShows = safeMedia.filter(m => m.type === 'tv_show').sort((a, b) => (b.year || 0) - (a.year || 0));
  const gameCollection = [...games].sort((a, b) => (b.year || 0) - (a.year || 0));
  const bookCollection = [...books].sort((a, b) => String(b.published_date || '').localeCompare(String(a.published_date || '')));
  const recent = [...safeMedia].sort((a, b) => (b.year || 0) - (a.year || 0) || new Date(b.created_date) - new Date(a.created_date)).slice(0, 20);
  const heroItems = Array.from(new Map([
    ...featured.filter(item => item.type === 'movie'),
    ...trending.filter(item => item.type === 'movie'),
    ...recent.filter(item => item.type === 'movie'),
    ...movies
  ].map(item => [item.id, item])).values()).slice(0, 12);
  // Collect unique genres and topics that have content
  const allGenres = [...new Set(safeMedia.flatMap(m => m.genres || []))]
    .filter(genre => HOME_GENRES.includes(genre))
    .sort((a, b) => a.localeCompare(b));
  const allTopics = getLibraryTopics(safeMedia);
  const genreRows = allGenres
    .map(genre => ({
      genre,
      items: safeMedia
        .filter(item => item.genres?.includes(genre))
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 20)
    }))
    .filter(row => row.items.length >= 2)
    .slice(0, 8);
  const topicRows = allTopics
    .map(topic => ({
      topic,
      items: safeMedia
        .filter(item => deriveMediaTopics(item).includes(topic))
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 20)
    }))
    .filter(row => row.items.length >= 2)
    .slice(0, 8);

  const reloadHomeMedia = async () => {
    const allMedia = await base44.entities.Media.filter({ status: 'approved' });
    const safeMedia = filterMainAppSafeMedia(allMedia);
    setMedia(safeMedia);
    sessionStorage.setItem(HOME_CACHE_KEY, JSON.stringify({ media: safeMedia, watchHistory }));
  };

  return (
    <div className="min-h-screen bg-transparent">
      <Navbar user={user} />
      <AnimatePresence>
        {showAISearch && <AISearchModalAdvanced onClose={() => setShowAISearch(false)} onAdded={reloadHomeMedia} />}
      </AnimatePresence>
      {eliteSettings.homeLayout !== 'library' && <HeroBanner featuredItems={heroItems} wallpaperSettings={eliteSettings} />}
      <div className="pb-16">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-8 pt-8">
          <div className="mb-4 flex justify-end">
            <button onClick={() => setShowAISearch(true)} className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/20 px-4 py-2 text-sm font-bold text-primary hover:bg-primary/30">
              <Search className="h-4 w-4" /> AI Search & Add <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Link to="/kids" className="group block overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-r from-primary/15 via-accent/10 to-secondary p-5 hover:border-primary/50 transition-colors duration-200">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                    <Baby className="h-7 w-7" />
                  </div>
                  <div>
                    <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary"><Sparkles className="h-3.5 w-3.5" /> New Safe Space</div>
                    <h2 className="text-2xl font-bold text-foreground">Kids & Family Area</h2>
                    <p className="text-sm text-muted-foreground">Animation, family movies, and kid-friendly shows in one dedicated place.</p>
                  </div>
                </div>
                <span className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground group-hover:bg-primary/90">Enter Kids Area →</span>
              </div>
            </Link>
            <Link to="/games" className="group block overflow-hidden rounded-3xl border border-accent/20 bg-gradient-to-r from-accent/15 via-primary/10 to-secondary p-5 hover:border-accent/50 transition-colors duration-200">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground shadow-lg shadow-accent/20">
                    <Gamepad2 className="h-7 w-7" />
                  </div>
                  <div>
                    <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-accent"><Sparkles className="h-3.5 w-3.5" /> New Games Hub</div>
                    <h2 className="text-2xl font-bold text-foreground">Games Hub</h2>
                    <p className="text-sm text-muted-foreground">Play web games, open cloud/app store links, and add legal emulator sources.</p>
                  </div>
                </div>
                <span className="rounded-full bg-accent px-5 py-2 text-sm font-bold text-accent-foreground group-hover:bg-accent/90">Open Games →</span>
              </div>
            </Link>
          </div>
        </div>
        <CollectionTabs movies={movies} tvShows={tvShows} games={gameCollection} books={bookCollection} />
        <SmartCollectionFolders media={safeMedia} books={bookCollection} />
        <ResumeEverything watchHistory={watchHistory} gameSaves={gameSaves} gameProgress={gameProgress} />
        <ContinueWatching items={watchHistory} />
        <AiRecommendations media={safeMedia} games={gameCollection} watchHistory={watchHistory} gameProgress={gameProgress} />
        <SmartLists media={safeMedia} watchHistory={watchHistory} ratings={mediaRatings} />
        <TrendingNow historyItems={watchHistory} />
        <MediaCarousel title="New Releases" items={recent} viewAllPath="/movies" />
        <MediaCarousel title="Movies" items={movies} viewAllPath="/movies" />
        <MediaCarousel title="TV Shows" items={tvShows} viewAllPath="/tv-shows" />
        <GenreSection genres={allGenres} />
        {topicRows.map(row => (
          <MediaCarousel
            key={row.topic}
            title={`${row.topic} Collection`}
            items={row.items}
            viewAllPath={`/genre/${encodeURIComponent(row.topic)}`}
          />
        ))}
        {genreRows.map(row => (
          <MediaCarousel
            key={row.genre}
            title={`${row.genre} Picks`}
            items={row.items}
            viewAllPath={`/genre/${encodeURIComponent(row.genre)}`}
          />
        ))}
      </div>
    </div>
  );
}