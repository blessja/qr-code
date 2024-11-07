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
import "./ClockInOut.css";
import Footer from "./Footer";
import beepSound from "../assets/sounds/scan-beep.mp3";
import config from "../config"; // Import your config file

const successSound = new Audio(beepSound);

const Register: React.FC = () => {
  const [workerName, setWorkerName] = useState("");
  const [workerID, setWorkerID] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [actionType, setActionType] = useState<"clockin" | "clockout" | "">("");

  const history = useHistory();

  const handleScanSuccess = (workerData: {
    workerName: string;
    workerID: string;
  }) => {
    setWorkerName(workerData.workerName);
    setWorkerID(workerData.workerID);
    playSuccessSound();
    executeAction(workerData);
  };

  const playSuccessSound = () => {
    successSound.play().catch((error) => {
      console.error("Sound playback error:", error);
    });
  };

  successSound.addEventListener("canplaythrough", () => {
    console.log("Audio file loaded successfully.");
  });

  successSound.addEventListener("error", (e) => {
    console.error("Error loading audio file:", e);
  });

  const executeAction = async (workerData: {
    workerName: string;
    workerID: string;
  }) => {
    if (!workerData.workerID || !workerData.workerName) {
      setAlertMessage("Please scan the worker QR code.");
      setShowAlert(true);
      return notifyError("Please scan the worker QR code.");
    }

    try {
      const url =
        actionType === "clockin"
          ? `${config.apiBaseUrl}/clockin`
          : `${config.apiBaseUrl}/clockout`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workerID: workerData.workerID,
          workerName: workerData.workerName,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setToastMessage(result.message || "Action completed successfully.");
        setShowToast(true);
        notifySuccess(result.message || "Action completed successfully.");
        // Clear the worker details for the next scan
        clearWorkerDetails();
      } else {
        setAlertMessage(result.message || "An error occurred.");
        setShowAlert(true);
        notifyError(result.message || "An error occurred.");
        // Optionally clear details on error
        clearWorkerDetails();
      }
    } catch (error) {
      console.error("Error during action execution:", error);
      setAlertMessage("A server error occurred. Please try again.");
      setShowAlert(true);
      notifyError("A server error occurred. Please try again.");
      // Clear the worker details for the next scan
      clearWorkerDetails();
    }
  };

  // Helper function to clear worker details
  const clearWorkerDetails = () => {
    setWorkerName("");
    setWorkerID("");
  };

  const startScan = (type: "clockin" | "clockout") => {
    setActionType(type);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Register</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            flexDirection: "column",
            height: "100vh",
          }}
        >
          <div>
            <IonCard style={{ marginTop: "20px" }}>
              <IonCardHeader>
                <IonCardTitle>Clock In / Clock Out</IonCardTitle>
                <IonCardSubtitle>
                  {workerName ? (
                    <p>Worker Name: {workerName}</p>
                  ) : (
                    actionType && (
                      <QRScanner onScanSuccess={handleScanSuccess} />
                    )
                  )}
                </IonCardSubtitle>
              </IonCardHeader>

              <IonCardContent
                className="btns"
                style={{ display: "flex", justifyContent: "space-between" }}
              >
                <IonButton onClick={() => startScan("clockin")}>
                  Clock In
                </IonButton>
                <IonButton onClick={() => startScan("clockout")} color="danger">
                  Clock Out
                </IonButton>
              </IonCardContent>
            </IonCard>
          </div>
          <div style={{ marginBottom: "50px" }}>
            <IonCard
              style={{
                marginTop: "50px",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <IonButton onClick={() => history.push("/clocks")}>
                Clock Logs
              </IonButton>
              <IonButton
                color={"danger"}
                onClick={() => history.push("/monitor-clockins")}
              >
                Clock Monitor
              </IonButton>
            </IonCard>
          </div>
        </div>

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
        <Footer />
      </IonContent>
    </IonPage>
  );
};

export default Register;
