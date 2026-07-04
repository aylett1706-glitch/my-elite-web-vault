import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import Navbar from '@/components/layout/Navbar';
import CollectionItemCard from '@/components/collections/CollectionItemCard';
import { ArrowLeft, Gamepad2, Loader2, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const itemMatches = (item, keywords = []) => {
  if (!keywords.length) return false;
  const text = [item.title, item.description, item.synopsis, item.collection_name, item.collection_key, item.director, item.cast, item.genres, item.tags, item.platforms, item.related_keywords].flat().filter(Boolean).join(' ').toLowerCase();
  return keywords.some(keyword => text.includes(String(keyword).toLowerCase()));
};

export default function CollectionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [collection, setCollection] = useState(null);
  const [media, setMedia] = useState([]);
  const [games, setGames] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [me, folder, mediaItems, gameItems] = await Promise.all([
      base44.auth.me().catch(() => null),
      base44.entities.MediaCollection.get(id),
      base44.entities.Media.filter({ status: 'approved' }, '-created_date', 400),
      base44.entities.Game.filter({ status: 'approved' }, '-created_date', 400)
    ]);
    setUser(me);
    setCollection(folder);
    setMedia(mediaItems.filter(item => !item.is_adult));
    setGames(gameItems);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const allowAuto = collection?.collection_type !== 'manual';
  const selectedMedia = new Set(collection?.selected_media_ids || []);
  const selectedGames = new Set(collection?.selected_game_ids || []);

  const folderMedia = useMemo(() => media.filter(item => selectedMedia.has(item.id) || (allowAuto && itemMatches(item, collection?.media_keywords || []))), [media, collection]);
  const folderGames = useMemo(() => games.filter(item => selectedGames.has(item.id) || (allowAuto && itemMatches(item, collection?.game_keywords || []))), [games, collection]);

  const libraryMatches = useMemo(() => {
    const lower = query.toLowerCase();
    const filter = item => !lower || [item.title, item.synopsis, item.description, item.genres, item.tags].flat().filter(Boolean).join(' ').toLowerCase().includes(lower);
    return { media: media.filter(filter).slice(0, 24), games: games.filter(filter).slice(0, 24) };
  }, [media, games, query]);

  const updateFolder = async (data) => {
    const updated = await base44.entities.MediaCollection.update(collection.id, data);
    setCollection(updated);
  };

  const toggleMedia = async (item) => {
    const next = new Set(collection.selected_media_ids || []);
    next.has(item.id) ? next.delete(item.id) : next.add(item.id);
    await updateFolder({ selected_media_ids: [...next] });
  };

  const toggleGame = async (item) => {
    const next = new Set(collection.selected_game_ids || []);
    next.has(item.id) ? next.delete(item.id) : next.add(item.id);
    await updateFolder({ selected_game_ids: [...next] });
  };

  const deleteFolder = async () => {
    if (!confirm(`Delete "${collection.name}"?`)) return;
    await base44.entities.MediaCollection.delete(collection.id);
    toast.success('Folder deleted');
    navigate('/collections');
  };

  if (loading) return <div className="fixed inset-0 flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!collection) return <div className="min-h-screen bg-background"><Navbar user={user} /><main className="pt-28 text-center text-foreground">Collection not found</main></div>;

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      <main className="mx-auto max-w-screen-2xl px-4 pb-16 pt-24 md:px-8">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <button onClick={() => navigate('/collections')} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-secondary px-4 text-sm font-bold text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Collections</button>
          <button onClick={deleteFolder} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 text-sm font-bold text-red-400 hover:bg-red-500/20"><Trash2 className="h-4 w-4" /> Delete folder</button>
        </div>

        <section className="mb-8 rounded-3xl border border-primary/20 bg-card p-6">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-primary">{collection.collection_type} folder</p>
          <h1 className="font-bebas text-5xl tracking-wider text-foreground md:text-7xl">{collection.name}</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">{collection.description || 'A custom collection folder.'}</p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-muted-foreground">
            {(collection.media_keywords || []).map(keyword => <span key={keyword} className="rounded-full bg-primary/10 px-3 py-1 text-primary">Media: {keyword}</span>)}
            {(collection.game_keywords || []).map(keyword => <span key={keyword} className="rounded-full bg-accent/10 px-3 py-1 text-accent">Game: {keyword}</span>)}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-black text-foreground">In this folder</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7">
            {folderMedia.map(item => <CollectionItemCard key={`m-${item.id}`} item={item} type="media" selected />)}
            {folderGames.map(item => <CollectionItemCard key={`g-${item.id}`} item={item} type="game" selected />)}
          </div>
          {!folderMedia.length && !folderGames.length && <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">No items match yet. Add items manually below or update keywords.</p>}
        </section>

        {collection.collection_type !== 'auto' && (
          <section className="rounded-3xl border border-border bg-card p-5">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-black text-foreground">Manual add</h2>
                <p className="text-sm text-muted-foreground">Search your library and add movies, shows or games to this folder.</p>
              </div>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Find items to add…" className="w-full rounded-xl border border-border bg-secondary py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60" />
              </div>
            </div>
            <h3 className="mb-3 text-sm font-black uppercase tracking-widest text-primary">Movies & TV</h3>
            <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-8">
              {libraryMatches.media.map(item => <CollectionItemCard key={item.id} item={item} type="media" selected={selectedMedia.has(item.id)} onToggle={toggleMedia} editable />)}
            </div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-accent"><Gamepad2 className="h-4 w-4" /> Games</h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-8">
              {libraryMatches.games.map(item => <CollectionItemCard key={item.id} item={item} type="game" selected={selectedGames.has(item.id)} onToggle={toggleGame} editable />)}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}