import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import EliteAtmosphere from '@/components/layout/EliteAtmosphere';
import EliteControlCenter from '@/components/layout/EliteControlCenter';
import GlobalErrorBoundary from '@/components/system/GlobalErrorBoundary';
import ConnectionStatus from '@/components/system/ConnectionStatus';
import PerformanceWarmup from '@/components/system/PerformanceWarmup';
import MobileBottomTabs from '@/components/layout/MobileBottomTabs';
import ExperienceOnboarding from '@/components/onboarding/ExperienceOnboarding';
import EliteAIAssistant from '@/components/assistant/EliteAIAssistant';
import AccessibilityEnhancer from '@/components/system/AccessibilityEnhancer';
import { Toaster as Sonner } from 'sonner';

// Page imports
import Home from './pages/Home';
import Watch from './pages/Watch';
import MediaDetail from './pages/MediaDetail';
import Search from './pages/Search.jsx';
import Upload from './pages/Upload';
import Admin from './pages/Admin';
import AddMedia from './pages/AddMedia';
import Browse from './pages/Browse';
import Kids from './pages/Kids.jsx';
import Profile from './pages/Profile';
import UploadSeries from './pages/UploadSeries';
import GenreBrowse from './pages/GenreBrowse';
import AdultVault from './pages/AdultVault';
import AdultPerformerDetail from './pages/AdultPerformerDetail.jsx';
import PerformersHub from './pages/PerformersHub.jsx';
import PerformerProfile from './pages/PerformerProfile.jsx';
import Games from './pages/Games.jsx';
import Sports from './pages/Sports.jsx';
import Anime from './pages/Anime.jsx';
import Manga from './pages/Manga.jsx';
import MangaReader from './pages/MangaReader.jsx';
import Books from './pages/Books.jsx';
import BookReader from './pages/BookReader.jsx';
import GameDetail from './pages/GameDetail.jsx';
import GamePlay from './pages/GamePlay.jsx';
import LiveTV from './pages/LiveTV.jsx';
import InputHub from './pages/InputHub.jsx';
import Collections from './pages/Collections.jsx';
import CollectionDetail from './pages/CollectionDetail.jsx';
import ActorProfile from './pages/ActorProfile.jsx';
import ActorHub from './pages/ActorHub.jsx';
import CreatorTools from './pages/CreatorTools.jsx';
import Spotlight from './pages/Spotlight.jsx';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Loading EliteVault...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/movies" element={<Browse mediaType="movie" />} />
      <Route path="/tv-shows" element={<Browse mediaType="tv_show" />} />
      <Route path="/kids" element={<Kids />} />
      <Route path="/games" element={<Games />} />
      <Route path="/sports" element={<Sports />} />
      <Route path="/input-hub" element={<InputHub />} />
      <Route path="/live-tv" element={<LiveTV />} />
      <Route path="/collections" element={<Collections />} />
      <Route path="/collections/:id" element={<CollectionDetail />} />
      <Route path="/actors" element={<ActorHub />} />
      <Route path="/actors/:name" element={<ActorProfile />} />
      <Route path="/tools" element={<CreatorTools />} />
      <Route path="/spotlight" element={<Spotlight />} />
      <Route path="/anime" element={<Anime />} />
      <Route path="/manga" element={<Manga />} />
      <Route path="/manga/:id" element={<MangaReader />} />
      <Route path="/books" element={<Books />} />
      <Route path="/books/:id/read" element={<BookReader />} />
      <Route path="/games/:id" element={<GameDetail />} />
      <Route path="/games/:id/play" element={<GamePlay />} />
      <Route path="/my-list" element={<Browse />} />
      <Route path="/search" element={<Search />} />
      <Route path="/watch/:id" element={<Watch />} />
      <Route path="/media/:id" element={<MediaDetail />} />
      <Route path="/upload" element={<Upload />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/add-media" element={<AddMedia />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/upload-series" element={<UploadSeries />} />
      <Route path="/genre/:genre" element={<GenreBrowse />} />
      <Route path="/vault" element={<AdultVault />} />
      <Route path="/vault/performer/:name" element={<AdultPerformerDetail />} />
      <Route path="/performers" element={<PerformersHub />} />
      <Route path="/performers/:id" element={<PerformerProfile />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <GlobalErrorBoundary>
            <PerformanceWarmup />
            <AccessibilityEnhancer />
            <ExperienceOnboarding />
            <EliteAtmosphere />
            <EliteControlCenter />
            <EliteAIAssistant />
            <MobileBottomTabs />
            <ConnectionStatus />
            <main id="main-content" className="relative z-10 pb-20 md:pb-0">
              <AuthenticatedApp />
            </main>
          </GlobalErrorBoundary>
        </Router>
        <Toaster />
        <Sonner theme="dark" position="bottom-right" />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;