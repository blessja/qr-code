import { Redirect, Route } from "react-router-dom";
import { IonApp, IonRouterOutlet, setupIonicReact } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import CheckIn from "./components/CheckIn";
import CheckOut from "./components/CheckOut";
import PieceWork from "./components/PieceWork_1";
import PieceWork_2 from "./components/PieceWork_2";
import Register from "./components/Register";
import MonitorClockInOut from "./pages/MonitorClockInOut";
import ClockDashboard from "./pages/ClockInOutDashboard";

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

setupIonicReact();

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <IonRouterOutlet>
        <Route exact path="/home">
          <Home />
        </Route>
        <Route exact path="/">
          <Redirect to="/home" />
        </Route>
        <Route exact path="/dashboard">
          <Dashboard />
        </Route>
        <Route exact path="/checkin">
          <CheckIn />
        </Route>
        <Route exact path="/checkout">
          <CheckOut />
        </Route>
        <Route exact path="/piecework_1">
          <PieceWork />
        </Route>
        <Route exact path="/piecework-2">
          <PieceWork_2 />
        </Route>
        <Route exact path="/register">
          <Register />
        </Route>
        <Route exact path="/monitor-clockins">
          <MonitorClockInOut />
        </Route>
        <Route exact path="/clocks">
          <ClockDashboard />
        </Route>
      </IonRouterOutlet>
    </IonReactRouter>
  </IonApp>
);

export default App;
