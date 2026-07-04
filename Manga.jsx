import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import Navbar from '@/components/layout/Navbar';
import { BookOpen, Check, Database, Layers, Loader2, Plus, Search, Sparkles, Star } from 'lucide-react';
import HubCategoryChips from '@/components/hubs/HubCategoryChips';
import HubContentRow from '@/components/hubs/HubContentRow';
import { toast } from 'sonner';
import MangaChapterManager from '@/components/manga/MangaChapterManager';

const emptyForm = { title: '', synopsis: '', cover_url: '', read_url: '', author: '', artist: '', genres: '', status: 'ongoing', content_rating: '' };
const MANGA_CATEGORIES = [
  { label: 'All Manga', value: 'all' },
  { label: 'Ongoing', value: 'ongoing' },
  { label: 'Completed', value: 'completed' },
  { label: 'Featured', value: 'featured' },
  { label: 'Chapters', value: 'chapters' }
];

export default function Manga() {
  const [user, setUser] = useState(null);
  const [manga, setManga] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [aiQuery, setAiQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResults, setAiResults] = useState([]);
  const [deepSearch, setDeepSearch] = useState(true);
  const [addedTitles, setAddedTitles] = useState(new Set());
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    const load = async () => {
      const [me, items] = await Promise.all([
        base44.auth.me().catch(() => null),
        base44.entities.Manga.list('-created_date', 200)
      ]);
      setUser(me);
      setManga(items);
      setLoading(false);
    };
    load();
  }, []);

  const featured = useMemo(() => manga.find(item => item.is_featured) || manga[0], [manga]);
  const categoryManga = useMemo(() => manga.filter(item => {
    if (activeCategory === 'featured') return item.is_featured;
    if (activeCategory === 'chapters') return (item.chapters?.length || 0) > 0;
    if (['ongoing', 'completed'].includes(activeCategory)) return item.status === activeCategory;
    return true;
  }), [manga, activeCategory]);
  const mangaRows = [
    { title: 'Ongoing Manga', description: 'Series still releasing or being followed.', items: manga.filter(item => item.status === 'ongoing') },
    { title: 'Completed Manga', description: 'Finished manga collections.', items: manga.filter(item => item.status === 'completed') },
    { title: 'Chapter Collections', description: 'Manga with chapters ready to expand.', items: manga.filter(item => (item.chapters?.length || 0) > 0) }
  ];

  const addManga = async (e) => {
    e.preventDefault();
    const created = await base44.entities.Manga.create({
      ...form,
      genres: form.genres.split(',').map(item => item.trim()).filter(Boolean),
      chapters: [],
      views: 0
    });
    setManga(prev => [created, ...prev]);
    setForm(emptyForm);
    setShowForm(false);
    toast.success('Manga added');
  };

  const searchManga = async (e) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    const res = await base44.functions.invoke('animeMangaSearch', { query: aiQuery, type: 'manga', deep: deepSearch, limit: deepSearch ? 24 : 12 });
    setAiResults(res.data?.results || []);
    setAiLoading(false);
  };

  const addAiManga = async (item) => {
    const created = await base44.entities.Manga.create(item);
    setManga(prev => [created, ...prev]);
    setAddedTitles(prev => new Set([...prev, item.title]));
    toast.success('Manga added');
  };

  const handleMangaUpdated = (updated) => {
    setManga(prev => prev.map(item => item.id === updated.id ? updated : item));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      <main className="mx-auto max-w-screen-2xl px-4 pb-16 pt-24 md:px-8">
        <section className="mb-8 overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-card via-card to-cyan-500/10 p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">
                <Sparkles className="h-3.5 w-3.5" /> Manga Library
              </div>
              <h1 className="mt-5 font-bebas text-5xl tracking-wider text-foreground md:text-7xl">Manga</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">A dedicated manga shelf for chapters, covers, creators, genres, collections, and future reader support.</p>
            </div>
            {user?.role === 'admin' && (
              <button onClick={() => setShowForm(v => !v)} className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-primary px-5 text-sm font-black text-primary-foreground hover:bg-primary/90">
                <Plus className="h-4 w-4" /> Add Manga
              </button>
            )}
          </div>
        </section>

        <section className="mb-8 rounded-3xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" />
              <h2 className="text-lg font-black text-foreground">AI Manga Search & Add</h2>
            </div>
            <form onSubmit={searchManga} className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input value={aiQuery} onChange={e => setAiQuery(e.target.value)} placeholder="Deep search manga, authors, themes, genres, chapters..." className="w-full rounded-xl border border-border bg-secondary py-3 pl-10 pr-4 text-sm text-foreground" />
                </div>
                <button disabled={aiLoading || !aiQuery.trim()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-black text-primary-foreground disabled:opacity-50">
                  {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} {deepSearch ? 'Deep Search' : 'Search'}
                </button>
              </div>
              <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                <input type="checkbox" checked={deepSearch} onChange={e => setDeepSearch(e.target.checked)} className="h-4 w-4 accent-primary" />
                Deep search: expands results with authors, serialisation, rankings, popularity, chapters, volumes, themes and extra matches.
              </label>
            </form>
            {aiResults.length > 0 && (
              <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {aiResults.map(item => {
                  const added = addedTitles.has(item.title) || manga.some(existing => existing.title?.toLowerCase() === item.title?.toLowerCase());
                  return (
                    <div key={item.title} className="flex gap-3 rounded-2xl border border-border bg-secondary/50 p-3">
                      <div className="h-24 w-16 shrink-0 overflow-hidden rounded-xl bg-secondary">{item.cover_url && <img src={item.cover_url} alt={item.title} className="h-full w-full object-cover" />}</div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-bold text-foreground">{item.title}</h3>
                        <p className="text-xs text-muted-foreground">{item.author || 'Manga'} · {item.status}</p>
                        <p className="mt-1 line-clamp-3 text-xs text-muted-foreground whitespace-pre-line">{item.synopsis}</p>
                        {item.genres?.length > 0 && <p className="mt-2 line-clamp-1 text-[11px] font-bold text-primary">{item.genres.slice(0, 5).join(' • ')}</p>}
                        <button onClick={() => !added && addAiManga(item)} className={`mt-2 inline-flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-bold ${added ? 'bg-green-500/20 text-green-400' : 'bg-primary text-primary-foreground'}`}>
                          {added ? <><Check className="h-3 w-3" /> Added</> : <><Plus className="h-3 w-3" /> Add Manga</>}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

        {user?.role === 'admin' && <MangaChapterManager manga={manga} onUpdated={handleMangaUpdated} />}

        {showForm && (
          <form onSubmit={addManga} className="mb-8 grid gap-3 rounded-3xl border border-border bg-card p-5 md:grid-cols-2">
            <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Title" className="rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground" />
            <input value={form.cover_url} onChange={e => setForm({ ...form, cover_url: e.target.value })} placeholder="Cover image URL" className="rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground" />
            <input value={form.read_url} onChange={e => setForm({ ...form, read_url: e.target.value })} placeholder="Official reading URL, if available" className="rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground" />
            <input value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} placeholder="Author" className="rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground" />
            <input value={form.artist} onChange={e => setForm({ ...form, artist: e.target.value })} placeholder="Artist" className="rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground" />
            <input value={form.genres} onChange={e => setForm({ ...form, genres: e.target.value })} placeholder="Genres, comma separated" className="rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground" />
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground">
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="hiatus">Hiatus</option>
            </select>
            <textarea value={form.synopsis} onChange={e => setForm({ ...form, synopsis: e.target.value })} placeholder="Synopsis" className="min-h-28 rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground md:col-span-2" />
            <button className="rounded-xl bg-primary px-5 py-3 text-sm font-black text-primary-foreground md:col-span-2">Save Manga</button>
          </form>
        )}

        <div className="mb-6 space-y-6">
          <HubCategoryChips categories={MANGA_CATEGORIES} active={activeCategory} onChange={setActiveCategory} />
          {mangaRows.map(row => (
            <HubContentRow key={row.title} title={row.title} description={row.description} items={row.items}>
              {(item) => (
                <Link key={item.id} to={`/manga/${item.id}`} className="w-36 shrink-0 rounded-2xl border border-border bg-card p-3 transition-transform hover:scale-105">
                  <div className="aspect-[2/3] overflow-hidden rounded-xl bg-secondary">
                    {item.cover_url ? <img src={item.cover_url} alt={item.title} className="h-full w-full object-cover" loading="lazy" /> : <div className="flex h-full items-center justify-center"><BookOpen className="h-8 w-8 text-muted-foreground" /></div>}
                  </div>
                  <h3 className="mt-2 truncate text-sm font-bold text-foreground">{item.title}</h3>
                </Link>
              )}
            </HubContentRow>
          ))}
        </div>

        {featured && (
          <div className="mb-8 rounded-3xl border border-primary/20 bg-card p-5">
            <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary"><Star className="h-3.5 w-3.5" /> Featured Manga</p>
            <div className="flex gap-4">
              <div className="h-32 w-24 shrink-0 overflow-hidden rounded-2xl bg-secondary">
                {featured.cover_url ? <img src={featured.cover_url} alt={featured.title} className="h-full w-full object-cover" /> : <BookOpen className="m-auto mt-12 h-8 w-8 text-muted-foreground" />}
              </div>
              <div>
                <h2 className="text-2xl font-black text-foreground">{featured.title}</h2>
                <p className="text-sm text-muted-foreground">{featured.author || 'Unknown author'} · {featured.status}</p>
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{featured.synopsis}</p>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20"><div className="h-9 w-9 animate-spin rounded-full border-2 border-primary/30 border-t-primary" /></div>
        ) : manga.length === 0 ? (
          <div className="rounded-3xl border border-border bg-card p-10 text-center">
            <BookOpen className="mx-auto mb-3 h-10 w-10 text-primary" />
            <h2 className="text-xl font-black text-foreground">No manga added yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">Admins can add manga titles here, then chapters can be expanded later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
            {categoryManga.map(item => (
              <Link key={item.id} to={`/manga/${item.id}`} className="rounded-2xl border border-border bg-card p-3 transition-transform hover:scale-105">
                <div className="aspect-[2/3] overflow-hidden rounded-xl bg-secondary">
                  {item.cover_url ? <img src={item.cover_url} alt={item.title} className="h-full w-full object-cover" loading="lazy" /> : <div className="flex h-full items-center justify-center"><BookOpen className="h-8 w-8 text-muted-foreground" /></div>}
                </div>
                <h3 className="mt-2 truncate text-sm font-bold text-foreground">{item.title}</h3>
                <p className="truncate text-xs text-muted-foreground">{item.author || item.artist || 'Manga'}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-primary"><Layers className="h-3 w-3" /> {item.chapters?.length || 0} chapters</p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}