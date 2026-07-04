import { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import Navbar from '@/components/layout/Navbar';
import InputDevicePanel from '@/components/input-hub/InputDevicePanel';
import ControllerMapper from '@/components/input-hub/ControllerMapper';
import MacroBuilder from '@/components/input-hub/MacroBuilder';
import InputProfileManager from '@/components/input-hub/InputProfileManager';
import InputAdvancedSystems from '@/components/input-hub/InputAdvancedSystems';
import AiInputAssistant from '@/components/input-hub/AiInputAssistant';
import TrainingSystem from '@/components/input-hub/TrainingSystem';
import { Gamepad2, ShieldCheck } from 'lucide-react';

const defaultProfile = {
  name: 'Elite Universal Profile',
  device_type: 'controller',
  game_id: '',
  game_title: '',
  mode: 'custom',
  binds: {},
  macros: [],
  sensitivity: { dpi: 1600, deadzone: 0.12 },
  touch_layout: { opacity: 70 },
  gyro_settings: { enabled: false },
  haptics: { vibration: 65 },
  rgb_profile: { effect: 'health reactive' },
  accessibility: { one_handed: false, large_buttons: true },
  streamer_actions: {},
  is_shared: false
};

export default function InputHub() {
  const [user, setUser] = useState(null);
  const [games, setGames] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [profile, setProfile] = useState(defaultProfile);
  const [liveInput, setLiveInput] = useState({ key: '', clicks: 0, apm: 0, gamepad: null });
  const macros = useMemo(() => profile.macros || [], [profile.macros]);

  useEffect(() => {
    const load = async () => {
      const me = await base44.auth.me().catch(() => null);
      const gameItems = await base44.entities.Game.filter({ status: 'approved' }, '-created_date', 200);
      const profileItems = me ? await base44.entities.InputProfile.filter({ user_email: me.email }, '-updated_date', 100) : [];
      setUser(me);
      setGames(gameItems);
      setProfiles(profileItems);
      if (profileItems[0]) setProfile({ ...defaultProfile, ...profileItems[0] });
    };
    load();
  }, []);

  const setBinds = (updater) => setProfile(prev => ({ ...prev, binds: typeof updater === 'function' ? updater(prev.binds || {}) : updater }));
  const setMacros = (updater) => setProfile(prev => ({ ...prev, macros: typeof updater === 'function' ? updater(prev.macros || []) : updater }));

  const saveProfile = async () => {
    if (!user) {
      base44.auth.redirectToLogin(window.location.href);
      return;
    }
    const payload = { ...profile, user_email: user.email };
    const saved = profile.id ? await base44.entities.InputProfile.update(profile.id, payload) : await base44.entities.InputProfile.create(payload);
    setProfile({ ...defaultProfile, ...saved });
    const fresh = await base44.entities.InputProfile.filter({ user_email: user.email }, '-updated_date', 100);
    setProfiles(fresh);
    toast.success('Input profile synced');
  };

  const loadProfile = (item) => {
    setProfile({ ...defaultProfile, ...item });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar user={user} />
      <main className="mx-auto max-w-screen-2xl px-4 pb-16 pt-24 md:px-8">
        <section className="mb-6 overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-card via-card to-primary/10 p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">
                <Gamepad2 className="h-3.5 w-3.5" /> Ultimate Input & Control Hub
              </div>
              <h1 className="font-bebas text-5xl tracking-wider text-foreground md:text-7xl">Input & Control Ecosystem</h1>
              <p className="mt-2 max-w-4xl text-sm leading-relaxed text-muted-foreground">A unified browser-safe control system for device detection, controller mapping, macros, game profiles, accessibility, touch, gyro settings, analytics, training and AI optimization.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4 text-sm text-muted-foreground">
              <ShieldCheck className="mb-2 h-5 w-5 text-primary" /> Hardware RGB, firmware, polling rate and vendor driver changes require native vendor software; this hub stores and syncs the profile intent.
            </div>
          </div>
        </section>

        <div className="space-y-6">
          <InputProfileManager profile={profile} setProfile={setProfile} games={games} profiles={profiles} saveProfile={saveProfile} loadProfile={loadProfile} />
          <InputDevicePanel liveInput={liveInput} setLiveInput={setLiveInput} />
          <ControllerMapper binds={profile.binds || {}} setBinds={setBinds} liveInput={liveInput} />
          <MacroBuilder macros={macros} setMacros={setMacros} />
          <AiInputAssistant profile={profile} setProfile={setProfile} />
          <InputAdvancedSystems profile={profile} setProfile={setProfile} liveInput={liveInput} />
          <TrainingSystem />
        </div>
      </main>
    </div>
  );
}