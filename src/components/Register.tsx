import React, { useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonAlert,
  IonToast,
} from "@ionic/react";
import QRScanner from "../components/QrScanner";
import { notifySuccess, notifyError } from "../utils/notify";
import { useHistory } from "react-router-dom";
import "./ClockInOut.css"; // If needed for styling

// Ensure the path to the sound file is correct
const successSound = new Audio("/assets/sounds/scan-beep.mp3");

const Register: React.FC = () => {
  const [workerName, setWorkerName] = useState("");
  const [workerID, setWorkerID] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const handleScanSuccess = (workerData: {
    workerName: string;
    workerID: string;
  }) => {
    setWorkerName(workerData.workerName);
    setWorkerID(workerData.workerID);
  };

  const playSuccessSound = () => {
    successSound.play().catch((error) => {
      console.error("Sound playback error:", error);
    });
  };

  const handleClockIn = async () => {
    if (!workerID || !workerName) {
      setAlertMessage("Please scan the worker QR code.");
      setShowAlert(true);
      return notifyError("Please scan the worker QR code.");
    }

    try {
      const response = await fetch(
        "https://farm-managment-app.onrender.com/api/clockin",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workerID, workerName }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setAlertMessage(data.message);
        setShowAlert(true);
      } else {
        notifySuccess(data.message);
        setToastMessage("Clocked in successfully!");
        setShowToast(true);
        playSuccessSound(); // Play sound on success
        // Reset for next worker immediately after success
        setWorkerName("");
        setWorkerID("");
      }
    } catch (error) {
      setAlertMessage("An error occurred during clock-in.");
      setShowAlert(true);
    }
  };

  const handleClockOut = async () => {
    if (!workerID || !workerName) {
      setAlertMessage("Please scan the worker QR code.");
      setShowAlert(true);
      return notifyError("Please scan the worker QR code.");
    }

    try {
      const response = await fetch(
        "https://farm-managment-app.onrender.com/api/clockout",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workerID, workerName }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setAlertMessage(data.message);
        setShowAlert(true);
      } else {
        notifySuccess(data.message);
        setToastMessage("Clocked out successfully!");
        setShowToast(true);
        playSuccessSound(); // Play sound on success
        // Optionally reset for next worker if needed
        setWorkerName("");
        setWorkerID("");
      }
    } catch (error) {
      setAlertMessage("An error occurred during clock-out.");
      setShowAlert(true);
    }
  };
  const history = useHistory();
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Register</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonCard style={{ marginTop: "20px" }}>
          <IonCardHeader>
            <IonCardTitle>Clock In / Clock Out</IonCardTitle>
            <IonCardSubtitle>
              {workerName ? (
                <p>Worker Name: {workerName}</p>
              ) : (
                <QRScanner onScanSuccess={handleScanSuccess} />
              )}
            </IonCardSubtitle>
          </IonCardHeader>

          <IonCardContent
            className="btns"
            style={{ display: "flex", justifyContent: "space-between" }}
          >
            <IonButton onClick={handleClockIn}>Clock In</IonButton>
            <IonButton onClick={handleClockOut} color="danger">
              Clock Out
            </IonButton>
          </IonCardContent>
        </IonCard>
        <IonCard
          style={{
            marginTop: "50px",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <IonButton onClick={() => history.push("/clocks")}>Clocks</IonButton>
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
          message={toastMessage}
          duration={2000}
          cssClass="custom-toast"
        />
      </IonContent>
    </IonPage>
  );
};

export default Register;
