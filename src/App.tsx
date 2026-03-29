import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Receiving from "@/pages/Receiving";
import Warehouse from "@/pages/Warehouse";
import Reports from "@/pages/Reports";
import Sync from "@/pages/Sync";
import Users from "@/pages/Users";
import Labels from "@/pages/Labels";

const queryClient = new QueryClient();

const App = () => {
  const [page, setPage] = useState("dashboard");

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <Dashboard />;
      case "receiving": return <Receiving />;
      case "warehouse": return <Warehouse />;
      case "labels": return <Labels />;
      case "reports": return <Reports />;
      case "sync": return <Sync />;
      case "users": return <Users />;
      default: return <Dashboard />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Layout activePage={page} onNavigate={setPage}>
          {renderPage()}
        </Layout>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;