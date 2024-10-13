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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
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
  const [rows, setRows] = useState<string[]>([]);
  const [checkedInRows, setCheckedInRows] = useState<string[]>([]); // Track checked-in rows
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  const history = useHistory();

  // Fetch block names when component mounts
  useEffect(() => {
    fetch("https://farm-managment-app.onrender.com/api/blocks")
      .then((response) => response.json())
      .then((data) => setBlocks(data))
      .catch((error) => {
        setAlertMessage(`Error fetching blocks: ${error.message}`);
        setShowAlert(true);
      });
  }, []);

  // Fetch rows for the selected block and also get currently checked-in rows
  useEffect(() => {
    if (blockName) {
      fetch(
        `https://farm-managment-app.onrender.com/api/block/${blockName}/rows`
      )
        .then((response) => response.json())
        .then((data) => {
          setRows(data);
        })
        .catch((error) => console.error("Error fetching rows:", error));

      // Fetch checked-in rows for the selected block
      fetch(
        `https://farm-managment-app.onrender.com/api/block/${blockName}/checked-in-rows`
      )
        .then((response) => response.json())
        .then((checkedInData) => {
          setCheckedInRows(checkedInData);
        })
        .catch((error) =>
          console.error("Error fetching checked-in rows:", error)
        );
    }
  }, [blockName]);

  // Function to handle successful scan
  const handleScanSuccess = (workerData: {
    workerName: string;
    workerID: string;
  }) => {
    setWorkerName(workerData.workerName);
    setWorkerID(workerData.workerID);
  };

  // Filter out rows that are currently checked in
  const availableRows = rows.filter((row) => !checkedInRows.includes(row));

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

      if (response.ok) {
        const data = await response.json();
        console.log("Check-in successful:", data);
        setShowToast(true);
        setCheckedInRows((prev) => [...prev, rowNumber]); // Add row to checked-in rows
        setWorkerName("");
        setWorkerID("");
        setRowNumber(null);
      } else {
        const errorData = await response.json();
        setAlertMessage(`Check-in failed: ${errorData.message}`);
        setShowAlert(true);
      }
    } catch (error) {
      setAlertMessage("An error occurred during check-in.");
      setShowAlert(true);
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

          {/* Block Dropdown */}
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
              onChange={(e) => setBlockName(e.target.value)}
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

          {/* Row Dropdown */}
          <FormControl
            variant="outlined"
            disabled={!blockName}
            style={{ width: "100%", marginTop: "20px", padding: "10px 20px" }}
          >
            <InputLabel
              style={{
                display: "flex",
                padding: "10px 20px",
                fontSize: "16px",
              }}
              id="row-label"
            >
              Row Number
            </InputLabel>
            <Select
              labelId="row-label"
              value={rowNumber || ""}
              onChange={(e) => setRowNumber(e.target.value)}
              label="Row Number"
            >
              <MenuItem value="">
                <em>Select Row</em>
              </MenuItem>
              {availableRows.map((row) => (
                <MenuItem key={row} value={row}>
                  {row}
                </MenuItem>
              ))}
            </Select>
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
            checkout
          </Button>
        </div>
      </IonContent>

      {/* IonAlert for Error Messages */}
      <IonAlert
        isOpen={showAlert}
        onDidDismiss={() => setShowAlert(false)}
        header={"Alert"}
        message={alertMessage}
        buttons={["OK"]}
      />

      {/* IonToast for Success Messages */}
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message="Check-in successful!"
        duration={2000}
      />
      <Footer />
    </IonPage>
  );
};

export default CheckIn;
