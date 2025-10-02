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
} from "@ionic/react";
import { AlertTriangle, Bell, Eye, X, RefreshCw } from "lucide-react";
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

  // Check for long work sessions (>2 hours)
  const checkForLongWorkSessions = (data: WorkerBlockData[]): RowAlert[] => {
    const alerts: RowAlert[] = [];

    data.forEach((item) => {
      // Calculate time spent from startTime to current time or completion
      // Assuming each row has a time_spent property or we calculate from timestamps
      const startTime = new Date(item.startTime).getTime();
      const currentTime = new Date().getTime();
      const timeSpentMinutes = (currentTime - startTime) / (1000 * 60);
      const timeSpentHours = timeSpentMinutes / 60;

      // Alert for sessions longer than 2 hours that are still in progress
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

    // Sort by time spent (longest first)
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

      // Check for alerts
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
