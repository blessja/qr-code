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
  filteredTotal?: number; // Add this for sorting filtered results
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

  // Pagination for dates - responsive
  const [currentDatePage, setCurrentDatePage] = useState(0);
  const [datesPerPage, setDatesPerPage] = useState(3);

  // Adjust dates per page based on screen size
  useEffect(() => {
    const updateDatesPerPage = () => {
      if (window.innerWidth < 640) {
        setDatesPerPage(2); // Mobile: show 2 dates
      } else if (window.innerWidth < 1024) {
        setDatesPerPage(3); // Tablet: show 3 dates
      } else {
        setDatesPerPage(3); // Desktop: show 3 dates
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

    const processed = rawWorkers.map((worker) => {
      const rows: ProcessedRow[] = [];
      const workerDailyTotals: { [date: string]: number } = {};

      worker.blocks.forEach((block) => {
        blocksSet.add(block.block_name);

        block.rows.forEach((row) => {
          const dateOnly = row.date.split("T")[0];
          datesSet.add(dateOnly);
          const jobType = (row.job_type || "other").toLowerCase();
          jobTypesSet.add(jobType);

          let rowEntry = rows.find(
            (r) =>
              r.blockName === block.block_name && r.rowNumber === row.row_number
          );

          if (!rowEntry) {
            rowEntry = {
              blockName: block.block_name,
              rowNumber: row.row_number,
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
        _id: worker._id,
        workerID: worker.workerID,
        name: worker.name,
        rows: rows.sort((a, b) => {
          if (a.blockName !== b.blockName) {
            return a.blockName.localeCompare(b.blockName);
          }
          return a.rowNumber.localeCompare(b.rowNumber);
        }),
        dailyTotals: workerDailyTotals,
        grandTotal: worker.total_stock_count,
      };
    });

    const sortedDates = Array.from(datesSet).sort();
    setAllDates(sortedDates);
    setUniqueBlocks(Array.from(blocksSet).sort());
    setUniqueJobTypes(Array.from(jobTypesSet).sort());

    return processed.sort((a, b) => b.grandTotal - a.grandTotal);
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

        return { ...worker, rows: filteredRows };
      })
      .filter((worker) => worker.rows.length > 0);

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

  // Calculate pagination
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
    // Create a printable view
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

    // Open print dialog
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

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Worker Daily Totals</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div className="max-w-full mx-auto">
          {/* Header Section */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Worker Daily Totals
                </h1>
                {lastUpdated && (
                  <p className="text-sm text-gray-600 mt-1">
                    Last updated: {lastUpdated.toLocaleString()}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <IonButton
                  fill="outline"
                  onClick={fetchWorkers}
                  disabled={loading}
                >
                  <RefreshCw
                    size={16}
                    className={loading ? "animate-spin" : ""}
                  />
                  Refresh
                </IonButton>

                <IonButton fill="solid" onClick={exportToPDF}>
                  <Download size={16} />
                  Export PDF
                </IonButton>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">
                    Total Workers
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {totalWorkers}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">
                    Total Vines
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {totalVines.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-purple-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">
                    Date Range
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {allDates.length > 0 ? `${allDates.length} days` : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex-1">
                <IonSearchbar
                  value={searchText}
                  onIonInput={(e) => handleSearch(e.detail.value!)}
                  placeholder="Search worker, block, or row..."
                  showClearButton="focus"
                />
              </div>

              <div>
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
              </div>

              <div>
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
            </div>
          </div>

          {/* Date Pagination Controls */}
          {allDates.length > datesPerPage && (
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing dates {startDateIndex + 1} - {endDateIndex} of{" "}
                  {allDates.length}
                </div>
                <div className="flex gap-2 items-center">
                  <IonButton
                    fill="outline"
                    size="small"
                    onClick={goToPreviousPage}
                    disabled={currentDatePage === 0}
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </IonButton>
                  <span className="px-4 py-2 text-sm text-gray-700">
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
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="text-red-600 text-sm">
                <strong>Error:</strong> {error}
              </div>
            </div>
          )}

          {/* Workers Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50 z-10">
                      Worker
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Blocks
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Rows
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Job Types
                    </th>
                    {currentPageDates.map((date) => (
                      <th
                        key={date}
                        className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase whitespace-nowrap"
                      >
                        {new Date(date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase bg-blue-50 sticky right-0 z-10">
                      Grand Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={5 + currentPageDates.length}
                        className="px-6 py-4 text-center text-gray-500"
                      >
                        <RefreshCw
                          className="animate-spin mx-auto mb-2"
                          size={24}
                        />
                        Loading workers...
                      </td>
                    </tr>
                  ) : filteredWorkers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5 + currentPageDates.length}
                        className="px-6 py-4 text-center text-gray-500"
                      >
                        No workers found
                      </td>
                    </tr>
                  ) : (
                    filteredWorkers.map((worker) => {
                      // Get unique blocks, rows, and job types for this worker
                      const blocks = [
                        ...new Set(worker.rows.map((r) => r.blockName)),
                      ].join(", ");
                      const rows = [
                        ...new Set(worker.rows.map((r) => r.rowNumber)),
                      ]
                        .sort((a, b) => {
                          const numA = parseInt(a);
                          const numB = parseInt(b);
                          return numA - numB;
                        })
                        .join(", ");
                      const jobTypes = [
                        ...new Set(worker.rows.map((r) => r.jobType)),
                      ].join(", ");

                      return (
                        <tr key={worker._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap sticky left-0 bg-white hover:bg-gray-50 z-10">
                            <div className="text-sm font-medium text-gray-900">
                              {worker.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {worker.workerID}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <div className="max-w-xs truncate" title={blocks}>
                              {blocks}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <div className="max-w-xs truncate" title={rows}>
                              {rows}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {[
                                ...new Set(worker.rows.map((r) => r.jobType)),
                              ].map((jobType, idx) => (
                                <span
                                  key={idx}
                                  className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 capitalize whitespace-nowrap"
                                >
                                  {jobType}
                                </span>
                              ))}
                            </div>
                          </td>
                          {currentPageDates.map((date) => (
                            <td
                              key={date}
                              className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900"
                            >
                              {worker.dailyTotals[date] || "-"}
                            </td>
                          ))}
                          <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-bold text-gray-900 bg-blue-50 sticky right-0 z-10">
                            {worker.rows.reduce(
                              (sum, row) => sum + row.total,
                              0
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-4 text-center text-sm text-gray-500">
            Showing {filteredWorkers.length} of {workers.length} workers
            {(searchText ||
              selectedBlock !== "all" ||
              selectedJobType !== "all") && (
              <span className="ml-2 text-blue-600">(filtered)</span>
            )}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default WorkerTotalsPage;
