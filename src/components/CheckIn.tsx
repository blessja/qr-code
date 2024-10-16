import React, { useState, useEffect } from "react";
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
import {
  FormControl,
  InputLabel,
  Button,
  TextField,
  Select,
  MenuItem,
} from "@mui/material";
import Header from "./Header";
import Footer from "./Footer";
import { useHistory } from "react-router-dom";
import QRScanner from "../components/QrScanner";
import { notifySuccess, notifyError } from "../utils/notify";
import "./Checkin.css";

const CheckIn: React.FC = () => {
  const [workerName, setWorkerName] = useState("");
  const [workerID, setWorkerID] = useState("");
  const [blockName, setBlockName] = useState("");
  const [rowNumber, setRowNumber] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<string[]>([]);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  const history = useHistory();

  useEffect(() => {
    fetch("https://farm-managment-app.onrender.com/api/blocks")
      .then((response) => response.json())
      .then((data) => setBlocks(data))
      .catch((error) => {
        setAlertMessage(`Error fetching blocks: ${error.message}`);
        setShowAlert(true);
      });
  }, []);

  const handleScanSuccess = (workerData: {
    workerName: string;
    workerID: string;
  }) => {
    setWorkerName(workerData.workerName);
    setWorkerID(workerData.workerID);
  };

  const handleRowInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let input = event.target.value;
    input = input.toUpperCase(); // Capitalize letters
    setRowNumber(input);
  };

  const handleCheckIn = async () => {
    if (!workerID || !workerName || !blockName || rowNumber === null) {
      setAlertMessage("Please provide all required information.");
      setShowAlert(true);
      return notifyError("Please fill all the fields");
    }

    try {
      const response = await fetch(
        "https://farm-managment-app.onrender.com/api/checkin",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workerID, workerName, blockName, rowNumber }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        // Show the error message returned from the server
        setAlertMessage(data.message);
        setShowAlert(true);
      } else {
        // If check-in is successful
        console.log("Check-in successful:", data);
        setShowToast(true);
        setWorkerName("");
        setWorkerID("");
      }
    } catch (error) {
      setAlertMessage("An error occurred during check-in.");
      setShowAlert(true);
      setWorkerName("");
      setWorkerID("");
    }
  };

  return (
    <IonPage>
      <IonContent>
        <Header />
        <IonCard style={{ marginTop: "20px" }}>
          <IonCardHeader>
            <IonCardTitle>Check In</IonCardTitle>
            <IonCardSubtitle>
              {workerName ? (
                <p>Worker Name: {workerName}</p>
              ) : (
                <QRScanner onScanSuccess={handleScanSuccess} />
              )}
            </IonCardSubtitle>
          </IonCardHeader>

          <IonCardContent>
            <p>Please select the block number and row number</p>
          </IonCardContent>

          <FormControl
            variant="outlined"
            style={{ width: "100%", padding: "10px 20px" }}
          >
            <InputLabel
              style={{
                display: "flex",
                padding: "10px 20px",
                fontSize: "16px",
              }}
              id="block-label"
            >
              Block Name
            </InputLabel>
            <Select
              labelId="block-label"
              value={blockName}
              onChange={(e: React.ChangeEvent<{ value: unknown }>) =>
                setBlockName(e.target.value as string)
              }
              label="Block Name"
            >
              <MenuItem value="">
                <em>Select Block</em>
              </MenuItem>
              {blocks.map((block) => (
                <MenuItem key={block} value={block}>
                  {block}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl
            variant="outlined"
            disabled={!blockName}
            style={{ width: "100%", marginTop: "20px", padding: "10px 20px" }}
          >
            <TextField
              label="Row Number"
              value={rowNumber || ""}
              onChange={handleRowInputChange}
              placeholder="Enter Row (e.g., 8A, 21B)"
            />
          </FormControl>

          <IonButton
            className="btn"
            onClick={handleCheckIn}
            disabled={!blockName || !rowNumber}
          >
            Check In
          </IonButton>
        </IonCard>
        <div className="btns">
          <Button
            variant="contained"
            color="primary"
            sx={{ mr: 2, mt: 2, ml: 2 }}
            onClick={() => history.push("/piecework_1")}
          >
            Back
          </Button>

          <Button
            variant="contained"
            color="secondary"
            sx={{ mr: 2, mt: 2, ml: 2 }}
            onClick={() => history.push("/checkout")}
          >
            Checkout
          </Button>
        </div>
      </IonContent>

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
        message="Check-in successful!"
        cssClass="custom-toast"
        buttons={[
          {
            text: "OK",
            role: "cancel",
            handler: () => setShowToast(false),
          },
        ]}
      />

      <Footer />
    </IonPage>
  );
};

export default CheckIn;
