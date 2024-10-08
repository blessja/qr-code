import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
} from "@ionic/react";
import ExploreContainer from "./ExploreContainer";

const PieceWork_1: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Piece Work Day</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {/* Add your component or form here */}
        <ExploreContainer />
      </IonContent>
    </IonPage>
  );
};

export default PieceWork_1;
