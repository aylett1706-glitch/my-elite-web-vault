import { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import Navbar from '@/components/layout/Navbar';
import SportsHero from '@/components/sports/SportsHero';
import SportsCategoryGrid from '@/components/sports/SportsCategoryGrid';
import SportsEventForm from '@/components/sports/SportsEventForm';
import SportsEventCard from '@/components/sports/SportsEventCard';
import SportsSmartCollections from '@/components/sports/SportsSmartCollections';
import SportsSourceDirectory from '@/components/sports/SportsSourceDirectory';
import { Search, ShieldCheck } from 'lucide-react';

export default function Sports() {
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
    base44.entities.SportEvent.list('-start_time', 200).then(setEvents);
  }, []);

  const filteredEvents = useMemo(() => {
    const lower = query.toLowerCase();
    return events.filter(event => {
      const categoryMatch = !selectedCategory || event.category === selectedCategory;
      const text = [event.title, event.sport, event.discipline, event.competition, event.country, event.venue, event.status, event.score_summary, event.tags].flat().filter(Boolean).join(' ').toLowerCase();
      return categoryMatch && (!lower || text.includes(lower));
    });
  }, [events, query, selectedCategory]);

  const createEvent = async (data) => {
    const created = await base44.entities.SportEvent.create(data);
    setEvents(prev => [created, ...prev]);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar user={user} />
      <main className="mx-auto max-w-screen-2xl space-y-6 px-4 pb-20 pt-24 md:px-8">
        <SportsHero events={events} />

        <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
          <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" /><p><strong>Official/free-first hub:</strong> this section organises sports and links to official or open-access sources only. Stream availability depends on rights, region and the event owner.</p></div>
        </div>

        <section className="rounded-3xl border border-border bg-card/70 p-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search sport, league, fighter, team, athlete, collection or event..." className="w-full rounded-2xl border border-border bg-secondary py-4 pl-12 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none" />
          </div>
        </section>

        <SportsCategoryGrid selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />
        <SportsSmartCollections onSearch={setQuery} />
        <SportsEventForm onCreate={createEvent} />

        <section className="rounded-3xl border border-border bg-card/70 p-5">
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-black text-foreground">Live, upcoming and archived events</h2>
              <p className="text-sm text-muted-foreground">{filteredEvents.length} saved event{filteredEvents.length === 1 ? '' : 's'} match your filters.</p>
            </div>
            {(query || selectedCategory) && <button type="button" onClick={() => { setQuery(''); setSelectedCategory(''); }} className="text-sm font-bold text-primary hover:text-primary/80">Clear filters</button>}
          </div>
          {filteredEvents.length ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filteredEvents.map(event => <SportsEventCard key={event.id} event={event} />)}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-border bg-secondary/30 p-8 text-center text-sm text-muted-foreground">No events saved yet. Add your first official sports stream, score page or replay above.</div>
          )}
        </section>

        <SportsSourceDirectory />
      </main>
    </div>
  );
}