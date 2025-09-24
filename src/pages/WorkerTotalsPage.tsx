import React, { useState, useEffect } from "react";
import {
  RefreshCw,
  Download,
  Search,
  Users,
  Clock,
  TrendingUp,
  FileText,
  Filter,
  Calendar,
  Target,
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
import { workerService, ProcessedWorkerData } from "../services/workerService";
import { exportWorkersToPDF } from "../utils/pdfExport";

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
      time_spent: number;
      date: string;
      day_of_week: string;
    }>;
  }>;
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

  // Fetch workers data
  const fetchWorkers = async () => {
    setLoading(true);
    setError(null);

    try {
      const rawData = await workerService.fetchWorkers();
      const processedData = workerService.processWorkerData(rawData);

      setWorkers(processedData);
      applyFilters(processedData, searchText, selectedEfficiency);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching workers:", error);
      setError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  // Apply all filters
  const applyFilters = (
    workerList: ProcessedWorkerData[],
    search: string,
    efficiency: string
  ) => {
    const filtered = workerService.filterWorkers(workerList, {
      searchText: search,
      efficiency: efficiency === "all" ? undefined : efficiency,
    });
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

  // Auto-refresh every 2 minutes
  useEffect(() => {
    fetchWorkers();
    const interval = setInterval(fetchWorkers, 120000); // 2 minutes
    return () => clearInterval(interval);
  }, []);

  // Calculate summary statistics using the service
  const stats = workerService.getWorkerStatistics(filteredWorkers);

  const exportToPDF = () => {
    exportWorkersToPDF(filteredWorkers, "Worker Performance Report");
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">
                    Total Workers
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.totalWorkers}
                  </p>
                  <p className="text-xs text-gray-500">
                    {stats.activeWorkersCount} active
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">
                    Total Vines
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.totalVines.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    Avg: {stats.averageVinesPerWorker}/worker
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-purple-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">
                    Total Hours
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.totalHours.toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Avg: {stats.averageHoursPerWorker}/worker
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-orange-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">
                    Avg. Position
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.averagePosition.toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-500">vines per hour</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <IonSearchbar
                  value={searchText}
                  onIonInput={(e) => handleSearch(e.detail.value!)}
                  placeholder="Search by worker name or ID..."
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
                      Total Vines
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hours Worked
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Position (Vines/Hr)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Efficiency
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Days Worked
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Active
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={9}
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
                        colSpan={9}
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {worker.total_stock_count.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {worker.totalDays}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {worker.lastActiveDate === "Never"
                            ? "Never"
                            : new Date(
                                worker.lastActiveDate
                              ).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between text-sm text-gray-500">
            <div>
              Showing {filteredWorkers.length} of {workers.length} workers
              {(searchText || selectedEfficiency !== "all") && (
                <span className="ml-2 text-blue-600">(filtered)</span>
              )}
            </div>
            <div className="mt-2 md:mt-0">
              <span className="inline-flex items-center gap-4">
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                  Excellent: {stats.efficiencyDistribution.Excellent || 0}
                </span>
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                  High: {stats.efficiencyDistribution.High || 0}
                </span>
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></span>
                  Medium: {stats.efficiencyDistribution.Medium || 0}
                </span>
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span>
                  Low: {stats.efficiencyDistribution.Low || 0}
                </span>
              </span>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default WorkerTotalsPage;
