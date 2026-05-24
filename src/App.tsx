import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AnnouncementPopup from "@/components/AnnouncementPopup";
import SupportButton from "@/components/SupportButton";
import NotFound from "@/pages/not-found";

import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import DashboardPage from "@/pages/DashboardPage";
import ProfilePage from "@/pages/ProfilePage";
import ScoresPage from "@/pages/ScoresPage";
import UniversitiesPage from "@/pages/UniversitiesPage";
import UniversityDetailPage from "@/pages/UniversityDetailPage";
import ScholarshipsPage from "@/pages/ScholarshipsPage";
import CalculatorPage from "@/pages/CalculatorPage";
import RecommendationsPage from "@/pages/RecommendationsPage";
import AIChatPage from "@/pages/AIChatPage";
import ComparePage from "@/pages/ComparePage";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUniversitiesPage from "@/pages/admin/AdminUniversitiesPage";
import AdminUniversityFormPage from "@/pages/admin/AdminUniversityFormPage";
import AdminScholarshipsPage from "@/pages/admin/AdminScholarshipsPage";
import AdminImporterPage from "@/pages/admin/AdminImporterPage";
import AdminDataQualityPage from "@/pages/admin/AdminDataQualityPage";
import AdminSupportPage from "@/pages/admin/AdminSupportPage";
import AdminAnnouncementsPage from "@/pages/admin/AdminAnnouncementsPage";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function ProtectedRoute({ component: Component, adminOnly = false }: { component: React.ComponentType; adminOnly?: boolean }) {
  const { currentUser, loading, isAdmin } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">جاري التحميل...</p>
      </div>
    </div>
  );
  if (!currentUser) return <Redirect to="/login" />;
  if (adminOnly && !isAdmin) return <Redirect to="/dashboard" />;
  return <Component />;
}

function Router() {
  const { currentUser, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <Switch>
      <Route path="/" component={() => currentUser ? <Redirect to="/dashboard" /> : <LandingPage />} />
      <Route path="/login" component={() => currentUser ? <Redirect to="/dashboard" /> : <LoginPage />} />
      <Route path="/register" component={() => currentUser ? <Redirect to="/dashboard" /> : <RegisterPage />} />

      <Route path="/dashboard" component={() => <ProtectedRoute component={DashboardPage} />} />
      <Route path="/profile" component={() => <ProtectedRoute component={ProfilePage} />} />
      <Route path="/scores" component={() => <ProtectedRoute component={ScoresPage} />} />
      <Route path="/universities" component={() => <ProtectedRoute component={UniversitiesPage} />} />
      <Route path="/universities/:id" component={() => <ProtectedRoute component={UniversityDetailPage} />} />
      <Route path="/scholarships" component={() => <ProtectedRoute component={ScholarshipsPage} />} />
      <Route path="/calculator" component={() => <ProtectedRoute component={CalculatorPage} />} />
      <Route path="/recommendations" component={() => <ProtectedRoute component={RecommendationsPage} />} />
      <Route path="/ai-chat" component={() => <ProtectedRoute component={AIChatPage} />} />
      <Route path="/compare" component={() => <ProtectedRoute component={ComparePage} />} />

      <Route path="/admin" component={() => <ProtectedRoute component={AdminDashboard} adminOnly />} />
      <Route path="/admin/universities" component={() => <ProtectedRoute component={AdminUniversitiesPage} adminOnly />} />
      <Route path="/admin/universities/new" component={() => <ProtectedRoute component={() => <AdminUniversityFormPage mode="create" />} adminOnly />} />
      <Route path="/admin/universities/:id/edit" component={() => <ProtectedRoute component={() => <AdminUniversityFormPage mode="edit" />} adminOnly />} />
      <Route path="/admin/scholarships" component={() => <ProtectedRoute component={AdminScholarshipsPage} adminOnly />} />
      <Route path="/admin/importer" component={() => <ProtectedRoute component={AdminImporterPage} adminOnly />} />
      <Route path="/admin/data-quality" component={() => <ProtectedRoute component={AdminDataQualityPage} adminOnly />} />
      <Route path="/admin/support" component={() => <ProtectedRoute component={AdminSupportPage} adminOnly />} />
      <Route path="/admin/announcements" component={() => <ProtectedRoute component={AdminAnnouncementsPage} adminOnly />} />

      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { currentUser } = useAuth();
  return (
    <>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
      <Toaster />
      {currentUser && <AnnouncementPopup />}
      {currentUser && <SupportButton />}
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
