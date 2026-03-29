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

const queryClient = new QueryClient();

const pages: Record<string, React.ReactNode> = {
  dashboard: <Dashboard />,
  receiving: <Receiving />,
  warehouse: <Warehouse />,
  reports: <Reports />,
  sync: <Sync />,
  users: <Users />,
};

const App = () => {
  const [page, setPage] = useState("dashboard");

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Layout activePage={page} onNavigate={setPage}>
          {pages[page] ?? <Dashboard />}
        </Layout>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
