import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonRow,
  IonCol,
  IonLabel,
  IonButton,
  IonGrid,
} from "@ionic/react";
import axios from "axios";
import * as XLSX from "xlsx";
import "./ClockDashboard.css";

interface ClockInOutData {
  workerID: string;
  workerName: string;
  workedHoursPerDay: { [key: string]: number }; // e.g., { "Monday": 5, "Tuesday": 6, "Wednesday": 4 }
}

const daysOfWeek = [
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Monday",
  "Tuesday",
];

// Function to format hours into 'hours mins' format
const formatHoursToTime = (hours: number) => {
  const h = Math.floor(hours); // Get the integer part for hours
  const m = Math.round((hours - h) * 60); // Convert the fractional part to minutes
  return `${h}h ${m}m`;
};

const ClockDashboard: React.FC = () => {
  const [clockData, setClockData] = useState<ClockInOutData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          "https://farm-managment-app.onrender.com/api/clocks"
        );
        setClockData(response.data);
      } catch (error) {
        console.error("Error fetching data:", (error as Error).message);
      }
    };

    fetchData();
  }, []);

  const exportToExcel = () => {
    const exportData = clockData.map((data) => {
      const rowData: any = {
        WorkerID: data.workerID,
        WorkerName: data.workerName,
      };

      // Add each day of the week to the export data
      daysOfWeek.forEach((day) => {
        const hours = data.workedHoursPerDay[day] || 0; // Default to 0 if no data
        rowData[day] = formatHoursToTime(hours); // Format the hours into 'h m' format
      });

      return rowData;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Set column widths for a better layout in Excel
    worksheet["!cols"] = [
      { wch: 12 }, // Worker ID
      { wch: 20 }, // Worker Name
      { wch: 12 }, // Space between name and days
      { wch: 12 }, // wednesday
      { wch: 12 }, // thursday
      { wch: 12 }, // friday
      { wch: 12 }, // saturday
      { wch: 12 }, // Monday
      { wch: 12 }, // Tuesday
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Clock Data");

    XLSX.writeFile(workbook, "clock_data.xlsx");
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Clock Dashboard</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonGrid>
          {/* Table Header */}
          <IonRow>
            <IonCol className="centered-col">
              <IonLabel>Worker ID</IonLabel>
            </IonCol>
            <IonCol className="centered-col">
              <IonLabel>Worker Name</IonLabel>
            </IonCol>
            <IonCol className="centered-col space-col" />
            {daysOfWeek.map((day, index) => (
              <IonCol key={index} className="centered-col">
                <IonLabel>{day}</IonLabel>
              </IonCol>
            ))}
          </IonRow>

          {/* Table Data */}
          {clockData.map((data, index) => (
            <IonRow key={index}>
              <IonCol className="centered-col">{data.workerID}</IonCol>
              <IonCol className="centered-col">{data.workerName}</IonCol>
              <IonCol className="centered-col space-col" />
              {daysOfWeek.map((day, dayIndex) => (
                <IonCol key={dayIndex} className="centered-col">
                  {formatHoursToTime(data.workedHoursPerDay[day] || 0)}
                </IonCol>
              ))}
            </IonRow>
          ))}
        </IonGrid>

        <IonButton
          style={{ marginTop: "40px" }}
          expand="block"
          onClick={exportToExcel}
        >
          Export to Excel
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default ClockDashboard;
