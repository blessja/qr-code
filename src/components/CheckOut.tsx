import React, { useState, useEffect } from "react";
import { BarcodeScanner } from "@capacitor-community/barcode-scanner";
import Header from "./Header";
import Footer from "./Footer";
import { useHistory } from "react-router-dom";
import {
  IonContent,
  IonPage,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonButton,
  IonAlert,
  IonToast,
} from "@ionic/react";
import {
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Input,
} from "@mui/material";
import QRScanner from "../components/QrScanner";

const CheckOut: React.FC = () => {
  const [workerID, setWorkerID] = useState("");
  const [workerName, setWorkerName] = useState("");
  const [blockName, setBlockName] = useState("");
  const [rowNumber, setRowNumber] = useState<string | null>(null);
  const [stockCount, setStockCount] = useState<number | null>(null);
  const [blocks, setBlocks] = useState<string[]>([]);
  const [rows, setRows] = useState<string[]>([]);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    fetch("https://farm-managment-app.onrender.com/api/blocks")
      .then((response) => response.json())
      .then((data) => {
        setBlocks(data);
      })
      .catch((error) => console.error("Error fetching blocks:", error));
  }, []);

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
    }
  }, [blockName]);

  const handleScanSuccess = (workerData: {
    workerName: string;
    workerID: string;
  }) => {
    setWorkerName(workerData.workerName);
    setWorkerID(workerData.workerID);
    console.log("Worker data parsed and set:", workerData); // Check if workerData is valid
  };
  const handleScanFailure = (error: string) => {
    console.error("Error parsing QR code:", error);
  };

  const handleCheckOut = async () => {
    console.log("Handling checkout...");
    console.log("Data being sent:", {
      workerID,
      workerName,
      blockName,
      rowNumber,
      stockCount,
    });

    if (!workerID || !blockName || rowNumber === null) {
      setAlertMessage("Please provide all required information.");
      setShowAlert(true);
      return;
    }

    try {
      const response = await fetch(
        "https://farm-managment-app.onrender.com/api/checkout",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workerID,
            workerName, // Add this to match the Postman request
            blockName,
            rowNumber,
            stockCount,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Check-out successful:", data);
        setShowToast(true);
        setWorkerID("");
        setWorkerName("");
        setBlockName("");
        setRowNumber(null);
        setStockCount(null);
      } else {
        const errorData = await response.json();
        console.error("Checkout error response:", errorData);
        setAlertMessage(`Check-out failed: ${errorData.message}`);
        setShowAlert(true);
      }
    } catch (error) {
      console.error("Error during checkout:", error);
      setAlertMessage("An error occurred during check-out.");
      setShowAlert(true);
    }
  };

  const history = useHistory();
  return (
    <IonPage>
      <IonContent>
        <Header />
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Check Out</IonCardTitle>
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
              onChange={(e) => {
                setBlockName(e.target.value);
                console.log("Block selected:", e.target.value);
              }}
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
              onChange={(e) => {
                setRowNumber(e.target.value);
                console.log("Row selected:", e.target.value);
              }}
              label="Row Number"
            >
              <MenuItem value="">
                <em>Select Row</em>
              </MenuItem>
              {rows.map((row) => (
                <MenuItem key={row} value={row}>
                  {row}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl
            variant="outlined"
            style={{ width: "100%", marginTop: "20px", padding: "10px 20px" }}
          >
            <InputLabel
              style={{
                display: "flex",
                padding: "10px 20px",
                fontSize: "16px",
              }}
              htmlFor="stock-count"
            >
              Stock Count (Optional)
            </InputLabel>
            <Input
              id="stock-count"
              value={stockCount || ""}
              onChange={(e) => {
                const value = e.target.value ? parseInt(e.target.value) : null;
                setStockCount(value);
                console.log("Stock count entered:", value);
              }}
              type="number"
              placeholder="Enter stock count"
            />
          </FormControl>

          <IonButton
            className="btn"
            onClick={handleCheckOut}
            disabled={!blockName || !rowNumber}
          >
            Check Out
          </IonButton>
        </IonCard>
        <Button
          variant="contained"
          color="primary"
          sx={{ mr: 2, mt: 2, ml: 2 }}
          onClick={() => history.push("/piecework_1")}
        >
          Back
        </Button>
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
          message="Check-out successful!"
          duration={2000}
        />
      </IonContent>
      <Footer />
    </IonPage>
  );
};

export default CheckOut;
