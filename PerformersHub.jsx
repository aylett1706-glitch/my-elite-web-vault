import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Search, UserRound } from 'lucide-react';
import AIAddPerformer from '@/components/performers/AIAddPerformer';
import ManualPerformerForm from '@/components/performers/ManualPerformerForm';

export default function PerformersHub() {
  const [performers, setPerformers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadPerformers = async () => {
    const data = await base44.entities.Performer.list('name', 200);
    setPerformers(data);
    setLoading(false);
  };

  useEffect(() => { loadPerformers(); }, []);

  const filtered = performers.filter((performer) => {
    const text = `${performer.name || ''} ${performer.stage_name || ''}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-background px-4 py-8 text-foreground md:px-8">
      <div className="mx-auto max-w-screen-2xl space-y-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-red-400">Elite Vault</p>
            <h1 className="font-bebas text-5xl tracking-wider text-foreground">Pornstars Hub</h1>
            <p className="mt-2 text-sm text-muted-foreground">AI-imported performer profiles, photos, metadata, and video examples.</p>
          </div>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search performers..."
              className="w-full rounded-2xl border border-border bg-secondary py-4 pl-11 pr-4 text-sm focus:border-red-500/60 focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-4">
          <AIAddPerformer onImported={(performer) => setPerformers(prev => [performer, ...prev])} />
          <ManualPerformerForm onCreated={(performer) => setPerformers(prev => [performer, ...prev])} />
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-red-500/30 border-t-red-500" /></div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {filtered.map((performer) => (
              <Link key={performer.id} to={`/performers/${performer.id}`} className="group overflow-hidden rounded-3xl border border-red-900/30 bg-card transition-all hover:border-red-500/60 hover:shadow-2xl">
                <div className="relative aspect-[3/4] overflow-hidden bg-secondary">
                  {performer.photo_url ? (
                    <img src={performer.photo_url} alt={performer.stage_name || performer.name} referrerPolicy="no-referrer" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                  ) : (
                    <div className="flex h-full items-center justify-center"><UserRound className="h-12 w-12 text-muted-foreground" /></div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="line-clamp-1 font-bold text-white">{performer.stage_name || performer.name}</h3>
                    <p className="mt-1 text-xs text-white/60">{performer.total_scenes || 0} video examples</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}