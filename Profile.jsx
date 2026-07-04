import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Clock, Film, Tv, LogOut, Star, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import EliteSettingsPanel from '@/components/settings/EliteSettingsPanel';
import { motion } from 'framer-motion';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const me = await base44.auth.me().catch(() => null);
      setUser(me);
      if (me) {
        const h = await base44.entities.WatchHistory.filter({ user_email: me.email }, '-last_watched', 50);
        setHistory(h);
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleLogout = () => base44.auth.logout('/');

  const stats = {
    movies: history.filter(h => h.media_type === 'movie').length,
    shows: history.filter(h => h.media_type === 'tv_show').length,
    completed: history.filter(h => h.completed).length,
  };

  if (loading) return (
    <div className="fixed inset-0 bg-background flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      <div className="pt-24 max-w-4xl mx-auto px-4 md:px-8 pb-16">
        <button onClick={() => navigate('/')} className="mb-6 p-2 hover:bg-secondary rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-muted-foreground hover:text-foreground" />
        </button>
        {/* Profile Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-6 mb-10 p-6 bg-card border border-border rounded-2xl">
          <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-3xl font-bold text-primary-foreground">
            {user?.full_name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">{user?.full_name || 'User'}</h1>
            <p className="text-muted-foreground">{user?.email}</p>
            <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${user?.role === 'admin' ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'}`}>
              {user?.role || 'member'}
            </span>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:border-destructive/50 hover:bg-destructive/10 transition-colors text-sm">
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </motion.div>

        <div className="mb-10">
          <EliteSettingsPanel />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { label: 'Movies Watched', value: stats.movies, icon: Film },
            { label: 'Shows Watched', value: stats.shows, icon: Tv },
            { label: 'Completed', value: stats.completed, icon: Star },
          ].map(s => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-2xl p-5 text-center">
              <s.icon className="w-5 h-5 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Watch History */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4">Watch History</h2>
          {history.length === 0 ? (
            <div className="text-center py-12 bg-card border border-border rounded-2xl">
              <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No watch history yet</p>
              <Link to="/" className="text-primary hover:underline text-sm mt-2 inline-block">Browse content</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {history.map(item => {
                const progress = item.duration_seconds > 0 ? (item.progress_seconds / item.duration_seconds) * 100 : 0;
                return (
                  <Link key={item.id} to={`/watch/${item.media_id}?t=${item.progress_seconds}`}
                    className="flex items-center gap-3 bg-card border border-border rounded-xl p-3 hover:border-primary/30 transition-colors group">
                    <div className="w-12 h-16 rounded-lg overflow-hidden bg-secondary shrink-0">
                      {item.poster_url && <img src={item.poster_url} alt={item.media_title} className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{item.media_title}</p>
                      <p className="text-xs text-muted-foreground capitalize">{item.media_type?.replace('_', ' ')}</p>
                      <div className="mt-2 h-1 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(progress, 100)}%` }} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{Math.round(progress)}% {item.completed ? '• Completed' : ''}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}