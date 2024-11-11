import React, { useState, useEffect } from "react";

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
import QRScanner from "./QrScanner";
import beepSound from "../assets/sounds/scan-beep.mp3";

const successSound = new Audio(beepSound);

const CheckOut: React.FC = () => {
  const [workerID, setWorkerID] = useState("");
  const [workerName, setWorkerName] = useState("");
  const [jobType, setJobType] = useState("");
  const [blockName, setBlockName] = useState("");
  const [rowNumber, setRowNumber] = useState<string | null>(null);
  const [stockCount, setStockCount] = useState<number | null>(null);
  const [blocks, setBlocks] = useState<string[]>([]);
  const [rows, setRows] = useState<string[]>([]);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    fetch(
      "https://farm-backend-fpbmfrgferdjdtah.southafricanorth-01.azurewebsites.net/api/blocks"
    )
      .then((response) => response.json())
      .then((data) => {
        setBlocks(data);
        console.log("Fetched blocks:", data);
      })
      .catch((error) => console.error("Error fetching blocks:", error));
  }, []);

  useEffect(() => {
    if (blockName) {
      fetch(
        `https://farm-backend-fpbmfrgferdjdtah.southafricanorth-01.azurewebsites.net/api/block/${blockName}/rows`
      )
        .then((response) => response.json())
        .then((data) => {
          setRows(data);
          console.log("Fetched rows for block", blockName, ":", data);
        })
        .catch((error) => console.error("Error fetching rows:", error));
    }
  }, [blockName]);

  const handleScanSuccess = async (workerData: {
    workerName: string;
    workerID: string;
  }) => {
    try {
      setWorkerName(workerData.workerName);
      setWorkerID(workerData.workerID);
      playSuccessSound();

      console.log("Worker data parsed and set:", workerData);

      // Fetch the check-in details to prefill blockName, rowNumber, jobType, and stockCount
      const response = await fetch(
        `https://farm-backend-fpbmfrgferdjdtah.southafricanorth-01.azurewebsites.net/api/worker/${workerData.workerID}/current-checkin`
      );

      if (response.ok) {
        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {
          const checkinData = data[0]; // Access the first object in the array

          // Set jobType using the correct key from the response
          if (checkinData.job_type) {
            setJobType(checkinData.job_type);
            console.log("Fetched jobType:", checkinData.job_type);
          }

          // Set other data
          if (checkinData.blockName) {
            setBlockName(checkinData.blockName);
            console.log("Fetched blockName:", checkinData.blockName);
          }

          if (checkinData.rowNumber) {
            setRowNumber(checkinData.rowNumber);
            console.log("Fetched rowNumber:", checkinData.rowNumber);
          }

          if (checkinData.stockCount) {
            setStockCount(checkinData.stockCount);
            console.log("Fetched stockCount:", checkinData.stockCount);
          }
        }
      } else {
        console.error("Error fetching check-in details:", response.statusText);
      }
    } catch (error) {
      console.error("Error during handleScanSuccess:", error);
    }
  };

  const playSuccessSound = () => {
    successSound.play().catch((error) => {
      console.error("Sound playback error:", error);
    });
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
      jobType,
    });

    if (!workerID || !blockName || rowNumber === null) {
      setAlertMessage("Please provide all required information.");
      setShowAlert(true);
      return;
    }

    // Use the remaining stocks if stockCount is not provided
    const finalStockCount =
      stockCount ?? (await getRemainingStocks(workerID, rowNumber));

    if (isNaN(finalStockCount)) {
      setAlertMessage("Invalid stock count.");
      setShowAlert(true);
      return;
    }

    try {
      const response = await fetch(
        "https://farm-backend-fpbmfrgferdjdtah.southafricanorth-01.azurewebsites.net/api/checkout",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workerID,
            workerName,
            blockName,
            rowNumber,
            stockCount: finalStockCount,
            jobType,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Check-out successful:", data);
        setShowToast(true);
        // Reset state after successful checkout
        setWorkerID("");
        setWorkerName("");
        setBlockName("");
        setRowNumber(null);
        setStockCount(null);
        setJobType("");
      } else {
        const errorData = await response.json();
        console.error(
          "Checkout error response:",
          JSON.stringify(errorData, null, 2)
        );

        setAlertMessage(`Check-out failed: ${errorData.message}`);
        setShowAlert(true);
      }
    } catch (error) {
      console.error("Error during checkout:", error);
      setAlertMessage("An error occurred during check-out.");
      setShowAlert(true);
    }
  };

  // Helper function to get remaining stocks if stockCount is not entered
  const getRemainingStocks = async (
    workerID: string,
    rowNumber: string
  ): Promise<number> => {
    try {
      const response = await fetch(
        `https://farm-backend-fpbmfrgferdjdtah.southafricanorth-01.azurewebsites.net/api/worker/${workerID}/row/${rowNumber}/remaining-stocks`
      );
      if (response.ok) {
        const data = await response.json();
        console.log("Fetched remaining stocks:", data.remainingStocks);
        return data.remainingStocks; // Return the remaining stocks
      } else {
        throw new Error("Failed to fetch remaining stocks");
      }
    } catch (error) {
      console.error(error);
      return 0; // Default to 0 if there's an issue fetching the data
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
            style={{ width: "100%", marginTop: "20px", padding: "10px 20px" }}
          >
            <InputLabel
              style={{
                display: "flex",
                padding: "10px 20px",
                fontSize: "16px",
              }}
              id="jobTypeInput"
            >
              Job Name
            </InputLabel>
            <Input
              // labelId="Job Name"
              value={jobType || ""} // Ensure this reflects the fetched job type
              onChange={(e) => {
                setJobType(e.target.value);
                console.log("job selected:", e.target.value);
              }}
              // label="Job Name"
            ></Input>
          </FormControl>

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
              value={blockName} // This should correctly reflect the fetched blockName
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
              value={rowNumber || ""} // Ensure this reflects the fetched rowNumber
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
              value={stockCount || ""} // This should correctly reflect the fetched stockCount
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
        <div className="btns">
          <Button
            variant="contained"
            color="primary"
            sx={{ mr: 2, ml: 2 }}
            onClick={() => history.push("/piecework_1")}
          >
            Back
          </Button>
          <Button
            variant="contained"
            color="secondary"
            sx={{ mr: 2, ml: 2 }}
            onClick={() => history.push("/checkin")}
          >
            Check-in
          </Button>
        </div>
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
          cssClass="custom-toast"
          buttons={[
            {
              text: "OK",
              role: "cancel",
              handler: () => setShowToast(false),
            },
          ]}
        />
      </IonContent>
      <Footer />
    </IonPage>
  );
};

export default CheckOut;
