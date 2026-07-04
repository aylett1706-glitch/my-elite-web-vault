import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Film, Play, Star, UserRound } from 'lucide-react';

export default function PerformerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [performer, setPerformer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Performer.get(id).then((data) => {
      setPerformer(data);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-red-500/30 border-t-red-500" /></div>;
  if (!performer) return <div className="min-h-screen bg-background p-8 text-foreground">Performer not found</div>;

  const name = performer.stage_name || performer.name;
  const videos = performer.video_examples || [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="relative h-[54vh] min-h-[420px] overflow-hidden">
        {performer.cover_url || performer.photo_url ? (
          <img src={performer.cover_url || performer.photo_url} alt={name} referrerPolicy="no-referrer" className="absolute inset-0 h-full w-full object-cover opacity-70" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-secondary"><UserRound className="h-20 w-20 text-muted-foreground" /></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-black/30" />
        <button onClick={() => navigate(-1)} className="absolute left-6 top-6 z-10 rounded-xl bg-black/60 p-3 text-white hover:bg-black">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="absolute bottom-10 left-4 right-4 md:left-10">
          <h1 className="font-bebas text-6xl tracking-wider text-white md:text-7xl">{name}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/75 md:text-base">{performer.bio}</p>
        </div>
      </div>

      <main className="mx-auto max-w-screen-2xl px-4 pb-16 md:px-8">
        <div className="mb-10 grid grid-cols-2 gap-3 md:grid-cols-5">
          {[['Nationality', performer.nationality], ['Height', performer.height], ['Measurements', performer.measurements], ['Hair', performer.hair_color], ['Eyes', performer.eye_color]].map(([label, value]) => value ? (
            <div key={label} className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
              <p className="mt-1 font-semibold text-foreground">{value}</p>
            </div>
          ) : null)}
        </div>

        {performer.tags?.length > 0 && (
          <div className="mb-10 flex flex-wrap gap-2">
            {performer.tags.map(tag => <span key={tag} className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-300">{tag}</span>)}
          </div>
        )}

        <div className="mb-5 flex items-center gap-2">
          <Star className="h-5 w-5 text-red-400" />
          <h2 className="text-2xl font-bold">AI Video Examples</h2>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {videos.map((video, index) => (
            <a key={`${video.title}-${index}`} href={video.video_url || video.source_url} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-3xl border border-border bg-card transition-all hover:border-red-500/60">
              <div className="relative aspect-video bg-secondary">
                {video.preview_gif_url || video.poster_url ? <img src={video.preview_gif_url || video.poster_url} alt={video.title} referrerPolicy="no-referrer" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" /> : <div className="flex h-full items-center justify-center"><Film className="h-10 w-10 text-muted-foreground" /></div>}
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/40"><Play className="h-12 w-12 text-white opacity-0 transition-opacity group-hover:opacity-100" /></div>
              </div>
              <div className="p-5">
                <h3 className="line-clamp-2 font-bold text-foreground">{video.title}</h3>
                {video.quality && <p className="mt-2 text-xs font-semibold text-red-300">{video.quality}</p>}
              </div>
            </a>
          ))}
        </div>

        <Link to="/performers" className="mt-12 inline-flex rounded-xl border border-border px-5 py-3 text-sm font-semibold text-muted-foreground hover:text-foreground">Back to Pornstars Hub</Link>
      </main>
    </div>
  );
}