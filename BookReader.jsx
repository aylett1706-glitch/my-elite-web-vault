import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import Navbar from '@/components/layout/Navbar';
import { ArrowLeft, BookOpen, Bookmark, Loader2, Search, ZoomIn, ZoomOut } from 'lucide-react';
import BookListenPanel from '@/components/books/BookListenPanel';
import SmartBookReader from '@/components/books/SmartBookReader';

const getReadableUrl = (book) => {
  if (!book) return '';
  const url = book.file_url || book.pdf_url || book.epub_url || book.preview_url || '';
  if (/\.(pdf|epub|txt|html?)(\.|\/|\?|$)/i.test(url)) return url;
  if (/gutenberg\.org|standardebooks\.org|wikisource\.org|openstax\.org/i.test(url)) return url;
  if (book.preview_url?.includes('archive.org/embed/')) return book.preview_url;
  if (book.preview_url?.includes('archive.org/details/')) return book.preview_url.replace('/details/', '/embed/');
  return '';
};

export default function BookReader() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [findingFullCopy, setFindingFullCopy] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const load = async () => {
      const [me, items] = await Promise.all([
        base44.auth.me().catch(() => null),
        base44.entities.Book.filter({ id }, '', 1)
      ]);
      setUser(me);
      setBook(items[0] || null);
      setLoading(false);
    };
    load();
  }, [id]);

  const readableUrl = useMemo(() => getReadableUrl(book), [book]);
  const inAppPreviewPages = useMemo(() => [
    book?.description,
    book?.authors?.length ? `Authors: ${book.authors.join(', ')}` : '',
    book?.categories?.length ? `Topics: ${book.categories.join(', ')}` : '',
    book?.publisher ? `Publisher: ${book.publisher}` : ''
  ].filter(Boolean).length || 1, [book]);
  const needsFullCopy = book && !readableUrl && (book.page_count || 0) > inAppPreviewPages;
  const bookmarkKey = `page-${currentPage + 1}`;
  const isBookmarked = Boolean(book?.bookmarks?.some(mark => mark.key === bookmarkKey));

  const zoomIn = () => setZoom(value => Math.min(2, Number((value + 0.1).toFixed(1))));
  const zoomOut = () => setZoom(value => Math.max(0.7, Number((value - 0.1).toFixed(1))));

  const addBookmark = async () => {
    if (!book) return;
    const existing = book.bookmarks || [];
    const nextBookmarks = isBookmarked
      ? existing.filter(mark => mark.key !== bookmarkKey)
      : [...existing, { key: bookmarkKey, page: currentPage + 1, label: `Page ${currentPage + 1}`, created_at: new Date().toISOString() }];
    const updated = await base44.entities.Book.update(book.id, { bookmarks: nextBookmarks, progress_percent: Math.min(100, Math.round(((currentPage + 1) / Math.max(book.page_count || 1, 1)) * 100)) });
    setBook(updated);
  };

  const findFullCopy = async () => {
    if (!book?.title || findingFullCopy) return;
    setFindingFullCopy(true);
    const res = await base44.functions.invoke('bookSearch', { query: `${book.title} ${book.authors?.[0] || ''} full text`, deep: true, limit: 20 });
    const fullCopy = (res.data?.results || []).find(item => {
      const url = item.preview_url || '';
      return /\.(pdf|epub|txt|html?)(\.|\/|\?|$)/i.test(url) || /gutenberg\.org|standardebooks\.org|wikisource\.org|openstax\.org/i.test(url);
    }) || (res.data?.results || []).find(item => item.preview_url?.includes('archive.org/embed/'));
    if (fullCopy) {
      const updated = await base44.entities.Book.update(book.id, {
        preview_url: fullCopy.preview_url,
        info_url: fullCopy.info_url,
        cover_url: book.cover_url || fullCopy.cover_url,
        page_count: book.page_count || fullCopy.page_count,
        description: book.description || fullCopy.description
      });
      setBook(updated);
    }
    setFindingFullCopy(false);
  };

  useEffect(() => {
    if (needsFullCopy && !findingFullCopy) {
      findFullCopy();
    }
  }, [needsFullCopy]);

  if (loading) {
    return <div className="fixed inset-0 flex items-center justify-center bg-background"><Loader2 className="h-9 w-9 animate-spin text-primary" /></div>;
  }

  if (!book) {
    return <div className="min-h-screen bg-background"><Navbar user={user} /><main className="pt-28 text-center text-foreground">Book not found</main></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      <main className="mx-auto max-w-screen-2xl px-4 pb-10 pt-24 md:px-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link to="/books" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-secondary px-4 text-sm font-bold text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to Books
          </Link>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={zoomOut} className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-border px-3 text-xs font-black text-foreground hover:border-primary/50"><ZoomOut className="h-4 w-4" /> Zoom out</button>
            <button type="button" onClick={zoomIn} className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-border px-3 text-xs font-black text-foreground hover:border-primary/50"><ZoomIn className="h-4 w-4" /> Zoom in</button>
            <button type="button" onClick={addBookmark} className={`inline-flex min-h-10 items-center gap-1 rounded-xl px-3 text-xs font-black ${isBookmarked ? 'bg-primary text-primary-foreground' : 'border border-primary/40 text-primary hover:bg-primary/10'}`}><Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} /> Bookmark</button>
            {!readableUrl && <button type="button" onClick={findFullCopy} disabled={findingFullCopy} className="inline-flex min-h-10 items-center gap-1 rounded-xl bg-primary px-3 text-xs font-black text-primary-foreground disabled:opacity-50"><Search className="h-4 w-4" /> {findingFullCopy ? 'Finding complete book…' : 'Find complete book'}</button>}
          </div>
        </div>

        <section className="mb-5 overflow-hidden rounded-3xl border border-border bg-card p-5">
          <div className="flex flex-col gap-5 md:flex-row">
            <div className="w-32 shrink-0 overflow-hidden rounded-2xl bg-secondary">
              {book.cover_url ? <img src={book.cover_url} alt={book.title} className="aspect-[3/4] w-full object-cover" /> : <div className="flex aspect-[3/4] items-center justify-center"><BookOpen className="h-10 w-10 text-primary" /></div>}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black uppercase tracking-widest text-primary">{book.content_type?.replace('_', ' ') || 'Book'}</p>
              <h1 className="mt-1 font-bebas text-4xl tracking-wider text-foreground md:text-6xl">{book.title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{book.authors?.join(', ') || book.publisher || 'Unknown author'}</p>
              <p className="mt-3 max-w-4xl text-sm leading-relaxed text-muted-foreground">{book.description || 'No description available.'}</p>
            </div>
          </div>
        </section>

        <BookListenPanel book={book} />

        <section className="overflow-hidden rounded-3xl border border-border bg-card">
          <SmartBookReader
            book={book}
            zoom={zoom}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            onBookmark={addBookmark}
            isBookmarked={isBookmarked}
          />
        </section>
      </main>
    </div>
  );
}