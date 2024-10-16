import React, { useEffect } from "react";
import { IonContent, IonPage } from "@ionic/react";
import { App as CapacitorApp } from "@capacitor/app";
import { isPlatform } from "@ionic/react";
import { useIonRouter } from "@ionic/react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Cards from "../components/Cards";

const Home: React.FC = () => {
  const router = useIonRouter();

  useEffect(() => {
    let listener: any;

    const setupBackButtonListener = async () => {
      if (isPlatform("android")) {
        listener = await CapacitorApp.addListener("backButton", () => {
          if (router.canGoBack()) {
            router.goBack(); // Go to the previous page
          } else {
            CapacitorApp.exitApp(); // Exit the app if on the last screen
          }
        });
      }
    };

    setupBackButtonListener();

    // Cleanup listener when component unmounts
    return () => {
      if (listener) {
        listener.remove();
      }
    };
  }, [router]);

  return (
    <IonPage>
      <IonContent>
        <Header />
        <Cards />
        <Footer />
      </IonContent>
    </IonPage>
  );
};

export default Home;
