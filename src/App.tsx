import { lazy, Suspense, useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "./lib/queryClient";
import { OfflineBanner } from "./components/OfflineBanner";
import { AuthProvider } from "./hooks/useAuth";
import { AuthGuard } from "./components/AuthGuard";
import ErrorBoundary from "./components/ErrorBoundary";
import { useInactivity } from "./hooks/useInactivity";

const Index     = lazy(() => import("./pages/Index"));
const Auth      = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const NotFound  = lazy(() => import("./pages/NotFound"));

// Safe async native setup — runs after React mounts, never blocks rendering
const setupNative = async () => {
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return;

    // StatusBar — wrapped individually so one failure doesn't block others
    try {
      const { StatusBar, Style } = await import('@capacitor/status-bar');
      await StatusBar.setStyle({ style: Style.Dark });
      // setBackgroundColor only works on Android — skip on iOS/iPad
      if (Capacitor.getPlatform() === 'android') {
        await StatusBar.setBackgroundColor({ color: '#0a0a0a' });
      }
    } catch {
      // StatusBar not available on this device/platform — safe to ignore
    }

    // SplashScreen — hide after a short delay to ensure content is visible
    try {
      const { SplashScreen } = await import('@capacitor/splash-screen');
      await SplashScreen.hide({ fadeOutDuration: 300 });
    } catch {
      // SplashScreen not configured — safe to ignore
    }
  } catch {
    // Not a Capacitor environment — web only
  }
};

const InactivityTracker = () => {
  useInactivity();
  return null;
};

function PageLoader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: '#0a0a0a',
    }}>
      <div style={{
        width: 32, height: 32, border: '3px solid #534AB7',
        borderTopColor: 'transparent', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// Native setup component — runs inside React tree so it's safe
const NativeSetup = () => {
  useEffect(() => {
    setupNative();
  }, []);
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <OfflineBanner />
      <BrowserRouter>
        <AuthProvider>
          <NativeSetup />
          <InactivityTracker />
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route
                  path="/dashboard"
                  element={
                    <AuthGuard>
                      <Dashboard />
                    </AuthGuard>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;