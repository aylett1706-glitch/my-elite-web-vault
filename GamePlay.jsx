import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, ExternalLink, Gamepad2, Maximize, RotateCcw, Save, ShieldCheck, Wifi } from 'lucide-react';
import { toast } from 'sonner';
import EmulatorJsPlayer from '@/components/games/EmulatorJsPlayer';

export default function GamePlay() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [user, setUser] = useState(null);
  const [saveRecord, setSaveRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [frameKey, setFrameKey] = useState(0);
  const [controllerConnected, setControllerConnected] = useState(false);
  const iframeRef = useRef(null);
  const stageRef = useRef(null);
  const cloudSources = ['steam', 'xbox_cloud', 'playstation_cloud'];
  const usesRomEmulator = game?.source_type === 'emulator' && game?.rom_url;
  const canEmbed = Boolean(game?.play_url) && !cloudSources.includes(game?.source_type);

  useEffect(() => {
    const load = async () => {
      const me = await base44.auth.me().catch(() => null);
      const [item] = await base44.entities.Game.filter({ id }, '', 1);
      const saves = me ? await base44.entities.GameSave.filter({ user_email: me.email, game_id: id }, '-updated_date', 1) : [];
      setUser(me);
      setGame(item || null);
      setSaveRecord(saves[0] || null);
      setLoading(false);
      if (item) base44.entities.Game.update(id, { views: (item.views || 0) + 1 }).catch(() => {});
    };
    load();
  }, [id]);

  useEffect(() => {
    if (!user?.email || !game?.id) return;
    const startedAt = Date.now();
    const timer = setInterval(() => {
      base44.entities.GameProgress.filter({ user_email: user.email, game_id: game.id }, '-updated_date', 1).then(existing => {
        const payload = {
          user_email: user.email,
          game_id: game.id,
          game_title: game.title,
          progress_label: 'In progress',
          session_seconds: Math.floor((Date.now() - startedAt) / 1000),
          last_played: new Date().toISOString()
        };
        return existing[0]?.id ? base44.entities.GameProgress.update(existing[0].id, payload) : base44.entities.GameProgress.create(payload);
      });
    }, 15000);
    return () => clearInterval(timer);
  }, [user, game]);

  useEffect(() => {
    const updateController = () => setControllerConnected(Boolean(navigator.getGamepads?.().some(Boolean)));
    const timer = setInterval(updateController, 1000);
    window.addEventListener('gamepadconnected', updateController);
    window.addEventListener('gamepaddisconnected', updateController);
    updateController();
    return () => {
      clearInterval(timer);
      window.removeEventListener('gamepadconnected', updateController);
      window.removeEventListener('gamepaddisconnected', updateController);
    };
  }, []);

  const saveCheckpoint = async () => {
    if (!user || !game) return;
    const payload = {
      user_email: user.email,
      game_id: game.id,
      game_title: game.title,
      save_label: 'Manual checkpoint',
      save_notes: 'Saved your current game session marker. Some embedded games manage exact save state inside the emulator/player.',
      save_data: JSON.stringify({ play_url: game.play_url, saved_at: new Date().toISOString() }),
      last_played: new Date().toISOString()
    };
    const saved = saveRecord ? await base44.entities.GameSave.update(saveRecord.id, payload) : await base44.entities.GameSave.create(payload);
    setSaveRecord(saved);
    toast.success('Cloud checkpoint saved');
  };

  const focusGame = () => {
    iframeRef.current?.focus();
    iframeRef.current?.contentWindow?.focus();
  };

  const directPlay = () => {
    const url = game?.store_url || game?.play_url;
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  const goFullscreen = async () => {
    await stageRef.current?.requestFullscreen?.();
    focusGame();
  };

  const restartGame = () => {
    setFrameKey(prev => prev + 1);
    setTimeout(focusGame, 500);
  };

  if (loading) {
    return <div className="fixed inset-0 flex items-center justify-center bg-black"><div className="h-9 w-9 animate-spin rounded-full border-2 border-primary/30 border-t-primary" /></div>;
  }

  if (!game) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-black text-white">
        <Gamepad2 className="h-12 w-12 text-primary" />
        <p>Game not found</p>
        <button onClick={() => navigate('/games')} className="text-primary hover:underline">Back to Games</button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden bg-black text-white">
      <header className="fixed left-0 right-0 top-0 z-20 flex flex-col gap-3 border-b border-white/10 bg-black/70 p-3 backdrop-blur-xl md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <button onClick={() => navigate('/games')} aria-label="Back to games" className="min-h-11 min-w-11 rounded-xl bg-white/10 p-2 text-white hover:bg-white/15">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold md:text-xl">{game.title}</h1>
            <p className="text-xs text-white/60">{game.source_type?.replace('_', ' ')} · {game.age_rating || 'All Ages'}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 text-sm font-bold ${controllerConnected ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' : 'border-white/15 bg-white/5 text-white/70'}`}>
            <Gamepad2 className="h-4 w-4" /> {controllerConnected ? 'Controller Connected' : 'Controller Ready'}
          </span>
          <button onClick={saveCheckpoint} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 px-4 text-sm font-bold text-white hover:bg-white/10">
            <Save className="h-4 w-4" /> Cloud Save
          </button>
          <button onClick={restartGame} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 px-4 text-sm font-bold text-white hover:bg-white/10">
            <RotateCcw className="h-4 w-4" /> Restart
          </button>
          <button onClick={goFullscreen} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90">
            <Maximize className="h-4 w-4" /> Play Fullscreen
          </button>
          <button onClick={focusGame} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 px-4 text-sm font-bold text-white hover:bg-white/10">
            <Gamepad2 className="h-4 w-4" /> Focus Controls
          </button>
          {(game.play_url || game.store_url) && (
            <button onClick={directPlay} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 text-sm font-bold text-primary hover:bg-primary/20">
              Launch Source <ExternalLink className="h-4 w-4" />
            </button>
          )}
          {game.store_url && (
            <a href={game.store_url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 px-4 text-sm font-bold text-white hover:bg-white/10">
              Open Source <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      </header>

      <div className="fixed bottom-0 left-0 right-0 z-20 flex flex-col gap-2 border-t border-white/10 bg-black/70 px-4 py-3 text-sm text-white/70 backdrop-blur-xl md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2"><Wifi className="h-4 w-4 text-primary" /> {saveRecord ? `Last checkpoint: ${new Date(saveRecord.updated_date || saveRecord.last_played).toLocaleString()}` : 'No cloud checkpoint yet'}</div>
        <div className="text-xs">Click the game screen first. If controls still do not respond, use Direct Play for full keyboard and mouse support.</div>
      </div>

      {game.legal_notes && (
        <div className="flex items-start gap-2 border-b border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
          <p>{game.legal_notes}</p>
        </div>
      )}

      {usesRomEmulator ? (
        <main ref={stageRef} onMouseDown={focusGame} className="fixed inset-0 bg-black pt-20 pb-16">
          <EmulatorJsPlayer game={game} />
        </main>
      ) : canEmbed ? (
        <main ref={stageRef} onMouseDown={focusGame} className="fixed inset-0 bg-black">
          <iframe
            ref={iframeRef}
            key={frameKey}
            title={game.title}
            src={game.play_url}
            className="h-full w-full border-0 bg-black"
            allow="fullscreen; gamepad; autoplay; pointer-lock; clipboard-read; clipboard-write"
            allowFullScreen
            tabIndex={0}
            onLoad={() => setTimeout(focusGame, 300)}
            onMouseDown={focusGame}
          />
        </main>
      ) : (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 pt-24 text-center">
          <Gamepad2 className="h-16 w-16 text-primary" />
          <h2 className="text-2xl font-bold">Open with the official service</h2>
          <p className="max-w-md text-sm text-white/60">Steam, Xbox Cloud and PlayStation cloud games must launch through their official services. Uploaded legal ROMs can run in the browser emulator.</p>
          {(game.store_url || game.play_url) && <button onClick={directPlay} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground">Launch Game <ExternalLink className="h-4 w-4" /></button>}
        </div>
      )}
    </div>
  );
}