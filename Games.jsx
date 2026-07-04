import { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import Navbar from '@/components/layout/Navbar';
import GameCard from '@/components/games/GameCard';
import GameAddPanel from '@/components/games/GameAddPanel';
import GameCollectionRow from '@/components/games/GameCollectionRow';
import EliteGamingCommandCenter from '@/components/games/EliteGamingCommandCenter';
import GameVideoHub from '@/components/games/GameVideoHub';
import OfficialCloudServices from '@/components/games/OfficialCloudServices';
import GameInstantAISearch from '@/components/games/GameInstantAISearch';
import { Gamepad2, Plus, Search } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

const SOURCE_FILTERS = [
  ['all', 'All Sources'],
  ['web_game', 'Web Games'],
  ['cloud_link', 'Cloud'],
  ['steam', 'Steam'],
  ['xbox_cloud', 'Xbox Cloud'],
  ['playstation_cloud', 'PlayStation'],
  ['app_store', 'App Stores'],
  ['emulator', 'Emulators']
];

const textForGame = (game) => `${game.title || ''} ${game.description || ''} ${(game.genres || []).join(' ')} ${(game.platforms || []).join(' ')} ${(game.tags || []).join(' ')}`.toLowerCase();
const matchesAny = (game, keywords) => keywords.some(keyword => textForGame(game).includes(keyword));

export default function Games() {
  const [user, setUser] = useState(null);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [source, setSource] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [saves, setSaves] = useState([]);
  const [clips, setClips] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const load = async () => {
      const me = await base44.auth.me().catch(() => null);
      const [items, favs, userSaves, userClips, userAchievements, activeTournaments, feed] = await Promise.all([
        base44.entities.Game.filter({ status: 'approved' }, '-created_date', 200),
        me ? base44.entities.GameFavorite.filter({ user_email: me.email }, '-created_date', 200) : [],
        me ? base44.entities.GameSave.filter({ user_email: me.email }, '-last_played', 50) : [],
        me ? base44.entities.GameClip.filter({ user_email: me.email }, '-created_date', 50) : [],
        me ? base44.entities.GameAchievement.filter({ user_email: me.email }, '-unlocked_at', 50) : [],
        base44.entities.GameTournament.filter({ status: 'upcoming' }, 'starts_at', 20),
        base44.entities.GameActivity.list('-created_date', 50)
      ]);
      setUser(me);
      setGames(items);
      setFavorites(favs);
      setSaves(userSaves);
      setClips(userClips);
      setAchievements(userAchievements);
      setTournaments(activeTournaments);
      setActivities(feed);
      setLoading(false);
    };
    load();
  }, []);

  const filteredGames = useMemo(() => {
    const lower = query.trim().toLowerCase();
    return games.filter(game => {
      const sourceMatch = source === 'all' || game.source_type === source;
      const text = textForGame(game);
      const queryMatch = !lower || text.includes(lower);
      return sourceMatch && queryMatch;
    });
  }, [games, query, source]);

  const favoriteIds = useMemo(() => new Set(favorites.map(fav => fav.game_id)), [favorites]);
  const savedGameIds = useMemo(() => new Set(saves.map(save => save.game_id)), [saves]);
  const favoriteGames = filteredGames.filter(game => favoriteIds.has(game.id));
  const continuePlayingGames = filteredGames.filter(game => savedGameIds.has(game.id)).slice(0, 8);
  const installedGames = filteredGames.filter(game => game.play_url).slice(0, 8);
  const cloudGames = filteredGames.filter(game => ['cloud_link', 'steam', 'xbox_cloud', 'playstation_cloud'].includes(game.source_type)).slice(0, 8);
  const wishlistGames = filteredGames.filter(game => (game.tags || []).some(tag => tag.toLowerCase().includes('wishlist')) || game.source_type === 'app_store').slice(0, 8);
  const hiddenGames = filteredGames.filter(game => (game.tags || []).some(tag => ['hidden', 'private'].includes(tag.toLowerCase()))).slice(0, 8);
  const featured = filteredGames.filter(game => game.is_featured).slice(0, 6);
  const retroEmulators = filteredGames.filter(game => game.source_type === 'emulator' || matchesAny(game, ['retro', 'classic', 'ms-dos', 'dos', 'atari', 'sega', 'nintendo'])).slice(0, 8);
  const browserArcade = filteredGames.filter(game => game.source_type === 'web_game' && matchesAny(game, ['arcade', 'action', 'shooter', 'platform', 'browser'])).slice(0, 8);
  const strategyGames = filteredGames.filter(game => matchesAny(game, ['strategy', 'simulation', 'managerial', 'tactical', 'turn-based', 'real-time'])).slice(0, 8);
  const puzzleBrainGames = filteredGames.filter(game => matchesAny(game, ['puzzle', 'brain', 'logic', 'word', 'educational'])).slice(0, 8);
  const actionAdventure = filteredGames.filter(game => matchesAny(game, ['action', 'adventure', 'platformer', 'fighting', 'racing'])).slice(0, 8);
  const topRatedBrowserGames = [...filteredGames].filter(game => game.play_url).sort((a, b) => (b.views || b.rating || 0) - (a.views || a.rating || 0)).slice(0, 8);

  const toggleFavorite = async (game) => {
    if (!user) return;
    const existing = favorites.find(fav => fav.game_id === game.id);
    if (existing) {
      await base44.entities.GameFavorite.delete(existing.id);
      setFavorites(prev => prev.filter(fav => fav.id !== existing.id));
    } else {
      const created = await base44.entities.GameFavorite.create({ user_email: user.email, game_id: game.id, game_title: game.title, source_type: game.source_type });
      setFavorites(prev => [created, ...prev]);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      <AnimatePresence>
        {showAdd && <GameAddPanel onClose={() => setShowAdd(false)} onAdded={(game) => setGames(prev => [game, ...prev])} />}
      </AnimatePresence>

      <section className="relative overflow-hidden px-4 pb-10 pt-28 md:px-8 md:pt-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(245,184,61,0.18),transparent_32%),radial-gradient(circle_at_85%_5%,rgba(147,51,234,0.20),transparent_30%)]" />
        <div className="relative mx-auto max-w-screen-2xl">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary">
              <Gamepad2 className="h-4 w-4" /> Games Hub
            </div>
            <h1 className="font-bebas text-6xl tracking-wider text-foreground md:text-8xl">Play Games Inside EliteVault</h1>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
              Instantly search playable games, upload legal ROMs for browser emulators, and launch Steam, Xbox and PlayStation cloud services from one hub.
            </p>
            <button onClick={() => setShowAdd(true)} className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4" /> Search or Add Games
            </button>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-screen-2xl px-4 pb-16 md:px-8">
        <div className="mb-6 rounded-3xl border border-border bg-card p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1 lg:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search games, platforms, genres…" className="w-full rounded-full border border-border bg-secondary py-3 pl-10 pr-4 text-base text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none" />
            </div>
            <div className="flex flex-wrap gap-2">
              {SOURCE_FILTERS.map(([value, label]) => (
                <button key={value} onClick={() => setSource(value)} className={`min-h-11 rounded-full px-4 text-sm font-bold ${source === value ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <GameInstantAISearch onAdded={(game) => setGames(prev => [game, ...prev])} />

        <EliteGamingCommandCenter
          games={filteredGames}
          user={user}
          saves={saves}
          clips={clips}
          achievements={achievements}
          tournaments={tournaments}
          activities={activities}
          favorites={favorites}
          onAddGames={() => setShowAdd(true)}
          onSearch={setQuery}
        />

        <GameVideoHub />
        <OfficialCloudServices />

        <div id="library" />
        <GameCollectionRow title="Continue Playing" description="Resume games with saved checkpoints and recent play activity." games={continuePlayingGames} favoriteIds={favoriteIds} onToggleFavorite={toggleFavorite} />
        <GameCollectionRow title="Installed / Playable Now" description="Games with one-click in-app play routes." games={installedGames} favoriteIds={favoriteIds} onToggleFavorite={toggleFavorite} />
        <GameCollectionRow title="Cloud" description="Cloud and external streaming sources connected to your library." games={cloudGames} favoriteIds={favoriteIds} onToggleFavorite={toggleFavorite} />
        <GameCollectionRow title="Wishlist" description="Store and wishlist-tagged games to track for later." games={wishlistGames} favoriteIds={favoriteIds} onToggleFavorite={toggleFavorite} />
        <GameCollectionRow title="My Favorites" description="Your starred web games and emulators for quick access." games={favoriteGames} favoriteIds={favoriteIds} onToggleFavorite={toggleFavorite} />
        <GameCollectionRow title="Hidden Games" description="Private or hidden-tagged games kept out of the main flow." games={hiddenGames} favoriteIds={favoriteIds} onToggleFavorite={toggleFavorite} />
        <div id="explore" />
        <GameCollectionRow title="Featured Games" description="Highlighted picks from your Games Hub library." games={featured} favoriteIds={favoriteIds} onToggleFavorite={toggleFavorite} />
        <GameCollectionRow title="Retro Emulators" description="Classic DOS, arcade, console, and legal emulator-friendly picks." games={retroEmulators} favoriteIds={favoriteIds} onToggleFavorite={toggleFavorite} />
        <GameCollectionRow title="Browser Arcade" description="Fast playable web games with arcade-style action." games={browserArcade} favoriteIds={favoriteIds} onToggleFavorite={toggleFavorite} />
        <GameCollectionRow title="Strategy" description="Tactical, simulation, management, and turn-based games." games={strategyGames} favoriteIds={favoriteIds} onToggleFavorite={toggleFavorite} />
        <GameCollectionRow title="Puzzle & Brain" description="Logic, educational, word, and puzzle games." games={puzzleBrainGames} favoriteIds={favoriteIds} onToggleFavorite={toggleFavorite} />
        <GameCollectionRow title="Action & Adventure" description="Platformers, racing, fighting, and adventure games." games={actionAdventure} favoriteIds={favoriteIds} onToggleFavorite={toggleFavorite} />
        <GameCollectionRow title="Top Rated Browser Games" description="Playable games ranked by popularity and activity." games={topRatedBrowserGames} favoriteIds={favoriteIds} onToggleFavorite={toggleFavorite} />

        {loading ? (
          <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" /></div>
        ) : filteredGames.length === 0 ? (
          <div className="rounded-3xl border border-border bg-card p-10 text-center">
            <Gamepad2 className="mx-auto mb-4 h-12 w-12 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">No games yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">Add your first web game, cloud link, app store game, or legal emulator source.</p>
            <button onClick={() => setShowAdd(true)} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4" /> Add Games
            </button>
          </div>
        ) : (
          <section>
            <p className="mb-4 text-sm text-muted-foreground">{filteredGames.length} game{filteredGames.length !== 1 ? 's' : ''}</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredGames.map(game => <GameCard key={game.id} game={game} isFavorite={favoriteIds.has(game.id)} onToggleFavorite={toggleFavorite} />)}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}