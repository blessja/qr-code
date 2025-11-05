import React, { useEffect, useState } from "react";
import { IonContent, IonPage, IonToast } from "@ionic/react";
import { App as CapacitorApp } from "@capacitor/app";
import { isPlatform } from "@ionic/react";
import { useIonRouter } from "@ionic/react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Cards from "../components/Cards";
import LandingPage from "./LandingPage";

const Home: React.FC = () => {
  const router = useIonRouter();
  const [showExitToast, setShowExitToast] = useState(false);
  const [lastBackPress, setLastBackPress] = useState(0);

  useEffect(() => {
    let listener: any;
    const setupBackButtonListener = async () => {
      if (isPlatform("android")) {
        listener = await CapacitorApp.addListener(
          "backButton",
          ({ canGoBack }) => {
            const currentPath = window.location.pathname;

            // Define key pages that should have exit confirmation
            const keyPages = ["/home", "/dashboard", "/"];

            if (keyPages.includes(currentPath)) {
              // If on key pages, show exit confirmation
              const currentTime = new Date().getTime();
              const timeDiff = currentTime - lastBackPress;

              if (timeDiff < 2000) {
                // If back pressed twice within 2 seconds, exit
                CapacitorApp.exitApp();
              } else {
                // Show toast and record time
                setLastBackPress(currentTime);
                setShowExitToast(true);
              }
            } else if (canGoBack) {
              // For other pages, go back normally
              router.goBack();
            } else {
              // If can't go back, go to home
              router.push("/home", "back");
            }
          }
        );
      }
    };
    setupBackButtonListener();

    return () => {
      if (listener) {
        listener.remove();
      }
    };
  }, [router, lastBackPress]);

  return (
    <IonPage>
      <IonContent>
        <Header />
        <LandingPage />
        <Footer />

        <IonToast
          isOpen={showExitToast}
          onDidDismiss={() => setShowExitToast(false)}
          message="Press back again to exit"
          duration={2000}
          position="bottom"
          color="dark"
        />
      </IonContent>
    </IonPage>
  );
};

export default Home;
