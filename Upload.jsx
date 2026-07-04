import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Upload, Film, Tv, X, Check, AlertCircle, Loader2, Sparkles, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const GENRES = ['Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Thriller', 'Western'];

export default function UploadPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [step, setStep] = useState(1); // 1=type, 2=file, 3=meta, 4=done
  const [type, setType] = useState('movie');
  const [uploading, setUploading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [form, setForm] = useState({
    title: '', synopsis: '', year: '', director: '', cast: '', genres: [], video_url: '', poster_url: ''
  });

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, video_url: file_url }));
    setUploading(false);
    setStep(3);
  };

  const handlePosterUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, poster_url: file_url }));
  };

  const handleAIFill = async () => {
    if (!form.title) { toast.error('Enter a title first'); return; }
    setAiLoading(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Fill in movie/TV show metadata for: "${form.title}" (type: ${type}). Return JSON with fields: synopsis (2-3 sentences), year (number), director (string), cast (array of 5 main actors), genres (array of genres from: ${GENRES.join(', ')})`,
      response_json_schema: {
        type: 'object',
        properties: {
          synopsis: { type: 'string' },
          year: { type: 'number' },
          director: { type: 'string' },
          cast: { type: 'array', items: { type: 'string' } },
          genres: { type: 'array', items: { type: 'string' } }
        }
      }
    });
    setForm(f => ({
      ...f,
      synopsis: result.synopsis || f.synopsis,
      year: result.year?.toString() || f.year,
      director: result.director || f.director,
      cast: result.cast?.join(', ') || f.cast,
      genres: result.genres || f.genres
    }));
    setAiLoading(false);
    toast.success('AI filled in the metadata!');
  };

  const handleSubmit = async () => {
    if (!form.title || !form.video_url) { toast.error('Title and video file are required'); return; }
    await base44.entities.UploadQueue.create({
      ...form,
      type,
      year: form.year ? parseInt(form.year) : undefined,
      cast: form.cast ? form.cast.split(',').map(c => c.trim()) : [],
      submitted_by: user?.email,
      status: 'pending'
    });
    setStep(4);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      <div className="pt-24 max-w-2xl mx-auto px-4 pb-16">
        <button onClick={() => navigate('/')} className="mb-4 p-2 hover:bg-secondary rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-muted-foreground hover:text-foreground" />
        </button>
        <h1 className="font-bebas text-5xl text-foreground mb-2">Upload Content</h1>
        <p className="text-muted-foreground mb-8">Submit movies or TV shows for admin review</p>

        {/* Progress */}
        {step < 4 && (
          <div className="flex items-center gap-2 mb-8">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  step > s ? 'bg-primary text-primary-foreground' : step === s ? 'bg-primary/20 border border-primary text-primary' : 'bg-secondary text-muted-foreground'
                }`}>
                  {step > s ? <Check className="w-4 h-4" /> : s}
                </div>
                <span className={`text-sm ${step === s ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {s === 1 ? 'Type' : s === 2 ? 'File' : 'Details'}
                </span>
                {s < 3 && <div className={`w-8 h-px ${step > s ? 'bg-primary' : 'bg-border'}`} />}
              </div>
            ))}
          </div>
        )}

        {/* Step 1: Type */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-sm font-medium text-muted-foreground mb-4">What are you uploading?</p>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {['movie', 'tv_show'].map(t => (
                <button key={t} onClick={() => setType(t)} className={`flex flex-col items-center gap-3 p-8 rounded-2xl border-2 transition-all ${
                  type === t ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-secondary text-muted-foreground hover:border-primary/40'
                }`}>
                  {t === 'movie' ? <Film className="w-8 h-8" /> : <Tv className="w-8 h-8" />}
                  <span className="font-semibold">{t === 'movie' ? 'Movie' : 'TV Show'}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setStep(2)} className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors">
              Continue
            </button>
          </motion.div>
        )}

        {/* Step 2: File */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="border-2 border-dashed border-border hover:border-primary/60 rounded-2xl p-12 text-center transition-colors">
              {uploading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  <p className="text-muted-foreground">Uploading video...</p>
                </div>
              ) : form.video_url ? (
                <div className="flex flex-col items-center gap-3">
                  <Check className="w-10 h-10 text-green-500" />
                  <p className="text-foreground font-medium">Video uploaded!</p>
                  <button onClick={() => setStep(3)} className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-colors">
                    Continue to Details
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-foreground font-medium mb-1">Drop your video file here</p>
                  <p className="text-muted-foreground text-sm mb-4">MP4, MKV, AVI supported • Max 5GB</p>
                  <span className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium">Browse Files</span>
                  <input type="file" accept="video/*" onChange={handleFileUpload} className="hidden" />
                </label>
              )}
            </div>
            <p className="text-center text-sm text-muted-foreground mt-4">
              Or <button onClick={() => setStep(3)} className="text-primary hover:underline">skip and add URL manually</button>
            </p>
          </motion.div>
        )}

        {/* Step 3: Metadata */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Title *"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="flex-1 bg-secondary border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60"
              />
              <button onClick={handleAIFill} disabled={aiLoading}
                className="flex items-center gap-2 px-4 py-3 bg-primary/20 border border-primary/30 text-primary rounded-xl text-sm font-medium hover:bg-primary/30 transition-colors disabled:opacity-50">
                {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                AI Fill
              </button>
            </div>

            <textarea
              placeholder="Synopsis"
              value={form.synopsis}
              onChange={e => setForm(f => ({ ...f, synopsis: e.target.value }))}
              rows={4}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 resize-none"
            />

            <div className="grid grid-cols-2 gap-3">
              <input type="number" placeholder="Year" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
                className="bg-secondary border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60" />
              <input type="text" placeholder="Director" value={form.director} onChange={e => setForm(f => ({ ...f, director: e.target.value }))}
                className="bg-secondary border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60" />
            </div>

            <input type="text" placeholder="Cast (comma separated)" value={form.cast} onChange={e => setForm(f => ({ ...f, cast: e.target.value }))}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60" />

            {!form.video_url && (
              <input type="url" placeholder="Video URL (if not uploaded)" value={form.video_url} onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60" />
            )}

            <input type="url" placeholder="Poster URL or upload below" value={form.poster_url} onChange={e => setForm(f => ({ ...f, poster_url: e.target.value }))}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60" />

            {/* Genres */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">Genres</p>
              <div className="flex flex-wrap gap-2">
                {GENRES.map(g => (
                  <button key={g} onClick={() => setForm(f => ({
                    ...f,
                    genres: f.genres.includes(g) ? f.genres.filter(x => x !== g) : [...f.genres, g]
                  }))}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      form.genres.includes(g) ? 'bg-primary text-primary-foreground' : 'bg-secondary border border-border text-muted-foreground hover:border-primary/40'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleSubmit} className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-semibold hover:bg-primary/90 transition-colors">
              Submit for Review
            </button>
          </motion.div>
        )}

        {/* Step 4: Done */}
        {step === 4 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">Submitted!</h2>
            <p className="text-muted-foreground mb-6">Your content is in the review queue. An admin will approve it shortly.</p>
            <button onClick={() => { setStep(1); setForm({ title: '', synopsis: '', year: '', director: '', cast: '', genres: [], video_url: '', poster_url: '' }); }}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors">
              Upload Another
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}