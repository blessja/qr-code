import React, { useEffect, useState } from "react";
import { IonButton, useIonAlert } from "@ionic/react";
import { BarcodeScanner } from "@capacitor-mlkit/barcode-scanning";

interface BarcodeScannerProps {
  onScanSuccess: (workerData: { workerName: string; workerID: string }) => void;
}

const BarcodeScannerComponent: React.FC<BarcodeScannerProps> = ({
  onScanSuccess,
}) => {
  const [isSupported, setIsSupported] = useState(false);
  const [presentAlert] = useIonAlert();

  useEffect(() => {
    const checkSupport = async () => {
      const result = await BarcodeScanner.isSupported();
      setIsSupported(result.supported);
      if (!result.supported) {
        presentAlert({
          header: "Error",
          message: "Sorry, Barcode Scanner is not supported on your device.",
          buttons: ["OK"],
        });
      }
    };
    checkSupport();
  }, [presentAlert]);

  // Function to request camera permissions
  const requestPermissions = async () => {
    const { camera } = await BarcodeScanner.requestPermissions();
    return camera === "granted" || camera === "limited";
  };

  // Function to start scanning
  const startScanning = async () => {
    const granted = await requestPermissions();
    if (!granted) {
      presentAlert({
        header: "Permission denied",
        message: "Please grant camera permission to use the barcode scanner.",
        buttons: ["OK"],
      });
      return;
    }

    try {
      const { barcodes } = await BarcodeScanner.scan();

      // Attempt to parse the barcode content as JSON
      barcodes.forEach((barcode) => {
        try {
          const jsonData = JSON.parse(barcode.rawValue);
          console.log("Parsed JSON Data:", jsonData);

          // Handle the JSON data (for example, worker details)
          if (jsonData.workerID && jsonData.workerName) {
            // Call the onScanSuccess prop to pass worker data back to the parent
            onScanSuccess({
              workerID: jsonData.workerID,
              workerName: jsonData.workerName,
            });
            presentAlert({
              header: "Scanned QR Code",
              message: `Worker ID: ${jsonData.workerID}, Worker Name: ${jsonData.workerName}`,
              buttons: ["OK"],
            });
          } else {
            throw new Error("Invalid JSON structure.");
          }
        } catch (error) {
          console.error("Error parsing JSON from QR code:", error);
          presentAlert({
            header: "Error",
            message: "The scanned QR code does not contain valid JSON data.",
            buttons: ["OK"],
          });
        }
      });
    } catch (error) {
      console.error("Error during scanning:", error);
      presentAlert({
        header: "Error",
        message: "An error occurred during the scanning process.",
        buttons: ["OK"],
      });
    }
  };

  return (
    <>
      <IonButton onClick={startScanning}>Scan Worker QR Code</IonButton>
    </>
  );
};

export default BarcodeScannerComponent;
