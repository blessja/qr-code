import React, { useCallback, useEffect, useState } from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonAlert,
} from "@ionic/react";
import WorkerBlockWidget from "../components/dashboard/widgets/WorkerBlockWidget";
import { WorkerBlockData } from "../utils/mockData";
import { ApiService } from "../services/api";
import "./Dashboard.css";

const Dashboard: React.FC = () => {
  const [workerBlockData, setWorkerBlockData] = useState<WorkerBlockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Try to fetch data from the API
      const data = await ApiService.getWorkerBlocks();
      setWorkerBlockData(data);
    } catch (err) {
      console.error("Failed to fetch from API", err);
      setError("Failed to connect to the server.");
      setShowAlert(true);
      setWorkerBlockData([]); // Clear data on error
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

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Worker Dashboard</IonTitle>
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
              Track worker assignments, progress, and stock management in
              real-time.
            </p>
          </div>
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
      </IonContent>
    </IonPage>
  );
};

export default Dashboard;
