import React, { useEffect } from "react";
import { IonContent, IonPage } from "@ionic/react";
import { App } from "@capacitor/app";
import { isPlatform } from "@ionic/react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ExploreContainer from "../components/ExploreContainer";
import Cards from "../components/Cards";

const Home: React.FC = () => {
  useEffect(() => {
    let listener: any;

    const setupBackButtonListener = async () => {
      if (isPlatform("android")) {
        listener = await App.addListener("backButton", () => {
          App.exitApp(); // Exits the app
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
  }, []);

  return (
    <IonPage>
      <IonContent>
        <Header />
        <Cards />
        {/* <ExploreContainer /> */}
        <Footer />
      </IonContent>
    </IonPage>
  );
};

export default Home;
