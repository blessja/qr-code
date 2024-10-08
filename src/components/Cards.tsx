import {
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonGrid,
  IonRow,
  IonCol,
  IonText,
} from "@ionic/react";
import { useHistory } from "react-router-dom"; // Use history from react-router-dom

import "./Cards.css";

const Cards = () => {
  const history = useHistory(); // Initialize useHistory

  const goToDetails = (path: string) => {
    history.push(path); // Push the desired path when the card is clicked
  };

  return (
    <IonContent>
      <IonGrid>
        {/* Piece Work Day Card */}
        <IonRow>
          <IonCol>
            <IonCard
              onClick={() => goToDetails("/piecework_1")}
              className="card-info piece-work"
            >
              <div className="overlay">
                <IonCardHeader>
                  <IonCardTitle
                    style={{
                      color: "white",
                      fontSize: "1.5rem",
                      fontWeight: "bold",
                    }}
                  >
                    Piece Work Day
                  </IonCardTitle>
                </IonCardHeader>
                <div className="info">
                  <IonText className="temp">6°</IonText>
                </div>
              </div>
            </IonCard>
          </IonCol>
        </IonRow>

        {/* Piece Work (Uitknip) Card */}
        <IonRow>
          <IonCol>
            <IonCard
              onClick={() => goToDetails("/piecework-2")}
              className="card-info piece-work-2"
            >
              <div className="overlay">
                <IonCardHeader>
                  <IonCardTitle
                    style={{
                      color: "white",
                      fontSize: "1.5rem",
                      fontWeight: "bold",
                    }}
                  >
                    Piece Work (Uitknip)
                  </IonCardTitle>
                </IonCardHeader>
                <div className="info">
                  <IonText className="temp">20°</IonText>
                </div>
              </div>
            </IonCard>
          </IonCol>
        </IonRow>

        {/* Register Card */}
        <IonRow>
          <IonCol>
            <IonCard
              onClick={() => goToDetails("/register")}
              className="card-info register"
            >
              <div className="overlay">
                <IonCardHeader>
                  <IonCardTitle
                    style={{
                      color: "white",
                      fontSize: "1.5rem",
                      fontWeight: "bold",
                    }}
                  >
                    Register
                  </IonCardTitle>
                </IonCardHeader>
                <div className="info">
                  <IonText className="temp">-13°</IonText>
                </div>
              </div>
            </IonCard>
          </IonCol>
        </IonRow>
      </IonGrid>
    </IonContent>
  );
};

export default Cards;
