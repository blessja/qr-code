import { BarcodeScanner } from "@capacitor-mlkit/barcode-scanning";

interface BarcodeScannerProps {
  onScanSuccess: (workerData: { workerName: string; workerID: string }) => void;
}

const BarcodeScannerComponent = {
  // Function to start scanning directly without needing a button press
  startScanning: async (
    onScanSuccess: BarcodeScannerProps["onScanSuccess"]
  ) => {
    const { camera } = await BarcodeScanner.requestPermissions();
    if (camera !== "granted") return;

    try {
      const { barcodes } = await BarcodeScanner.scan();
      barcodes.forEach((barcode) => {
        try {
          const jsonData = JSON.parse(barcode.rawValue);
          if (jsonData.workerID && jsonData.workerName) {
            onScanSuccess({
              workerID: jsonData.workerID,
              workerName: jsonData.workerName,
            });
          } else {
            throw new Error("Invalid JSON structure.");
          }
        } catch (error) {
          console.error("Error parsing JSON from QR code:", error);
        }
      });
    } catch (error) {
      console.error("Error during scanning:", error);
    }
  },
};

export default BarcodeScannerComponent;
