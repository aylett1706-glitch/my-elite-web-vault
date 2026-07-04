import { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import Navbar from '@/components/layout/Navbar';
import BookCard from '@/components/books/BookCard';
import BookFeatureGrid from '@/components/books/BookFeatureGrid';
import { BookOpen, Headphones, Library, Loader2, Search, Sparkles } from 'lucide-react';

const isFullReadableBook = (book) => {
  const url = `${book?.preview_url || ''} ${book?.info_url || ''} ${book?.audiobook_url || ''}`;
  return /\.(pdf|epub|txt|html?)(\.|\/|\?|$)/i.test(url) || /gutenberg\.org|standardebooks\.org|wikisource\.org|openstax\.org|librivox\.org/i.test(url);
};

const searchOptions = [
  { label: 'Public domain', value: 'public_domain' },
  { label: 'Open textbooks', value: 'textbooks' },
  { label: 'Audiobooks', value: 'audiobooks' },
  { label: 'Whole web AI', value: 'open_web' }
];

const categories = [
  { label: 'All', value: 'all' },
  { label: 'eBooks', value: 'ebook' },
  { label: 'Audiobooks', value: 'audiobook' },
  { label: 'Comics', value: 'comic' },
  { label: 'Manga', value: 'manga' },
  { label: 'Learning', value: 'educational' }
];

export default function Books() {
  const [user, setUser] = useState(null);
  const [books, setBooks] = useState([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [deepSearch, setDeepSearch] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedSources, setSelectedSources] = useState(['public_domain', 'textbooks', 'audiobooks', 'open_web']);

  useEffect(() => {
    const load = async () => {
      const [me, savedBooks] = await Promise.all([
        base44.auth.me().catch(() => null),
        base44.entities.Book.filter({ status: 'approved' }, '-created_date', 100)
      ]);
      setUser(me);
      setBooks(savedBooks);
      setLoading(false);
    };
    load();
  }, []);

  const savedIds = useMemo(() => new Set(books.map(book => book.source_id || book.title?.toLowerCase())), [books]);
  const filteredBooks = useMemo(() => books.filter(book => activeCategory === 'all' || book.content_type === activeCategory), [books, activeCategory]);

  const runBookSearch = async ({ useDeep = false, useAi = false } = {}) => {
    if (!query.trim()) return;
    setSearching(true);
    const res = await base44.functions.invoke('bookSearch', {
      query: query.trim(),
      deep: useDeep,
      useAi,
      sourceOptions: selectedSources,
      limit: useDeep ? 40 : 12
    });
    setResults((res.data?.results || []).filter(isFullReadableBook));
    setSearching(false);
  };

  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => runBookSearch({ useDeep: false, useAi: false }), 450);
    return () => clearTimeout(timer);
  }, [query, selectedSources]);

  const searchBooks = async (event) => {
    event.preventDefault();
    await runBookSearch({ useDeep: deepSearch, useAi: deepSearch && selectedSources.includes('open_web') });
  };

  const toggleSource = (source) => {
    setSelectedSources(prev => prev.includes(source) ? prev.filter(item => item !== source) : [...prev, source]);
  };

  const addBook = async (book) => {
    const created = await base44.entities.Book.create(book);
    setBooks(prev => [created, ...prev]);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      <main className="mx-auto max-w-screen-2xl px-4 pb-16 pt-24 md:px-8">
        <section className="mb-8 overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-card via-card to-primary/10 p-6 md:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Ultimate Books & Audiobook Hub
          </div>
          <div className="mt-5 grid gap-6 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
            <div>
              <h1 className="font-bebas text-5xl tracking-wider text-foreground md:text-7xl">Books Library</h1>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                Search the web for legal full-access readable books, audiobooks, manuals and open learning titles — no limited previews or borrow-only pages.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 rounded-3xl border border-white/10 bg-black/25 p-4">
              <div><p className="text-2xl font-black text-primary">{books.length}</p><p className="text-xs text-muted-foreground">Saved books</p></div>
              <div><p className="text-2xl font-black text-primary">{books.filter(b => b.has_audiobook).length}</p><p className="text-xs text-muted-foreground">Audiobooks</p></div>
              <div><p className="text-2xl font-black text-primary">{books.reduce((sum, b) => sum + (b.xp_value || 0), 0)}</p><p className="text-xs text-muted-foreground">Reading XP</p></div>
            </div>
          </div>
        </section>

        <section className="mb-8 rounded-3xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" />
            <h2 className="text-lg font-black text-foreground">Full Access AI Book Search</h2>
          </div>
          <form onSubmit={searchBooks} className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {searchOptions.map(option => (
                <button key={option.value} type="button" onClick={() => toggleSource(option.value)} className={`rounded-full px-3 py-1.5 text-xs font-black ${selectedSources.includes(option.value) ? 'bg-primary text-primary-foreground' : 'border border-border bg-secondary text-muted-foreground hover:text-foreground'}`}>
                  {option.label}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <label htmlFor="book-search" className="sr-only">Search books and audiobooks</label>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input id="book-search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search full readable books only, e.g. “Pride and Prejudice”, “openstax biology”, “public domain fantasy”..." className="w-full rounded-xl border border-border bg-secondary py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60" />
              </div>
              <button disabled={searching || !query.trim()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-black text-primary-foreground disabled:opacity-50">
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Deeper AI Search
              </button>
            </div>
            <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
              <input type="checkbox" checked={deepSearch} onChange={e => setDeepSearch(e.target.checked)} className="h-4 w-4 accent-primary" />
              Results appear while you type from fast public sources. Use Deeper AI Search to scan the whole web with the selected options.
            </label>
          </form>
          {query.trim().length >= 3 && (
            <div className="mt-4 flex items-center gap-2 text-xs font-bold text-muted-foreground">
              {searching && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
              {searching ? 'Searching full public sources…' : `${results.length} full-access result${results.length === 1 ? '' : 's'}`}
            </div>
          )}
          {results.length > 0 && (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
              {results.map(book => <BookCard key={book.source_id || book.title} book={book} onAdd={addBook} added={savedIds.has(book.source_id || book.title?.toLowerCase())} />)}
            </div>
          )}
        </section>

        <div className="mb-8 flex gap-2 overflow-x-auto pb-2 scrollbar-hide" role="tablist" aria-label="Book categories">
          {categories.map(category => (
            <button key={category.value} type="button" onClick={() => setActiveCategory(category.value)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-black ${activeCategory === category.value ? 'bg-primary text-primary-foreground' : 'border border-border bg-secondary text-muted-foreground hover:text-foreground'}`}>
              {category.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-9 w-9 animate-spin text-primary" /></div>
        ) : filteredBooks.length === 0 ? (
          <div className="mb-8 rounded-3xl border border-border bg-card p-10 text-center">
            <Library className="mx-auto mb-3 h-10 w-10 text-primary" />
            <h2 className="text-xl font-black text-foreground">Your books library is ready</h2>
            <p className="mt-1 text-sm text-muted-foreground">Search above and save your first book, audiobook, comic, manual or learning title.</p>
          </div>
        ) : (
          <section className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6" aria-label="Saved books library">
            {filteredBooks.map(book => <BookCard key={book.id} book={book} />)}
          </section>
        )}

        <section className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-primary/20 bg-primary/10 p-5"><BookOpen className="mb-3 h-7 w-7 text-primary" /><h3 className="font-black text-foreground">Reader modes</h3><p className="mt-2 text-sm text-muted-foreground">Dark, sepia, dyslexia, immersive, vertical, horizontal and auto-scroll experiences are mapped for expansion.</p></div>
          <div className="rounded-3xl border border-primary/20 bg-primary/10 p-5"><Headphones className="mb-3 h-7 w-7 text-primary" /><h3 className="font-black text-foreground">Elite audio</h3><p className="mt-2 text-sm text-muted-foreground">Speed, sleep timer, chapters, AI narration, voices, transcripts and spatial audio are part of the hub roadmap.</p></div>
          <div className="rounded-3xl border border-primary/20 bg-primary/10 p-5"><Sparkles className="mb-3 h-7 w-7 text-primary" /><h3 className="font-black text-foreground">Connected universe</h3><p className="mt-2 text-sm text-muted-foreground">Books can connect to movies, games, lore videos, soundtracks and future community rooms.</p></div>
        </section>

        <BookFeatureGrid />
      </main>
    </div>
  );
}