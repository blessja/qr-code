import React, { useState, useEffect } from "react";
import {
  IonButton,
  IonCard,
  IonContent,
  IonPage,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonAlert,
  IonToast,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonInput,
  IonBadge,
  IonIcon,
} from "@ionic/react";
import { motion, AnimatePresence } from "framer-motion";
import { checkmarkCircle, alertCircle, leaf, trendingUp } from "ionicons/icons";
import Header from "./Header";
import Footer from "./Footer";
import QRScanner from "./QrScanner";
import { useHistory } from "react-router-dom";
import beepSound from "../assets/sounds/scan-beep.mp3";

const apiBaseUrl = "https://farm-server-02-production.up.railway.app/api";
const successSound = new Audio(beepSound);

const FastPiecework: React.FC = () => {
  const [workerName, setWorkerName] = useState("");
  const [workerID, setWorkerID] = useState("");
  const [jobType, setJobType] = useState("");
  const [customJobType, setCustomJobType] = useState("");
  const [blockName, setBlockName] = useState("");
  const [rowNumber, setRowNumber] = useState("");
  const [blocks, setBlocks] = useState<string[]>([]);
  const [jobTypes, setJobTypes] = useState<string[]>([]);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formStep, setFormStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successCount, setSuccessCount] = useState(0);
  const [rowDirection, setRowDirection] = useState<"forward" | "reverse">(
    "forward"
  );
  const [autoIncrement, setAutoIncrement] = useState(true);

  const history = useHistory();
  useEffect(() => {
    // TEMP: mock data for local testing
    const mockBlocks = [
      "Block 1",
      "Block 2",
      "Block 3",
      "Block 4",
      "Block 5",
      "Block 6",
      "Block 7",
      "Block 8",
      "Block 9",
      "Block 10",
      "Block 11",
      "Block 12",
      "Block 13",
      "Block 14",
      "Block 15",
      "Block 16",
      "Block 17",
      "Block 18",
      "Block 19",
    ];
    setBlocks(mockBlocks);

    const mockJobTypes = ["LEAF PICKING"];
    setJobTypes(mockJobTypes);

    // If you want to use backend later, comment out mock and uncomment below
    /*
    fetch(`${config.apiBaseUrl}/blocks`)
      .then((response) => response.json())
      .then((data) => {
        const sortedBlocks = [...data].sort((a, b) =>
          a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
        );
        setBlocks(sortedBlocks);
      })
      .catch((error) => {
        setAlertMessage(`Error fetching blocks: ${error.message}`);
        setShowAlert(true);
      });
    */
  }, []);

  // useEffect(() => {
  //   fetch(apiBaseUrl + "/blocks")
  //     .then((response) => response.json())
  //     .then((data) => {
  //       const sortedBlocks = [...data].sort((a, b) =>
  //         a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
  //       );
  //       setBlocks(sortedBlocks);
  //     })
  //     .catch((error) => {
  //       setAlertMessage(`Error fetching blocks: ${error.message}`);
  //       setShowAlert(true);
  //     });

  //   fetch(apiBaseUrl + "/fast-piecework/job-types")
  //     .then((response) => response.json())
  //     .then((data) => setJobTypes(data))
  //     .catch((error) => {
  //       console.error("Error fetching job types:", error);
  //     });
  // }, []);

  const resetOnlyWorker = () => {
    setWorkerName("");
    setWorkerID("");
    setErrorMessage("");
    setFormStep(0);
    setIsLoading(false);
  };
  const parseRowNumber = (
    row: string
  ): { number: number; letter: string } | null => {
    const match = row.match(/^(\d+)([A-Z])$/);
    if (!match) return null;
    return {
      number: parseInt(match[1]),
      letter: match[2],
    };
  };
  const getNextRowNumber = (
    currentRow: string,
    direction: "forward" | "reverse"
  ): string => {
    const parsed = parseRowNumber(currentRow);
    if (!parsed) return "";

    const { number, letter } = parsed;

    if (direction === "forward") {
      // Forward: 1A -> 1B -> 2A -> 2B
      if (letter === "A") {
        return `${number}B`;
      } else if (letter === "B") {
        return `${number + 1}A`;
      }
    } else {
      // Reverse: 50B -> 50A -> 49B -> 49A
      if (letter === "B") {
        return `${number}A`;
      } else if (letter === "A") {
        if (number > 1) {
          return `${number - 1}B`;
        }
      }
    }

    return currentRow;
  };

  const handleScanSuccess = (workerData: {
    workerName: string;
    workerID: string;
  }) => {
    setWorkerName(workerData.workerName);
    setWorkerID(workerData.workerID);
    setErrorMessage("");
    setFormStep(1);
    playSuccessSound();
  };
  const playSuccessSound = () => {
    successSound.play().catch((error) => {
      console.error("Sound playback error:", error);
    });
  };

  const handleRowInputChange = (event: any) => {
    let input = event.target.value;
    input = input.toUpperCase(); // Ensure uppercase
    setRowNumber(input);
    setErrorMessage("");
  };

  const handleCustomJobTypeChange = (event: any) => {
    let input = event.target.value;
    input = input.toUpperCase();
    setCustomJobType(input);
    setErrorMessage("");
  };

  const getEffectiveJobType = () => {
    return jobType === "OTHER" ? customJobType : jobType;
  };

  const handleFastCheckIn = async () => {
    const effectiveJobType = getEffectiveJobType();

    if (
      !workerID ||
      !workerName ||
      !blockName ||
      !rowNumber ||
      !effectiveJobType
    ) {
      setErrorMessage("Please provide all required information.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch(
        apiBaseUrl + "/fast-piecework/fast-checkin",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workerID,
            workerName,
            blockName,
            rowNumber,
            jobType: effectiveJobType,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.message || "Fast check-in failed");
        setIsLoading(false);
      } else {
        setToastMessage(
          `✓ ${workerName} completed Row ${rowNumber} (${data.vinesCompleted} vines)`
        );
        setShowToast(true);
        setSuccessCount(successCount + 1);

        // Auto-increment row number if enabled
        if (autoIncrement) {
          const nextRow = getNextRowNumber(rowNumber, rowDirection);
          setRowNumber(nextRow);
        }

        setFormStep(2);

        setTimeout(() => {
          resetOnlyWorker();
        }, 1500);
      }
    } catch (error) {
      const errorMsg = "An error occurred during fast check-in.";
      setErrorMessage(errorMsg);
      setIsLoading(false);
    }
  };

  const handleFullReset = () => {
    setWorkerName("");
    setWorkerID("");
    setJobType("");
    setCustomJobType("");
    setBlockName("");
    setRowNumber("");
    setFormStep(0);
    setIsLoading(false);
    setErrorMessage("");
    setSuccessCount(0);
  };

  return (
    <IonPage>
      <IonContent>
        <Header />

        <div className="flex justify-center mt-4 px-4">
          <div className="bg-green-100 border-2 border-green-500 rounded-lg px-6 py-3 flex items-center gap-3">
            <IonIcon
              icon={checkmarkCircle}
              style={{ fontSize: "24px", color: "#16a34a" }}
            />
            <div>
              <p
                className="text-sm text-green-700 font-medium"
                style={{ margin: 0 }}
              >
                Workers Processed Today
              </p>
              <p
                className="text-2xl font-bold text-green-800"
                style={{ margin: 0 }}
              >
                {successCount}
              </p>
            </div>
          </div>
        </div>

        <div style={{ marginTop: "20px", padding: "0 16px" }}>
          <IonCard>
            <IonCardHeader
              style={{
                background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                color: "white",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "8px",
                }}
              >
                <IonIcon icon={leaf} style={{ fontSize: "24px" }} />
                <IonCardTitle>Fast Piecework Entry</IonCardTitle>
              </div>
              <p style={{ fontSize: "14px", margin: 0, opacity: 0.9 }}>
                Single-scan workflow for quick jobs like leaf picking
              </p>

              <div
                style={{
                  marginTop: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
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
                      backgroundColor: formStep >= 0 ? "white" : "#10b981",
                      color: formStep >= 0 ? "#059669" : "white",
                      fontWeight: "500",
                      fontSize: "14px",
                    }}
                  >
                    1
                  </div>
                  <span style={{ marginLeft: "8px", fontSize: "14px" }}>
                    Scan
                  </span>
                </div>
                <div
                  style={{
                    width: "24px",
                    height: "4px",
                    backgroundColor: "#10b981",
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
                      backgroundColor: formStep >= 1 ? "white" : "#10b981",
                      color: formStep >= 1 ? "#059669" : "white",
                      fontWeight: "500",
                      fontSize: "14px",
                    }}
                  >
                    2
                  </div>
                  <span style={{ marginLeft: "8px", fontSize: "14px" }}>
                    Complete
                  </span>
                </div>
              </div>
            </IonCardHeader>

            <IonCardContent>
              {errorMessage && (
                <div
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
                  <IonIcon
                    icon={alertCircle}
                    style={{
                      fontSize: "20px",
                      color: "#ef4444",
                      marginRight: "8px",
                      marginTop: "2px",
                    }}
                  />
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
              )}

              {formStep === 0 && (
                <div>
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
                        <strong>Current Job Setup:</strong>
                        {getEffectiveJobType() && (
                          <p>Job: {getEffectiveJobType()}</p>
                        )}
                        {blockName && <p>Block: {blockName}</p>}
                        {rowNumber && <p>Next Row: {rowNumber}</p>}
                      </div>
                      <IonButton
                        size="small"
                        fill="clear"
                        onClick={handleFullReset}
                        style={{ color: "#f59e0b", marginTop: "8px" }}
                      >
                        Change Job Setup
                      </IonButton>
                    </div>
                  )}

                  {workerName ? (
                    <div
                      style={{
                        backgroundColor: "#f0f9ff",
                        border: "2px solid #059669",
                        borderRadius: "8px",
                        padding: "16px",
                        marginBottom: "24px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <IonIcon
                          icon={checkmarkCircle}
                          style={{
                            fontSize: "20px",
                            color: "#059669",
                            marginRight: "8px",
                          }}
                        />
                        <h3
                          style={{
                            margin: 0,
                            fontWeight: "500",
                            color: "#065f46",
                          }}
                        >
                          Worker Ready
                        </h3>
                      </div>
                      <div
                        style={{
                          marginTop: "8px",
                          fontSize: "14px",
                          color: "#065f46",
                        }}
                      >
                        <p>
                          <strong>Name:</strong> {workerName}
                        </p>
                        <p>
                          <strong>ID:</strong> {workerID}
                        </p>
                      </div>
                      <IonButton
                        size="small"
                        fill="clear"
                        onClick={resetOnlyWorker}
                        style={{ color: "#059669", marginTop: "8px" }}
                      >
                        Scan Different Worker
                      </IonButton>
                    </div>
                  ) : (
                    <QRScanner onScanSuccess={handleScanSuccess} />
                  )}

                  {workerName && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        marginTop: "16px",
                      }}
                    >
                      <IonButton color="success" onClick={() => setFormStep(1)}>
                        Continue
                      </IonButton>
                    </div>
                  )}
                </div>
              )}

              {formStep === 1 && (
                <div>
                  <div
                    style={{
                      backgroundColor: "#ecfdf5",
                      border: "1px solid #059669",
                      borderRadius: "8px",
                      padding: "16px",
                      marginBottom: "16px",
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: "14px",
                        color: "#065f46",
                        fontWeight: "500",
                      }}
                    >
                      ⚡ Quick Entry Mode: All vines in the row will be marked
                      as completed with one click
                    </p>
                  </div>

                  <IonItem>
                    <IonLabel position="stacked">Job Type *</IonLabel>
                    <IonSelect
                      value={jobType}
                      onIonChange={(e) => setJobType(e.detail.value)}
                      placeholder="Select job type"
                    >
                      {jobTypes.map((job) => (
                        <IonSelectOption key={job} value={job}>
                          {job}
                        </IonSelectOption>
                      ))}
                    </IonSelect>
                  </IonItem>
                  <div
                    style={{
                      backgroundColor: "#f3f4f6",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      padding: "12px",
                      marginTop: "16px",
                      marginBottom: "16px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "12px",
                      }}
                    >
                      <label
                        style={{
                          fontSize: "14px",
                          fontWeight: "500",
                          color: "#374151",
                        }}
                      >
                        Auto-Increment Rows
                      </label>
                      <input
                        type="checkbox"
                        checked={autoIncrement}
                        onChange={(e) => setAutoIncrement(e.target.checked)}
                        style={{
                          width: "20px",
                          height: "20px",
                          accentColor: "#059669",
                        }}
                      />
                    </div>

                    {autoIncrement && (
                      <div style={{ marginTop: "8px" }}>
                        <label
                          style={{
                            fontSize: "12px",
                            color: "#6b7280",
                            display: "block",
                            marginBottom: "6px",
                          }}
                        >
                          Direction:
                        </label>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            type="button"
                            onClick={() => setRowDirection("forward")}
                            style={{
                              flex: 1,
                              padding: "8px 12px",
                              borderRadius: "6px",
                              border: "2px solid",
                              borderColor:
                                rowDirection === "forward"
                                  ? "#059669"
                                  : "#d1d5db",
                              backgroundColor:
                                rowDirection === "forward"
                                  ? "#d1fae5"
                                  : "white",
                              color:
                                rowDirection === "forward"
                                  ? "#065f46"
                                  : "#6b7280",
                              fontSize: "13px",
                              fontWeight: "500",
                              cursor: "pointer",
                              transition: "all 0.2s",
                            }}
                          >
                            ↓ Forward
                            <br />
                            <span style={{ fontSize: "11px", opacity: 0.8 }}>
                              1A → 1B → 2A
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setRowDirection("reverse")}
                            style={{
                              flex: 1,
                              padding: "8px 12px",
                              borderRadius: "6px",
                              border: "2px solid",
                              borderColor:
                                rowDirection === "reverse"
                                  ? "#059669"
                                  : "#d1d5db",
                              backgroundColor:
                                rowDirection === "reverse"
                                  ? "#d1fae5"
                                  : "white",
                              color:
                                rowDirection === "reverse"
                                  ? "#065f46"
                                  : "#6b7280",
                              fontSize: "13px",
                              fontWeight: "500",
                              cursor: "pointer",
                              transition: "all 0.2s",
                            }}
                          >
                            ↑ Reverse
                            <br />
                            <span style={{ fontSize: "11px", opacity: 0.8 }}>
                              50B → 50A → 49B
                            </span>
                          </button>
                        </div>
                      </div>
                    )}

                    {autoIncrement &&
                      rowNumber &&
                      parseRowNumber(rowNumber) && (
                        <div
                          style={{
                            marginTop: "12px",
                            padding: "8px",
                            backgroundColor: "#dbeafe",
                            border: "1px solid #3b82f6",
                            borderRadius: "6px",
                            fontSize: "12px",
                            color: "#1e40af",
                          }}
                        >
                          <strong>Next row:</strong>{" "}
                          {getNextRowNumber(rowNumber, rowDirection) ||
                            "End of sequence"}
                        </div>
                      )}
                  </div>

                  {jobType === "OTHER" && (
                    <IonItem>
                      <IonLabel position="stacked">Custom Job Type *</IonLabel>
                      <IonInput
                        value={customJobType}
                        onIonChange={handleCustomJobTypeChange}
                        placeholder="Enter custom job type"
                      />
                    </IonItem>
                  )}

                  <IonItem>
                    <IonLabel position="stacked">Block Name *</IonLabel>
                    <IonSelect
                      value={blockName}
                      onIonChange={(e) => setBlockName(e.detail.value)}
                      placeholder="Select block"
                    >
                      {blocks.map((block) => (
                        <IonSelectOption key={block} value={block}>
                          {block}
                        </IonSelectOption>
                      ))}
                    </IonSelect>
                  </IonItem>

                  <IonItem>
                    <IonLabel position="stacked">Row Number *</IonLabel>
                    <IonInput
                      value={rowNumber}
                      onIonChange={handleRowInputChange}
                      placeholder="e.g., 5A, 12B"
                    />
                  </IonItem>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginTop: "24px",
                    }}
                  >
                    <IonButton
                      fill="outline"
                      onClick={() => {
                        setFormStep(0);
                        setErrorMessage("");
                      }}
                    >
                      Back
                    </IonButton>
                    <IonButton
                      color="success"
                      onClick={handleFastCheckIn}
                      disabled={
                        !blockName ||
                        !rowNumber ||
                        !getEffectiveJobType() ||
                        isLoading
                      }
                    >
                      {isLoading ? "Processing..." : "Complete Row"}
                    </IonButton>
                  </div>
                </div>
              )}

              {formStep === 2 && (
                <div style={{ textAlign: "center", padding: "32px 0" }}>
                  <div
                    style={{
                      width: "80px",
                      height: "80px",
                      borderRadius: "50%",
                      backgroundColor: "#d1fae5",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 16px",
                    }}
                  >
                    <IonIcon
                      icon={checkmarkCircle}
                      style={{ fontSize: "48px", color: "#059669" }}
                    />
                  </div>
                  <h3
                    style={{
                      fontSize: "20px",
                      fontWeight: "500",
                      color: "#111827",
                      margin: "0 0 4px",
                    }}
                  >
                    Row Completed!
                  </h3>
                  <p
                    style={{
                      color: "#6b7280",
                      textAlign: "center",
                      marginBottom: "16px",
                    }}
                  >
                    {workerName} finished {blockName}, Row {rowNumber}
                  </p>
                  <IonBadge color="success" style={{ fontSize: "14px" }}>
                    {getEffectiveJobType()}
                  </IonBadge>
                  <p
                    style={{
                      color: "#059669",
                      fontSize: "14px",
                      marginTop: "16px",
                    }}
                  >
                    Ready for next worker...
                  </p>
                </div>
              )}
            </IonCardContent>
          </IonCard>
        </div>

        <div className="flex justify-center gap-4 mt-6 mb-6 px-4">
          <IonButton fill="outline" onClick={() => history.push("/dashboard")}>
            Dashboard
          </IonButton>
          <IonButton
            color="success"
            onClick={() => history.push("/fast-piecework-totals")}
          >
            <IonIcon icon={trendingUp} slot="start" />
            View Totals
          </IonButton>
        </div>

        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header="Alert"
          message={alertMessage}
          buttons={["OK"]}
        />

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
          color="success"
          position="top"
        />
      </IonContent>
      <Footer />
    </IonPage>
  );
};

export default FastPiecework;
