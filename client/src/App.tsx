import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import MainLayout from "@/components/layout/main-layout";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Instances from "@/pages/instances";
import Broadcast from "@/pages/broadcast";
import Contacts from "@/pages/contacts";
import DeliveryReport from "@/pages/delivery-report";
import Inbox from "@/pages/inbox";
import Transactions from "@/pages/transactions";
import MessageQueue from "@/pages/message-queue";
import ApiDocs from "@/pages/api-docs";
import Profile from "@/pages/profile";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      {/* Protected routes */}
      <Route path="/" nest>
        <MainLayout>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/instances" component={Instances} />
            <Route path="/broadcast" component={Broadcast} />
            <Route path="/contacts" component={Contacts} />
            <Route path="/delivery-report" component={DeliveryReport} />
            <Route path="/inbox" component={Inbox} />
            <Route path="/transactions" component={Transactions} />
            <Route path="/message-queue" component={MessageQueue} />
            <Route path="/api-docs" component={ApiDocs} />
            <Route path="/profile" component={Profile} />
            <Route component={NotFound} />
          </Switch>
        </MainLayout>
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
