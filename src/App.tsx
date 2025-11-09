import { Redirect, Route } from "react-router-dom";
import { IonApp, IonRouterOutlet, setupIonicReact } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import WorkerTotalsPage from "./pages/WorkerTotalsPage";
import CheckIn from "./components/CheckIn";
import CheckOut from "./components/CheckOut";
import PieceWork from "./components/PieceWork_1";
import PieceWork_2 from "./components/PieceWork_2";
import Register from "./components/Register";
import MonitorClockInOut from "./pages/MonitorClockInOut";
import ClockDashboard from "./pages/ClockInOutDashboard";
import FastPiecework from "./components/FastPiecework";
import FastPieceworkTotals from "./components/FastPieceworkTotals";
/* Core CSS required for Ionic components to work properly */
import "@ionic/react/css/core.css";

/* Basic CSS for apps built with Ionic */
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";

/* Optional CSS utils that can be commented out */
// import "@ionic/react/css/padding.css";
// import "@ionic/react/css/float-elements.css";
// import "@ionic/react/css/text-alignment.css";
// import "@ionic/react/css/text-transformation.css";
// import "@ionic/react/css/flex-utils.css";
// import "@ionic/react/css/display.css";

// Tailwind css
// import "./theme/tailwind.css";
import "tailwindcss/base.css";
import "tailwindcss/components.css";

/* Global CSS for the whole app */
import "./App.css";

/* Theme variables */
import "./theme/variables.css";
import Sidebar from "./components/dashboard/Sidebar";
import DashboardLayout from "./components/layout/DashboardLayout";
import OfflineIndicator from './components/OfflineIndicator';


setupIonicReact();

const App: React.FC = () => {
  return (
    <IonApp>
      <IonReactRouter>
        <OfflineIndicator />
        <div className="flex h-screen bg-gray-50">
          {/* Sidebar - only show on certain routes */}
          <Route
            path="/(dashboard|home|checkin|checkout|workerTotalsPage|monitor-clockins|clocks|piecework|fast-piecework|fast-piecework-totals)"
            component={Sidebar}
          />

          {/* Main content area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <IonRouterOutlet className="flex-1 bg-white ml-0 md:ml-64">
              <Route exact path="/home">
                <div className="min-h-screen">
                  <Home />
                </div>
              </Route>

              <Route exact path="/">
                <Redirect to="/home" />
              </Route>

              <Route exact path="/dashboard">
                <div className="min-h-screen">
                  <DashboardLayout>
                    <Dashboard />
                  </DashboardLayout>
                </div>
              </Route>

              <Route exact path="/checkin">
                <div className="min-h-screen">
                  <CheckIn />
                </div>
              </Route>

              <Route exact path="/checkout">
                <div className="min-h-screen">
                  <CheckOut />
                </div>
              </Route>

              <Route exact path="/piecework_1">
                <div className="min-h-screen">
                  <PieceWork />
                </div>
              </Route>

              <Route exact path="/piecework-2">
                <div className="min-h-screen">
                  <PieceWork_2 />
                </div>
              </Route>

              <Route exact path="/register">
                <div className="min-h-screen">
                  <Register />
                </div>
              </Route>

              <Route exact path="/monitor-clockins">
                <div className="min-h-screen">
                  <MonitorClockInOut />
                </div>
              </Route>

              <Route exact path="/clocks">
                <div className="min-h-screen">
                  <ClockDashboard />
                </div>
              </Route>

              <Route exact path="/workerTotalsPage">
                <div className="min-h-screen">
                  <WorkerTotalsPage />
                </div>
              </Route>

              <Route exact path="/fast-piecework">
                <div className="min-h-screen">
                  <FastPiecework />
                </div>
              </Route>

              <Route exact path="/fast-piecework-totals">
                <div className="min-h-screen">
                  <FastPieceworkTotals />
                </div>
              </Route>
            </IonRouterOutlet>
          </div>
        </div>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
