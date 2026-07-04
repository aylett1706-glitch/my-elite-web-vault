import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Loader2, ArrowLeft } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import ImageSourceField from '@/components/media/ImageSourceField';
import { toast } from 'sonner';

const GENRES = ['Action', 'Adventure', 'Anime', 'Animation', 'Comedy', 'Crime', 'Documentary', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Thriller', 'Western'];

export default function AddMedia() {
  const [user, setUser] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '', type: 'movie', synopsis: '', year: '', rating: '', content_rating: '', age_rating_country: '', director: '',
    cast: '', genres: [], poster_url: '', backdrop_url: '', video_url: '', trailer_url: '',
    collection_name: '', collection_key: '', related_keywords: '', streaming_platforms: '', watch_provider_region: 'AU',
    duration_minutes: '', is_featured: false, is_trending: false, is_adult: false, status: 'approved'
  });

  useEffect(() => {
    base44.auth.me().then(u => {
      if (!u || u.role !== 'admin') navigate('/');
      setUser(u);
    }).catch(() => navigate('/'));
  }, []);

  const handleAIFill = async () => {
    if (!form.title) { toast.error('Enter a title first'); return; }
    setAiLoading(true);
    try {
      const result = await base44.functions.invoke('enrichMediaWithTMDB', { title: form.title, type: form.type });
      setForm(f => ({
        ...f,
        synopsis: result.data.synopsis || f.synopsis,
        year: result.data.year?.toString() || f.year,
        rating: result.data.rating?.toString() || f.rating,
        director: result.data.director || f.director,
        cast: result.data.cast?.join(', ') || f.cast,
        genres: result.data.genres || f.genres,
        duration_minutes: result.data.duration_minutes?.toString() || f.duration_minutes,
        poster_url: result.data.poster_url || f.poster_url,
        backdrop_url: result.data.backdrop_url || f.backdrop_url,
        trailer_url: result.data.trailer_url || f.trailer_url,
        content_rating: result.data.content_rating || f.content_rating,
        age_rating_country: result.data.age_rating_country || f.age_rating_country,
        collection_name: result.data.collection_name || f.collection_name,
        collection_key: result.data.collection_key || f.collection_key,
        related_keywords: result.data.related_keywords?.join(', ') || f.related_keywords,
        streaming_platforms: result.data.streaming_platforms?.join(', ') || f.streaming_platforms,
        watch_provider_region: result.data.watch_provider_region || f.watch_provider_region,
        tmdb_id: result.data.tmdb_id || f.tmdb_id,
        imdb_id: result.data.imdb_id || f.imdb_id,
        source_url: result.data.source_url || f.source_url,
      }));
      toast.success('TMDB metadata loaded!');
    } catch (err) {
      toast.error('Failed to fetch TMDB data');
    }
    setAiLoading(false);
  };

  const handleSave = async () => {
    if (!form.title) { toast.error('Title is required'); return; }
    setSaving(true);
    await base44.entities.Media.create({
      ...form,
      year: form.year ? parseInt(form.year) : undefined,
      rating: form.rating ? parseFloat(form.rating) : undefined,
      duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : undefined,
      cast: form.cast ? form.cast.split(',').map(c => c.trim()) : [],
      related_keywords: form.related_keywords ? form.related_keywords.split(',').map(k => k.trim()).filter(Boolean) : [],
      streaming_platforms: form.streaming_platforms ? form.streaming_platforms.split(',').map(platform => platform.trim()).filter(Boolean) : [],
      watch_provider_region: form.watch_provider_region || 'AU',
      collection_key: form.collection_key || form.collection_name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    });
    toast.success('Media added to library!');
    navigate('/admin');
  };

  const F = ({ label, field, type = 'text', placeholder = '' }) => (
   <div>
     <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
     <input 
       type={type} 
       value={form[field] || ''} 
       placeholder={placeholder}
       onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
       className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60" 
     />
   </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      <div className="pt-24 max-w-3xl mx-auto px-4 pb-16">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/admin')} className="p-2 hover:bg-secondary rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-muted-foreground hover:text-foreground" />
            </button>
            <h1 className="font-bebas text-5xl text-foreground">Add Media</h1>
          </div>
          <button onClick={handleAIFill} disabled={aiLoading}
            className="flex items-center gap-2 bg-primary/20 border border-primary/30 text-primary px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/30 transition-colors disabled:opacity-50">
            {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            AI Auto-fill
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Title *</label>
            <input 
              type="text" 
              value={form.title} 
              placeholder=""
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60" 
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Type</label>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/60">
              <option value="movie">Movie</option>
              <option value="tv_show">TV Show</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Synopsis</label>
            <textarea value={form.synopsis} onChange={e => setForm(f => ({ ...f, synopsis: e.target.value }))}
              rows={4} placeholder="Enter synopsis..."
              className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 resize-none" />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Relevant Info / Notes</label>
            <textarea value={form.content_notes || ''} onChange={e => setForm(f => ({ ...f, content_notes: e.target.value }))}
              rows={3} placeholder="Add relevant info, source notes, collection details, or vault notes..."
              className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 resize-none" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <F label="Year" field="year" type="number" />
            <F label="Rating (0-10)" field="rating" type="number" />
            <F label="Duration (min)" field="duration_minutes" type="number" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <F label="Age Rating" field="content_rating" placeholder="AU PG, M, MA15+..." />
            <F label="Rating Country" field="age_rating_country" placeholder="AU" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <F label="Director" field="director" />
            <F label="Cast (comma separated)" field="cast" />
          </div>

          <ImageSourceField
            label="Poster Picture"
            helper="Used on movie/TV cards, search results, and video lists. Paste a URL or upload an image."
            value={form.poster_url}
            onChange={(url) => setForm(f => ({ ...f, poster_url: url }))}
            aspect="aspect-[2/3]"
          />
          <ImageSourceField
            label="Home Page Backdrop"
            helper="Used for the cycling hero image on the home page and detail pages."
            value={form.backdrop_url}
            onChange={(url) => setForm(f => ({ ...f, backdrop_url: url }))}
          />
          <F label="Video / Movie URL" field="video_url" placeholder="https://..." />
          <F label="Trailer URL" field="trailer_url" placeholder="https://youtube.com/watch?v=..." />
          <div className="grid grid-cols-2 gap-4">
            <F label="Collection / Franchise" field="collection_name" placeholder="Marvel, DC, Descendants..." />
            <F label="Collection Key" field="collection_key" placeholder="marvel" />
          </div>
          <F label="Related Keywords" field="related_keywords" placeholder="Marvel, Avengers, Spider-Man" />
          <div className="grid grid-cols-2 gap-4">
            <F label="Streaming Platforms" field="streaming_platforms" placeholder="Netflix, Prime Video, Disney+" />
            <F label="Platform Region" field="watch_provider_region" placeholder="AU" />
          </div>

          {/* Genres */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">Genres</label>
            <div className="flex flex-wrap gap-2">
              {GENRES.map(g => (
                <button key={g} type="button"
                  onClick={() => setForm(f => ({
                    ...f,
                    genres: f.genres.includes(g) ? f.genres.filter(x => x !== g) : [...f.genres, g]
                  }))}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${form.genres.includes(g) ? 'bg-primary text-primary-foreground' : 'bg-secondary border border-border text-muted-foreground hover:border-primary/40'}`}>
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="flex gap-6">
            {[['is_featured', 'Featured / Home Cycle'], ['is_trending', 'Trending'], ['is_adult', 'Adult Vault']].map(([field, label]) => (
              <label key={field} className="flex items-center gap-2 cursor-pointer">
                <div onClick={() => setForm(f => ({ ...f, [field]: !f[field] }))}
                  className={`w-10 h-5 rounded-full transition-colors relative ${form[field] ? 'bg-primary' : 'bg-secondary border border-border'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${form[field] ? 'left-5' : 'left-0.5'}`} />
                </div>
                <span className="text-sm text-muted-foreground">{label}</span>
              </label>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => navigate('/admin')} className="flex-1 py-3 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors text-sm font-medium">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 bg-primary text-primary-foreground py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm">
              {saving ? 'Saving...' : 'Add to Library'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}