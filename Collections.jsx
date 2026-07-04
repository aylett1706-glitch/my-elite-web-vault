import { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import Navbar from '@/components/layout/Navbar';
import CollectionForm from '@/components/collections/CollectionForm';
import CollectionTile from '@/components/collections/CollectionTile';
import { Folder, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const presets = [
  { name: 'Marvel', description: 'Marvel, MCU, Avengers, X-Men and related titles.', collection_type: 'mixed', media_keywords: ['Marvel', 'MCU', 'Avengers', 'X-Men'], game_keywords: ['Marvel', 'Avengers', 'Spider-Man'] },
  { name: 'Action Games', description: 'Automatically groups action, shooter, fighting and adventure games.', collection_type: 'mixed', media_keywords: ['Action'], game_keywords: ['action', 'shooter', 'fighting', 'adventure'] },
  { name: 'Must-Watch', description: 'A manual watchlist folder you can fill yourself.', collection_type: 'manual', media_keywords: [], game_keywords: [] }
];

const itemMatches = (item, keywords = []) => {
  if (!keywords.length) return false;
  const text = [item.title, item.description, item.synopsis, item.collection_name, item.collection_key, item.director, item.cast, item.genres, item.tags, item.platforms, item.related_keywords].flat().filter(Boolean).join(' ').toLowerCase();
  return keywords.some(keyword => text.includes(String(keyword).toLowerCase()));
};

const getFolderItems = (collection, media, games) => {
  const manualMedia = new Set(collection.selected_media_ids || []);
  const manualGames = new Set(collection.selected_game_ids || []);
  const allowAuto = collection.collection_type !== 'manual';
  return {
    media: media.filter(item => manualMedia.has(item.id) || (allowAuto && itemMatches(item, collection.media_keywords || []))),
    games: games.filter(item => manualGames.has(item.id) || (allowAuto && itemMatches(item, collection.game_keywords || [])))
  };
};

export default function Collections() {
  const [user, setUser] = useState(null);
  const [collections, setCollections] = useState([]);
  const [media, setMedia] = useState([]);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [me, folders, mediaItems, gameItems] = await Promise.all([
      base44.auth.me().catch(() => null),
      base44.entities.MediaCollection.list('-created_date', 100),
      base44.entities.Media.filter({ status: 'approved' }, '-created_date', 300),
      base44.entities.Game.filter({ status: 'approved' }, '-created_date', 300)
    ]);
    setUser(me);
    setCollections(folders);
    setMedia(mediaItems.filter(item => !item.is_adult));
    setGames(gameItems);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const createCollection = async (data) => {
    setSaving(true);
    await base44.entities.MediaCollection.create(data);
    toast.success('Folder created');
    await load();
    setSaving(false);
  };

  const createPreset = async (preset) => {
    if (collections.some(folder => folder.name.toLowerCase() === preset.name.toLowerCase())) return;
    await createCollection({ ...preset, selected_media_ids: [], selected_game_ids: [] });
  };

  const foldersWithItems = useMemo(() => collections.map(collection => ({ collection, ...getFolderItems(collection, media, games) })), [collections, media, games]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      <main className="mx-auto max-w-screen-2xl px-4 pb-16 pt-24 md:px-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-primary">Custom folders</p>
            <h1 className="font-bebas text-5xl tracking-wider text-foreground md:text-7xl">Collections</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">Manually add titles or let keyword rules automatically group movies, TV shows and games.</p>
          </div>
        </div>

        <CollectionForm onCreate={createCollection} saving={saving} />

        <section className="my-6 rounded-3xl border border-border bg-card/60 p-5">
          <div className="mb-3 flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /><h2 className="font-black text-foreground">Quick folders</h2></div>
          <div className="flex flex-wrap gap-2">
            {presets.map(preset => (
              <button key={preset.name} onClick={() => createPreset(preset)} disabled={collections.some(folder => folder.name.toLowerCase() === preset.name.toLowerCase())} className="rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-black text-primary hover:bg-primary/20 disabled:opacity-40">
                {preset.name}
              </button>
            ))}
          </div>
        </section>

        {loading ? <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : foldersWithItems.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {foldersWithItems.map(folder => <CollectionTile key={folder.collection.id} {...folder} />)}
          </div>
        ) : (
          <div className="rounded-3xl border border-border bg-card p-12 text-center">
            <Folder className="mx-auto mb-3 h-10 w-10 text-primary" />
            <p className="font-bold text-foreground">No folders yet</p>
            <p className="text-sm text-muted-foreground">Create one above to start organising your library.</p>
          </div>
        )}
      </main>
    </div>
  );
}