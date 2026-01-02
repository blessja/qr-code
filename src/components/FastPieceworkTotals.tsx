import React, { useState, useEffect } from "react";
import {
  IonContent,
  IonPage,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonButton,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonItem,
  IonLabel,
  IonBadge,
  IonSpinner,
  IonIcon,
  IonSegment,
  IonSegmentButton,
} from "@ionic/react";
import {
  refresh,
  download,
  people,
  trendingUp,
  calendar,
  leaf,
} from "ionicons/icons";
import Header from "./Header";
import Footer from "./Footer";
import { useHistory } from "react-router-dom";

const apiBaseUrl = "https://farm-server-02-production-b3d0.up.railway.app/api";

interface WorkerRow {
  blockName: string;
  rowNumber: string;
  vines: number;
  date: string;
  jobType: string;
}

interface BlockCompletion {
  blockName: string;
  expectedTotalVines: number;
  workerCompletedVines: number;
  workerPercentage: number;
  workerCompletedRows: number;
  totalRowsInBlock: number;
  variety: string;
}

interface GlobalBlockStatus {
  blockName: string;
  expectedVines: number;
  actualVines: number;
  difference: number;
  completionPercentage: number;
  status: "complete" | "over" | "short";
  completedRows: number;
  totalRows: number;
  variety: string;
  completedRowNumbers: string[];
}

interface WorkerData {
  workerID: string;
  workerName: string;
  totalVines: number;
  rows: WorkerRow[];
  blockCompletion: BlockCompletion[];
}

interface ApiResponse {
  workers: WorkerData[];
  globalBlockStatus?: GlobalBlockStatus[];
  summary?: {
    totalWorkers: number;
    totalVines: number;
    jobTypes: string[];
  };
}

const PieceworkTotals: React.FC = () => {
  const [workers, setWorkers] = useState<WorkerData[]>([]);
  const [filteredWorkers, setFilteredWorkers] = useState<WorkerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [selectedJobType, setSelectedJobType] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string>("all");
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [availableJobTypes, setAvailableJobTypes] = useState<string[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [globalBlockStatus, setGlobalBlockStatus] = useState<
    GlobalBlockStatus[]
  >([]);

  const history = useHistory();

  // NEW: Toggle between fast and regular piecework
  const [viewMode, setViewMode] = useState<"fast" | "regular">("fast");

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedJobType !== "all") params.append("jobType", selectedJobType);
      if (selectedDate !== "all") params.append("date", selectedDate);

      // Choose endpoint based on view mode
      const endpoint =
        viewMode === "fast"
          ? "/fast-piecework/fast-totals" // Fast piecework (single scan)
          : "/regular-work-totals"; // Regular work (check-in/out)

      const response = await fetch(
        `${apiBaseUrl}${endpoint}?${params.toString()}`
      );
      const data: ApiResponse = await response.json();

      setWorkers(data.workers);
      setGlobalBlockStatus(data.globalBlockStatus || []);
      applyFilters(data.workers, searchText);

      // ... rest of the code ...
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (workerList: WorkerData[], search: string) => {
    let filtered = workerList;

    if (search && search.trim()) {
      const searchTerm = search.toLowerCase().trim();
      filtered = filtered.filter(
        (worker) =>
          worker.workerName.toLowerCase().includes(searchTerm) ||
          worker.workerID.toLowerCase().includes(searchTerm) ||
          worker.rows.some((row) =>
            row.blockName.toLowerCase().includes(searchTerm)
          )
      );
    }

    setFilteredWorkers(filtered);
  };

  useEffect(() => {
    fetchData();
  }, [selectedJobType, selectedDate, viewMode]); // Re-fetch when mode changes

  const handleSearch = (text: string) => {
    setSearchText(text);
    applyFilters(workers, text);
  };

  const totalWorkers = filteredWorkers.length;
  const totalVines = filteredWorkers.reduce(
    (sum, worker) => sum + worker.totalVines,
    0
  );

const exportToPDF = () => {
    const title =
      viewMode === "fast"
        ? "Fast Piecework Report - By Block"
        : "Regular Piecework Report - By Block";

    // Group workers by block
    interface BlockWorkerData {
      workerID: string;
      workerName: string;
      vines: number;
      rows: number;
    }

    interface BlockGroup {
      blockName: string;
      workers: BlockWorkerData[];
      totalVines: number;
      variety?: string;
    }

    const blockMap = new Map<string, BlockGroup>();

    // Process each worker and their block completions
    filteredWorkers.forEach((worker) => {
      if (worker.blockCompletion && worker.blockCompletion.length > 0) {
        worker.blockCompletion.forEach((completion) => {
          if (!blockMap.has(completion.blockName)) {
            blockMap.set(completion.blockName, {
              blockName: completion.blockName,
              workers: [],
              totalVines: 0,
              variety: completion.variety,
            });
          }

          const block = blockMap.get(completion.blockName)!;
          block.workers.push({
            workerID: worker.workerID,
            workerName: worker.workerName,
            vines: completion.workerCompletedVines,
            rows: completion.workerCompletedRows,
          });
          block.totalVines += completion.workerCompletedVines;
        });
      }
    });

    // Convert to array and sort blocks alphabetically
    const blocks = Array.from(blockMap.values()).sort((a, b) =>
      a.blockName.localeCompare(b.blockName)
    );

    // Sort workers within each block by ID (ascending: 2021, 2022, 2023...)
    blocks.forEach((block) => {
      block.workers.sort((a, b) => a.workerID.localeCompare(b.workerID));
    });

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #1f2937; margin-bottom: 10px; }
          .meta { color: #6b7280; margin-bottom: 20px; font-size: 14px; }
          .block-section { margin-bottom: 30px; page-break-inside: avoid; }
          .block-header { 
            background-color: ${viewMode === "fast" ? "#10b981" : "#3b82f6"}; 
            color: white; 
            padding: 12px; 
            border-radius: 4px;
            margin-bottom: 10px;
          }
          .block-title { margin: 0; font-size: 18px; font-weight: 600; }
          .block-meta { margin: 4px 0 0 0; font-size: 12px; opacity: 0.9; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; font-size: 12px; }
          th { background-color: #f3f4f6; color: #374151; font-weight: 600; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .font-bold { font-weight: bold; }
          .total-row { background-color: #fef3c7; font-weight: 600; }
          @media print {
            .block-section { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div class="meta">Generated: ${new Date().toLocaleString()}</div>
        <div class="meta">Total Blocks: ${blocks.length} | Total Workers: ${totalWorkers} | Total Vines: ${totalVines.toLocaleString()}</div>
        
        ${blocks
          .map(
            (block) => `
          <div class="block-section">
            <div class="block-header">
              <h2 class="block-title">${block.blockName}</h2>
              <p class="block-meta">
                ${block.variety ? `Variety: ${block.variety} | ` : ""}
                Total Vines: ${block.totalVines.toLocaleString()} | 
                Workers: ${block.workers.length}
              </p>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th style="width: 15%;">Worker ID</th>
                  <th style="width: 35%;">Worker Name</th>
                  <th class="text-center" style="width: 20%;">Rows Completed</th>
                  <th class="text-right" style="width: 30%;">Vines</th>
                </tr>
              </thead>
              <tbody>
                ${block.workers
                  .map(
                    (worker) => `
                  <tr>
                    <td>${worker.workerID}</td>
                    <td>${worker.workerName}</td>
                    <td class="text-center">${worker.rows}</td>
                    <td class="text-right font-bold">${worker.vines.toLocaleString()}</td>
                  </tr>
                `
                  )
                  .join("")}
                <tr class="total-row">
                  <td colspan="3" class="text-right">Block Total:</td>
                  <td class="text-right font-bold">${block.totalVines.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        `
          )
          .join("")}
      </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 250);
    }
  };

  return (
    <IonPage>
      <IonContent>
        <Header />

        <div style={{ padding: "16px" }}>
          {/* Header Section */}
          <div style={{ marginBottom: "24px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "8px",
              }}
            >
              <IonIcon
                icon={leaf}
                style={{
                  fontSize: "28px",
                  color: viewMode === "fast" ? "#059669" : "#3b82f6",
                }}
              />
              <h1
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#111827",
                  margin: 0,
                }}
              >
                Piecework Totals
              </h1>
            </div>
            {lastUpdated && (
              <p
                style={{
                  fontSize: "14px",
                  color: "#6b7280",
                  margin: "4px 0 0 0",
                }}
              >
                Last updated: {lastUpdated.toLocaleString()}
              </p>
            )}
          </div>

          {/* NEW: Toggle between Fast and Regular Piecework */}
          <IonSegment
            value={viewMode}
            onIonChange={(e) =>
              setViewMode(e.detail.value as "fast" | "regular")
            }
            style={{ marginBottom: "24px" }}
          >
            <IonSegmentButton value="fast">
              <IonLabel>Fast Piecework</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="regular">
              <IonLabel>Regular Piecework</IonLabel>
            </IonSegmentButton>
          </IonSegment>

          {/* Action Buttons */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              marginBottom: "16px",
              flexWrap: "wrap",
            }}
          >
            <IonButton fill="outline" onClick={fetchData} disabled={loading}>
              <IonIcon icon={refresh} slot="start" />
              Refresh
            </IonButton>
            <IonButton fill="solid" onClick={exportToPDF}>
              <IonIcon icon={download} slot="start" />
              Export PDF
            </IonButton>
          </div>

          {/* Summary Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
              marginBottom: "24px",
            }}
          >
            <SummaryCard
              icon={people}
              label="Total Workers"
              value={totalWorkers}
              color={viewMode === "fast" ? "#059669" : "#3b82f6"}
            />
            <SummaryCard
              icon={trendingUp}
              label="Total Vines"
              value={totalVines.toLocaleString()}
              color={viewMode === "fast" ? "#059669" : "#3b82f6"}
            />
            <SummaryCard
              icon={calendar}
              label="Date Range"
              value={
                availableDates.length > 0
                  ? `${availableDates.length} days`
                  : "N/A"
              }
              color={viewMode === "fast" ? "#059669" : "#3b82f6"}
            />
          </div>

          {/* Global Block Completion Overview - Only for fast piecework */}
          {viewMode === "fast" && globalBlockStatus.length > 0 && (
            <div style={{ marginBottom: "24px" }}>
              <h2
                style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "#111827",
                  marginBottom: "12px",
                }}
              >
                Block Completion Overview
              </h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                  gap: "12px",
                }}
              >
                {globalBlockStatus.map((block, idx) => (
                  <IonCard key={idx} style={{ margin: 0 }}>
                    <IonCardContent style={{ padding: "12px" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "start",
                          marginBottom: "8px",
                        }}
                      >
                        <div>
                          <h3
                            style={{
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#111827",
                              margin: "0 0 4px 0",
                            }}
                          >
                            {block.blockName}
                          </h3>
                          <p
                            style={{
                              fontSize: "11px",
                              color: "#6b7280",
                              margin: 0,
                            }}
                          >
                            {block.variety}
                          </p>
                        </div>
                        <IonBadge
                          color={
                            block.status === "complete"
                              ? "success"
                              : block.status === "over"
                              ? "warning"
                              : "danger"
                          }
                        >
                          {block.status.toUpperCase()}
                        </IonBadge>
                      </div>

                      <div style={{ marginBottom: "8px" }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: "12px",
                            marginBottom: "4px",
                          }}
                        >
                          <span style={{ color: "#6b7280" }}>Progress:</span>
                          <span style={{ fontWeight: "600", color: "#111827" }}>
                            {block.completedRows} / {block.totalRows} rows
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: "12px",
                            marginBottom: "8px",
                          }}
                        >
                          <span style={{ color: "#6b7280" }}>Vines:</span>
                          <span
                            style={{
                              fontWeight: "600",
                              color:
                                block.status === "complete"
                                  ? "#059669"
                                  : block.status === "over"
                                  ? "#f59e0b"
                                  : "#ef4444",
                            }}
                          >
                            {block.actualVines.toLocaleString()} /{" "}
                            {block.expectedVines.toLocaleString()}
                            {block.difference !== 0 && (
                              <span
                                style={{ fontSize: "10px", marginLeft: "4px" }}
                              >
                                ({block.difference > 0 ? "+" : ""}
                                {block.difference})
                              </span>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div
                        style={{
                          width: "100%",
                          height: "6px",
                          backgroundColor: "#e5e7eb",
                          borderRadius: "3px",
                          overflow: "hidden",
                          marginBottom: "8px",
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.min(
                              block.completionPercentage,
                              100
                            )}%`,
                            height: "100%",
                            backgroundColor:
                              block.status === "complete"
                                ? "#059669"
                                : block.status === "over"
                                ? "#f59e0b"
                                : "#ef4444",
                            transition: "width 0.3s ease",
                          }}
                        ></div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "11px",
                        }}
                      >
                        <span style={{ color: "#6b7280" }}>
                          {block.completionPercentage.toFixed(1)}% complete
                        </span>
                        {block.status !== "complete" && (
                          <span
                            style={{
                              color:
                                block.status === "over" ? "#f59e0b" : "#ef4444",
                              fontWeight: "500",
                            }}
                          >
                            {block.status === "over"
                              ? `${block.difference} extra vines`
                              : `${Math.abs(block.difference)} vines short`}
                          </span>
                        )}
                      </div>

                      <details style={{ marginTop: "8px" }}>
                        <summary
                          style={{
                            fontSize: "11px",
                            color: "#6b7280",
                            cursor: "pointer",
                            userSelect: "none",
                          }}
                        >
                          View completed rows
                        </summary>
                        <div
                          style={{
                            marginTop: "4px",
                            fontSize: "10px",
                            color: "#111827",
                            maxHeight: "60px",
                            overflowY: "auto",
                            padding: "4px",
                          }}
                        >
                          {block.completedRowNumbers.join(", ")}
                        </div>
                      </details>
                    </IonCardContent>
                  </IonCard>
                ))}
              </div>
            </div>
          )}

          {/* Filters */}
          <IonSearchbar
            value={searchText}
            onIonInput={(e) => handleSearch(e.detail.value!)}
            placeholder="Search worker or block..."
            showClearButton="focus"
          />

          {/* Worker Cards */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "32px" }}>
              <IonSpinner name="crescent" />
              <p style={{ color: "#6b7280", marginTop: "12px" }}>
                Loading workers...
              </p>
            </div>
          ) : filteredWorkers.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px" }}>
              <p style={{ color: "#6b7280" }}>
                No {viewMode} piecework workers found
              </p>
            </div>
          ) : (
            filteredWorkers.map((worker, index) => (
              <IonCard key={worker.workerID} style={{ marginBottom: "16px" }}>
                <IonCardHeader style={{ paddingBottom: "12px" }}>
                  <IonCardTitle>{worker.workerName}</IonCardTitle>
                  <p>ID: {worker.workerID}</p>
                </IonCardHeader>
                <IonCardContent>
                  <p style={{ fontWeight: "600", marginBottom: "8px" }}>
                    Total Vines: {worker.totalVines.toLocaleString()}
                  </p>

                  {/* Worker's Block Contribution */}
                  <div style={{ marginBottom: "12px" }}>
                    <p
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#6b7280",
                        margin: "0 0 4px 0",
                      }}
                    >
                      Worker's Block Contribution
                    </p>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                      }}
                    >
                      {worker.blockCompletion &&
                      worker.blockCompletion.length > 0 ? (
                        worker.blockCompletion.map((completion, idx) => (
                          <div
                            key={idx}
                            style={{
                              backgroundColor: "#f9fafb",
                              padding: "8px",
                              borderRadius: "4px",
                              border: "1px solid #e5e7eb",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <div>
                                <p
                                  style={{
                                    fontSize: "12px",
                                    fontWeight: "600",
                                    color: "#111827",
                                    margin: "0 0 2px 0",
                                  }}
                                >
                                  {completion.blockName}
                                </p>
                                <p
                                  style={{
                                    fontSize: "10px",
                                    color: "#6b7280",
                                    margin: "0",
                                  }}
                                >
                                  {completion.workerCompletedRows} rows
                                  completed
                                </p>
                              </div>
                              <div style={{ textAlign: "right" }}>
                                <p
                                  style={{
                                    fontSize: "13px",
                                    fontWeight: "600",
                                    color:
                                      viewMode === "fast"
                                        ? "#059669"
                                        : "#3b82f6",
                                    margin: "0",
                                  }}
                                >
                                  {completion.workerCompletedVines.toLocaleString()}{" "}
                                  vines
                                </p>
                                <p
                                  style={{
                                    fontSize: "10px",
                                    color: "#6b7280",
                                    margin: "0",
                                  }}
                                >
                                  {completion.workerPercentage}% of block
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p
                          style={{
                            fontSize: "12px",
                            color: "#6b7280",
                            margin: "0",
                          }}
                        >
                          No block data available
                        </p>
                      )}
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>
            ))
          )}
        </div>

        <Footer />
      </IonContent>
    </IonPage>
  );
};

// Small summary card component for cleaner UI
const SummaryCard: React.FC<{
  icon: string;
  label: string;
  value: string | number;
  color?: string;
}> = ({ icon, label, value, color = "#059669" }) => (
  <div
    style={{
      padding: "16px",
      border: "1px solid #e5e7eb",
      borderRadius: "8px",
      backgroundColor: "#ffffff",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <IonIcon icon={icon} style={{ fontSize: "32px", color }} />
      <div>
        <p style={{ fontSize: "12px", color: "#6b7280", margin: "0 0 4px 0" }}>
          {label}
        </p>
        <p
          style={{
            fontSize: "24px",
            fontWeight: "600",
            color: "#111827",
            margin: "0",
          }}
        >
          {value}
        </p>
      </div>
    </div>
  </div>
);

export default PieceworkTotals;
