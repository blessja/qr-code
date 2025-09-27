import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useIonAlert } from "@ionic/react";
import { BarcodeScanner } from "@capacitor-mlkit/barcode-scanning";

interface BarcodeScannerProps {
  onScanSuccess: (workerData: { workerName: string; workerID: string }) => void;
}

const BarcodeScannerComponent: React.FC<BarcodeScannerProps> = ({
  onScanSuccess,
}) => {
  const [isSupported, setIsSupported] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [presentAlert] = useIonAlert();

  // Install Google Barcode Scanner Module
  const installBarcodeModule = async () => {
    try {
      await BarcodeScanner.installGoogleBarcodeScannerModule();
      console.log("Google Barcode Scanner Module installed successfully.");
    } catch (error: unknown) {
      const err = error as Error;
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
        setError("Barcode Scanner is not supported on your device.");
      } else {
        await installBarcodeModule();
      }
    };
    checkSupportAndInstall();
  }, []);

  // Permissions
  const requestPermissions = async () => {
    const { camera } = await BarcodeScanner.requestPermissions();
    return camera === "granted" || camera === "limited";
  };

  // Start scanning
  const startScanning = async () => {
    setError(null);
    const granted = await requestPermissions();
    if (!granted) {
      setError(
        "Failed to start camera. Please ensure camera permissions are granted."
      );
      return;
    }

    try {
      setScanning(true);
      const { barcodes } = await BarcodeScanner.scan();
      barcodes.forEach((barcode) => {
        try {
          const jsonData = JSON.parse(barcode.rawValue);
          if (jsonData.workerID && jsonData.workerName) {
            onScanSuccess(jsonData);
            setScanning(false);
          } else {
            throw new Error("Invalid JSON structure.");
          }
        } catch (err) {
          console.error("Error parsing JSON from QR code:", err);
          setError("Invalid QR code format");
          setScanning(false);
        }
      });
    } catch (scanErr) {
      console.error("Error during scanning:", scanErr);
      setError(
        "Failed to start camera. Please ensure camera permissions are granted."
      );
      setScanning(false);
    }
  };

  return (
    <div className="w-full">
      <motion.div
        className="rounded-lg overflow-hidden bg-gray-100 relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {!scanning ? (
          <motion.div
            className="p-6 flex flex-col items-center"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="w-48 h-48 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                />
              </svg>
            </div>
            <p className="text-gray-600 mb-4 text-center">
              Scan worker's QR code to check in
            </p>
            <motion.button
              className="bg-green-600 text-white px-6 py-2 rounded-md font-medium shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startScanning}
            >
              Start Scanner
            </motion.button>
          </motion.div>
        ) : (
          <div className="relative h-[300px] flex items-center justify-center bg-black">
            <p className="text-white">Scanning...</p>
            <motion.button
              className="absolute bottom-4 right-4 bg-white text-gray-800 px-4 py-2 rounded-md font-medium shadow-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setScanning(false)}
            >
              Cancel
            </motion.button>
          </div>
        )}
      </motion.div>

      {/* Error always visible below card */}
      {error && (
        <motion.div
          className="mt-2 text-red-500 text-sm text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {error}
        </motion.div>
      )}
    </div>
  );
};

export default BarcodeScannerComponent;
