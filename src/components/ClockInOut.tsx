import React, { useState } from "react";
import {
  IonButton,
  IonCard,
  IonContent,
  IonPage,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonAlert,
  IonToast,
} from "@ionic/react";
import QRScanner from "./QrScanner";
import { notifySuccess, notifyError } from "../utils/notify";
import "./ClockInOut.css";

const ClockInOut: React.FC = () => {
  const [workerName, setWorkerName] = useState("");
  const [workerID, setWorkerID] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [isClockedIn, setIsClockedIn] = useState(false);

  const handleScanSuccess = (workerData: {
    workerName: string;
    workerID: string;
  }) => {
    setWorkerName(workerData.workerName);
    setWorkerID(workerData.workerID);
  };

  const handleClockInOut = async () => {
    if (!workerID || !workerName) {
      setAlertMessage("Please scan the worker QR code.");
      setShowAlert(true);
      return notifyError("Please scan the worker QR code.");
    }

    try {
      const url = isClockedIn
        ? "https://farm-managment-app.onrender.com/api/clockin"
        : "https://farm-managment-app.onrender.com/api/clockout";

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerID, workerName }),
      });

      const data = await response.json();

      if (!response.ok) {
        setAlertMessage(data.message);
        setShowAlert(true);
      } else {
        notifySuccess(data.message);
        setShowToast(true);
        setWorkerName("");
        setWorkerID("");
        setIsClockedIn(!isClockedIn); // Toggle clock-in/out state
      }
    } catch (error) {
      setAlertMessage("An error occurred during clock-in/out.");
      setShowAlert(true);
    }
  };

  return (
    <IonPage>
      <IonContent>
        <IonCard style={{ marginTop: "20px" }}>
          <IonCardHeader>
            <IonCardTitle>
              {isClockedIn ? "Clock Out" : "Clock In"}
            </IonCardTitle>
            <IonCardSubtitle>
              {workerName ? (
                <p>Worker Name: {workerName}</p>
              ) : (
                <QRScanner onScanSuccess={handleScanSuccess} />
              )}
            </IonCardSubtitle>
          </IonCardHeader>

          <IonCardContent>
            <IonButton onClick={handleClockInOut}>
              {isClockedIn ? "Clock Out" : "Clock In"}
            </IonButton>
          </IonCardContent>
        </IonCard>

        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header={"Alert"}
          message={alertMessage}
          buttons={["OK"]}
        />

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={
            isClockedIn
              ? "Clocked out successfully!"
              : "Clocked in successfully!"
          }
          duration={2000}
        />
      </IonContent>
    </IonPage>
  );
};

export default ClockInOut;
