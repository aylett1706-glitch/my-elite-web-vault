import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, Film, Loader2, Database, Plus, Check, ArrowLeft, Lock, Eye, EyeOff, ShieldAlert, Sparkles, ChevronDown, ChevronUp, X, Image, Upload } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import HubSearchSection from '@/components/search/HubSearchSection';
import AiMediaPreviewModal from '@/components/search/AiMediaPreviewModal';
import AdvancedSearchFilters from '@/components/search/AdvancedSearchFilters';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { deriveMediaTopics } from '@/lib/media-classification';
import { filterMainAppSafeMedia, isAdultRated } from '@/lib/content-safety';

const VAULT_PIN = '1706';
const SESSION_KEY = 'ev_vault_unlocked';
const GENRES = ['Action', 'Adventure', 'Anime', 'Animation', 'Comedy', 'Crime', 'Documentary', 'Drama', 'Family', 'Fantasy', 'Food', 'Gaming', 'Health', 'History', 'Horror', 'Kids', 'Learning', 'Lifestyle', 'Mystery', 'News', 'Romance', 'Science Fiction', 'Sports', 'Travel', 'Thriller'];
const QUICK_SEARCHES = ['Marvel', 'Star Wars', 'Harry Potter', 'Australian stories', 'Kids family', 'Documentary', 'True crime', 'Anime', 'Food cooking', 'Health wellness', 'Travel', 'Gaming esports'];

const sortNewestFirst = (items = []) => [...items].sort((a, b) => (b.year || 0) - (a.year || 0) || new Date(b.created_date || 0) - new Date(a.created_date || 0));

export default function SearchPage() {
  const params = new URLSearchParams(window.location.search);
  const initialQuery = params.get('q') || '';
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [hubResults, setHubResults] = useState({ games: [], manga: [], live: [], performers: [] });
  const [aiResults, setAiResults] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [addedIds, setAddedIds] = useState(new Set());
  const [yearFilter, setYearFilter] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [moodFilter, setMoodFilter] = useState('');
  const [directorFilter, setDirectorFilter] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [searchType, setSearchType] = useState('title');
  const [previewItem, setPreviewItem] = useState(null);

  // Deep AI Search
  const [showDeepAI, setShowDeepAI] = useState(false);
  const [deepQuery, setDeepQuery] = useState('');
  const [deepLoading, setDeepLoading] = useState(false);
  const [deepResults, setDeepResults] = useState(null); // null = not searched yet

  // Vault state
  const [vaultUnlocked, setVaultUnlocked] = useState(() => sessionStorage.getItem(SESSION_KEY) === 'true');
  const [vaultPin, setVaultPin] = useState('');
  const [showVaultPin, setShowVaultPin] = useState(false);
  const [vaultPinError, setVaultPinError] = useState('');
  const [vaultItems, setVaultItems] = useState([]);
  const [vaultLoading, setVaultLoading] = useState(false);
  const [vaultQuery, setVaultQuery] = useState('');
  const [vaultAiResults, setVaultAiResults] = useState([]);
  const [vaultAiLoading, setVaultAiLoading] = useState(false);
  const [vaultAddedIds, setVaultAddedIds] = useState(new Set());

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (initialQuery) doSearch(initialQuery);
  }, []);

  useEffect(() => {
    if (vaultUnlocked) loadVaultContent();
  }, [vaultUnlocked]);

  const loadVaultContent = async () => {
    setVaultLoading(true);
    const media = await base44.entities.Media.filter({ status: 'approved', is_adult: true }, '-created_date', 200);
    setVaultItems(media);
    setVaultLoading(false);
  };

  const handleVaultUnlock = () => {
    if (vaultPin === VAULT_PIN) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      setVaultUnlocked(true);
      setVaultPinError('');
    } else {
      setVaultPinError('Incorrect PIN. Access denied.');
      setVaultPin('');
    }
  };

  const handleVaultLock = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setVaultUnlocked(false);
    setVaultItems([]);
    setVaultAiResults([]);
  };

  const handleVaultSearch = async (e) => {
    e.preventDefault();
    if (!vaultQuery.trim()) return;
    setVaultAiLoading(true);
    setVaultAiResults([]);
    try {
      const res = await base44.functions.invoke('tmdbSearch', { query: vaultQuery, pages: 25, limit: 100 });
      const sorted = (res.data?.results || []).sort((a, b) => (b.year || 0) - (a.year || 0));
      setVaultAiResults(sorted);
    } catch {
      setVaultAiResults([]);
    }
    setVaultAiLoading(false);
  };

  const addToVault = async (item) => {
    await base44.entities.Media.create({
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
      is_adult: true,
      views: 0,
      language: 'en'
    });
    setVaultAddedIds(prev => new Set([...prev, item.title]));
    toast.success(`"${item.title}" added to Vault!`);
    loadVaultContent();
  };

  const handleDeepSearch = async (e) => {
    e.preventDefault();
    if (!deepQuery.trim()) return;
    setDeepLoading(true);
    setDeepResults(null);

    // Fetch all approved non-adult media
    const all = await base44.entities.Media.filter({ status: 'approved' });
    const safeMedia = filterMainAppSafeMedia(all);

    // Build a compact catalogue for the LLM
    const catalogue = safeMedia.map(m => ({
      id: m.id,
      title: m.title,
      type: m.type,
      year: m.year,
      rating: m.rating,
      genres: m.genres,
      synopsis: m.synopsis?.slice(0, 200),
      director: m.director,
      cast: m.cast?.slice(0, 5),
      collection_name: m.collection_name,
      collection_key: m.collection_key,
      related_keywords: m.related_keywords,
      streaming_platforms: m.streaming_platforms,
      watch_provider_region: m.watch_provider_region,
    }));

    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a movie recommendation engine. The user wants: "${deepQuery}".
      
Here is the media catalogue as JSON:
${JSON.stringify(catalogue)}

Return a JSON array of matching media IDs ranked by relevance. Understand requests by collection/franchise (Marvel, DC, Star Wars, Descendants, etc.) and by streaming platform (Netflix, Prime Video, Disney+, Stan, Binge, Apple TV+, Paramount+). Only include items that genuinely match the request. Max 20 results. 
Respond ONLY with a JSON array of id strings, e.g. ["id1", "id2"].`,
      response_json_schema: {
        type: 'object',
        properties: {
          ids: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    const matchedIds = new Set(res?.ids || []);
    const ranked = (res?.ids || []).map(id => safeMedia.find(m => m.id === id)).filter(Boolean);
    setDeepResults(ranked);
    setDeepLoading(false);
  };

  const filteredResults = useMemo(() => {
    const mood = moodFilter.toLowerCase();
    const director = directorFilter.toLowerCase();
    const platform = platformFilter.toLowerCase();
    return sortNewestFirst(results.filter(item => {
      const searchable = [item.synopsis, item.content_notes, item.collection_name, item.related_keywords, item.genres].flat().filter(Boolean).join(' ').toLowerCase();
      const yearMatch = !yearFilter || Number(item.year) === Number(yearFilter);
      const genreMatch = !genreFilter || item.genres?.includes(genreFilter) || searchable.includes(genreFilter.toLowerCase());
      const moodMatch = !mood || searchable.includes(mood);
      const directorMatch = !director || String(item.director || '').toLowerCase().includes(director);
      const platformMatch = !platform || item.streaming_platforms?.some(name => name.toLowerCase().includes(platform));
      return yearMatch && genreMatch && moodMatch && directorMatch && platformMatch;
    }));
  }, [results, yearFilter, genreFilter, moodFilter, directorFilter, platformFilter]);

  const filteredAiResults = useMemo(() => {
    const mood = moodFilter.toLowerCase();
    const director = directorFilter.toLowerCase();
    const platform = platformFilter.toLowerCase();
    return sortNewestFirst(aiResults.filter(item => {
      const searchable = [item.synopsis, item.content_notes, item.collection_name, item.related_keywords, item.genres].flat().filter(Boolean).join(' ').toLowerCase();
      const yearMatch = !yearFilter || Number(item.year) === Number(yearFilter);
      const genreMatch = !genreFilter || item.genres?.includes(genreFilter) || searchable.includes(genreFilter.toLowerCase());
      const moodMatch = !mood || searchable.includes(mood);
      const directorMatch = !director || String(item.director || '').toLowerCase().includes(director);
      const platformMatch = !platform || item.streaming_platforms?.some(name => name.toLowerCase().includes(platform));
      return yearMatch && genreMatch && moodMatch && directorMatch && platformMatch;
    }));
  }, [aiResults, yearFilter, genreFilter, moodFilter, directorFilter, platformFilter]);

  const hubResultCount = hubResults.games.length + hubResults.manga.length + hubResults.live.length + hubResults.performers.length;

  const matchesQuery = (item, lower, fields) => fields.some(field => {
    const value = item[field];
    if (Array.isArray(value)) return value.some(entry => String(entry).toLowerCase().includes(lower));
    return String(value || '').toLowerCase().includes(lower);
  });

  const doSearch = async (q) => {
    if (!q.trim()) return;
    setSearching(true);
    setAiResults([]);
    setHubResults({ games: [], manga: [], live: [], performers: [] });

    const lower = q.toLowerCase();
    const [all, games, manga, live, performers] = await Promise.all([
      base44.entities.Media.filter({ status: 'approved' }),
      base44.entities.Game.filter({ status: 'approved' }, '-created_date', 200),
      base44.entities.Manga.list('-created_date', 200),
      base44.entities.LiveChannel.filter({ status: 'approved' }, '-created_date', 200),
      base44.entities.Performer.list('-created_date', 200)
    ]);

    const safeMedia = filterMainAppSafeMedia(all);
    const matched = sortNewestFirst(safeMedia.filter(m =>
      matchesQuery(m, lower, ['title', 'synopsis', 'collection_name', 'collection_key', 'related_keywords', 'streaming_platforms', 'genres', 'cast', 'director']) ||
      deriveMediaTopics(m).some(topic => topic.toLowerCase().includes(lower))
    ));
    setResults(matched);
    setHubResults({
      games: sortNewestFirst(games.filter(item => matchesQuery(item, lower, ['title', 'description', 'genres', 'platforms', 'source_type', 'tags']))),
      manga: manga.filter(item => matchesQuery(item, lower, ['title', 'synopsis', 'author', 'artist', 'genres', 'status'])),
      live: live.filter(item => matchesQuery(item, lower, ['name', 'description', 'category', 'country'])),
      performers: performers.filter(item => matchesQuery(item, lower, ['name', 'stage_name', 'bio', 'nationality', 'tags', 'content_categories', 'character_traits']))
    });
    setSearching(false);

    // Use TMDB backend function for fast, accurate results
    setAiLoading(true);
    try {
      const res = await base44.functions.invoke('tmdbSearch', { query: q, pages: 25, limit: searchType === 'actor' ? 500 : 100, searchType });
      const sorted = filterMainAppSafeMedia(res.data?.results || []).sort((a, b) => (b.year || 0) - (a.year || 0));
      setAiResults(sorted);
    } catch (err) {
      console.warn('TMDB search unavailable:', err.message);
      setAiResults([]);
    }
    setAiLoading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    doSearch(query);
    window.history.pushState({}, '', `/search?q=${encodeURIComponent(query)}`);
  };

  const handleQuickSearch = (term) => {
    setSearchType('title');
    setQuery(term);
    doSearch(term);
    window.history.pushState({}, '', `/search?q=${encodeURIComponent(term)}`);
  };

  const handleImageSearch = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageLoading(true);
    setAiResults([]);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: 'Identify the movie or TV show from this uploaded image. It may be a poster, still frame, screenshot, or cover art. Return the most likely searchable title plus optional year and genre hints. If unsure, return the best concise search keywords.',
      file_urls: [file_url],
      response_json_schema: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          year: { type: 'number' },
          genres: { type: 'array', items: { type: 'string' } }
        }
      }
    });
    const nextQuery = analysis?.query || '';
    if (analysis?.year) setYearFilter(String(analysis.year));
    if (analysis?.genres?.[0] && GENRES.includes(analysis.genres[0])) setGenreFilter(analysis.genres[0]);
    setQuery(nextQuery);
    if (nextQuery) await doSearch(nextQuery);
    setImageLoading(false);
    event.target.value = '';
  };

  const addToLibrary = async (item) => {
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
      language: 'en'
    });
    setAddedIds(prev => new Set([...prev, item.title]));
    toast.success(`"${item.title}" added to library!`);
    setPreviewItem(null);
    // Refresh local results
    const all = await base44.entities.Media.filter({ status: 'approved' });
    const safeMedia = filterMainAppSafeMedia(all);
    const lower = query.toLowerCase();
    setResults(sortNewestFirst(safeMedia.filter(m =>
      m.title?.toLowerCase().includes(lower) ||
      m.synopsis?.toLowerCase().includes(lower) ||
      m.collection_name?.toLowerCase().includes(lower) ||
      m.collection_key?.toLowerCase().includes(lower) ||
      m.related_keywords?.some(k => k.toLowerCase().includes(lower)) ||
      m.streaming_platforms?.some(platform => platform.toLowerCase().includes(lower)) ||
      m.genres?.some(g => g.toLowerCase().includes(lower)) ||
      m.cast?.some(c => c.toLowerCase().includes(lower)) ||
      deriveMediaTopics(m).some(topic => topic.toLowerCase().includes(lower))
    )));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      <AiMediaPreviewModal
        item={previewItem}
        alreadyAdded={previewItem ? addedIds.has(previewItem.title) || results.some(r => r.title.toLowerCase() === previewItem.title.toLowerCase()) : false}
        onAdd={addToLibrary}
        onClose={() => setPreviewItem(null)}
      />
      <div className="pt-24 max-w-screen-xl mx-auto px-4 md:px-8 pb-16">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-secondary rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-muted-foreground hover:text-foreground" />
          </button>
          <h1 className="font-bebas text-4xl md:text-5xl text-foreground">Search</h1>
        </div>

        {/* Deep AI Search Toggle */}
        <div className="mb-6">
          <button
            onClick={() => { setShowDeepAI(v => !v); setDeepResults(null); setDeepQuery(''); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
              showDeepAI
                ? 'bg-primary/15 border-primary/40 text-primary'
                : 'bg-secondary border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Deep AI Search
            {showDeepAI ? <ChevronUp className="w-3.5 h-3.5 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 ml-1" />}
          </button>

          <AnimatePresence>
            {showDeepAI && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 bg-card border border-primary/20 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <p className="text-sm font-semibold text-foreground">Describe what you want to watch</p>
                    <span className="text-xs text-muted-foreground ml-1">— AI will find the best matches from your library</span>
                  </div>
                  <form onSubmit={handleDeepSearch} className="flex gap-3">
                    <input
                      type="text"
                      value={deepQuery}
                      onChange={e => setDeepQuery(e.target.value)}
                      placeholder='e.g. "a feel-good comedy from the 90s" or "dark sci-fi with time travel"'
                      className="flex-1 bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60"
                    />
                    <button
                      type="submit"
                      disabled={deepLoading || !deepQuery.trim()}
                      className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {deepLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      {deepLoading ? 'Thinking...' : 'Find'}
                    </button>
                  </form>

                  {/* Deep AI Results */}
                  {deepLoading && (
                    <div className="flex items-center gap-3 mt-4 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      AI is analysing your library...
                    </div>
                  )}

                  {deepResults !== null && !deepLoading && (
                    <div className="mt-5">
                      {deepResults.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No matches found. Try rephrasing your description.</p>
                      ) : (
                        <>
                          <p className="text-xs text-muted-foreground mb-3">{deepResults.length} AI-matched title{deepResults.length !== 1 ? 's' : ''} for "<span className="text-foreground">{deepQuery}</span>"</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                            {deepResults.map((item, i) => (
                              <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                                <Link to={`/media/${item.id}`} className="group block">
                                  <div className="aspect-[2/3] rounded-xl overflow-hidden bg-secondary mb-1.5 group-hover:scale-105 transition-transform shadow-md">
                                    {item.poster_url
                                      ? <img src={item.poster_url} alt={item.title} className="w-full h-full object-cover" />
                                      : <div className="w-full h-full flex items-center justify-center"><Film className="w-7 h-7 text-muted-foreground" /></div>
                                    }
                                  </div>
                                  <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">{item.title}</p>
                                  <p className="text-xs text-muted-foreground">{item.year}</p>
                                </Link>
                              </motion.div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSubmit} className="mb-8 space-y-3">
          <div className="flex flex-wrap gap-2">
            {[
              ['title', 'Titles, categories & platforms'],
              ['actor', 'Actor credits']
            ].map(([value, label]) => (
              <button key={value} type="button" onClick={() => setSearchType(value)} className={`rounded-full px-4 py-2 text-xs font-black ${searchType === value ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
                {label}
              </button>
            ))}
            <Link to="/spotlight" className="rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-black text-primary hover:bg-primary/20">Open Spotlight →</Link>
          </div>
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1 max-w-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={searchType === 'actor' ? 'Search an actor to find their movies and TV shows...' : 'Search movies, TV, genres, moods, platforms, collections, games, manga and live TV...' }
                className="w-full bg-secondary border border-border rounded-2xl pl-12 pr-4 py-4 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all"
              />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
              </button>
            </div>
            <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary hover:bg-primary/20">
              {imageLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4" />}
              {imageLoading ? 'Reading image...' : 'Find by image'}
              <input type="file" accept="image/*" onChange={handleImageSearch} className="hidden" />
            </label>
          </div>
          <AdvancedSearchFilters
            mood={moodFilter}
            setMood={setMoodFilter}
            director={directorFilter}
            setDirector={setDirectorFilter}
            platform={platformFilter}
            setPlatform={setPlatformFilter}
            yearFilter={yearFilter}
            setYearFilter={setYearFilter}
            genreFilter={genreFilter}
            setGenreFilter={setGenreFilter}
            genres={GENRES}
          />
          <div className="rounded-3xl border border-border bg-card/60 p-4">
            <p className="mb-3 text-xs font-black uppercase tracking-widest text-primary">Quick discovery</p>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {QUICK_SEARCHES.map(term => (
                <button key={term} type="button" onClick={() => handleQuickSearch(term)} className="shrink-0 rounded-full bg-secondary px-4 py-2 text-xs font-black text-muted-foreground hover:bg-primary/15 hover:text-primary">
                  {term}
                </button>
              ))}
            </div>
          </div>
        </form>

        {/* Library Results */}
        {filteredResults.length > 0 && (
          <div className="mb-10">
            <p className="text-sm text-muted-foreground mb-4">{filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''} in library for "<span className="text-foreground">{query}</span>"</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredResults.map((item, i) => (
                <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <Link to={`/media/${item.id}`} className="group block">
                    <div className="aspect-[2/3] rounded-xl overflow-hidden bg-secondary mb-2 group-hover:scale-105 transition-transform shadow-lg">
                      {item.poster_url
                        ? <img src={item.poster_url} alt={item.title} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><Film className="w-8 h-8 text-muted-foreground" /></div>
                      }
                    </div>
                    <p className="text-xs font-semibold text-foreground truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.year} • {item.type === 'tv_show' ? 'TV' : 'Movie'}</p>
                    {item.collection_name && <p className="text-xs font-bold text-primary truncate">{item.collection_name}</p>}
                    {item.streaming_platforms?.length > 0 && <p className="text-xs text-muted-foreground truncate">On {item.streaming_platforms.slice(0, 2).join(', ')}</p>}
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        <HubSearchSection type="games" items={hubResults.games} platform={platformFilter} />
        <HubSearchSection type="manga" items={hubResults.manga} />
        <HubSearchSection type="live" items={hubResults.live} />
        <HubSearchSection type="performers" items={hubResults.performers} />

        {/* AI Results */}
        {aiLoading && (
          <div className="flex items-center gap-3 px-5 py-4 bg-primary/10 border border-primary/20 rounded-2xl max-w-2xl mb-6">
            <Database className="w-5 h-5 text-primary animate-pulse shrink-0" />
            <p className="text-sm text-foreground">Deep searching TMDB across 25 pages for maximum movie and TV matches for "<span className="font-semibold">{query}</span>"...</p>
          </div>
        )}

        {filteredAiResults.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-4 h-4 text-primary" />
              <h2 className="text-lg font-bold text-foreground">TMDB Found {filteredAiResults.length} Match{filteredAiResults.length !== 1 ? 'es' : ''}</h2>
              <span className="text-xs text-muted-foreground ml-1">— click Add to add to the library</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAiResults.map((item, i) => {
                const alreadyAdded = addedIds.has(item.title) || results.some(r => r.title.toLowerCase() === item.title.toLowerCase());
                return (
                  <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                    onClick={() => setPreviewItem(item)}
                    className="flex cursor-pointer gap-4 bg-card border border-border rounded-2xl p-4 hover:border-primary/30 transition-colors">
                    {/* Poster */}
                    <div className="w-20 h-28 rounded-xl overflow-hidden bg-secondary shrink-0">
                      {item.poster_url
                        ? <img src={item.poster_url} alt={item.title} className="w-full h-full object-cover" onError={e => e.target.style.display = 'none'} />
                        : <div className="w-full h-full flex items-center justify-center"><Film className="w-6 h-6 text-muted-foreground" /></div>
                      }
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <h3 className="font-semibold text-foreground text-sm leading-tight">{item.title}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {item.year} • {item.type === 'tv_show' ? 'TV Show' : 'Movie'}
                            {item.rating ? ` • ⭐ ${item.rating.toFixed(1)}` : ''}
                          </p>
                          {item.collection_name && <p className="mt-1 text-xs font-bold text-primary">Linked: {item.collection_name}</p>}
                          {item.streaming_platforms?.length > 0 && <p className="mt-1 text-xs text-muted-foreground">Platforms: {item.streaming_platforms.slice(0, 3).join(', ')}</p>}
                          {item.trailer_url && (
                            <a href={item.trailer_url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-accent hover:text-accent/80">
                              YouTube trailer
                            </a>
                          )}
                          </div>
                        <button
                          onClick={(event) => { event.stopPropagation(); !alreadyAdded && addToLibrary(item); }}
                          className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                            alreadyAdded
                              ? 'bg-green-500/20 text-green-400 cursor-default'
                              : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105'
                          }`}>
                          {alreadyAdded ? <><Check className="w-3 h-3" /> Added</> : <><Plus className="w-3 h-3" /> Add</>}
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">{item.synopsis}</p>
                      {item.genres?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.genres.slice(0, 3).map(g => (
                            <span key={g} className="px-2 py-0.5 bg-secondary rounded-full text-xs text-muted-foreground">{g}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* No results at all */}
        {!searching && !aiLoading && !imageLoading && query && filteredResults.length === 0 && filteredAiResults.length === 0 && hubResultCount === 0 && (
          <div className="text-center py-20">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-semibold text-foreground mb-2">No results found</p>
            <p className="text-muted-foreground text-sm">Try different keywords or check spelling</p>
          </div>
        )}

        {/* Vault Section */}
        <div className="mt-12 border-t border-red-900/30 pt-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center">
              <Lock className="w-4 h-4 text-red-400" />
            </div>
            <h2 className="font-bebas text-3xl text-red-300 tracking-wider">Private Vault · 18+</h2>
            {vaultUnlocked && (
              <button onClick={handleVaultLock} className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-red-900/40 border border-red-700/40 text-red-400 rounded-lg text-xs font-medium hover:bg-red-900/70 transition-colors">
                <Lock className="w-3 h-3" /> Lock
              </button>
            )}
          </div>

          {!vaultUnlocked ? (
            <div className="max-w-sm">
              <p className="text-muted-foreground text-sm mb-4">Enter your PIN to access adult content.</p>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <input
                    type={showVaultPin ? 'text' : 'password'}
                    value={vaultPin}
                    onChange={e => { setVaultPin(e.target.value); setVaultPinError(''); }}
                    onKeyDown={e => e.key === 'Enter' && handleVaultUnlock()}
                    placeholder="Enter PIN"
                    maxLength={8}
                    className="w-full bg-secondary border border-red-900/40 rounded-xl px-4 py-2.5 text-foreground placeholder:text-muted-foreground text-center tracking-widest focus:outline-none focus:border-red-500/60"
                  />
                  <button onClick={() => setShowVaultPin(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showVaultPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button onClick={handleVaultUnlock} disabled={!vaultPin}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-40">
                  Unlock
                </button>
              </div>
              {vaultPinError && <p className="text-red-400 text-xs mt-2">{vaultPinError}</p>}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Vault TMDB Search — admin only */}
              {user?.role === 'admin' && (
                <form onSubmit={handleVaultSearch} className="flex gap-3 max-w-xl">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={vaultQuery}
                      onChange={e => setVaultQuery(e.target.value)}
                      placeholder="Search TMDB to add to Vault..."
                      className="w-full bg-secondary border border-red-900/40 rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-red-500/60"
                    />
                  </div>
                  <button type="submit" disabled={vaultAiLoading || !vaultQuery.trim()}
                    className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-40">
                    {vaultAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    Search
                  </button>
                </form>
              )}

              {/* Vault AI Results */}
              {vaultAiResults.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-3">TMDB results — click Add to add to Vault (marked as adult)</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {vaultAiResults.map((item, i) => {
                      const added = vaultAddedIds.has(item.title);
                      return (
                        <div key={i} className="flex gap-3 bg-card border border-red-900/30 rounded-xl p-3">
                          <div className="w-14 h-20 rounded-lg overflow-hidden bg-secondary shrink-0">
                            {item.poster_url ? <img src={item.poster_url} alt={item.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Film className="w-5 h-5 text-muted-foreground" /></div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground text-sm truncate">{item.title}</p>
                            <p className="text-xs text-muted-foreground">{item.year} • {item.type === 'tv_show' ? 'TV' : 'Movie'}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{item.synopsis}</p>
                            <button onClick={() => !added && addToVault(item)}
                              className={`mt-2 flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${added ? 'bg-green-500/20 text-green-400 cursor-default' : 'bg-red-600 text-white hover:bg-red-500'}`}>
                              {added ? <><Check className="w-3 h-3" /> Added</> : <><Plus className="w-3 h-3" /> Add to Vault</>}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Vault Library */}
              {vaultLoading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="w-7 h-7 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
                </div>
              ) : vaultItems.length === 0 ? (
                <p className="text-muted-foreground text-sm">No adult content in Vault yet. Use the search above to add.</p>
              ) : (
                <div>
                  <p className="text-xs text-muted-foreground mb-3">{vaultItems.length} title{vaultItems.length !== 1 ? 's' : ''} in Vault</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-4">
                    {vaultItems.map((item, i) => (
                      <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.02, 0.3) }}>
                        <Link to={`/media/${item.id}`} className="group block">
                          <div className="aspect-[2/3] rounded-xl overflow-hidden bg-secondary mb-2 group-hover:scale-105 transition-all duration-300">
                            {item.poster_url ? <img src={item.poster_url} alt={item.title} className="w-full h-full object-cover" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center"><Film className="w-7 h-7 text-muted-foreground" /></div>}
                          </div>
                          <p className="text-xs font-semibold text-foreground truncate">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.year}</p>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}