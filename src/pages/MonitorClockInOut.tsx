import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonLoading,
  IonCard,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonText,
} from "@ionic/react";
import "./MonitorClockInOut.css";

const MonitorClockInOut: React.FC = () => {
  const [clockData, setClockData] = useState<any>(null); // Initially null to handle loading
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClockData = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5003/api/monitor-clockins"
        );
        setClockData(response.data); // Store the full response
      } catch (error) {
        setError("Error fetching clock-in/out data.");
        console.error(error);
      }
    };

    fetchClockData();
  }, []);

  if (clockData === null) {
    return <IonLoading isOpen={true} message={"Loading..."} />;
  }

  if (clockData.message) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Clock-in/Clock-out Monitoring</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <IonText style={{ fontSize: "18px", fontWeight: "bold" }}>
              {clockData.message}
            </IonText>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Clock-in/Clock-out Monitoring</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {clockData.workersWithUnclockedSessions.length === 0 ? (
          <IonText style={{ fontSize: "18px", fontWeight: "bold" }}>
            All workers have clocked out.
          </IonText>
        ) : (
          <IonList>
            {clockData.workersWithUnclockedSessions.map((worker: any) => (
              <IonCard key={worker.workerID}>
                <IonCardHeader>
                  <IonCardSubtitle>
                    Worker ID: {worker.workerID}
                  </IonCardSubtitle>
                  <IonCardTitle>{worker.workerName}</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonList>
                    {worker.unclockedSessions.map(
                      (session: any, index: number) => (
                        <IonItem key={index}>
                          <IonLabel>
                            <h2>
                              Clock In Time:{" "}
                              {new Date(session.clockInTime).toLocaleString()}
                            </h2>
                            <p>Day: {session.day}</p>
                          </IonLabel>
                        </IonItem>
                      )
                    )}
                  </IonList>
                </IonCardContent>
              </IonCard>
            ))}
          </IonList>
        )}
      </IonContent>
    </IonPage>
  );
};

export default MonitorClockInOut;
