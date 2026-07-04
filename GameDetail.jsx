import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import Navbar from '@/components/layout/Navbar';
import { ArrowLeft, ExternalLink, Gamepad2, MonitorPlay, ShieldCheck, Star } from 'lucide-react';
import { toast } from 'sonner';

export default function GameDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [game, setGame] = useState(null);
  const [favorite, setFavorite] = useState(null);
  const [save, setSave] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const me = await base44.auth.me().catch(() => null);
      const [item] = await base44.entities.Game.filter({ id }, '', 1);
      const favs = me ? await base44.entities.GameFavorite.filter({ user_email: me.email, game_id: id }, '-created_date', 1) : [];
      const saves = me ? await base44.entities.GameSave.filter({ user_email: me.email, game_id: id }, '-updated_date', 1) : [];
      setUser(me);
      setGame(item || null);
      setFavorite(favs[0] || null);
      setSave(saves[0] || null);
      setLoading(false);
    };
    load();
  }, [id]);

  const toggleFavorite = async () => {
    if (!user || !game) return;
    if (favorite) {
      await base44.entities.GameFavorite.delete(favorite.id);
      setFavorite(null);
      toast.success('Removed from favorites');
    } else {
      const created = await base44.entities.GameFavorite.create({ user_email: user.email, game_id: game.id, game_title: game.title, source_type: game.source_type });
      setFavorite(created);
      toast.success('Added to favorites');
    }
  };

  if (loading) return <div className="fixed inset-0 flex items-center justify-center bg-background"><div className="h-9 w-9 animate-spin rounded-full border-2 border-primary/30 border-t-primary" /></div>;
  if (!game) return <div className="min-h-screen bg-background"><Navbar user={user} /><div className="pt-28 text-center text-foreground">Game not found</div></div>;

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      <main className="mx-auto max-w-screen-xl px-4 pb-16 pt-24 md:px-8">
        <button onClick={() => navigate('/games')} className="mb-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-secondary px-4 text-sm font-bold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Games Hub
        </button>

        <section className="overflow-hidden rounded-3xl border border-border bg-card">
          <div className="relative min-h-72 bg-secondary">
            {game.banner_url || game.cover_url ? <img src={game.banner_url || game.cover_url} alt={game.title} className="h-72 w-full object-cover opacity-70" /> : <div className="flex h-72 items-center justify-center"><Gamepad2 className="h-20 w-20 text-primary" /></div>}
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">
                <MonitorPlay className="h-3.5 w-3.5" /> {game.source_type?.replace('_', ' ')}
              </div>
              <h1 className="font-bebas text-5xl tracking-wider text-foreground md:text-7xl">{game.title}</h1>
              <p className="mt-3 max-w-3xl text-base leading-relaxed text-muted-foreground">{game.description || 'No description added yet.'}</p>
            </div>
          </div>

          <div className="grid gap-6 p-6 md:grid-cols-[1fr_320px] md:p-8">
            <div className="space-y-6">
              <div>
                <h2 className="mb-3 text-lg font-bold text-foreground">Genres</h2>
                <div className="flex flex-wrap gap-2">
                  {(game.genres?.length ? game.genres : ['Uncategorised']).map(genre => <span key={genre} className="rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-muted-foreground">{genre}</span>)}
                </div>
              </div>
              <div>
                <h2 className="mb-3 text-lg font-bold text-foreground">Available Platforms</h2>
                <div className="flex flex-wrap gap-2">
                  {(game.platforms?.length ? game.platforms : ['Browser']).map(platform => <span key={platform} className="rounded-full border border-border px-3 py-1 text-sm font-semibold text-foreground">{platform}</span>)}
                </div>
              </div>
              {game.legal_notes && <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100"><ShieldCheck className="mr-2 inline h-4 w-4 text-emerald-300" />{game.legal_notes}</div>}
              {save && <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4 text-sm text-muted-foreground"><strong className="text-foreground">Cloud Save:</strong> {save.save_label || 'Saved checkpoint'} · {save.save_notes || 'Ready to resume.'}</div>}
            </div>

            <aside className="space-y-3 rounded-2xl border border-border bg-secondary/50 p-4">
              {(game.play_url || game.rom_url) && <Link to={`/games/${game.id}/play`} className="flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground hover:bg-primary/90">{game.rom_url ? 'Play Emulator' : 'Play Inside App'}</Link>}
              {game.store_url && <a href={game.store_url} target="_blank" rel="noreferrer" className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border px-5 text-sm font-bold text-foreground hover:border-primary/50">Open Source <ExternalLink className="h-4 w-4" /></a>}
              <button onClick={toggleFavorite} className={`flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold ${favorite ? 'bg-yellow-400 text-black' : 'bg-card text-foreground hover:bg-card/80'}`}>
                <Star className={`h-4 w-4 ${favorite ? 'fill-black' : ''}`} /> {favorite ? 'Favorited' : 'Add to Favorites'}
              </button>
            </aside>
          </div>
        </section>
      </main>
    </div>
  );
}