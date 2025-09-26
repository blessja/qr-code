import React, { useState, useEffect } from "react";
import {
  RefreshCw,
  Download,
  Users,
  Clock,
  TrendingUp,
  FileText,
  AlertTriangle,
  Bell,
  Eye,
  X,
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
  IonBadge,
  IonModal,
  IonList,
  IonAlert,
} from "@ionic/react";
import { ApiService } from "../services/api";

interface WorkerData {
  _id: string;
  workerID: string;
  name: string;
  total_stock_count: number;
  jobType?: string;
  blocks: Array<{
    block_name: string;
    rows: Array<{
      row_number: string;
      stock_count: number;
      time_spent: number; // in minutes from backend
      date: string;
      day_of_week: string;
      job_type?: string;
    }>;
    _id: string;
  }>;
}

interface RowAlert {
  workerId: string;
  workerName: string;
  blockName: string;
  rowNumber: string;
  timeSpentHours: number;
  timeSpentMinutes: number;
  date: string;
  jobType?: string;
}

interface ProcessedWorkerData extends WorkerData {
  totalHours: number;
  daysWorked: number;
  position: number;
  efficiency: string;
  primaryJobType: string;
  workDates: string[];
  longWorkRowsCount: number; // Count of rows worked > 2 hours
}

const WorkerTotalsPage: React.FC = () => {
  const [workers, setWorkers] = useState<ProcessedWorkerData[]>([]);
  const [filteredWorkers, setFilteredWorkers] = useState<ProcessedWorkerData[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedEfficiency, setSelectedEfficiency] = useState<string>("all");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Notification system
  const [rowAlerts, setRowAlerts] = useState<RowAlert[]>([]);
  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const [showAlertDetails, setShowAlertDetails] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<RowAlert | null>(null);

  // Get primary job type for a worker
  const getPrimaryJobType = (worker: WorkerData): string => {
    if (worker.jobType) return worker.jobType.toLowerCase();

    const jobTypes: { [key: string]: number } = {};
    worker.blocks.forEach((block) => {
      block.rows.forEach((row) => {
        const jobType = (row.job_type || "other").toLowerCase();
        jobTypes[jobType] = (jobTypes[jobType] || 0) + 1;
      });
    });

    const primaryJobType = Object.keys(jobTypes).reduce(
      (a, b) => (jobTypes[a] > jobTypes[b] ? a : b),
      "other"
    );

    return primaryJobType || "other";
  };

  // Get work dates for a worker
  const getWorkerWorkDates = (worker: WorkerData): string[] => {
    const workDates = new Set<string>();
    worker.blocks.forEach((block) => {
      block.rows.forEach((row) => {
        if (row.date) {
          const dateOnly = row.date.split("T")[0];
          workDates.add(dateOnly);
        }
      });
    });
    return Array.from(workDates).sort();
  };

  // Check for rows with excessive work time (>2 hours = 120 minutes)
  const checkForLongWorkSessions = (workers: WorkerData[]): RowAlert[] => {
    const alerts: RowAlert[] = [];

    workers.forEach((worker) => {
      worker.blocks.forEach((block) => {
        block.rows.forEach((row) => {
          const timeInMinutes = row.time_spent || 0;
          const timeInHours = timeInMinutes / 60;

          // Alert for sessions longer than 2 hours
          if (timeInHours > 2) {
            alerts.push({
              workerId: worker.workerID,
              workerName: worker.name,
              blockName: block.block_name,
              rowNumber: row.row_number,
              timeSpentHours: Math.floor(timeInHours),
              timeSpentMinutes: Math.round(timeInMinutes % 60),
              date: row.date,
              jobType: row.job_type,
            });
          }
        });
      });
    });

    // Sort by time spent (longest first)
    return alerts.sort(
      (a, b) =>
        b.timeSpentHours * 60 +
        b.timeSpentMinutes -
        (a.timeSpentHours * 60 + a.timeSpentMinutes)
    );
  };

  // Process worker data using actual time_spent from check-in/out
  const processWorkerData = (
    rawWorkers: WorkerData[]
  ): ProcessedWorkerData[] => {
    return rawWorkers
      .map((worker) => {
        const primaryJobType = getPrimaryJobType(worker);
        const workDates = getWorkerWorkDates(worker);
        const daysWorked = workDates.length;

        // Calculate total hours from time_spent (convert minutes to hours)
        const totalMinutes = worker.blocks.reduce((blockSum, block) => {
          return (
            blockSum +
            block.rows.reduce((rowSum, row) => {
              return rowSum + (row.time_spent || 0);
            }, 0)
          );
        }, 0);

        const totalHours = totalMinutes / 60; // Convert to hours

        // Count rows with > 2 hours work
        const longWorkRowsCount = worker.blocks.reduce((count, block) => {
          return (
            count +
            block.rows.filter((row) => (row.time_spent || 0) > 120).length
          );
        }, 0);

        // Calculate position (vines per hour)
        const position =
          totalHours > 0 ? worker.total_stock_count / totalHours : 0;

        // Determine efficiency rating
        let efficiency = "Low";
        if (position > 50) efficiency = "Excellent";
        else if (position > 30) efficiency = "High";
        else if (position > 15) efficiency = "Medium";

        return {
          ...worker,
          primaryJobType,
          workDates,
          daysWorked,
          totalHours: Math.round(totalHours * 100) / 100,
          position: Math.round(position * 100) / 100,
          efficiency,
          longWorkRowsCount,
        };
      })
      .sort((a, b) => {
        if (b.total_stock_count !== a.total_stock_count) {
          return b.total_stock_count - a.total_stock_count;
        }
        return b.totalHours - a.totalHours;
      });
  };

  // Fetch workers data
  const fetchWorkers = async () => {
    setLoading(true);
    setError(null);

    try {
      const data: WorkerData[] = await ApiService.getWorkers();
      const processedData = processWorkerData(data);
      const alerts = checkForLongWorkSessions(data);

      setWorkers(processedData);
      setRowAlerts(alerts);
      applyFilters(processedData, searchText, selectedEfficiency);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching workers:", error);
      setError("Failed to load worker data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  const applyFilters = (
    workerList: ProcessedWorkerData[],
    search: string,
    efficiency: string
  ) => {
    let filtered = [...workerList];

    if (search && search.trim()) {
      const searchTerm = search.toLowerCase().trim();
      filtered = filtered.filter(
        (worker) =>
          worker.name.toLowerCase().includes(searchTerm) ||
          worker.workerID.toLowerCase().includes(searchTerm) ||
          worker.primaryJobType.toLowerCase().includes(searchTerm)
      );
    }

    if (efficiency && efficiency !== "all") {
      filtered = filtered.filter((worker) => worker.efficiency === efficiency);
    }

    setFilteredWorkers(filtered);
  };

  // Handle search
  const handleSearch = (text: string) => {
    setSearchText(text);
    applyFilters(workers, text, selectedEfficiency);
  };

  // Handle efficiency filter
  const handleEfficiencyFilter = (efficiency: string) => {
    setSelectedEfficiency(efficiency);
    applyFilters(workers, searchText, efficiency);
  };

  // View alert details
  const viewAlertDetails = (alert: RowAlert) => {
    setSelectedAlert(alert);
    setShowAlertDetails(true);
  };

  useEffect(() => {
    fetchWorkers();
    const interval = setInterval(fetchWorkers, 300000); // 5 minutes
    return () => clearInterval(interval);
  }, []);

  // Calculate summary statistics
  const totalWorkers = filteredWorkers.length;
  const totalVines = filteredWorkers.reduce(
    (sum, worker) => sum + worker.total_stock_count,
    0
  );
  const totalHours = filteredWorkers.reduce(
    (sum, worker) => sum + worker.totalHours,
    0
  );
  const averagePosition = totalHours > 0 ? totalVines / totalHours : 0;
  const totalAlerts = rowAlerts.length;

  const exportToPDF = () => {
    console.log("Exporting to PDF...", filteredWorkers);
  };

  const getEfficiencyColor = (efficiency: string) => {
    switch (efficiency) {
      case "Excellent":
        return "text-green-600 bg-green-100";
      case "High":
        return "text-blue-600 bg-blue-100";
      case "Medium":
        return "text-yellow-600 bg-yellow-100";
      default:
        return "text-red-600 bg-red-100";
    }
  };

  const formatTime = (hours: number, minutes: number) => {
    return `${hours}h ${minutes}m`;
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Worker Performance Totals</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Worker Performance Dashboard
                </h1>
                {lastUpdated && (
                  <p className="text-sm text-gray-600 mt-1">
                    Last updated: {lastUpdated.toLocaleString()} • Using Actual
                    Check-in/out Times
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                {/* Alerts Button */}
                <IonButton
                  fill="outline"
                  color={totalAlerts > 0 ? "warning" : "medium"}
                  onClick={() => setShowAlertsModal(true)}
                >
                  <Bell size={16} />
                  Alerts
                  {totalAlerts > 0 && (
                    <IonBadge color="warning" className="ml-2">
                      {totalAlerts}
                    </IonBadge>
                  )}
                </IonButton>

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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
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
                <Clock className="h-8 w-8 text-purple-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">
                    Total Hours
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {totalHours.toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-500">From Check-in/out</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-orange-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">
                    Avg. Position
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {averagePosition.toFixed(1)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <AlertTriangle
                  className={`h-8 w-8 ${
                    totalAlerts > 0 ? "text-red-600" : "text-gray-400"
                  }`}
                />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">
                    Long Sessions
                  </p>
                  <p
                    className={`text-2xl font-semibold ${
                      totalAlerts > 0 ? "text-red-600" : "text-gray-900"
                    }`}
                  >
                    {totalAlerts}
                  </p>
                  <p className="text-xs text-gray-500">&gt;2 hours</p>
                </div>
              </div>
            </div>
          </div>

          {/* Alert Banner */}
          {totalAlerts > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                  <span className="text-yellow-800 font-medium">
                    {totalAlerts} workers have sessions longer than 2 hours
                  </span>
                </div>
                <IonButton
                  fill="clear"
                  size="small"
                  color="warning"
                  onClick={() => setShowAlertsModal(true)}
                >
                  View Details
                </IonButton>
              </div>
            </div>
          )}

          {/* Filters Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <IonSearchbar
                  value={searchText}
                  onIonInput={(e) => handleSearch(e.detail.value!)}
                  placeholder="Search by worker name, ID, or job type..."
                  showClearButton="focus"
                />
              </div>

              <div className="md:w-48">
                <IonItem className="mb-0">
                  <IonLabel>Efficiency Filter</IonLabel>
                  <IonSelect
                    value={selectedEfficiency}
                    placeholder="All"
                    onIonChange={(e) => handleEfficiencyFilter(e.detail.value)}
                  >
                    <IonSelectOption value="all">All Levels</IonSelectOption>
                    <IonSelectOption value="Excellent">
                      Excellent
                    </IonSelectOption>
                    <IonSelectOption value="High">High</IonSelectOption>
                    <IonSelectOption value="Medium">Medium</IonSelectOption>
                    <IonSelectOption value="Low">Low</IonSelectOption>
                  </IonSelect>
                </IonItem>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <div className="text-red-600 text-sm">
                  <strong>Error:</strong> {error}
                </div>
              </div>
            </div>
          )}

          {/* Workers Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Worker ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Job Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Vines
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Days Worked
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Hours
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Position (Vines/Hr)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Efficiency
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Alerts
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={10}
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
                        colSpan={10}
                        className="px-6 py-4 text-center text-gray-500"
                      >
                        {searchText || selectedEfficiency !== "all"
                          ? "No workers match your filters"
                          : "No workers found"}
                      </td>
                    </tr>
                  ) : (
                    filteredWorkers.map((worker, index) => (
                      <tr key={worker._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span
                              className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-medium ${
                                index === 0
                                  ? "bg-yellow-100 text-yellow-800"
                                  : index === 1
                                  ? "bg-gray-100 text-gray-800"
                                  : index === 2
                                  ? "bg-orange-100 text-orange-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {index + 1}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {worker.workerID || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {worker.name || "Unknown"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">
                          {worker.primaryJobType}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                          {worker.total_stock_count.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {worker.daysWorked}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {worker.totalHours}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {worker.position}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEfficiencyColor(
                              worker.efficiency
                            )}`}
                          >
                            {worker.efficiency}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {worker.longWorkRowsCount > 0 ? (
                            <IonBadge color="warning">
                              {worker.longWorkRowsCount}
                            </IonBadge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-4 text-center text-sm text-gray-500">
            Showing {filteredWorkers.length} of {workers.length} workers
            {(searchText || selectedEfficiency !== "all") && (
              <span className="ml-2 text-blue-600">(filtered)</span>
            )}
          </div>
        </div>

        {/* Alerts Modal */}
        <IonModal
          isOpen={showAlertsModal}
          onDidDismiss={() => setShowAlertsModal(false)}
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>Work Session Alerts</IonTitle>
              <IonButton
                slot="end"
                fill="clear"
                onClick={() => setShowAlertsModal(false)}
              >
                <X size={24} />
              </IonButton>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <div className="max-w-4xl mx-auto">
              {rowAlerts.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">
                    <AlertTriangle
                      size={48}
                      className="mx-auto mb-4 text-gray-300"
                    />
                    <h3 className="text-lg font-medium">
                      No Long Sessions Found
                    </h3>
                    <p>All work sessions are under 2 hours</p>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Sessions Longer Than 2 Hours ({rowAlerts.length})
                    </h3>
                    <p className="text-sm text-gray-600">
                      Monitor worker wellbeing and productivity
                    </p>
                  </div>

                  <div className="space-y-3">
                    {rowAlerts.map((alert, index) => (
                      <div
                        key={index}
                        className="bg-white border border-orange-200 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertTriangle className="h-5 w-5 text-orange-500" />
                              <span className="font-medium text-gray-900">
                                {alert.workerName} ({alert.workerId})
                              </span>
                              <IonBadge color="warning">
                                {formatTime(
                                  alert.timeSpentHours,
                                  alert.timeSpentMinutes
                                )}
                              </IonBadge>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">Block:</span>{" "}
                                {alert.blockName}
                              </div>
                              <div>
                                <span className="font-medium">Row:</span>{" "}
                                {alert.rowNumber}
                              </div>
                              <div>
                                <span className="font-medium">Job:</span>{" "}
                                {alert.jobType || "N/A"}
                              </div>
                              <div>
                                <span className="font-medium">Date:</span>{" "}
                                {new Date(alert.date).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <IonButton
                            fill="outline"
                            size="small"
                            onClick={() => viewAlertDetails(alert)}
                          >
                            <Eye size={16} />
                            Details
                          </IonButton>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </IonContent>
        </IonModal>

        {/* Alert Details Modal */}
        <IonAlert
          isOpen={showAlertDetails}
          onDidDismiss={() => setShowAlertDetails(false)}
          header="Work Session Details"
          message={
            selectedAlert
              ? `
            <strong>Worker:</strong> ${selectedAlert.workerName} (${
                  selectedAlert.workerId
                })<br>
            <strong>Location:</strong> ${selectedAlert.blockName} - Row ${
                  selectedAlert.rowNumber
                }<br>
            <strong>Duration:</strong> ${formatTime(
              selectedAlert.timeSpentHours,
              selectedAlert.timeSpentMinutes
            )}<br>
            <strong>Job Type:</strong> ${
              selectedAlert.jobType || "Not specified"
            }<br>
            <strong>Date:</strong> ${
              selectedAlert.date
                ? new Date(selectedAlert.date).toLocaleString()
                : "Unknown"
            }<br><br>
            <em>Consider checking worker wellbeing and workload distribution.</em>
          `
              : ""
          }
          buttons={[
            {
              text: "Close",
              role: "cancel",
            },
            {
              text: "Mark as Reviewed",
              handler: () => {
                // You could implement a "reviewed" status here
                console.log("Alert marked as reviewed");
              },
            },
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default WorkerTotalsPage;
