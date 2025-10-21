import React, { useState, useEffect } from "react";
import {
  RefreshCw,
  Download,
  Users,
  TrendingUp,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonItem,
  IonLabel,
  IonCard,
  IonCardContent,
} from "@ionic/react";
import { ApiService } from "../services/api";

interface WorkerData {
  _id: string;
  workerID: string;
  name: string;
  total_stock_count: number;
  blocks: Array<{
    block_name: string;
    rows: Array<{
      row_number: string;
      stock_count: number;
      date: string;
      day_of_week: string;
      job_type?: string;
    }>;
    _id: string;
  }>;
}

interface ProcessedRow {
  blockName: string;
  rowNumber: string;
  jobType: string;
  dailyTotals: { [date: string]: number };
  total: number;
}

interface ProcessedWorkerData {
  _id: string;
  workerID: string;
  name: string;
  rows: ProcessedRow[];
  dailyTotals: { [date: string]: number };
  grandTotal: number;
}

const WorkerTotalsPage: React.FC = () => {
  const [workers, setWorkers] = useState<ProcessedWorkerData[]>([]);
  const [filteredWorkers, setFilteredWorkers] = useState<ProcessedWorkerData[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedBlock, setSelectedBlock] = useState<string>("all");
  const [selectedJobType, setSelectedJobType] = useState<string>("all");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [allDates, setAllDates] = useState<string[]>([]);
  const [uniqueBlocks, setUniqueBlocks] = useState<string[]>([]);
  const [uniqueJobTypes, setUniqueJobTypes] = useState<string[]>([]);
  const [currentDatePage, setCurrentDatePage] = useState(0);
  const [datesPerPage, setDatesPerPage] = useState(3);

  useEffect(() => {
    const updateDatesPerPage = () => {
      if (window.innerWidth < 640) {
        setDatesPerPage(2);
      } else if (window.innerWidth < 1024) {
        setDatesPerPage(3);
      } else {
        setDatesPerPage(4);
      }
    };

    updateDatesPerPage();
    window.addEventListener("resize", updateDatesPerPage);
    return () => window.removeEventListener("resize", updateDatesPerPage);
  }, []);

  const processWorkerData = (
    rawWorkers: WorkerData[]
  ): ProcessedWorkerData[] => {
    const datesSet = new Set<string>();
    const blocksSet = new Set<string>();
    const jobTypesSet = new Set<string>();

    const processed = rawWorkers
      .filter(
        (worker) => worker && worker.blocks && Array.isArray(worker.blocks)
      )
      .map((worker) => {
        const rows: ProcessedRow[] = [];
        const workerDailyTotals: { [date: string]: number } = {};

        worker.blocks.forEach((block) => {
          if (!block || !block.block_name || !Array.isArray(block.rows)) return;

          blocksSet.add(block.block_name);

          block.rows.forEach((row) => {
            if (!row || !row.date || row.stock_count === undefined) return;

            const dateOnly = row.date.split("T")[0];
            datesSet.add(dateOnly);
            const jobType = (row.job_type || "other").toLowerCase();
            jobTypesSet.add(jobType);

            let rowEntry = rows.find(
              (r) =>
                r.blockName === block.block_name &&
                r.rowNumber === row.row_number
            );

            if (!rowEntry) {
              rowEntry = {
                blockName: block.block_name || "",
                rowNumber: row.row_number || "",
                jobType: jobType,
                dailyTotals: {},
                total: 0,
              };
              rows.push(rowEntry);
            }

            rowEntry.dailyTotals[dateOnly] =
              (rowEntry.dailyTotals[dateOnly] || 0) + row.stock_count;
            rowEntry.total += row.stock_count;

            workerDailyTotals[dateOnly] =
              (workerDailyTotals[dateOnly] || 0) + row.stock_count;
          });
        });

        return {
          _id: worker._id || "",
          workerID: worker.workerID || "",
          name: worker.name || "Unknown",
          rows: rows.sort((a, b) => {
            const blockA = a.blockName || "";
            const blockB = b.blockName || "";
            if (blockA !== blockB) {
              return blockA.localeCompare(blockB);
            }
            const rowA = a.rowNumber || "";
            const rowB = b.rowNumber || "";
            return rowA.localeCompare(rowB);
          }),
          dailyTotals: workerDailyTotals,
          grandTotal: worker.total_stock_count || 0,
        };
      })
      .filter((worker) => worker.rows.length > 0);

    const sortedDates = Array.from(datesSet).sort();
    setAllDates(sortedDates);
    setUniqueBlocks(Array.from(blocksSet).sort());
    setUniqueJobTypes(Array.from(jobTypesSet).sort());

    return processed.sort((a, b) => (b.grandTotal || 0) - (a.grandTotal || 0));
  };

  const fetchWorkers = async () => {
    setLoading(true);
    setError(null);

    try {
      const data: WorkerData[] = await ApiService.getWorkers();
      const processedData = processWorkerData(data);
      setWorkers(processedData);
      applyFilters(processedData, searchText, selectedBlock, selectedJobType);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching workers:", error);
      setError("Failed to load worker data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (
    workerList: ProcessedWorkerData[],
    search: string,
    block: string,
    jobType: string
  ) => {
    let filtered = workerList
      .map((worker) => {
        let filteredRows = worker.rows;

        if (search && search.trim()) {
          const searchTerm = search.toLowerCase().trim();
          filteredRows = filteredRows.filter(
            (row) =>
              row.blockName.toLowerCase().includes(searchTerm) ||
              row.rowNumber.toLowerCase().includes(searchTerm) ||
              worker.name.toLowerCase().includes(searchTerm) ||
              worker.workerID.toLowerCase().includes(searchTerm)
          );
        }

        if (block && block !== "all") {
          filteredRows = filteredRows.filter((row) => row.blockName === block);
        }

        if (jobType && jobType !== "all") {
          filteredRows = filteredRows.filter((row) => row.jobType === jobType);
        }

        // Calculate filtered total for this worker
        const filteredTotal = filteredRows.reduce(
          (sum, row) => sum + row.total,
          0
        );

        return { ...worker, rows: filteredRows, filteredTotal };
      })
      .filter((worker) => worker.rows.length > 0)
      .sort((a, b) => (b.filteredTotal || 0) - (a.filteredTotal || 0));

    setFilteredWorkers(filtered);
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
    applyFilters(workers, text, selectedBlock, selectedJobType);
  };

  const handleBlockFilter = (block: string) => {
    setSelectedBlock(block);
    applyFilters(workers, searchText, block, selectedJobType);
  };

  const handleJobTypeFilter = (jobType: string) => {
    setSelectedJobType(jobType);
    applyFilters(workers, searchText, selectedBlock, jobType);
  };

  useEffect(() => {
    fetchWorkers();
    const interval = setInterval(fetchWorkers, 300000);
    return () => clearInterval(interval);
  }, []);

  const totalDatePages = Math.ceil(allDates.length / datesPerPage);
  const startDateIndex = currentDatePage * datesPerPage;
  const endDateIndex = Math.min(startDateIndex + datesPerPage, allDates.length);
  const currentPageDates = allDates.slice(startDateIndex, endDateIndex);

  const goToNextPage = () => {
    if (currentDatePage < totalDatePages - 1) {
      setCurrentDatePage(currentDatePage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentDatePage > 0) {
      setCurrentDatePage(currentDatePage - 1);
    }
  };

  const totalWorkers = filteredWorkers.length;
  const totalVines = filteredWorkers.reduce(
    (sum, worker) => sum + worker.grandTotal,
    0
  );

  const exportToPDF = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Worker Daily Totals Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #1f2937; margin-bottom: 10px; }
          .meta { color: #6b7280; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; font-size: 12px; }
          th { background-color: #f9fafb; font-weight: 600; }
          .text-center { text-align: center; }
          .font-bold { font-weight: bold; }
          .bg-blue { background-color: #eff6ff; }
          .badge { display: inline-block; padding: 2px 8px; background-color: #dbeafe; 
                   color: #1e40af; border-radius: 9999px; font-size: 11px; margin-right: 4px; }
        </style>
      </head>
      <body>
        <h1>Worker Daily Totals Report</h1>
        <div class="meta">Generated: ${new Date().toLocaleString()}</div>
        <div class="meta">Total Workers: ${totalWorkers} | Total Vines: ${totalVines.toLocaleString()}</div>
        <table>
          <thead>
            <tr>
              <th>Worker</th>
              <th>Blocks</th>
              <th>Rows</th>
              <th>Job Types</th>
              ${allDates
                .map(
                  (date) =>
                    `<th class="text-center">${new Date(
                      date
                    ).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}</th>`
                )
                .join("")}
              <th class="text-center bg-blue">Grand Total</th>
            </tr>
          </thead>
          <tbody>
            ${filteredWorkers
              .map((worker) => {
                const blocks = [
                  ...new Set(worker.rows.map((r) => r.blockName)),
                ].join(", ");
                const rows = [...new Set(worker.rows.map((r) => r.rowNumber))]
                  .sort((a, b) => parseInt(a) - parseInt(b))
                  .join(", ");
                const jobTypes = [...new Set(worker.rows.map((r) => r.jobType))]
                  .map((jt) => `<span class="badge">${jt}</span>`)
                  .join("");

                return `
                <tr>
                  <td><strong>${worker.name}</strong><br/><small>${
                  worker.workerID
                }</small></td>
                  <td>${blocks}</td>
                  <td>${rows}</td>
                  <td>${jobTypes}</td>
                  ${allDates
                    .map(
                      (date) =>
                        `<td class="text-center">${
                          worker.dailyTotals[date] || "-"
                        }</td>`
                    )
                    .join("")}
                  <td class="text-center font-bold bg-blue">${
                    worker.grandTotal
                  }</td>
                </tr>
              `;
              })
              .join("")}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  const styles = {
    container: {
      padding: "16px",
    },
    header: {
      marginBottom: "24px",
    },
    title: {
      fontSize: "24px",
      fontWeight: "bold",
      color: "#111827",
      margin: "0 0 8px 0",
    },
    subtitle: {
      fontSize: "14px",
      color: "#4b5563",
      margin: "8px 0 0 0",
    },
    buttonGroup: {
      display: "flex",
      gap: "8px",
      marginTop: "16px",
      flexWrap: "wrap" as const,
    },
    summaryGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "16px",
      marginBottom: "24px",
    },
    card: {
      padding: "16px",
      border: "1px solid #e5e7eb",
      borderRadius: "8px",
      backgroundColor: "#ffffff",
    },
    cardContent: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
    },
    cardText: {
      fontSize: "12px",
      color: "#6b7280",
      margin: "0 0 4px 0",
    },
    cardValue: {
      fontSize: "24px",
      fontWeight: "600",
      color: "#111827",
      margin: "0",
    },
    filterSection: {
      marginBottom: "16px",
    },
    workerCard: {
      marginBottom: "16px",
      padding: "12px",
      border: "1px solid #e5e7eb",
      borderRadius: "8px",
      backgroundColor: "#ffffff",
    },
    workerHeader: {
      marginBottom: "12px",
      paddingBottom: "12px",
      borderBottom: "1px solid #f3f4f6",
    },
    workerName: {
      fontSize: "16px",
      fontWeight: "600",
      color: "#111827",
      margin: "0 0 4px 0",
    },
    workerId: {
      fontSize: "12px",
      color: "#6b7280",
      margin: "0",
    },
    workerInfo: {
      marginBottom: "12px",
    },
    infoLabel: {
      fontSize: "12px",
      fontWeight: "600",
      color: "#6b7280",
      margin: "0 0 4px 0",
    },
    infoValue: {
      fontSize: "13px",
      color: "#111827",
      margin: "0",
    },
    dailyRow: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))",
      gap: "8px",
      marginTop: "12px",
      paddingTop: "12px",
      borderTop: "1px solid #f3f4f6",
    },
    dailyItem: {
      textAlign: "center" as const,
    },
    dailyDate: {
      fontSize: "11px",
      fontWeight: "600",
      color: "#6b7280",
      margin: "0 0 4px 0",
    },
    dailyValue: {
      fontSize: "16px",
      fontWeight: "600",
      color: "#1f2937",
      margin: "0",
    },
    totalValue: {
      fontSize: "16px",
      fontWeight: "700",
      color: "#1e40af",
      backgroundColor: "#eff6ff",
      padding: "8px",
      borderRadius: "4px",
      textAlign: "center" as const,
      margin: "0",
    },
    badge: {
      display: "inline-block",
      padding: "4px 8px",
      backgroundColor: "#dbeafe",
      color: "#1e40af",
      borderRadius: "12px",
      fontSize: "11px",
      fontWeight: "600",
      marginRight: "4px",
      marginBottom: "4px",
      textTransform: "capitalize" as const,
    },
    paginationContainer: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: "16px",
      padding: "12px",
      backgroundColor: "#ffffff",
      border: "1px solid #e5e7eb",
      borderRadius: "8px",
      flexWrap: "wrap" as const,
      gap: "12px",
    },
    paginationText: {
      fontSize: "12px",
      color: "#6b7280",
    },
    paginationButtons: {
      display: "flex",
      gap: "8px",
      alignItems: "center",
    },
    errorBox: {
      padding: "12px",
      backgroundColor: "#fef2f2",
      border: "1px solid #fecaca",
      borderRadius: "8px",
      marginBottom: "16px",
    },
    errorText: {
      color: "#dc2626",
      fontSize: "14px",
      margin: "0",
    },
    emptyState: {
      padding: "32px 16px",
      textAlign: "center" as const,
      color: "#6b7280",
    },
    loadingState: {
      padding: "32px 16px",
      textAlign: "center" as const,
      color: "#6b7280",
    },
    footer: {
      marginTop: "16px",
      textAlign: "center" as const,
      fontSize: "12px",
      color: "#6b7280",
    },
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar></IonToolbar>
      </IonHeader>

      <IonContent>
        <div style={styles.container}>
          {/* Header */}
          <div style={styles.header}>
            <h1 style={styles.title}>Worker Daily Totals</h1>
            {lastUpdated && (
              <p style={styles.subtitle}>
                Last updated: {lastUpdated.toLocaleString()}
              </p>
            )}
            <div style={styles.buttonGroup}>
              <IonButton
                fill="outline"
                onClick={fetchWorkers}
                disabled={loading}
              >
                <RefreshCw
                  size={16}
                  style={{ marginRight: "8px" }}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh
              </IonButton>

              <IonButton fill="solid" onClick={exportToPDF}>
                <Download size={16} style={{ marginRight: "8px" }} />
                Export PDF
              </IonButton>
            </div>
          </div>

          {/* Summary Cards */}
          <div style={styles.summaryGrid}>
            <div style={styles.card}>
              <div style={styles.cardContent}>
                <Users size={32} color="#2563eb" />
                <div>
                  <p style={styles.cardText}>Total Workers</p>
                  <p style={styles.cardValue}>{totalWorkers}</p>
                </div>
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.cardContent}>
                <TrendingUp size={32} color="#16a34a" />
                <div>
                  <p style={styles.cardText}>Total Vines</p>
                  <p style={styles.cardValue}>{totalVines.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.cardContent}>
                <Calendar size={32} color="#9333ea" />
                <div>
                  <p style={styles.cardText}>Date Range</p>
                  <p style={styles.cardValue}>
                    {allDates.length > 0 ? `${allDates.length} days` : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div style={styles.filterSection}>
            <IonSearchbar
              value={searchText}
              onIonInput={(e) => handleSearch(e.detail.value!)}
              placeholder="Search worker, block, or row..."
              showClearButton="focus"
            />

            <IonItem>
              <IonLabel>Block Filter</IonLabel>
              <IonSelect
                value={selectedBlock}
                placeholder="All Blocks"
                onIonChange={(e) => handleBlockFilter(e.detail.value)}
              >
                <IonSelectOption value="all">All Blocks</IonSelectOption>
                {uniqueBlocks.map((block) => (
                  <IonSelectOption key={block} value={block}>
                    {block}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>

            <IonItem>
              <IonLabel>Job Type Filter</IonLabel>
              <IonSelect
                value={selectedJobType}
                placeholder="All Job Types"
                onIonChange={(e) => handleJobTypeFilter(e.detail.value)}
              >
                <IonSelectOption value="all">All Job Types</IonSelectOption>
                {uniqueJobTypes.map((jobType) => (
                  <IonSelectOption key={jobType} value={jobType}>
                    {jobType}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>
          </div>

          {/* Date Pagination */}
          {allDates.length > datesPerPage && (
            <div style={styles.paginationContainer}>
              <div style={styles.paginationText}>
                Showing dates {startDateIndex + 1} - {endDateIndex} of{" "}
                {allDates.length}
              </div>
              <div style={styles.paginationButtons}>
                <IonButton
                  fill="outline"
                  size="small"
                  onClick={goToPreviousPage}
                  disabled={currentDatePage === 0}
                >
                  <ChevronLeft size={16} />
                  Previous
                </IonButton>
                <span style={styles.paginationText}>
                  Page {currentDatePage + 1} of {totalDatePages}
                </span>
                <IonButton
                  fill="outline"
                  size="small"
                  onClick={goToNextPage}
                  disabled={currentDatePage >= totalDatePages - 1}
                >
                  Next
                  <ChevronRight size={16} />
                </IonButton>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={styles.errorBox}>
              <p style={styles.errorText}>
                <strong>Error:</strong> {error}
              </p>
            </div>
          )}

          {/* Workers List */}
          {loading ? (
            <div style={styles.loadingState}>
              <RefreshCw
                size={24}
                style={{
                  marginBottom: "12px",
                  animation: "spin 1s linear infinite",
                }}
              />
              <p>Loading workers...</p>
            </div>
          ) : filteredWorkers.length === 0 ? (
            <div style={styles.emptyState}>
              <p>No workers found</p>
            </div>
          ) : (
            filteredWorkers.map((worker) => {
              const blocks = [
                ...new Set(worker.rows.map((r) => r.blockName)),
              ].join(", ");
              const rows = [...new Set(worker.rows.map((r) => r.rowNumber))]
                .sort((a, b) => parseInt(a) - parseInt(b))
                .join(", ");

              return (
                <div key={worker._id} style={styles.workerCard}>
                  <div style={styles.workerHeader}>
                    <p style={styles.workerName}>{worker.name}</p>
                    <p style={styles.workerId}>{worker.workerID}</p>
                  </div>

                  <div style={styles.workerInfo}>
                    <p style={styles.infoLabel}>Blocks</p>
                    <p style={styles.infoValue}>{blocks || "N/A"}</p>
                  </div>

                  <div style={styles.workerInfo}>
                    <p style={styles.infoLabel}>Rows</p>
                    <p style={styles.infoValue}>{rows || "N/A"}</p>
                  </div>

                  <div style={styles.workerInfo}>
                    <p style={styles.infoLabel}>Job Types</p>
                    <div>
                      {[...new Set(worker.rows.map((r) => r.jobType))].map(
                        (jobType, idx) => (
                          <span key={idx} style={styles.badge}>
                            {jobType}
                          </span>
                        )
                      )}
                    </div>
                  </div>

                  <div style={styles.dailyRow}>
                    {currentPageDates.map((date) => (
                      <div key={date} style={styles.dailyItem}>
                        <p style={styles.dailyDate}>
                          {new Date(date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                        <p style={styles.dailyValue}>
                          {worker.dailyTotals[date] || "-"}
                        </p>
                      </div>
                    ))}
                    <div style={styles.dailyItem}>
                      <p style={styles.dailyDate}>TOTAL</p>
                      <p style={styles.totalValue}>
                        {worker.rows.reduce((sum, row) => sum + row.total, 0)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Footer */}
          <div style={styles.footer}>
            Showing {filteredWorkers.length} of {workers.length} workers
            {(searchText ||
              selectedBlock !== "all" ||
              selectedJobType !== "all") && (
              <span style={{ color: "#2563eb" }}> (filtered)</span>
            )}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default WorkerTotalsPage;
