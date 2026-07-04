import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Shield, Film, Users, Clock, Check, X, Eye, Trash2, Star, TrendingUp, Plus, Edit, ArrowLeft, Search, Tv, Lock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import AISearchModalAdvanced from '@/components/admin/AISearchModalAdvanced';
import EliteSettingsPanel from '@/components/settings/EliteSettingsPanel';

const TABS = ['Queue', 'Library', 'Users', 'Elite'];

export default function Admin() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('Queue');
  const [queue, setQueue] = useState([]);
  const [library, setLibrary] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAISearch, setShowAISearch] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const me = await base44.auth.me().catch(() => null);
      if (!me || me.role !== 'admin') { navigate('/'); return; }
      setUser(me);
      const [q, lib, u] = await Promise.all([
        base44.entities.UploadQueue.list('-created_date'),
        base44.entities.Media.list('-created_date'),
        base44.entities.User.list()
      ]);
      setQueue(q);
      setLibrary(lib);
      setUsers(u);
      setLoading(false);
    };
    load();
  }, []);

  const approveUpload = async (item) => {
    const media = await base44.entities.Media.create({
      title: item.title,
      type: item.type,
      synopsis: item.synopsis,
      year: item.year,
      genres: item.genres,
      cast: item.cast,
      director: item.director,
      poster_url: item.poster_url,
      backdrop_url: item.backdrop_url,
      gallery_urls: item.gallery_urls,
      video_url: item.video_url,
      duration_minutes: item.duration_minutes,
      content_notes: item.content_notes,
      is_adult: !!item.is_adult,
      status: 'approved'
    });
    await base44.entities.UploadQueue.update(item.id, { status: 'approved' });
    setQueue(q => q.map(x => x.id === item.id ? { ...x, status: 'approved' } : x));
    toast.success(`"${item.title}" approved and added to library!`);
  };

  const rejectUpload = async (item) => {
    await base44.entities.UploadQueue.update(item.id, { status: 'rejected' });
    setQueue(q => q.map(x => x.id === item.id ? { ...x, status: 'rejected' } : x));
    toast.error(`"${item.title}" rejected`);
  };

  const deleteMedia = async (id) => {
    await base44.entities.Media.delete(id);
    setLibrary(l => l.filter(x => x.id !== id));
    toast.success('Deleted');
  };

  const toggleFeatured = async (item) => {
    await base44.entities.Media.update(item.id, { is_featured: !item.is_featured });
    setLibrary(l => l.map(x => x.id === item.id ? { ...x, is_featured: !x.is_featured } : x));
    toast.success(`${!item.is_featured ? 'Featured' : 'Unfeatured'}`);
  };

  const toggleTrending = async (item) => {
    await base44.entities.Media.update(item.id, { is_trending: !item.is_trending });
    setLibrary(l => l.map(x => x.id === item.id ? { ...x, is_trending: !x.is_trending } : x));
    toast.success(`${!item.is_trending ? 'Set as trending' : 'Removed from trending'}`);
  };

  const toggleAdult = async (item) => {
    await base44.entities.Media.update(item.id, { is_adult: !item.is_adult });
    setLibrary(l => l.map(x => x.id === item.id ? { ...x, is_adult: !x.is_adult } : x));
    toast.success(`${!item.is_adult ? 'Moved to Private Vault' : 'Removed from Vault'}`);
  };

  if (loading) return (
    <div className="fixed inset-0 bg-background flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      <AnimatePresence>
        {showAISearch && (
          <AISearchModalAdvanced
            onClose={() => setShowAISearch(false)}
            onAdded={async () => {
              const lib = await base44.entities.Media.list('-created_date');
              setLibrary(lib);
            }}
          />
        )}
      </AnimatePresence>
      <div className="pt-24 max-w-screen-xl mx-auto px-4 md:px-8 pb-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="p-2 hover:bg-secondary rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-muted-foreground hover:text-foreground" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bebas text-4xl text-foreground">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Manage your EliteVault library</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAISearch(true)}
              className="flex items-center gap-2 bg-primary/20 border border-primary/30 text-primary px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/30 transition-colors"
            >
              <Search className="w-4 h-4" />
              AI Search & Add
            </button>
            <Link to="/upload-series" className="flex items-center gap-2 bg-secondary border border-border text-foreground px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-secondary/70 transition-colors">
              <Tv className="w-4 h-4" />
              Add Series
            </Link>
            <Link to="/add-media" className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors">
              <Plus className="w-4 h-4" />
              Add Movie
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Media', value: library.length, icon: Film, color: 'text-primary' },
            { label: 'Pending Review', value: queue.filter(q => q.status === 'pending').length, icon: Clock, color: 'text-yellow-400' },
            { label: 'Total Users', value: users.length, icon: Users, color: 'text-blue-400' },
            { label: 'Featured', value: library.filter(m => m.is_featured).length, icon: Star, color: 'text-yellow-400' },
          ].map(stat => (
            <div key={stat.label} className="bg-card border border-border rounded-2xl p-5">
              <div className={`${stat.color} mb-2`}><stat.icon className="w-5 h-5" /></div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-secondary p-1 rounded-xl mb-6 w-fit">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}>
              {t}
            </button>
          ))}
        </div>

        {/* Elite Tab */}
        {tab === 'Elite' && <EliteSettingsPanel allowGlobalSave />}

        {/* Queue Tab */}
        {tab === 'Queue' && (
          <div className="space-y-3">
            {queue.length === 0 && <p className="text-center py-12 text-muted-foreground">No uploads in queue</p>}
            {queue.map(item => (
              <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex items-center gap-4 bg-card border border-border rounded-2xl p-4">
                <div className="w-12 h-16 rounded-lg overflow-hidden bg-secondary shrink-0">
                  {item.poster_url && <img src={item.poster_url} alt={item.title} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground truncate">{item.title}</h3>
                    <span className="px-2 py-0.5 bg-secondary rounded text-xs text-muted-foreground capitalize">{item.type}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{item.synopsis}</p>
                  <p className="text-xs text-muted-foreground mt-1">By: {item.submitted_by} • {item.year}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                    item.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                    item.status === 'approved' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>{item.status}</span>
                  {item.status === 'pending' && (
                    <>
                      <button onClick={() => approveUpload(item)} className="w-9 h-9 rounded-xl bg-green-500/20 flex items-center justify-center text-green-400 hover:bg-green-500/30 transition-colors">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => rejectUpload(item)} className="w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Library Tab */}
        {tab === 'Library' && (
          <div className="space-y-2">
            {library.map(item => (
              <div key={item.id} className="flex items-center gap-4 bg-card border border-border rounded-xl p-3">
                <div className="w-10 h-14 rounded-lg overflow-hidden bg-secondary shrink-0">
                  {item.poster_url && <img src={item.poster_url} alt={item.title} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.year} • {item.type === 'tv_show' ? 'TV' : 'Movie'} • {item.views || 0} views</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => toggleFeatured(item)} title="Toggle Featured"
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${item.is_featured ? 'bg-yellow-500/30 text-yellow-400' : 'bg-secondary text-muted-foreground hover:text-yellow-400'}`}>
                    <Star className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => toggleTrending(item)} title="Toggle Trending"
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${item.is_trending ? 'bg-primary/30 text-primary' : 'bg-secondary text-muted-foreground hover:text-primary'}`}>
                    <TrendingUp className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => toggleAdult(item)} title="Toggle Adult/Vault"
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${item.is_adult ? 'bg-red-500/30 text-red-400' : 'bg-secondary text-muted-foreground hover:text-red-400'}`}>
                    <Lock className="w-3.5 h-3.5" />
                  </button>
                  <Link to={`/watch/${item.id}`}
                    className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                    <Eye className="w-3.5 h-3.5" />
                  </Link>
                  <button onClick={() => deleteMedia(item.id)}
                    className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Users Tab */}
        {tab === 'Users' && (
          <div className="space-y-2">
            {users.map(u => (
              <div key={u.id} className="flex items-center gap-4 bg-card border border-border rounded-xl p-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  {u.full_name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{u.full_name || 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </div>
                <span className={`px-2 py-1 rounded-lg text-xs font-medium ${u.role === 'admin' ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                  {u.role}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}