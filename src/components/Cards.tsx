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
import { IonIcon } from "@ionic/react";
import { checkmarkCircleOutline } from "ionicons/icons";
import { useHistory } from "react-router-dom"; // Use history from react-router-dom

import "./Cards.css";

const Cards = () => {
  const history = useHistory(); // Initialize useHistory

  const goToDetails = (path: string) => {
    history.push(path); // Push the desired path when the card is clicked
  };

  const currentDateTime = new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: undefined, // Exclude seconds
  });

  return (
    <IonContent style={{ marginTop: "40px" }}>
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
                    Work Day
                  </IonCardTitle>
                </IonCardHeader>
                <div className="info">
                  <IonText className="temp">
                    {" "}
                    <IonIcon icon={checkmarkCircleOutline} />
                  </IonText>
                </div>
                <IonText className="small-text">{currentDateTime}</IonText>
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
                  <IonText className="temp">
                    <IonIcon icon={checkmarkCircleOutline} />
                  </IonText>
                </div>
                <IonText className="small-text">{currentDateTime}</IonText>
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
                    Clock In / Out
                  </IonCardTitle>
                </IonCardHeader>
                <div className="info">
                  <IonText className="temp">
                    <IonIcon icon={checkmarkCircleOutline} />
                  </IonText>
                </div>
                <IonText className="small-text">{currentDateTime}</IonText>
              </div>
            </IonCard>
          </IonCol>
        </IonRow>
      </IonGrid>
    </IonContent>
  );
};

export default Cards;
