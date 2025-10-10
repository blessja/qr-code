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
import { useHistory, useLocation } from "react-router-dom";
import QRScanner from "../components/QrScanner";
import { notifySuccess, notifyError } from "../utils/notify";
import { SelectChangeEvent } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircleIcon, ChevronDownIcon, AlertCircle } from "lucide-react";
import "./Checkin.css";
import beepSound from "../assets/sounds/scan-beep.mp3";

const successSound = new Audio(beepSound);

const apiBaseUrl =
  "https://farm-backend-fpbmfrgferdjdtah.southafricanorth-01.azurewebsites.net/api";

const JOB_TYPES = [
  "PRUNING",
  "SUIER",
  "ANCHOR & TOP BUNCH",
  "LEAF PICKING",
  "OTHER",
];

const CheckIn: React.FC = () => {
  const [workerName, setWorkerName] = useState("");
  const [workerID, setWorkerID] = useState("");
  const [jobType, setJobType] = useState("");
  const [customJobType, setCustomJobType] = useState("");
  const [blockName, setBlockName] = useState("");
  const [rowNumber, setRowNumber] = useState<string | null>(null);
  const [rowDirection, setRowDirection] = useState<"ascending" | "descending">(
    "ascending"
  );
  const [blocks, setBlocks] = useState<string[]>([]);
  const [isBlockDropdownOpen, setIsBlockDropdownOpen] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formStep, setFormStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const history = useHistory();
  const location = useLocation();

  useEffect(() => {
    resetForm();
  }, [location.pathname]);

  useEffect(() => {
    fetch(apiBaseUrl + "/blocks")
      .then((response) => response.json())
      .then((data) => setBlocks(data))
      .catch((error) => {
        setAlertMessage(`Error fetching blocks: ${error.message}`);
        setShowAlert(true);
      });
  }, []);

  const resetForm = () => {
    setWorkerName("");
    setWorkerID("");
    setFormStep(0);
    setIsBlockDropdownOpen(false);
    setIsLoading(false);
    setErrorMessage("");
  };

  // Bidirectional auto-increment
  const autoIncrementRow = (
    currentRow: string,
    direction: "ascending" | "descending"
  ): string => {
    if (!currentRow) return "";

    const match = currentRow.match(/^(\d+)([A-Z])$/);
    if (!match) return currentRow;

    const [, number, letter] = match;
    const num = parseInt(number);
    const letterCode = letter.charCodeAt(0);

    if (direction === "ascending") {
      // Forward: 1A -> 1B -> 2A -> 2B
      if (letter === "A") {
        return `${num}B`;
      } else if (letter === "B") {
        return `${num + 1}A`;
      }
      return `${num}${String.fromCharCode(letterCode + 1)}`;
    } else {
      // Reverse: 50B -> 50A -> 49B -> 49A
      if (letter === "B") {
        return `${num}A`;
      } else if (letter === "A" && num > 1) {
        return `${num - 1}B`;
      }
      // If at 1A, stay at 1A (can't go lower)
      return currentRow;
    }
  };

  const resetOnlyWorker = () => {
    setWorkerName("");
    setWorkerID("");
    setErrorMessage("");

    if (rowNumber) {
      const nextRow = autoIncrementRow(rowNumber, rowDirection);
      setRowNumber(nextRow);
    }

    setFormStep(0);
    setIsLoading(false);
  };

  const handleScanSuccess = (workerData: {
    workerName: string;
    workerID: string;
  }) => {
    setWorkerName(workerData.workerName);
    setWorkerID(workerData.workerID);
    setErrorMessage("");
    playSuccessSound();
    setFormStep(1);
  };

  const handleRowInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let input = event.target.value;
    input = input.toUpperCase();
    setRowNumber(input);
    setErrorMessage("");
  };

  const playSuccessSound = () => {
    successSound.play().catch((error) => {
      console.error("Sound playback error:", error);
    });
  };

  const handleJobTypeChange = (event: SelectChangeEvent) => {
    const value = event.target.value;
    setJobType(value);
    setErrorMessage("");

    // Clear custom job type when switching away from OTHER
    if (value !== "OTHER") {
      setCustomJobType("");
    }
  };

  const handleCustomJobTypeChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    let input = event.target.value;
    input = input.toUpperCase();
    setCustomJobType(input);
    setErrorMessage("");
  };

  const getEffectiveJobType = () => {
    return jobType === "OTHER" ? customJobType : jobType;
  };

  const handleCheckIn = async () => {
    const effectiveJobType = getEffectiveJobType();

    if (
      !workerID ||
      !workerName ||
      !blockName ||
      !rowNumber ||
      !effectiveJobType
    ) {
      setErrorMessage("Please provide all required information.");
      notifyError("Please fill all the fields");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch(apiBaseUrl + "/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workerID,
          workerName,
          blockName,
          rowNumber,
          jobType: effectiveJobType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setErrorMessage(data.message);
          notifyError(data.message);
        } else {
          setErrorMessage(data.message || "Check-in failed");
          notifyError(data.message || "Check-in failed");
        }
      } else {
        console.log("Check-in successful:", data);
        notifySuccess("Check-in successful!");
        setFormStep(2);
        setShowToast(true);
        setTimeout(() => {
          resetOnlyWorker();
        }, 2000);
      }
    } catch (error) {
      const errorMsg = "An error occurred during check-in.";
      setErrorMessage(errorMsg);
      notifyError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFullReset = () => {
    setWorkerName("");
    setWorkerID("");
    setJobType("");
    setCustomJobType("");
    setBlockName("");
    setRowNumber(null);
    setFormStep(0);
    setIsBlockDropdownOpen(false);
    setIsLoading(false);
    setErrorMessage("");
  };

  return (
    <IonPage>
      <IonContent>
        <Header />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ marginTop: "20px", padding: "0 2px" }}
        >
          <motion.div
            whileHover={{
              boxShadow:
                "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            }}
            transition={{ duration: 0.2 }}
          >
            <IonCard>
              <IonCardHeader
                className="flex-grow p-4 flex items-center justify-center"
                style={{ background: "#16a34a", color: "white" }}
              >
                <IonCardTitle className=" text-white">
                  Worker Check-In
                </IonCardTitle>
                <div
                  style={{
                    marginTop: "8px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: formStep >= 0 ? "white" : "#22c55e",
                        color: formStep >= 0 ? "#16a34a" : "white",
                        fontWeight: "500",
                        fontSize: "14px",
                      }}
                    >
                      1
                    </div>
                    <span
                      style={{
                        marginLeft: "8px",
                        fontSize: "14px",
                        color: "rgba(255,255,255,0.8)",
                      }}
                    >
                      Scan
                    </span>
                  </div>
                  <div
                    style={{
                      width: "32px",
                      height: "4px",
                      backgroundColor: "#22c55e",
                      margin: "0 4px",
                    }}
                  ></div>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: formStep >= 1 ? "white" : "#22c55e",
                        color: formStep >= 1 ? "#16a34a" : "white",
                        fontWeight: "500",
                        fontSize: "14px",
                      }}
                    >
                      2
                    </div>
                    <span
                      style={{
                        marginLeft: "8px",
                        fontSize: "14px",
                        color: "rgba(255,255,255,0.8)",
                      }}
                    >
                      Details
                    </span>
                  </div>
                  <div
                    style={{
                      width: "32px",
                      height: "4px",
                      backgroundColor: "#22c55e",
                      margin: "0 4px",
                    }}
                  ></div>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: formStep >= 2 ? "white" : "#22c55e",
                        color: formStep >= 2 ? "#16a34a" : "white",
                        fontWeight: "500",
                        fontSize: "14px",
                      }}
                    >
                      3
                    </div>
                    <span
                      style={{
                        marginLeft: "8px",
                        fontSize: "14px",
                        color: "rgba(255,255,255,0.8)",
                      }}
                    >
                      Complete
                    </span>
                  </div>
                </div>
              </IonCardHeader>

              <IonCardContent>
                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      backgroundColor: "#fef2f2",
                      border: "1px solid #ef4444",
                      borderRadius: "8px",
                      padding: "12px",
                      marginBottom: "16px",
                      display: "flex",
                      alignItems: "start",
                    }}
                  >
                    <AlertCircle
                      size={20}
                      color="#ef4444"
                      style={{
                        marginRight: "8px",
                        marginTop: "2px",
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "14px",
                          color: "#991b1b",
                          fontWeight: "500",
                        }}
                      >
                        {errorMessage}
                      </p>
                    </div>
                  </motion.div>
                )}

                <AnimatePresence mode="wait">
                  {formStep === 0 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                    >
                      {(blockName || rowNumber || jobType) && (
                        <div
                          style={{
                            backgroundColor: "#fef3c7",
                            border: "1px solid #f59e0b",
                            borderRadius: "8px",
                            padding: "12px",
                            marginBottom: "16px",
                          }}
                        >
                          <div style={{ fontSize: "14px", color: "#92400e" }}>
                            <strong>Current Job Details:</strong>
                            {getEffectiveJobType() && (
                              <p>Job: {getEffectiveJobType()}</p>
                            )}
                            {blockName && <p>Block: {blockName}</p>}
                            {rowNumber && (
                              <p>
                                Row: {rowNumber} (
                                {rowDirection === "ascending" ? "↑" : "↓"})
                              </p>
                            )}
                          </div>
                          <Button
                            size="small"
                            onClick={handleFullReset}
                            style={{ marginTop: "8px", color: "#f59e0b" }}
                          >
                            Change Job Details
                          </Button>
                        </div>
                      )}

                      {workerName ? (
                        <div
                          style={{
                            backgroundColor: "#f0f9ff",
                            border: "1px solid #22c55e",
                            borderRadius: "8px",
                            padding: "16px",
                            marginBottom: "24px",
                          }}
                        >
                          <div
                            style={{ display: "flex", alignItems: "center" }}
                          >
                            <CheckCircleIcon
                              size={20}
                              color="#22c55e"
                              style={{ marginRight: "8px" }}
                            />
                            <h3
                              style={{
                                margin: 0,
                                fontWeight: "500",
                                color: "#166534",
                              }}
                            >
                              Worker Identified
                            </h3>
                          </div>
                          <div
                            style={{
                              marginTop: "8px",
                              fontSize: "14px",
                              color: "#166534",
                            }}
                          >
                            <p>
                              <strong>Name:</strong> {workerName}
                            </p>
                            <p>
                              <strong>ID:</strong> {workerID}
                            </p>
                          </div>
                          <Button
                            size="small"
                            onClick={resetOnlyWorker}
                            style={{ marginTop: "8px", color: "#22c55e" }}
                          >
                            Scan Again
                          </Button>
                        </div>
                      ) : (
                        <QRScanner onScanSuccess={handleScanSuccess} />
                      )}

                      {workerName && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3 }}
                          style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            marginTop: "16px",
                          }}
                        >
                          <Button
                            variant="contained"
                            onClick={() => setFormStep(1)}
                            style={{ backgroundColor: "#22c55e" }}
                          >
                            Continue
                          </Button>
                        </motion.div>
                      )}
                    </motion.div>
                  )}

                  {formStep === 1 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div
                        style={{
                          backgroundColor: "#eff6ff",
                          border: "1px solid #3b82f6",
                          borderRadius: "8px",
                          padding: "16px",
                          marginBottom: "16px",
                        }}
                      >
                        <p
                          style={{
                            margin: 0,
                            fontSize: "14px",
                            color: "#1e40af",
                          }}
                        >
                          Please select the block, row number, and job type
                        </p>
                      </div>

                      <FormControl
                        variant="outlined"
                        style={{ width: "100%", marginBottom: "20px" }}
                      >
                        <InputLabel id="job-type-label">Job Type</InputLabel>
                        <Select
                          labelId="job-type-label"
                          value={jobType}
                          onChange={handleJobTypeChange}
                          label="Job Type"
                          fullWidth
                        >
                          <MenuItem value="">
                            <em>Select Job Type</em>
                          </MenuItem>
                          {JOB_TYPES.map((job) => (
                            <MenuItem key={job} value={job}>
                              {job}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      {jobType === "OTHER" && (
                        <FormControl
                          variant="outlined"
                          style={{ width: "100%", marginBottom: "20px" }}
                        >
                          <TextField
                            label="Custom Job Type"
                            value={customJobType}
                            onChange={handleCustomJobTypeChange}
                            placeholder="Enter custom job type"
                            fullWidth
                            required
                          />
                        </FormControl>
                      )}

                      <FormControl
                        variant="outlined"
                        style={{ width: "100%", marginBottom: "20px" }}
                      >
                        <InputLabel id="block-label">Block Name</InputLabel>
                        <Select
                          labelId="block-label"
                          value={blockName}
                          onChange={(e: SelectChangeEvent) => {
                            setBlockName(e.target.value);
                            setErrorMessage("");
                          }}
                          label="Block Name"
                          fullWidth
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
                        style={{ width: "100%", marginBottom: "20px" }}
                      >
                        <TextField
                          label="Row Number"
                          value={rowNumber || ""}
                          onChange={handleRowInputChange}
                          placeholder="Enter Row (e.g., 8A, 21B)"
                          fullWidth
                        />
                      </FormControl>

                      <FormControl
                        variant="outlined"
                        style={{ width: "100%", marginBottom: "20px" }}
                      >
                        <InputLabel id="direction-label">
                          Row Direction
                        </InputLabel>
                        <Select
                          labelId="direction-label"
                          value={rowDirection}
                          onChange={(
                            e: SelectChangeEvent<"ascending" | "descending">
                          ) => {
                            setRowDirection(
                              e.target.value as "ascending" | "descending"
                            );
                          }}
                          label="Row Direction"
                          fullWidth
                        >
                          <MenuItem value="ascending">
                            Ascending (1A → 1B → 2A)
                          </MenuItem>
                          <MenuItem value="descending">
                            Descending (50B → 50A → 49B)
                          </MenuItem>
                        </Select>
                      </FormControl>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginTop: "24px",
                        }}
                      >
                        <Button
                          variant="outlined"
                          onClick={() => {
                            setFormStep(0);
                            setErrorMessage("");
                          }}
                        >
                          Back
                        </Button>
                        <Button
                          variant="contained"
                          onClick={handleCheckIn}
                          disabled={
                            !blockName ||
                            !rowNumber ||
                            !getEffectiveJobType() ||
                            isLoading
                          }
                          style={{ backgroundColor: "#22c55e" }}
                        >
                          {isLoading ? "Processing..." : "Check In"}
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {formStep === 2 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      style={{ textAlign: "center", padding: "32px 0" }}
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 200,
                          damping: 10,
                        }}
                        style={{
                          width: "80px",
                          height: "80px",
                          borderRadius: "50%",
                          backgroundColor: "#dcfce7",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          margin: "0 auto 16px",
                        }}
                      >
                        <CheckCircleIcon size={48} color="#22c55e" />
                      </motion.div>
                      <h3
                        style={{
                          fontSize: "20px",
                          fontWeight: "500",
                          color: "#111827",
                          margin: "0 0 4px",
                        }}
                      >
                        Check-In Successful!
                      </h3>
                      <p
                        style={{
                          color: "#6b7280",
                          textAlign: "center",
                          marginBottom: "24px",
                        }}
                      >
                        {workerName} has been checked in to {blockName}, Row{" "}
                        {rowNumber} for {getEffectiveJobType()}
                      </p>
                      <p
                        style={{
                          color: "#059669",
                          fontSize: "14px",
                          marginBottom: "16px",
                        }}
                      >
                        Ready to check in next worker for same job...
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </IonCardContent>
            </IonCard>
          </motion.div>
        </motion.div>
        <div className="mt-8 flex justify-center space-x-4">
          <motion.button
            className="px-5 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 shadow-sm"
            whileHover={{
              scale: 1.05,
            }}
            whileTap={{
              scale: 0.95,
            }}
            onClick={() => history.push("/dashboard")}
          >
            Back to Dashboard
          </motion.button>
          <motion.button
            className="px-5 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 shadow-sm"
            whileHover={{
              scale: 1.05,
            }}
            whileTap={{
              scale: 0.95,
            }}
            onClick={() => history.push("/checkout")}
          >
            Go to Checkout
          </motion.button>
        </div>
      </IonContent>
      <Footer />
    </IonPage>
  );
};

export default CheckIn;
