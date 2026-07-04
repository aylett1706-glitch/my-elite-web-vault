import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Lock, Eye, EyeOff, Film, Star, ShieldAlert } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AdultAISearchPanel from '@/components/vault/AdultAISearchPanel';
import AdultPerformerSection from '@/components/vault/AdultPerformerSection';
import VaultPerformerUpload from '@/components/vault/VaultPerformerUpload';
import { isAdultRated, normalizeRating } from '@/lib/content-safety';

const VAULT_PIN = '1706'; // Admin can change this — stored client-side only
const SESSION_KEY = 'ev_vault_unlocked';
const VAULT_CACHE_KEY = 'ev_vault_media_cache_v1';

const getVaultCache = () => {
  const cached = sessionStorage.getItem(VAULT_CACHE_KEY);
  return cached ? JSON.parse(cached) : [];
};

export default function AdultVault() {
  const navigate = useNavigate();
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(SESSION_KEY) === 'true');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState(getVaultCache);
  const [user, setUser] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [visibleCount, setVisibleCount] = useState(35);

  useEffect(() => {
    base44.auth.me().catch(() => null).then(setUser);
    if (unlocked) loadContent();
  }, [unlocked]);

  const loadContent = async () => {
    const media = await base44.entities.Media.filter({ status: 'approved' }, '-created_date', 500);
    const vaultMedia = media.filter(isAdultRated);
    setItems(vaultMedia);
    sessionStorage.setItem(VAULT_CACHE_KEY, JSON.stringify(vaultMedia));
  };

  const handleUnlock = () => {
    if (pin === VAULT_PIN) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      setUnlocked(true);
      setError('');
    } else {
      setError('Incorrect PIN. Access denied.');
      setPin('');
    }
  };

  const handleLock = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setUnlocked(false);
    setItems([]);
    navigate('/');
  };

  const ratingFolderItems = items.filter(item => ['R', 'X', 'XXX', 'NC-17', 'R18+', 'X18+', '18+'].includes(normalizeRating(item.content_rating)) || /\b(snuff)\b/i.test(`${item.title || ''} ${item.synopsis || ''} ${item.content_notes || ''}`));
  const categories = ['All', ...(ratingFolderItems.length ? ['R & X Rated'] : []), ...Array.from(new Set(items.flatMap(item => item.genres || []))).filter(Boolean)];
  const filteredItems = selectedCategory === 'All'
    ? items
    : selectedCategory === 'R & X Rated'
      ? ratingFolderItems
      : items.filter(item => item.genres?.includes(selectedCategory));
  const visibleItems = filteredItems.slice(0, visibleCount);

  useEffect(() => {
    if (!unlocked) return;
    const onScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 700) {
        setVisibleCount(count => Math.min(count + 21, filteredItems.length));
      }
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [unlocked, filteredItems.length]);

  if (!unlocked) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="font-bebas text-4xl text-white tracking-wider mb-2">Private Vault</h1>
            <p className="text-white/40 text-sm">18+ content · PIN required</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                value={pin}
                onChange={e => { setPin(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleUnlock()}
                placeholder="Enter PIN"
                maxLength={8}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/30 text-center text-xl tracking-widest focus:outline-none focus:border-red-400/60"
                autoFocus
              />
              <button
                onClick={() => setShowPin(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
              >
                {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <AnimatePresence>
              {error && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-red-400 text-sm text-center">
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <button
              onClick={handleUnlock}
              disabled={!pin}
              className="w-full bg-red-600 hover:bg-red-500 text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-40"
            >
              Unlock Vault
            </button>

            <button onClick={() => navigate('/')} className="w-full text-white/40 hover:text-white/70 text-sm transition-colors">
              ← Back to Home
            </button>
          </div>

          <p className="text-center text-white/20 text-xs mt-6">
            By entering, you confirm you are 18 years or older.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Vault header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-red-950/80 backdrop-blur border-b border-red-900/50 px-6 py-3 flex items-center gap-3">
        <ShieldAlert className="w-5 h-5 text-red-400" />
        <span className="font-bebas text-2xl tracking-wider text-red-300">Private Vault · 18+</span>
        <div className="flex-1" />
        <button onClick={handleLock}
          className="flex items-center gap-2 px-4 py-1.5 bg-red-900/60 border border-red-700/50 text-red-300 rounded-lg text-sm font-medium hover:bg-red-900 transition-colors">
          <Lock className="w-3.5 h-3.5" />
          Lock & Exit
        </button>
      </div>

      <div className="pt-24 max-w-screen-2xl mx-auto px-4 md:px-8 pb-16">
        <h1 className="font-bebas text-5xl text-foreground mb-2">Adult Content</h1>
        <p className="text-muted-foreground text-sm mb-8">Private · For authorised viewers only</p>

        <VaultPerformerUpload onCreated={() => sessionStorage.removeItem('ev_adult_performers_cache_v2')} />

        <AdultPerformerSection />

        <AdultAISearchPanel onAdded={loadContent} />

        {categories.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${selectedCategory === category ? 'bg-red-600 border-red-500 text-white' : 'bg-secondary border-border text-muted-foreground hover:text-foreground'}`}
              >
                {category}
              </button>
            ))}
          </div>
        )}

        {visibleItems.length === 0 ? (
          <div className="text-center py-20">
            <Film className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-semibold text-foreground mb-2">No adult content yet</p>
            <p className="text-muted-foreground text-sm">Admins can mark content as adult in the library.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4">
            {visibleItems.map((item, i) => (
              <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.02, 0.4) }}>
                <Link to={`/media/${item.id}`} className="group block">
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-secondary mb-2 group-hover:scale-105 transition-all duration-300">
                    {item.poster_url
                      ? <img src={item.poster_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                      : <div className="w-full h-full flex items-center justify-center"><Film className="w-8 h-8 text-muted-foreground" /></div>
                    }
                    {item.rating && (
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 flex items-center justify-center">
                        <span className="flex items-center gap-1 text-yellow-400 font-bold text-sm">
                          <Star className="w-4 h-4 fill-yellow-400" />{item.rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.year}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}