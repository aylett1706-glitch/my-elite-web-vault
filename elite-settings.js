import { base44 } from '@/api/base44Client';

export const ELITE_STORAGE_KEY = 'ev_elite_settings_v1';
export const GLOBAL_SETTINGS_KEY = 'global';
const GLOBAL_SETTINGS_CACHE_MS = 60000;
let globalSettingsPromise = null;
let globalSettingsLoadedAt = 0;

export const ELITE_PRESETS = {
  gold: { label: 'Imperial Gold', primary: '42 96% 61%', accent: '268 92% 70%', background: '224 35% 3%', card: '224 28% 7%' },
  crimson: { label: 'Crimson Vault', primary: '0 84% 60%', accent: '42 96% 61%', background: '232 34% 3%', card: '234 27% 7%' },
  sapphire: { label: 'Sapphire Luxe', primary: '214 100% 66%', accent: '190 95% 58%', background: '222 42% 4%', card: '222 32% 8%' },
  violet: { label: 'Royal Violet', primary: '268 92% 70%', accent: '42 96% 61%', background: '260 42% 4%', card: '260 30% 8%' },
  emerald: { label: 'Emerald Stream', primary: '152 76% 48%', accent: '190 95% 58%', background: '166 42% 4%', card: '166 30% 8%' },
  neon: { label: 'Neon Arcade', primary: '315 100% 62%', accent: '185 100% 55%', background: '250 44% 4%', card: '250 34% 8%' },
  frost: { label: 'Frost Glass', primary: '199 100% 72%', accent: '260 92% 78%', background: '220 34% 5%', card: '220 24% 10%' },
  sunset: { label: 'Sunset Luxe', primary: '24 96% 58%', accent: '330 88% 64%', background: '232 34% 4%', card: '232 26% 8%' },
  aurora: { label: 'Aurora Life', primary: '142 76% 58%', accent: '280 100% 74%', background: '224 38% 4%', card: '224 28% 8%' },
  sakura: { label: 'Sakura Bloom', primary: '340 92% 72%', accent: '42 96% 68%', background: '336 32% 5%', card: '336 24% 9%' },
  forest: { label: 'Forest Calm', primary: '132 50% 52%', accent: '42 82% 60%', background: '150 38% 4%', card: '150 26% 8%' },
  oceanic: { label: 'Ocean Life', primary: '188 92% 58%', accent: '216 100% 68%', background: '204 42% 4%', card: '204 30% 8%' },
  candy: { label: 'Candy Pop', primary: '326 100% 70%', accent: '190 100% 64%', background: '250 38% 5%', card: '250 28% 9%' },
  noir: { label: 'Cinema Noir', primary: '42 92% 70%', accent: '0 0% 82%', background: '0 0% 2%', card: '0 0% 7%' }
};

export const DEFAULT_ELITE_SETTINGS = {
  preset: 'gold',
  appName: 'EliteVault',
  compact: false,
  cinematicGlow: true,
  reducedMotion: false,
  quickDock: true,
  homeLayout: 'cinematic',
  vaultMode: 'private',
  defaultAdultPin: '1706',
  liveWallpaper: true,
  wallpaperPreset: 'rain_city',
  wallpaperQuality: 'high',
  wallpaperMotion: 'medium',
  wallpaperPerformance: 'balanced',
  smartWallpaperMode: true,
  audioReactiveWallpaper: false,
  controllerWallpaperMotion: true,
  wallpaperEffects: {
    particles: true,
    glow: true,
    blur: true,
    depth: true,
    weather: true
  },
  pageWidth: 'standard',
  lifeDesign: 'cinema',
  navigationStyle: 'floating',
  contentSpacing: 'balanced',
  cornerStyle: 'soft',
  textScale: 'normal',
  cardStyle: 'poster',
  posterShape: 'classic',
  browseDensity: 'balanced',
  metadataStyle: 'badges',
  animationStyle: 'smooth',
  hoverEffect: 'lift',
  accentIntensity: 'balanced',
  backgroundDim: 'medium',
  glassPanels: true,
  showBadges: true,
  showRatings: true,
  showTopicChips: true,
  autoPlayPreviews: true,
  focusMode: false,
  stickyNavigation: true,
  denseMobile: false,
  ambientOverlays: true,
  premiumBorders: true,
  largeArtwork: false,
  quickActions: true,
  personalizationMode: 'deep',
  recommendationDepth: 'rich',
  preferredMood: 'cinematic',
  preferredHubs: ['Movies', 'TV Shows', 'Games', 'Actors'],
  marketMode: 'all_in',
  homeHeroStyle: 'cinema',
  creatorRailFocus: 'ai_first',
  contentDiscoveryStyle: 'studio',
  profileMode: 'creator',
  playerExperience: 'cinema',
  mobileNavMode: 'bottom_tabs',
  trustLevel: 'transparent',
  accessibilityLevel: 'enhanced',
  aiDiscovery: true,
  onboardingPrompt: true,
  familyProfiles: true,
  socialLayer: true,
  watchParties: true,
  gameAchievements: true,
  subtitleFirst: true,
  sourceTransparency: true,
  mobileFirstMode: true,
  creatorInsights: true
};

export const readEliteSettings = () => {
  try {
    return { ...DEFAULT_ELITE_SETTINGS, ...(JSON.parse(localStorage.getItem(ELITE_STORAGE_KEY) || '{}')) };
  } catch {
    return DEFAULT_ELITE_SETTINGS;
  }
};

export const applyEliteSettings = (settings) => {
  const preset = ELITE_PRESETS[settings.preset] || ELITE_PRESETS.gold;
  const root = document.documentElement;
  root.style.setProperty('--primary', preset.primary);
  root.style.setProperty('--accent', preset.accent);
  root.style.setProperty('--background', preset.background);
  root.style.setProperty('--card', preset.card);
  root.style.setProperty('--gold', preset.primary);
  root.style.setProperty('--elite-background-dim', settings.backgroundDim === 'deep' ? '0.92' : settings.backgroundDim === 'light' ? '0.48' : '0.72');
  root.style.setProperty('--elite-accent-opacity', settings.accentIntensity === 'electric' ? '0.34' : settings.accentIntensity === 'subtle' ? '0.10' : '0.20');
  root.classList.toggle('elite-compact', !!settings.compact);
  root.classList.toggle('elite-no-glow', !settings.cinematicGlow);
  root.classList.toggle('elite-reduce-motion', !!settings.reducedMotion);
  ['pageWidth', 'lifeDesign', 'navigationStyle', 'contentSpacing', 'cornerStyle', 'textScale', 'cardStyle', 'posterShape', 'browseDensity', 'metadataStyle', 'animationStyle', 'hoverEffect', 'personalizationMode', 'recommendationDepth', 'preferredMood', 'marketMode', 'homeHeroStyle', 'creatorRailFocus', 'contentDiscoveryStyle', 'profileMode', 'playerExperience', 'mobileNavMode', 'trustLevel', 'accessibilityLevel'].forEach(key => {
    root.dataset[key] = settings[key] || DEFAULT_ELITE_SETTINGS[key];
  });
  ['glassPanels', 'showBadges', 'showRatings', 'showTopicChips', 'autoPlayPreviews', 'focusMode', 'stickyNavigation', 'denseMobile', 'ambientOverlays', 'premiumBorders', 'largeArtwork', 'quickActions', 'aiDiscovery', 'onboardingPrompt', 'familyProfiles', 'socialLayer', 'watchParties', 'gameAchievements', 'subtitleFirst', 'sourceTransparency', 'mobileFirstMode', 'creatorInsights'].forEach(key => {
    root.classList.toggle(`elite-${key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}`, !!settings[key]);
  });
};

export const saveEliteSettingsLocal = (settings) => {
  localStorage.setItem(ELITE_STORAGE_KEY, JSON.stringify(settings));
  applyEliteSettings(settings);
  window.dispatchEvent(new CustomEvent('elite-settings-updated', { detail: settings }));
};

export const loadGlobalEliteSettings = async () => {
  const now = Date.now();
  if (globalSettingsPromise && now - globalSettingsLoadedAt < GLOBAL_SETTINGS_CACHE_MS) {
    return globalSettingsPromise;
  }

  globalSettingsLoadedAt = now;
  globalSettingsPromise = base44.entities.EliteSettings.filter({ key: GLOBAL_SETTINGS_KEY }, '-updated_date', 1)
    .then((records) => {
      const settings = records?.[0]?.settings ? { ...DEFAULT_ELITE_SETTINGS, ...records[0].settings } : readEliteSettings();
      saveEliteSettingsLocal(settings);
      return { settings, record: records?.[0] || null };
    })
    .catch(() => {
      const settings = readEliteSettings();
      applyEliteSettings(settings);
      return { settings, record: null };
    });

  return globalSettingsPromise;
};

export const saveGlobalEliteSettings = async (settings, existingRecord) => {
  const payload = { key: GLOBAL_SETTINGS_KEY, settings };
  const saved = existingRecord?.id
    ? await base44.entities.EliteSettings.update(existingRecord.id, payload)
    : await base44.entities.EliteSettings.create(payload);
  saveEliteSettingsLocal(settings);
  return saved;
};