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

  // Function to install Google Barcode Scanner module, ignoring the error if it's already installed
  const installBarcodeModule = async () => {
    try {
      await BarcodeScanner.installGoogleBarcodeScannerModule();
      console.log("Google Barcode Scanner Module installed successfully.");
    } catch (error: unknown) {
      const err = error as Error; // Assert the error as a known type
      if (err.message.includes("already installed")) {
        console.log("Google Barcode Scanner Module is already installed.");
      } else {
        console.error("Error installing Google Barcode Scanner Module:", err);
      }
    }
  };

  useEffect(() => {
    const checkSupportAndInstall = async () => {
      const result = await BarcodeScanner.isSupported();
      setIsSupported(result.supported);
      if (!result.supported) {
        presentAlert({
          header: "Error",
          message: "Sorry, Barcode Scanner is not supported on your device.",
          buttons: ["OK"],
        });
      } else {
        // Attempt to install the module
        await installBarcodeModule();
      }
    };
    checkSupportAndInstall();
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
      barcodes.forEach((barcode) => {
        try {
          const jsonData = JSON.parse(barcode.rawValue);
          console.log("Parsed JSON Data:", jsonData);

          if (jsonData.workerID && jsonData.workerName) {
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
        } catch (error: unknown) {
          const err = error as Error; // Assert the error type here as well
          console.error("Error parsing JSON from QR code:", err);
          presentAlert({
            header: "Error",
            message: "The scanned QR code does not contain valid JSON data.",
            buttons: ["OK"],
          });
        }
      });
    } catch (scanError: unknown) {
      const err = scanError as Error; // Assert scanError type here
      console.error("Error during scanning:", err);
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
