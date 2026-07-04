import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import Navbar from '@/components/layout/Navbar';
import { ArrowLeft, BookOpen, Loader2, SkipForward } from 'lucide-react';
import MangaReaderControls from '@/components/manga/MangaReaderControls';
import MangaReadingUnavailable from '@/components/manga/MangaReadingUnavailable';
import MangaChapterReader from '@/components/manga/MangaChapterReader';
import MangaExternalReader from '@/components/manga/MangaExternalReader';
import { toast } from 'sonner';

export default function MangaReader() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const endRef = useRef(null);
  const [user, setUser] = useState(null);
  const [manga, setManga] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoNext, setAutoNext] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [zoom, setZoom] = useState(100);
  const [bookmarks, setBookmarks] = useState([]);

  const chapterParam = Number(new URLSearchParams(location.search).get('chapter') || 0);

  useEffect(() => {
    const load = async () => {
      const [me, item] = await Promise.all([
        base44.auth.me().catch(() => null),
        base44.entities.Manga.get(id)
      ]);
      setUser(me);
      setManga(item);
      setBookmarks(JSON.parse(localStorage.getItem(`manga_bookmarks_${id}`) || '[]'));
      setLoading(false);
    };
    load();
  }, [id]);

  const chapters = useMemo(() => [...(manga?.chapters || [])].sort((a, b) => Number(a.chapter || 0) - Number(b.chapter || 0)), [manga]);
  const currentIndex = Math.max(0, chapters.findIndex(chapter => Number(chapter.chapter) === chapterParam));
  const currentChapter = chapters[currentIndex] || chapters[0];
  const previousChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter = currentIndex >= 0 ? chapters[currentIndex + 1] : null;
  const currentBookmarkKey = currentChapter ? `chapter-${currentChapter.chapter}` : '';
  const bookmarked = bookmarks.includes(currentBookmarkKey);

  const goToChapter = (chapter) => {
    if (!chapter) return;
    setAtEnd(false);
    setCountdown(5);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    navigate(`/manga/${id}?chapter=${chapter.chapter}`);
  };

  const toggleBookmark = () => {
    if (!currentBookmarkKey) return;
    const nextBookmarks = bookmarked ? bookmarks.filter(item => item !== currentBookmarkKey) : [...bookmarks, currentBookmarkKey];
    setBookmarks(nextBookmarks);
    localStorage.setItem(`manga_bookmarks_${id}`, JSON.stringify(nextBookmarks));
    toast.success(bookmarked ? 'Bookmark removed' : 'Chapter bookmarked');
  };

  useEffect(() => {
    if (!endRef.current || !nextChapter) return;
    const observer = new IntersectionObserver(([entry]) => setAtEnd(entry.isIntersecting), { threshold: 0.8 });
    observer.observe(endRef.current);
    return () => observer.disconnect();
  }, [currentChapter, nextChapter]);

  useEffect(() => {
    if (!autoNext || !atEnd || !nextChapter) return;
    if (countdown <= 0) {
      goToChapter(nextChapter);
      return;
    }
    const timer = setTimeout(() => setCountdown(value => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [autoNext, atEnd, nextChapter, countdown]);

  if (loading) {
    return <div className="fixed inset-0 flex items-center justify-center bg-background"><Loader2 className="h-9 w-9 animate-spin text-primary" /></div>;
  }

  if (!manga) {
    return <div className="min-h-screen bg-background p-8 text-center text-muted-foreground">Manga not found</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      <main className="mx-auto max-w-5xl px-4 pb-20 pt-24 md:px-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link to="/manga" className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-bold text-foreground hover:bg-secondary">
            <ArrowLeft className="h-4 w-4" /> Back to Manga
          </Link>
          <label className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-bold text-muted-foreground">
            <input type="checkbox" checked={autoNext} onChange={e => setAutoNext(e.target.checked)} className="h-4 w-4 accent-primary" /> Auto next chapter
          </label>
        </div>

        <section className="mb-6 rounded-3xl border border-primary/20 bg-card p-5">
          <p className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary"><BookOpen className="h-4 w-4" /> Manga Reader</p>
          <h1 className="font-bebas text-4xl tracking-wider text-foreground md:text-6xl">{manga.title}</h1>
          <p className="text-sm text-muted-foreground">{currentChapter ? `Chapter ${currentChapter.chapter}${currentChapter.title ? ` · ${currentChapter.title}` : ''}` : `${manga.author || 'Manga'} · ${manga.status || 'ongoing'}`}</p>
        </section>

        {chapters.length > 0 && (
          <MangaReaderControls
            chapters={chapters}
            currentChapter={currentChapter}
            previousChapter={previousChapter}
            nextChapter={nextChapter}
            onChapterChange={goToChapter}
            zoom={zoom}
            onZoomChange={setZoom}
            bookmarked={bookmarked}
            onToggleBookmark={toggleBookmark}
          />
        )}

        {currentChapter?.pages?.length > 0 ? (
          <MangaChapterReader manga={manga} chapter={currentChapter} zoom={zoom} />
        ) : manga.read_url ? (
          <MangaExternalReader manga={manga} />
        ) : (
          <MangaReadingUnavailable manga={manga} user={user} />
        )}

        <div ref={endRef} className="mt-8 rounded-3xl border border-border bg-card p-5 text-center">
          {nextChapter ? (
            <>
              <p className="text-sm font-bold text-foreground">End of chapter {currentChapter?.chapter}</p>
              <p className="mt-1 text-sm text-muted-foreground">{autoNext ? `Auto next chapter in ${countdown}s` : 'Auto next is off'}</p>
              <button onClick={() => goToChapter(nextChapter)} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-black text-primary-foreground">
                <SkipForward className="h-4 w-4" /> Next Chapter Now
              </button>
            </>
          ) : (
            <p className="text-sm font-bold text-muted-foreground">You’re all caught up.</p>
          )}
        </div>
      </main>
    </div>
  );
}