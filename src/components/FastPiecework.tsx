import React, { useState, useEffect, useRef } from "react";
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
import { checkmarkCircle, alertCircle, leaf, trendingUp, person, search } from "ionicons/icons";
import Header from "./Header";
import Footer from "./Footer";
import { useHistory } from "react-router-dom";
import beepSound from "../assets/sounds/scan-beep.mp3";

// Import worker data from frontend API
import { 
  searchWorkers, 
  Worker 
} from "../data/workers-data";

const apiBaseUrl = "https://farm-server-02-production-b3d0.up.railway.app/api";
const successSound = new Audio(beepSound);

const FastPiecework: React.FC = () => {
  const [workerName, setWorkerName] = useState("");
  const [workerID, setWorkerID] = useState("");
  const [workerSearchQuery, setWorkerSearchQuery] = useState("");
  const [showWorkerDropdown, setShowWorkerDropdown] = useState(false);
  const [filteredWorkers, setFilteredWorkers] = useState<Worker[]>([]);
  const [jobType, setJobType] = useState("");
  const [customJobType, setCustomJobType] = useState("");
  const [blockName, setBlockName] = useState("");
  const [rowNumber, setRowNumber] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formStep, setFormStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successCount, setSuccessCount] = useState(0);
  const [rowDirection, setRowDirection] = useState<"forward" | "reverse">("forward");
  const [autoIncrement, setAutoIncrement] = useState(true);

  const [blocks, setBlocks] = useState<string[]>([]);
  const [jobTypes, setJobTypes] = useState<string[]>([]);

  const [showSwapModal, setShowSwapModal] = useState(false);
  const [swapToRow, setSwapToRow] = useState("");
  const [isSwapping, setIsSwapping] = useState(false);

  const workerInputRef = useRef<HTMLIonInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const history = useHistory();

  useEffect(() => {
    // Mock data for blocks and job types
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
    fetch(`${apiBaseUrl}/blocks`)
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

  useEffect(() => {
    if (workerSearchQuery) {
      const results = searchWorkers(workerSearchQuery);
      setFilteredWorkers(results.slice(0, 10)); // Show top 10 results
      setShowWorkerDropdown(results.length > 0);
    } else {
      setFilteredWorkers([]);
      setShowWorkerDropdown(false);
    }
  }, [workerSearchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowWorkerDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const resetOnlyWorker = () => {
    setWorkerName("");
    setWorkerID("");
    setWorkerSearchQuery("");
    setFilteredWorkers([]);
    setShowWorkerDropdown(false);
    setErrorMessage("");
    setFormStep(0);
    setIsLoading(false);
  };

  const parseRowNumber = (row: string): { number: number; letter: string } | null => {
    const match = row.match(/^(\d+)([A-Z])$/);
    if (!match) return null;
    return {
      number: parseInt(match[1]),
      letter: match[2],
    };
  };

  const getNextRowNumber = (currentRow: string, direction: "forward" | "reverse"): string => {
    const parsed = parseRowNumber(currentRow);
    if (!parsed) return "";

    const { number, letter } = parsed;

    if (direction === "forward") {
      if (letter === "A") {
        return `${number}B`;
      } else if (letter === "B") {
        return `${number + 1}A`;
      }
    } else {
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

  const handleWorkerSelect = (worker: Worker) => {
    setWorkerName(worker.name);
    setWorkerID(worker.workerID);
    setWorkerSearchQuery(worker.name);
    setShowWorkerDropdown(false);
    setErrorMessage("");
    playSuccessSound();
  };

  const handleWorkerInputChange = (e: any) => {
    const value = e.detail.value || "";
    setWorkerSearchQuery(value);
    
    // Clear worker if input is cleared
    if (!value) {
      setWorkerName("");
      setWorkerID("");
    }
  };

  const playSuccessSound = () => {
    successSound.play().catch((error) => {
      console.error("Sound playback error:", error);
    });
  };

  const handleRowInputChange = (event: any) => {
    let input = event.detail.value || "";
    input = input.toUpperCase();
    setRowNumber(input);
    setErrorMessage("");
  };

  const handleCustomJobTypeChange = (event: any) => {
    let input = event.detail.value || "";
    input = input.toUpperCase();
    setCustomJobType(input);
    setErrorMessage("");
  };

  const getEffectiveJobType = () => {
    return jobType === "OTHER" ? customJobType : jobType;
  };

  const handleFastCheckIn = async () => {
    const effectiveJobType = getEffectiveJobType();

    if (!workerID || !workerName || !blockName || !rowNumber || !effectiveJobType) {
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
    setWorkerSearchQuery("");
    setJobType("");
    setCustomJobType("");
    setBlockName("");
    setRowNumber("");
    setFormStep(0);
    setIsLoading(false);
    setErrorMessage("");
    setFilteredWorkers([]);
    setShowWorkerDropdown(false);
  };

  const handleSwapWorker = async (newRow: string) => {
    if (!newRow || !workerID || !blockName) {
      setErrorMessage("Missing information for worker move");
      return;
    }

    const effectiveJobType = getEffectiveJobType();
    if (!effectiveJobType) {
      setErrorMessage("Job type is required");
      return;
    }

    setIsSwapping(true);
    setErrorMessage("");

    try {
      const response = await fetch(
        apiBaseUrl + "/fast-piecework/swap-worker",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            oldWorkerID: workerID,
            newWorkerID: workerID, // Same worker, different row
            newWorkerName: workerName,
            blockName: blockName,
            rowNumber: rowNumber, // Original row
            jobType: effectiveJobType,
            newRowNumber: newRow, // New row
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.message || "Worker move failed");
        setIsSwapping(false);
        setShowSwapModal(false);
      } else {
        setToastMessage(`✓ ${workerName} moved from Row ${rowNumber} to Row ${newRow}`);
        setShowToast(true);
        setShowSwapModal(false);
        
        if (autoIncrement) {
          const nextRow = getNextRowNumber(newRow, rowDirection);
          setRowNumber(nextRow);
        } else {
          setRowNumber(newRow);
        }
        
        setSwapToRow("");
        setIsSwapping(false);
      }
    } catch (error) {
      setErrorMessage("An error occurred during worker move");
      setIsSwapping(false);
      setShowSwapModal(false);
    }
  };

  const openSwapModal = () => {
    setSwapToRow("");
    setShowSwapModal(true);
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
              <p className="text-sm text-green-700 font-medium" style={{ margin: 0 }}>
                Workers Processed Today
              </p>
              <p className="text-2xl font-bold text-green-800" style={{ margin: 0 }}>
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
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <IonIcon icon={leaf} style={{ fontSize: "24px" }} />
                <IonCardTitle>Fast Piecework Entry</IonCardTitle>
              </div>
              <p style={{ fontSize: "14px", margin: 0, opacity: 0.9 }}>
                Quick entry workflow for jobs like leaf picking
              </p>

              <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
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
                  <span style={{ marginLeft: "8px", fontSize: "14px" }}>Select Worker</span>
                </div>
                <div style={{ width: "24px", height: "4px", backgroundColor: "#10b981" }}></div>
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
                  <span style={{ marginLeft: "8px", fontSize: "14px" }}>Complete</span>
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
                  <p style={{ margin: 0, fontSize: "14px", color: "#991b1b", fontWeight: "500" }}>
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
                        {getEffectiveJobType() && <p style={{ margin: "4px 0" }}>Job: {getEffectiveJobType()}</p>}
                        {blockName && <p style={{ margin: "4px 0" }}>Block: {blockName}</p>}
                        {rowNumber && <p style={{ margin: "4px 0" }}>Next Row: {rowNumber}</p>}
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

                  {blockName && rowNumber && jobType && (
                    <div style={{ marginBottom: "16px" }}>
                      <IonButton
                        size="small"
                        fill="outline"
                        color="warning"
                        onClick={openSwapModal}
                        style={{ width: "100%" }}
                      >
                        Move Last Worker to Different Row
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
                          style={{ fontSize: "20px", color: "#059669", marginRight: "8px" }}
                        />
                        <h3 style={{ margin: 0, fontWeight: "500", color: "#065f46" }}>
                          Worker Selected
                        </h3>
                      </div>
                      <div style={{ marginTop: "8px", fontSize: "14px", color: "#065f46" }}>
                        <p style={{ margin: "4px 0" }}><strong>Name:</strong> {workerName}</p>
                        <p style={{ margin: "4px 0" }}><strong>ID:</strong> {workerID}</p>
                      </div>
                      <IonButton
                        size="small"
                        fill="clear"
                        onClick={resetOnlyWorker}
                        style={{ color: "#059669", marginTop: "8px" }}
                      >
                        Select Different Worker
                      </IonButton>
                    </div>
                  ) : (
                    <div style={{ marginBottom: "16px" }}>
                      <IonItem>
                        <IonIcon icon={search} slot="start" style={{ color: "#059669" }} />
                        <IonLabel position="stacked">Search Worker Name or ID *</IonLabel>
                        <IonInput
                          ref={workerInputRef}
                          value={workerSearchQuery}
                          onIonInput={handleWorkerInputChange}
                          placeholder="Type to search..."
                          onIonFocus={() => {
                            if (filteredWorkers.length > 0) {
                              setShowWorkerDropdown(true);
                            }
                          }}
                        />
                      </IonItem>

                      {workerSearchQuery && filteredWorkers.length === 0 && (
                        <div
                          style={{
                            padding: "12px",
                            marginTop: "8px",
                            backgroundColor: "#fef2f2",
                            border: "1px solid #fecaca",
                            borderRadius: "8px",
                            fontSize: "14px",
                            color: "#991b1b",
                          }}
                        >
                          No workers found matching "{workerSearchQuery}"
                        </div>
                      )}
                    </div>
                  )}

                  {/* Render dropdown outside the IonItem to avoid z-index issues */}
                  {!workerName && showWorkerDropdown && filteredWorkers.length > 0 && (
                    <div
                      ref={dropdownRef}
                      style={{
                        position: "relative",
                        marginTop: "-8px",
                        marginBottom: "16px",
                        backgroundColor: "white",
                        border: "2px solid #059669",
                        borderRadius: "8px",
                        maxHeight: "280px",
                        overflowY: "auto",
                        zIndex: 9999,
                        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
                      }}
                    >
                      {filteredWorkers.map((worker) => (
                        <div
                          key={worker.workerID}
                          onClick={() => handleWorkerSelect(worker)}
                          style={{
                            padding: "14px 16px",
                            cursor: "pointer",
                            borderBottom: "1px solid #e5e7eb",
                            transition: "background-color 0.2s",
                            backgroundColor: "white",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#ecfdf5";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "white";
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <IonIcon icon={person} style={{ fontSize: "22px", color: "#059669", flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: "600", color: "#111827", fontSize: "15px", marginBottom: "2px" }}>
                                {worker.name}
                              </div>
                              <div style={{ fontSize: "13px", color: "#6b7280" }}>
                                ID: {worker.workerID}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {workerName && (
                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
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
                    <p style={{ margin: 0, fontSize: "14px", color: "#065f46", fontWeight: "500" }}>
                      ⚡ Quick Entry Mode: All vines in the row will be marked as completed
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
                      <label style={{ fontSize: "14px", fontWeight: "500", color: "#374151" }}>
                        Auto-Increment Rows
                      </label>
                      <input
                        type="checkbox"
                        checked={autoIncrement}
                        onChange={(e) => setAutoIncrement(e.target.checked)}
                        style={{ width: "20px", height: "20px", accentColor: "#059669" }}
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
                              borderColor: rowDirection === "forward" ? "#059669" : "#d1d5db",
                              backgroundColor: rowDirection === "forward" ? "#d1fae5" : "white",
                              color: rowDirection === "forward" ? "#065f46" : "#6b7280",
                              fontSize: "13px",
                              fontWeight: "500",
                              cursor: "pointer",
                              transition: "all 0.2s",
                            }}
                          >
                            ↓ Forward
                            <br />
                            <span style={{ fontSize: "11px", opacity: 0.8 }}>1A → 1B → 2A</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setRowDirection("reverse")}
                            style={{
                              flex: 1,
                              padding: "8px 12px",
                              borderRadius: "6px",
                              border: "2px solid",
                              borderColor: rowDirection === "reverse" ? "#059669" : "#d1d5db",
                              backgroundColor: rowDirection === "reverse" ? "#d1fae5" : "white",
                              color: rowDirection === "reverse" ? "#065f46" : "#6b7280",
                              fontSize: "13px",
                              fontWeight: "500",
                              cursor: "pointer",
                              transition: "all 0.2s",
                            }}
                          >
                            ↑ Reverse
                            <br />
                            <span style={{ fontSize: "11px", opacity: 0.8 }}>50B → 50A → 49B</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {autoIncrement && rowNumber && parseRowNumber(rowNumber) && (
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
                        {getNextRowNumber(rowNumber, rowDirection) || "End of sequence"}
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "24px" }}>
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
                      disabled={!blockName || !rowNumber || !getEffectiveJobType() || isLoading}
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
                    <IonIcon icon={checkmarkCircle} style={{ fontSize: "48px", color: "#059669" }} />
                  </div>
                  <h3 style={{ fontSize: "20px", fontWeight: "500", color: "#111827", margin: "0 0 4px" }}>
                    Row Completed!
                  </h3>
                  <p style={{ color: "#6b7280", textAlign: "center", marginBottom: "16px" }}>
                    {workerName} finished {blockName}, Row {rowNumber}
                  </p>
                  <IonBadge color="success" style={{ fontSize: "14px" }}>
                    {getEffectiveJobType()}
                  </IonBadge>
                  <p style={{ color: "#059669", fontSize: "14px", marginTop: "16px" }}>
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
          <IonButton color="success" onClick={() => history.push("/fast-piecework-totals")}>
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

        <IonAlert
          isOpen={showSwapModal}
          onDidDismiss={() => {
            setShowSwapModal(false);
            setSwapToRow("");
            setIsSwapping(false);
          }}
          header="Move Worker to Different Row"
          message={`Move ${workerName} from Row ${rowNumber} to a different row in ${blockName}`}
          inputs={[
            {
              name: "newRow",
              type: "text",
              placeholder: "e.g., 5A, 12B",
              value: swapToRow,
            },
          ]}
          buttons={[
            {
              text: "Cancel",
              role: "cancel",
              handler: () => {
                setSwapToRow("");
                setIsSwapping(false);
              },
            },
            {
              text: isSwapping ? "Moving..." : "Move Worker",
              handler: (data) => {
                const newRow = data.newRow ? data.newRow.toUpperCase() : "";
                if (!newRow) {
                  setToastMessage("Please enter a row number");
                  setShowToast(true);
                  return false;
                }
                if (newRow === rowNumber) {
                  setToastMessage("New row must be different from current row");
                  setShowToast(true);
                  return false;
                }
                setSwapToRow(newRow);
                handleSwapWorker(newRow);
                return true;
              },
            },
          ]}
        />
      </IonContent>
      <Footer />
    </IonPage>
  );
};

export default FastPiecework;