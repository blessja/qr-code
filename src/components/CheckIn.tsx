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
  IonIcon,
} from "@ionic/react";
import { checkmarkCircle, alertCircle, search, person } from "ionicons/icons";
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

const CheckIn: React.FC = () => {
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
  const [errorMessage, setErrorMessage] = useState<string>("");

  const [blocks, setBlocks] = useState<string[]>([]);
  const [jobTypes, setJobTypes] = useState<string[]>([]);

  const workerInputRef = useRef<HTMLIonInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const history = useHistory();

  useEffect(() => {
    // Mock data for blocks and job types
    const mockBlocks = [
      "Block 1", "Block 2", "Block 3", "Block 4", "Block 5",
      "Block 6", "Block 7", "Block 8", "Block 9", "Block 10",
      "Block 11", "Block 12", "Block 13", "Block 14", "Block 15",
      "Block 16", "Block 17", "Block 18", "Block 19",
    ];
    setBlocks(mockBlocks);

    const mockJobTypes = ["PRUNING", "TYING", "SUCKERING", "LEAF PICKING", "OTHER"];
    setJobTypes(mockJobTypes);
  }, []);

  // Search workers as user types
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

  const handleCheckIn = async () => {
    const effectiveJobType = getEffectiveJobType();

    if (!workerID || !workerName || !blockName || !rowNumber || !effectiveJobType) {
      setErrorMessage("Please provide all required information.");
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
        setErrorMessage(data.message || "Check-in failed");
        setIsLoading(false);
      } else {
        setToastMessage(`✓ ${workerName} checked in at ${blockName}, Row ${rowNumber}`);
        setShowToast(true);
        playSuccessSound();
        
        // Reset form
        setTimeout(() => {
          setWorkerName("");
          setWorkerID("");
          setWorkerSearchQuery("");
          setJobType("");
          setCustomJobType("");
          setBlockName("");
          setRowNumber("");
          setIsLoading(false);
          setErrorMessage("");
          setFilteredWorkers([]);
          setShowWorkerDropdown(false);
        }, 1500);
      }
    } catch (error) {
      const errorMsg = "An error occurred during check-in.";
      setErrorMessage(errorMsg);
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setWorkerName("");
    setWorkerID("");
    setWorkerSearchQuery("");
    setJobType("");
    setCustomJobType("");
    setBlockName("");
    setRowNumber("");
    setIsLoading(false);
    setErrorMessage("");
    setFilteredWorkers([]);
    setShowWorkerDropdown(false);
  };

  return (
    <IonPage>
      <IonContent>
        <Header />

        <div style={{ marginTop: "20px", padding: "0 16px" }}>
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Worker Check-In</IonCardTitle>
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

              {workerName ? (
                <div
                  style={{
                    backgroundColor: "#f0fdf4",
                    border: "2px solid #22c55e",
                    borderRadius: "8px",
                    padding: "16px",
                    marginBottom: "24px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <IonIcon
                      icon={checkmarkCircle}
                      style={{ fontSize: "20px", color: "#22c55e", marginRight: "8px" }}
                    />
                    <h3 style={{ margin: 0, fontWeight: "500", color: "#166534" }}>
                      Worker Selected
                    </h3>
                  </div>
                  <div style={{ marginTop: "8px", fontSize: "14px", color: "#166534" }}>
                    <p style={{ margin: "4px 0" }}><strong>Name:</strong> {workerName}</p>
                    <p style={{ margin: "4px 0" }}><strong>ID:</strong> {workerID}</p>
                  </div>
                  <IonButton
                    size="small"
                    fill="clear"
                    onClick={() => {
                      setWorkerName("");
                      setWorkerID("");
                      setWorkerSearchQuery("");
                      setErrorMessage("");
                    }}
                    style={{ color: "#22c55e", marginTop: "8px" }}
                  >
                    Select Different Worker
                  </IonButton>
                </div>
              ) : (
                <div style={{ marginBottom: "16px" }}>
                  <IonItem>
                    <IonIcon icon={search} slot="start" />
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

              {/* Worker dropdown - rendered outside IonItem */}
              {!workerName && showWorkerDropdown && filteredWorkers.length > 0 && (
                <div
                  ref={dropdownRef}
                  style={{
                    position: "relative",
                    marginTop: "-8px",
                    marginBottom: "16px",
                    backgroundColor: "white",
                    border: "2px solid #22c55e",
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
                        e.currentTarget.style.backgroundColor = "#f0fdf4";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "white";
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <IonIcon icon={person} style={{ fontSize: "22px", color: "#22c55e", flexShrink: 0 }} />
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

              <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                <IonButton
                  expand="block"
                  fill="outline"
                  onClick={handleReset}
                  style={{ flex: 1 }}
                >
                  Reset
                </IonButton>
                <IonButton
                  expand="block"
                  color="primary"
                  onClick={handleCheckIn}
                  disabled={!workerID || !blockName || !rowNumber || !getEffectiveJobType() || isLoading}
                  style={{ flex: 1 }}
                >
                  {isLoading ? "Checking In..." : "Check In"}
                </IonButton>
              </div>
            </IonCardContent>
          </IonCard>
        </div>

        <div className="flex justify-center gap-4 mt-6 mb-6 px-4">
          <IonButton fill="outline" onClick={() => history.push("/dashboard")}>
            Dashboard
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

export default CheckIn;