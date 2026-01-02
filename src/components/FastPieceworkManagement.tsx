import React, { useState, useEffect } from "react";
import {
  IonCard,
  IonCardContent,
  IonBadge,
  IonButton,
  IonIcon,
  IonAlert,
  IonToast,
  IonContent,
  IonPage,
} from "@ionic/react";
import {
  arrowForward,
  swapHorizontal,
  trashOutline,
} from "ionicons/icons";

const apiBaseUrl = "https://farm-server-02-production-b3d0.up.railway.app/api";

interface WorkerRow {
  blockName: string;
  rowNumber: string;
  vines: number;
  date: string;
  jobType: string;
}

interface WorkerData {
  workerID: string;
  workerName: string;
  totalVines: number;
  rows: WorkerRow[];
}

const FastPieceworkManagement: React.FC = () => {
  const [workers, setWorkers] = useState<WorkerData[]>([]);
  const [filteredWorkers, setFilteredWorkers] = useState<WorkerData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [filterBlock, setFilterBlock] = useState("");
  const [filterJobType, setFilterJobType] = useState("");
  const [blocks, setBlocks] = useState<string[]>([]);
  const [jobTypes, setJobTypes] = useState<string[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastColor, setToastColor] = useState<"success" | "danger" | "warning">("success");

  // Move/Swap Modal States
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<{
    workerID: string;
    workerName: string;
    blockName: string;
    rowNumber: string;
    jobType: string;
    vines: number;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // View mode
  const [viewMode, setViewMode] = useState<"list" | "table">("list");

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [workers, searchText, filterBlock, filterJobType]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/fast-piecework/fast-totals`);
      const data = await response.json();

      const workersData = data.workers.map((worker: any) => ({
        workerID: worker.workerID,
        workerName: worker.workerName,
        totalVines: worker.totalVines,
        rows: worker.rows,
      }));

      setWorkers(workersData);

      const uniqueBlocks = new Set<string>();
      const uniqueJobTypes = new Set<string>();

      workersData.forEach((worker: WorkerData) => {
        worker.rows.forEach((row) => {
          uniqueBlocks.add(row.blockName);
          uniqueJobTypes.add(row.jobType);
        });
      });

      setBlocks(Array.from(uniqueBlocks).sort((a, b) => 
        a.localeCompare(b, undefined, { numeric: true })
      ));
      setJobTypes(Array.from(uniqueJobTypes).sort());

      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      showToastMessage("Failed to load data", "danger");
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...workers];

    if (searchText) {
      filtered = filtered.filter(
        (worker) =>
          worker.workerName.toLowerCase().includes(searchText.toLowerCase()) ||
          worker.workerID.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (filterBlock) {
      filtered = filtered.map((worker) => ({
        ...worker,
        rows: worker.rows.filter((row) => row.blockName === filterBlock),
      })).filter((worker) => worker.rows.length > 0);
    }

    if (filterJobType) {
      filtered = filtered.map((worker) => ({
        ...worker,
        rows: worker.rows.filter((row) => row.jobType === filterJobType),
      })).filter((worker) => worker.rows.length > 0);
    }

    setFilteredWorkers(filtered);
  };

  const showToastMessage = (
    message: string,
    color: "success" | "danger" | "warning" = "success"
  ) => {
    setToastMessage(message);
    setToastColor(color);
    setShowToast(true);
  };

  const handleMoveWorker = (entry: WorkerRow, workerID: string, workerName: string) => {
    setSelectedEntry({
      workerID,
      workerName,
      blockName: entry.blockName,
      rowNumber: entry.rowNumber,
      jobType: entry.jobType,
      vines: entry.vines,
    });
    setShowMoveModal(true);
  };

  const handleSwapWorker = (entry: WorkerRow, workerID: string, workerName: string) => {
    setSelectedEntry({
      workerID,
      workerName,
      blockName: entry.blockName,
      rowNumber: entry.rowNumber,
      jobType: entry.jobType,
      vines: entry.vines,
    });
    setShowSwapModal(true);
  };

  const handleDeleteEntry = (entry: WorkerRow, workerID: string, workerName: string) => {
    setSelectedEntry({
      workerID,
      workerName,
      blockName: entry.blockName,
      rowNumber: entry.rowNumber,
      jobType: entry.jobType,
      vines: entry.vines,
    });
    setShowDeleteModal(true);
  };

  const confirmMoveWorker = async (inputData: any) => {
    const newRowNumber = inputData.newRow?.trim().toUpperCase();
    
    if (!selectedEntry || !newRowNumber) {
      showToastMessage("Please enter a new row number", "warning");
      return false;
    }

    setIsProcessing(true);
    setShowMoveModal(false);

    try {
      const response = await fetch(`${apiBaseUrl}/fast-piecework/swap-worker`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldWorkerID: selectedEntry.workerID,
          newWorkerID: selectedEntry.workerID,
          newWorkerName: selectedEntry.workerName,
          blockName: selectedEntry.blockName,
          rowNumber: selectedEntry.rowNumber,
          jobType: selectedEntry.jobType,
          newRowNumber: newRowNumber,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showToastMessage(data.message || "Failed to move worker", "danger");
      } else {
        showToastMessage(
          `✓ ${selectedEntry.workerName} moved from Row ${selectedEntry.rowNumber} to Row ${newRowNumber}`,
          "success"
        );
        await fetchData();
      }
    } catch (error) {
      console.error("Error moving worker:", error);
      showToastMessage("Error moving worker", "danger");
    } finally {
      setIsProcessing(false);
    }

    return true;
  };

  const confirmSwapWorker = async (inputData: any) => {
    const swapTargetWorkerID = inputData.targetWorkerID?.trim();
    
    if (!selectedEntry || !swapTargetWorkerID) {
      showToastMessage("Please select a target worker", "warning");
      return false;
    }

    const targetWorker = workers.find((w) => w.workerID === swapTargetWorkerID);
    if (!targetWorker) {
      showToastMessage("Target worker not found", "danger");
      return false;
    }

    setIsProcessing(true);
    setShowSwapModal(false);

    try {
      const response = await fetch(`${apiBaseUrl}/fast-piecework/swap-worker`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldWorkerID: selectedEntry.workerID,
          newWorkerID: swapTargetWorkerID,
          newWorkerName: targetWorker.workerName,
          blockName: selectedEntry.blockName,
          rowNumber: selectedEntry.rowNumber,
          jobType: selectedEntry.jobType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showToastMessage(data.message || "Failed to swap worker", "danger");
      } else {
        showToastMessage(
          `✓ Swapped ${selectedEntry.workerName} with ${targetWorker.workerName} on Row ${selectedEntry.rowNumber}`,
          "success"
        );
        await fetchData();
      }
    } catch (error) {
      console.error("Error swapping worker:", error);
      showToastMessage("Error swapping worker", "danger");
    } finally {
      setIsProcessing(false);
    }

    return true;
  };

  const confirmDeleteEntry = async () => {
    if (!selectedEntry) return;

    setIsProcessing(true);
    setShowDeleteModal(false);

    try {
      const response = await fetch(`${apiBaseUrl}/fast-piecework/delete-entry`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workerID: selectedEntry.workerID,
          blockName: selectedEntry.blockName,
          rowNumber: selectedEntry.rowNumber,
          jobType: selectedEntry.jobType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showToastMessage(data.message || "Failed to delete entry", "danger");
      } else {
        showToastMessage(
          `✓ Deleted entry for ${selectedEntry.workerName} on ${selectedEntry.blockName}, Row ${selectedEntry.rowNumber}`,
          "success"
        );
        await fetchData();
      }
    } catch (error) {
      console.error("Error deleting entry:", error);
      showToastMessage("Error deleting entry", "danger");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <IonPage>
      <IonContent style={{ minHeight: "100vh", backgroundColor: "#f9fafb" }}>
        <div style={{ padding: "16px", maxWidth: "1400px", margin: "0 auto" }}>
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                background: "linear-gradient(135deg, #0891b2 0%, #0e7490 100%)",
                color: "white",
                padding: "20px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <svg
                  style={{ width: "24px", height: "24px" }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "600" }}>
                  Fast Piecework Management
                </h1>
              </div>
              <p style={{ fontSize: "14px", margin: "8px 0 0 0", opacity: 0.9 }}>
                View, edit, move, and manage all fast piecework entries
              </p>
            </div>

            <IonCard>
              <IonCardContent style={{ padding: "20px" }}>
              {/* Filters and Search */}
              <div style={{ marginBottom: "16px" }}>
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Search by worker name or ID"
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                    marginBottom: "12px",
                  }}
                />

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                    marginBottom: "12px",
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "14px",
                        fontWeight: "500",
                        marginBottom: "4px",
                        color: "#374151",
                      }}
                    >
                      Block
                    </label>
                    <select
                      value={filterBlock}
                      onChange={(e) => setFilterBlock(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        fontSize: "14px",
                        backgroundColor: "white",
                      }}
                    >
                      <option value="">All Blocks</option>
                      {blocks.map((block) => (
                        <option key={block} value={block}>
                          {block}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "14px",
                        fontWeight: "500",
                        marginBottom: "4px",
                        color: "#374151",
                      }}
                    >
                      Job Type
                    </label>
                    <select
                      value={filterJobType}
                      onChange={(e) => setFilterJobType(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        fontSize: "14px",
                        backgroundColor: "white",
                      }}
                    >
                      <option value="">All Jobs</option>
                      {jobTypes.map((job) => (
                        <option key={job} value={job}>
                          {job}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => {
                      setSearchText("");
                      setFilterBlock("");
                      setFilterJobType("");
                    }}
                    style={{
                      padding: "8px 16px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      backgroundColor: "white",
                      fontSize: "14px",
                      fontWeight: "500",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <svg
                      style={{ width: "16px", height: "16px" }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                      />
                    </svg>
                    Clear Filters
                  </button>
                  <button
                    onClick={fetchData}
                    disabled={isLoading}
                    style={{
                      padding: "8px 16px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      backgroundColor: "white",
                      fontSize: "14px",
                      fontWeight: "500",
                      cursor: isLoading ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      opacity: isLoading ? 0.5 : 1,
                    }}
                  >
                    <svg
                      style={{ width: "16px", height: "16px" }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Refresh
                  </button>
                </div>
              </div>

              {/* View Mode Toggle */}
              <div
                style={{
                  display: "flex",
                  backgroundColor: "#f3f4f6",
                  borderRadius: "6px",
                  padding: "4px",
                  marginBottom: "16px",
                }}
              >
                <button
                  onClick={() => setViewMode("list")}
                  style={{
                    flex: 1,
                    padding: "8px",
                    border: "none",
                    borderRadius: "4px",
                    backgroundColor: viewMode === "list" ? "white" : "transparent",
                    fontWeight: viewMode === "list" ? "600" : "400",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  List View
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  style={{
                    flex: 1,
                    padding: "8px",
                    border: "none",
                    borderRadius: "4px",
                    backgroundColor: viewMode === "table" ? "white" : "transparent",
                    fontWeight: viewMode === "table" ? "600" : "400",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  Table View
                </button>
              </div>

              {/* Loading State */}
              {isLoading && (
                <div style={{ textAlign: "center", padding: "32px" }}>
                  <div
                    style={{
                      border: "4px solid #f3f4f6",
                      borderTop: "4px solid #0891b2",
                      borderRadius: "50%",
                      width: "40px",
                      height: "40px",
                      animation: "spin 1s linear infinite",
                      margin: "0 auto",
                    }}
                  />
                  <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                  <p style={{ marginTop: "12px", color: "#6b7280" }}>Loading data...</p>
                </div>
              )}

              {/* Workers List/Table */}
              {!isLoading && filteredWorkers.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "32px",
                    color: "#6b7280",
                  }}
                >
                  <p>No entries found</p>
                </div>
              )}

              {!isLoading && viewMode === "list" && filteredWorkers.length > 0 && (
                <div>
                  {filteredWorkers.map((worker) => (
                    <div
                      key={worker.workerID}
                      style={{
                        backgroundColor: "#f9fafb",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        padding: "16px",
                        marginBottom: "16px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "12px",
                        }}
                      >
                        <div>
                          <h3
                            style={{
                              margin: 0,
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#111827",
                            }}
                          >
                            {worker.workerName}
                          </h3>
                          <p
                            style={{
                              margin: "4px 0 0 0",
                              fontSize: "13px",
                              color: "#6b7280",
                            }}
                          >
                            ID: {worker.workerID}
                          </p>
                        </div>
                        <IonBadge color="primary" style={{ fontSize: "14px" }}>
                          {worker.rows.length} {worker.rows.length === 1 ? "Row" : "Rows"}
                        </IonBadge>
                      </div>

                      {/* Rows for this worker */}
                      {worker.rows.map((row, index) => (
                        <div
                          key={index}
                          style={{
                            backgroundColor: "white",
                            border: "1px solid #e5e7eb",
                            borderRadius: "6px",
                            padding: "12px",
                            marginBottom: index < worker.rows.length - 1 ? "8px" : "0",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "start",
                              marginBottom: "8px",
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <div style={{ marginBottom: "4px" }}>
                                <strong style={{ fontSize: "14px" }}>
                                  {row.blockName}, Row {row.rowNumber}
                                </strong>
                              </div>
                              <div
                                style={{
                                  fontSize: "13px",
                                  color: "#6b7280",
                                  marginBottom: "4px",
                                }}
                              >
                                {row.jobType} • {row.vines} vines
                              </div>
                              <div style={{ fontSize: "12px", color: "#9ca3af" }}>
                                {new Date(row.date).toLocaleDateString()} at{" "}
                                {new Date(row.date).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              gap: "8px",
                              marginTop: "8px",
                            }}
                          >
                            <IonButton
                              size="small"
                              fill="outline"
                              color="warning"
                              onClick={() =>
                                handleMoveWorker(row, worker.workerID, worker.workerName)
                              }
                              disabled={isProcessing}
                            >
                              <IonIcon icon={arrowForward} slot="start" />
                              Move
                            </IonButton>
                            <IonButton
                              size="small"
                              fill="outline"
                              color="tertiary"
                              onClick={() =>
                                handleSwapWorker(row, worker.workerID, worker.workerName)
                              }
                              disabled={isProcessing}
                            >
                              <IonIcon icon={swapHorizontal} slot="start" />
                              Swap
                            </IonButton>
                            <IonButton
                              size="small"
                              fill="outline"
                              color="danger"
                              onClick={() =>
                                handleDeleteEntry(row, worker.workerID, worker.workerName)
                              }
                              disabled={isProcessing}
                            >
                              <IonIcon icon={trashOutline} slot="start" />
                              Delete
                            </IonButton>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {!isLoading && viewMode === "table" && filteredWorkers.length > 0 && (
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: "13px",
                    }}
                  >
                    <thead>
                      <tr style={{ backgroundColor: "#f3f4f6" }}>
                        <th
                          style={{
                            padding: "12px",
                            textAlign: "left",
                            fontWeight: "600",
                            borderBottom: "2px solid #e5e7eb",
                          }}
                        >
                          Worker
                        </th>
                        <th
                          style={{
                            padding: "12px",
                            textAlign: "left",
                            fontWeight: "600",
                            borderBottom: "2px solid #e5e7eb",
                          }}
                        >
                          Block
                        </th>
                        <th
                          style={{
                            padding: "12px",
                            textAlign: "left",
                            fontWeight: "600",
                            borderBottom: "2px solid #e5e7eb",
                          }}
                        >
                          Row
                        </th>
                        <th
                          style={{
                            padding: "12px",
                            textAlign: "left",
                            fontWeight: "600",
                            borderBottom: "2px solid #e5e7eb",
                          }}
                        >
                          Job Type
                        </th>
                        <th
                          style={{
                            padding: "12px",
                            textAlign: "left",
                            fontWeight: "600",
                            borderBottom: "2px solid #e5e7eb",
                          }}
                        >
                          Vines
                        </th>
                        <th
                          style={{
                            padding: "12px",
                            textAlign: "left",
                            fontWeight: "600",
                            borderBottom: "2px solid #e5e7eb",
                          }}
                        >
                          Date
                        </th>
                        <th
                          style={{
                            padding: "12px",
                            textAlign: "left",
                            fontWeight: "600",
                            borderBottom: "2px solid #e5e7eb",
                          }}
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredWorkers.map((worker) =>
                        worker.rows.map((row, index) => (
                          <tr
                            key={`${worker.workerID}-${index}`}
                            style={{
                              borderBottom: "1px solid #e5e7eb",
                            }}
                          >
                            <td style={{ padding: "12px" }}>
                              <div style={{ fontWeight: "500" }}>
                                {worker.workerName}
                              </div>
                              <div
                                style={{ fontSize: "11px", color: "#9ca3af" }}
                              >
                                {worker.workerID}
                              </div>
                            </td>
                            <td style={{ padding: "12px" }}>{row.blockName}</td>
                            <td style={{ padding: "12px" }}>
                              <IonBadge color="medium">{row.rowNumber}</IonBadge>
                            </td>
                            <td style={{ padding: "12px" }}>
                              <IonBadge color="success">{row.jobType}</IonBadge>
                            </td>
                            <td style={{ padding: "12px" }}>{row.vines}</td>
                            <td style={{ padding: "12px" }}>
                              {new Date(row.date).toLocaleDateString()}
                            </td>
                            <td style={{ padding: "12px" }}>
                              <div style={{ display: "flex", gap: "4px" }}>
                                <IonButton
                                  size="small"
                                  fill="clear"
                                  color="warning"
                                  onClick={() =>
                                    handleMoveWorker(
                                      row,
                                      worker.workerID,
                                      worker.workerName
                                    )
                                  }
                                  disabled={isProcessing}
                                >
                                  <IonIcon icon={arrowForward} />
                                </IonButton>
                                <IonButton
                                  size="small"
                                  fill="clear"
                                  color="tertiary"
                                  onClick={() =>
                                    handleSwapWorker(
                                      row,
                                      worker.workerID,
                                      worker.workerName
                                    )
                                  }
                                  disabled={isProcessing}
                                >
                                  <IonIcon icon={swapHorizontal} />
                                </IonButton>
                                <IonButton
                                  size="small"
                                  fill="clear"
                                  color="danger"
                                  onClick={() =>
                                    handleDeleteEntry(
                                      row,
                                      worker.workerID,
                                      worker.workerName
                                    )
                                  }
                                  disabled={isProcessing}
                                >
                                  <IonIcon icon={trashOutline} />
                                </IonButton>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </IonCardContent>
            </IonCard>
          </div>
        </div>
  
          {/* Move Worker Modal */}
          <IonAlert
            isOpen={showMoveModal}
            onDidDismiss={() => setShowMoveModal(false)}
            header="Move Worker to Different Row"
            message={
              selectedEntry
                ? `Move ${selectedEntry.workerName} from Row ${selectedEntry.rowNumber} to a different row in ${selectedEntry.blockName}`
                : ""
            }
            inputs={[
              {
                name: "newRow",
                type: "text",
                placeholder: "e.g., 5A, 12B",
              },
            ]}
            buttons={[
              {
                text: "Cancel",
                role: "cancel",
              },
              {
                text: "Move",
                handler: confirmMoveWorker,
              },
            ]}
          />

        {/* Swap Worker Modal */}
        <IonAlert
          isOpen={showSwapModal}
          onDidDismiss={() => setShowSwapModal(false)}
          header="Swap Worker"
          message={
            selectedEntry
              ? `Reassign ${selectedEntry.blockName}, Row ${selectedEntry.rowNumber} to a different worker`
              : ""
          }
          inputs={[
            {
              name: "targetWorkerID",
              type: "text",
              placeholder: "Enter target worker ID",
            },
          ]}
          buttons={[
            {
              text: "Cancel",
              role: "cancel",
            },
            {
              text: "Swap",
              handler: confirmSwapWorker,
            },
          ]}
        />

        {/* Delete Entry Modal */}
        <IonAlert
          isOpen={showDeleteModal}
          onDidDismiss={() => setShowDeleteModal(false)}
          header="Delete Entry"
          message={
            selectedEntry
              ? `Are you sure you want to delete this entry for ${selectedEntry.workerName} on ${selectedEntry.blockName}, Row ${selectedEntry.rowNumber}?`
              : ""
          }
          buttons={[
            {
              text: "Cancel",
              role: "cancel",
            },
            {
              text: "Delete",
              role: "destructive",
              handler: confirmDeleteEntry,
            },
          ]}
        />

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          color={toastColor}
          position="top"
        />
      </IonContent>
    </IonPage>
  );
};

export default FastPieceworkManagement;