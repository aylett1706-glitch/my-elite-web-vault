import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import Navbar from '@/components/layout/Navbar';
import ActorSearchHero from '@/components/actors/ActorSearchHero';
import ActorProfileHero from '@/components/actors/ActorProfileHero';
import ActorInsights from '@/components/actors/ActorInsights';
import ActorTimeline from '@/components/actors/ActorTimeline';
import ActorFilmographyGrid from '@/components/actors/ActorFilmographyGrid';
import { Loader2, UserRound } from 'lucide-react';
import { toast } from 'sonner';

const seedActors = ['Keanu Reeves', 'Margot Robbie', 'Tom Hardy', 'Denzel Washington', 'Ryan Gosling', 'Jake Gyllenhaal'];

export default function ActorHub() {
  const { name } = useParams();
  const routeActorName = name ? decodeURIComponent(name) : '';
  const [user, setUser] = useState(null);
  const [query, setQuery] = useState('');
  const [actor, setActor] = useState(null);
  const [credits, setCredits] = useState([]);
  const [library, setLibrary] = useState([]);
  const [cataloguedActors, setCataloguedActors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(new Set());

  useEffect(() => {
    Promise.all([
      base44.auth.me().catch(() => null),
      base44.entities.Media.filter({ status: 'approved' }, '-created_date', 500),
      base44.entities.Actor.list('-updated_date', 24).catch(() => [])
    ]).then(([me, media, actors]) => {
      setUser(me);
      setLibrary(media);
      setCataloguedActors(actors);
      if (routeActorName) {
        setQuery(routeActorName);
        searchActor(null, routeActorName);
      }
    });
  }, [routeActorName]);

  const libraryTitles = useMemo(() => new Set(library.map(item => item.title?.toLowerCase())), [library]);

  const searchActor = async (event, actorName = query) => {
    event?.preventDefault?.();
    if (!actorName.trim()) return;
    setLoading(true);
    const res = await base44.functions.invoke('tmdbSearch', { query: actorName.trim(), searchType: 'actor', limit: 180, includeProfile: true });
    const nextActor = res.data?.actor || { name: actorName.trim() };
    const nextCredits = res.data?.results || [];
    setActor(nextActor);
    setCredits(nextCredits);
    setQuery(nextActor.name || actorName.trim());
    setLoading(false);

    const existing = await base44.entities.Actor.filter({ name: nextActor.name }, '-created_date', 1);
    if (!existing.length && nextActor.name) {
      const created = await base44.entities.Actor.create({
        name: nextActor.name,
        biography: nextActor.biography || '',
        career_summary: nextActor.career_summary || '',
        acting_style: nextActor.acting_style || '',
        industry_impact: nextActor.industry_impact || '',
        profile_url: nextActor.profile_url || '',
        banner_url: nextActor.banner_url || '',
        known_for: nextActor.known_for || [],
        top_genres: nextActor.top_genres || [],
        birth_date: nextActor.birth_date || '',
        birth_place: nextActor.birth_place || '',
        popularity: nextActor.popularity || 0,
        total_movies: nextCredits.filter(item => item.type === 'movie').length,
        total_tv_shows: nextCredits.filter(item => item.type === 'tv_show').length,
        status: 'catalogued'
      });
      setCataloguedActors(prev => [created, ...prev]);
    }
  };

  const addToLibrary = async (item) => {
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
      trailer_url: item.trailer_url || '',
      video_url: item.video_url || '',
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
      views: 0,
      language: item.language || 'en'
    });
    setAdded(prev => new Set([...prev, item.title]));
    toast.success(`"${item.title}" added to your media hub`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      <main className="mx-auto max-w-screen-2xl space-y-6 px-4 pb-16 pt-24 md:px-8">
        <ActorSearchHero query={query} setQuery={setQuery} onSearch={searchActor} loading={loading} />

        {!actor && (
          <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
            {seedActors.map(name => (
              <button key={name} onClick={() => searchActor(null, name)} className="min-h-24 rounded-3xl border border-border bg-card p-4 text-left hover:border-primary/50">
                <UserRound className="mb-3 h-5 w-5 text-primary" />
                <p className="font-black text-foreground">{name}</p>
                <p className="text-xs text-muted-foreground">Generate profile</p>
              </button>
            ))}
          </section>
        )}

        {cataloguedActors.length > 0 && !actor && (
          <section className="rounded-3xl border border-border bg-card p-5">
            <h2 className="text-xl font-black text-foreground">Catalogued Actors</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {cataloguedActors.map(item => <button key={item.id} onClick={() => searchActor(null, item.name)} className="rounded-full bg-secondary px-4 py-2 text-sm font-bold text-muted-foreground hover:text-foreground">{item.name}</button>)}
            </div>
          </section>
        )}

        {loading && <div className="flex justify-center py-14"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}

        {!loading && actor && (
          <>
            <ActorProfileHero actor={actor} credits={credits} />
            <ActorInsights actor={actor} credits={credits} />
            <ActorTimeline credits={credits} />
            <ActorFilmographyGrid credits={credits} libraryTitles={libraryTitles} added={added} onAdd={addToLibrary} />
          </>
        )}
      </main>
    </div>
  );
}