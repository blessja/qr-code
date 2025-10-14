import React, { useCallback, useEffect, useState } from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonAlert,
  IonButton,
  IonBadge,
  IonModal,
  IonSelect,
  IonSelectOption,
  IonItem,
  IonLabel,
  IonInput,
} from "@ionic/react";
import {
  AlertTriangle,
  Bell,
  Eye,
  X,
  RefreshCw,
  ArrowLeftRight,
  MoveHorizontal,
  CheckCircle,
} from "lucide-react";
import WorkerBlockWidget from "../components/dashboard/widgets/WorkerBlockWidget";
import { WorkerBlockData } from "../utils/mockData";
import { ApiService } from "../services/api";
import "./Dashboard.css";
import Header from "../components/Header";
import { motion } from "framer-motion";
import { useHistory } from "react-router-dom";
import { LogIn, LogOut } from "lucide-react";

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

const Dashboard: React.FC = () => {
  const [workerBlockData, setWorkerBlockData] = useState<WorkerBlockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState(false);

  // Alert system states
  const [rowAlerts, setRowAlerts] = useState<RowAlert[]>([]);
  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const [showAlertDetails, setShowAlertDetails] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<RowAlert | null>(null);

  // Swap/Reassign states
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [swapMode, setSwapMode] = useState<"swap" | "reassign">("swap");
  const [selectedWorker1, setSelectedWorker1] = useState<string>("");
  const [selectedWorker2, setSelectedWorker2] = useState<string>("");
  const [reassignBlock, setReassignBlock] = useState<string>("");
  const [reassignRow, setReassignRow] = useState<string>("");
  const [swapLoading, setSwapLoading] = useState(false);
  const [blocks, setBlocks] = useState<string[]>([]);

  const apiBaseUrl =
    "https://farm-backend-fpbmfrgferdjdtah.southafricanorth-01.azurewebsites.net/api";

  // Check for long work sessions (>2 hours)
  const checkForLongWorkSessions = (data: WorkerBlockData[]): RowAlert[] => {
    const alerts: RowAlert[] = [];

    data.forEach((item) => {
      const startTime = new Date(item.startTime).getTime();
      const currentTime = new Date().getTime();
      const timeSpentMinutes = (currentTime - startTime) / (1000 * 60);
      const timeSpentHours = timeSpentMinutes / 60;

      if (timeSpentHours > 2 && item.remainingStocks > 0) {
        alerts.push({
          workerId: item.workerID,
          workerName: item.workerName,
          blockName: item.blockName,
          rowNumber: item.rowNumber,
          timeSpentHours: Math.floor(timeSpentHours),
          timeSpentMinutes: Math.round(timeSpentMinutes % 60),
          date: item.startTime,
          jobType: item.job_type,
        });
      }
    });

    return alerts.sort(
      (a, b) =>
        b.timeSpentHours * 60 +
        b.timeSpentMinutes -
        (a.timeSpentHours * 60 + a.timeSpentMinutes)
    );
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ApiService.getWorkerBlocks();
      setWorkerBlockData(data);

      const alerts = checkForLongWorkSessions(data);
      setRowAlerts(alerts);
    } catch (err) {
      console.error("Failed to fetch from API", err);
      setError("They are no available workers.");
      setShowAlert(true);
      setWorkerBlockData([]);
      setRowAlerts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Fetch blocks for reassignment
    fetch(apiBaseUrl + "/blocks")
      .then((response) => response.json())
      .then((data) => setBlocks(data))
      .catch((error) => console.error("Error fetching blocks:", error));
  }, [loadData]);

  const handleRefresh = () => {
    loadData();
  };

  const viewAlertDetails = (alert: RowAlert) => {
    setSelectedAlert(alert);
    setShowAlertDetails(true);
  };

  const formatTime = (hours: number, minutes: number) => {
    return `${hours}h ${minutes}m`;
  };

  const handleSwapWorkers = async () => {
    if (!selectedWorker1 || !selectedWorker2) {
      alert("Please select both workers to swap");
      return;
    }

    if (selectedWorker1 === selectedWorker2) {
      alert("Cannot swap worker with themselves");
      return;
    }

    const worker1 = workerBlockData.find((w) => w.workerID === selectedWorker1);
    const worker2 = workerBlockData.find((w) => w.workerID === selectedWorker2);

    if (!worker1 || !worker2) {
      alert("Workers not found");
      return;
    }

    setSwapLoading(true);

    try {
      // Swap by checking out both workers and checking them back in with swapped locations

      // Checkout worker 1
      await fetch(apiBaseUrl + "/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workerID: worker1.workerID,
          workerName: worker1.workerName,
          blockName: worker1.blockName,
          rowNumber: worker1.rowNumber,
          stockCount: 0, // No work completed, just swapping
          jobType: worker1.job_type,
        }),
      });

      // Checkout worker 2
      await fetch(apiBaseUrl + "/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workerID: worker2.workerID,
          workerName: worker2.workerName,
          blockName: worker2.blockName,
          rowNumber: worker2.rowNumber,
          stockCount: 0, // No work completed, just swapping
          jobType: worker2.job_type,
        }),
      });

      // Check in worker 1 to worker 2's location
      await fetch(apiBaseUrl + "/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workerID: worker1.workerID,
          workerName: worker1.workerName,
          blockName: worker2.blockName,
          rowNumber: worker2.rowNumber,
          jobType: worker2.job_type,
        }),
      });

      // Check in worker 2 to worker 1's location
      await fetch(apiBaseUrl + "/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workerID: worker2.workerID,
          workerName: worker2.workerName,
          blockName: worker1.blockName,
          rowNumber: worker1.rowNumber,
          jobType: worker1.job_type,
        }),
      });

      alert("Workers swapped successfully!");
      setShowSwapModal(false);
      setSelectedWorker1("");
      setSelectedWorker2("");
      loadData(); // Refresh data
    } catch (error) {
      console.error("Error swapping workers:", error);
      alert("Failed to swap workers. Please try again.");
    } finally {
      setSwapLoading(false);
    }
  };

  const handleReassignWorker = async () => {
    if (!selectedWorker1 || !reassignBlock || !reassignRow) {
      alert("Please fill all fields");
      return;
    }

    const worker = workerBlockData.find((w) => w.workerID === selectedWorker1);
    if (!worker) {
      alert("Worker not found");
      return;
    }

    setSwapLoading(true);

    try {
      // Checkout from current location
      await fetch(apiBaseUrl + "/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workerID: worker.workerID,
          workerName: worker.workerName,
          blockName: worker.blockName,
          rowNumber: worker.rowNumber,
          stockCount: 0,
          jobType: worker.job_type,
        }),
      });

      // Check in to new location
      await fetch(apiBaseUrl + "/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workerID: worker.workerID,
          workerName: worker.workerName,
          blockName: reassignBlock,
          rowNumber: reassignRow.toUpperCase(),
          jobType: worker.job_type,
        }),
      });

      alert("Worker reassigned successfully!");
      setShowSwapModal(false);
      setSelectedWorker1("");
      setReassignBlock("");
      setReassignRow("");
      loadData();
    } catch (error) {
      console.error("Error reassigning worker:", error);
      alert("Failed to reassign worker. Please try again.");
    } finally {
      setSwapLoading(false);
    }
  };

  const getWorkerDisplay = (workerId: string) => {
    const worker = workerBlockData.find((w) => w.workerID === workerId);
    if (!worker) return "";
    return `${worker.workerName} - ${worker.blockName}, Row ${worker.rowNumber} (${worker.job_type})`;
  };

  const totalAlerts = rowAlerts.length;
  const history = useHistory();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <div className="flex ml-20 sm:ml-5 items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => history.push("/checkin")}
              className="flex items-center space-x-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-md transition-colors duration-200 text-sm font-medium"
            >
              <LogIn size={16} />
              <span className="hidden sm:inline">Check-in</span>
              <span className="sm:hidden">In</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => history.push("/checkout")}
              className="flex items-center space-x-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition-colors duration-200 text-sm font-medium"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Check-out</span>
              <span className="sm:hidden">Out</span>
            </motion.button>

            {/* Swap/Reassign Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSwapModal(true)}
              className="flex items-center space-x-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-md transition-colors duration-200 text-sm font-medium"
              disabled={workerBlockData.length < 2}
            >
              <ArrowLeftRight size={16} />
              <span className="hidden sm:inline">Swap/Move</span>
              <span className="sm:hidden">Swap</span>
            </motion.button>
          </div>
          <div slot="end" className="flex items-center gap-2 mr-4">
            <IonButton
              fill="clear"
              color={totalAlerts > 0 ? "warning" : "medium"}
              onClick={() => setShowAlertsModal(true)}
            >
              <Bell size={20} />
              {totalAlerts > 0 && (
                <IonBadge color="warning" style={{ marginLeft: "4px" }}>
                  {totalAlerts}
                </IonBadge>
              )}
            </IonButton>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header="Connection Error"
          message={error || ""}
          buttons={["OK"]}
        />

        <div className="dashboard-container">
          <div className="dashboard-header">
            <h1 className="text-2xl font-bold text-gray-900">
              Worker Dashboard
            </h1>
            <p className="text-gray-500">
              Track worker assignments and progress in real-time.
            </p>
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

          {/* Worker Block Widget */}
          <div>
            <WorkerBlockWidget
              title="Worker Assignments & Progress"
              data={workerBlockData}
              isLoading={loading}
              onRefresh={handleRefresh}
            />
          </div>
        </div>

        {/* Swap/Reassign Modal */}
        <IonModal
          isOpen={showSwapModal}
          onDidDismiss={() => {
            setShowSwapModal(false);
            setSelectedWorker1("");
            setSelectedWorker2("");
            setReassignBlock("");
            setReassignRow("");
          }}
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>
                {swapMode === "swap" ? "Swap Workers" : "Reassign Worker"}
              </IonTitle>
              <IonButton
                slot="end"
                fill="clear"
                onClick={() => setShowSwapModal(false)}
              >
                <X size={24} />
              </IonButton>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <div className="max-w-2xl mx-auto">
              {/* Mode Selector */}
              <div className="mb-6">
                <div className="flex gap-2">
                  <button
                    onClick={() => setSwapMode("swap")}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                      swapMode === "swap"
                        ? "border-purple-600 bg-purple-50 text-purple-700"
                        : "border-gray-300 bg-white text-gray-700"
                    }`}
                  >
                    <ArrowLeftRight className="inline-block mr-2" size={20} />
                    <span className="font-medium">Swap Two Workers</span>
                  </button>
                  <button
                    onClick={() => setSwapMode("reassign")}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                      swapMode === "reassign"
                        ? "border-purple-600 bg-purple-50 text-purple-700"
                        : "border-gray-300 bg-white text-gray-700"
                    }`}
                  >
                    <MoveHorizontal className="inline-block mr-2" size={20} />
                    <span className="font-medium">Move One Worker</span>
                  </button>
                </div>
              </div>

              {swapMode === "swap" ? (
                <>
                  {/* Swap Mode */}
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800">
                        Select two workers to swap their block and row
                        assignments. Their job types will also be swapped.
                      </p>
                    </div>

                    <IonItem>
                      <IonLabel position="stacked">First Worker</IonLabel>
                      <IonSelect
                        value={selectedWorker1}
                        onIonChange={(e) => setSelectedWorker1(e.detail.value)}
                        placeholder="Select first worker"
                      >
                        {workerBlockData.map((worker) => (
                          <IonSelectOption
                            key={worker.workerID}
                            value={worker.workerID}
                          >
                            {worker.workerName} - {worker.blockName}, Row{" "}
                            {worker.rowNumber} ({worker.job_type})
                          </IonSelectOption>
                        ))}
                      </IonSelect>
                    </IonItem>

                    <div className="flex justify-center py-2">
                      <ArrowLeftRight className="text-purple-600" size={32} />
                    </div>

                    <IonItem>
                      <IonLabel position="stacked">Second Worker</IonLabel>
                      <IonSelect
                        value={selectedWorker2}
                        onIonChange={(e) => setSelectedWorker2(e.detail.value)}
                        placeholder="Select second worker"
                      >
                        {workerBlockData
                          .filter((w) => w.workerID !== selectedWorker1)
                          .map((worker) => (
                            <IonSelectOption
                              key={worker.workerID}
                              value={worker.workerID}
                            >
                              {worker.workerName} - {worker.blockName}, Row{" "}
                              {worker.rowNumber} ({worker.job_type})
                            </IonSelectOption>
                          ))}
                      </IonSelect>
                    </IonItem>

                    {selectedWorker1 && selectedWorker2 && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-sm font-medium text-green-800 mb-2">
                          Preview:
                        </p>
                        <div className="space-y-1 text-sm text-green-700">
                          <p>
                            ✓{" "}
                            {
                              workerBlockData.find(
                                (w) => w.workerID === selectedWorker1
                              )?.workerName
                            }{" "}
                            will move to{" "}
                            {
                              workerBlockData.find(
                                (w) => w.workerID === selectedWorker2
                              )?.blockName
                            }
                            , Row{" "}
                            {
                              workerBlockData.find(
                                (w) => w.workerID === selectedWorker2
                              )?.rowNumber
                            }
                          </p>
                          <p>
                            ✓{" "}
                            {
                              workerBlockData.find(
                                (w) => w.workerID === selectedWorker2
                              )?.workerName
                            }{" "}
                            will move to{" "}
                            {
                              workerBlockData.find(
                                (w) => w.workerID === selectedWorker1
                              )?.blockName
                            }
                            , Row{" "}
                            {
                              workerBlockData.find(
                                (w) => w.workerID === selectedWorker1
                              )?.rowNumber
                            }
                          </p>
                        </div>
                      </div>
                    )}

                    <IonButton
                      expand="block"
                      onClick={handleSwapWorkers}
                      disabled={
                        !selectedWorker1 || !selectedWorker2 || swapLoading
                      }
                      color="success"
                    >
                      {swapLoading ? "Swapping..." : "Swap Workers"}
                      <CheckCircle className="ml-2" size={20} />
                    </IonButton>
                  </div>
                </>
              ) : (
                <>
                  {/* Reassign Mode */}
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800">
                        Move a worker to a different block and row. The worker
                        will keep their current job type.
                      </p>
                    </div>

                    <IonItem>
                      <IonLabel position="stacked">Select Worker</IonLabel>
                      <IonSelect
                        value={selectedWorker1}
                        onIonChange={(e) => setSelectedWorker1(e.detail.value)}
                        placeholder="Select worker to move"
                      >
                        {workerBlockData.map((worker) => (
                          <IonSelectOption
                            key={worker.workerID}
                            value={worker.workerID}
                          >
                            {worker.workerName} - Currently at{" "}
                            {worker.blockName}, Row {worker.rowNumber}
                          </IonSelectOption>
                        ))}
                      </IonSelect>
                    </IonItem>

                    <IonItem>
                      <IonLabel position="stacked">New Block</IonLabel>
                      <IonSelect
                        value={reassignBlock}
                        onIonChange={(e) => setReassignBlock(e.detail.value)}
                        placeholder="Select new block"
                      >
                        {blocks.map((block) => (
                          <IonSelectOption key={block} value={block}>
                            {block}
                          </IonSelectOption>
                        ))}
                      </IonSelect>
                    </IonItem>

                    <IonItem>
                      <IonLabel position="stacked">New Row Number</IonLabel>
                      <IonInput
                        value={reassignRow}
                        onIonInput={(e: any) =>
                          setReassignRow(e.target.value.toUpperCase())
                        }
                        placeholder="e.g., 5A, 12B"
                      />
                    </IonItem>

                    {selectedWorker1 && reassignBlock && reassignRow && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-sm font-medium text-green-800 mb-2">
                          Preview:
                        </p>
                        <p className="text-sm text-green-700">
                          ✓{" "}
                          {
                            workerBlockData.find(
                              (w) => w.workerID === selectedWorker1
                            )?.workerName
                          }{" "}
                          will move from{" "}
                          {
                            workerBlockData.find(
                              (w) => w.workerID === selectedWorker1
                            )?.blockName
                          }
                          , Row{" "}
                          {
                            workerBlockData.find(
                              (w) => w.workerID === selectedWorker1
                            )?.rowNumber
                          }{" "}
                          → {reassignBlock}, Row {reassignRow}
                        </p>
                      </div>
                    )}

                    <IonButton
                      expand="block"
                      onClick={handleReassignWorker}
                      disabled={
                        !selectedWorker1 ||
                        !reassignBlock ||
                        !reassignRow ||
                        swapLoading
                      }
                      color="success"
                    >
                      {swapLoading ? "Moving..." : "Move Worker"}
                      <CheckCircle className="ml-2" size={20} />
                    </IonButton>
                  </div>
                </>
              )}
            </div>
          </IonContent>
        </IonModal>

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
                console.log("Alert marked as reviewed");
              },
            },
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default Dashboard;
