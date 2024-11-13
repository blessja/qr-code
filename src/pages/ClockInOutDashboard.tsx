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
import moment from "moment";
import jsPDF from "jspdf";
import "jspdf-autotable";
import "./ClockDashboard.css";
import config from "../config";

// Define interfaces for data types
interface WorkedHoursEntry {
  date: string; // Date in YYYY-MM-DD format
  hours: number; // Hours worked on that date
}

interface ClockInEntry {
  clockInTime: string;
  duration: number;
}

interface ClockInOutData {
  workerID: string;
  workerName: string;
  workedHoursPerDay: WorkedHoursEntry[];
  clockIns: ClockInEntry[];
}
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}
const ClockDashboard: React.FC = () => {
  const [clockData, setClockData] = useState<ClockInOutData[]>([]);
  const [currentWeek, setCurrentWeek] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fixedStartDate, setFixedStartDate] = useState<moment.Moment | null>(
    null
  );

  useEffect(() => {
    const fetchEarliestDateAndData = async () => {
      try {
        const dateResponse = await axios.get(
          `${config.apiBaseUrl}/earliest-clock-in`
        );
        const earliestDate = moment(dateResponse.data.earliestClockInDate);
        setFixedStartDate(earliestDate);

        const response = await axios.get(`${config.apiBaseUrl}/clocks`);
        const sortedData = response.data.sort(
          (a: ClockInOutData, b: ClockInOutData) =>
            parseInt(a.workerID, 10) - parseInt(b.workerID, 10)
        );

        const updatedData = sortedData.map((item: ClockInOutData) => ({
          ...item,
          workedHoursPerDay: calculateWorkedHours([item]),
        }));

        setClockData(updatedData);

        const week = getCurrentWeek(earliestDate);
        setCurrentWeek(week);
        console.log("Current week dates:", week);
      } catch (error) {
        console.error("Error fetching data:", (error as Error).message);
      }
    };

    fetchEarliestDateAndData();
  }, []);

  const getCurrentWeek = (startDate: moment.Moment): string[] => {
    const weekDates: string[] = [];

    let date = startDate.clone();
    while (date.day() !== 3) {
      date.add(1, "day");
    }

    for (let i = 0; i < 6; ) {
      if (date.day() !== 0) {
        weekDates.push(date.format("YYYY-MM-DD"));
        i++;
      }
      date.add(1, "day");
    }

    return weekDates;
  };

  const calculateWorkedHours = (data: ClockInOutData[]): WorkedHoursEntry[] => {
    const workedHoursMap: { [key: string]: number } = {};

    data.forEach((item) => {
      item.clockIns.forEach((entry) => {
        const entryDate = moment(entry.clockInTime).format("YYYY-MM-DD");
        workedHoursMap[entryDate] =
          (workedHoursMap[entryDate] || 0) + entry.duration;
      });
    });

    return Object.keys(workedHoursMap).map((date) => ({
      date,
      hours: workedHoursMap[date],
    }));
  };

  const formatHoursAndMinutes = (hours: number) => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours} hrs ${minutes > 0 ? `${minutes} mins` : ""}`;
  };

  const daysOfWeek = ["Wed", "Thu", "Fri", "Sat", "Mon", "Tue"];

  const exportToExcel = () => {
    const exportData = [];

    const headerRow: any = {
      WorkerID: "WorkerID",
      WorkerName: "Worker Name",
    };

    daysOfWeek.forEach((day, index) => {
      const date = currentWeek[index];
      headerRow[day] = `${day} (${date})`;
    });

    exportData.push(headerRow);

    clockData.forEach((data) => {
      const rowData: any = {
        WorkerID: data.workerID,
        WorkerName: data.workerName,
      };

      daysOfWeek.forEach((_, dayIndex) => {
        const date = currentWeek[dayIndex];
        const hoursEntry = data.workedHoursPerDay.find(
          (entry) => entry.date === date
        );
        const formattedHours = hoursEntry
          ? formatHoursAndMinutes(hoursEntry.hours)
          : "0 hrs";
        rowData[daysOfWeek[dayIndex]] = formattedHours;
      });

      exportData.push(rowData);
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    worksheet["!cols"] = [
      { wch: 12 },
      { wch: 20 },
      ...daysOfWeek.map(() => ({ wch: 15 })),
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Clock Data");
    XLSX.writeFile(workbook, "clock_data.xlsx");
  };

  const handleNextWeek = () => {
    setCurrentIndex(currentIndex + 1);
    if (fixedStartDate) {
      const newWeekStart = moment(currentWeek[0]).add(7, "days");
      setCurrentWeek(getCurrentWeek(newWeekStart));
    }
  };

  const handlePreviousWeek = () => {
    setCurrentIndex(currentIndex - 1);
    if (fixedStartDate) {
      const newWeekStart = moment(currentWeek[0]).subtract(7, "days");
      setCurrentWeek(getCurrentWeek(newWeekStart));
    }
  };
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Clock Dashboard", 14, 10);
    doc.setFontSize(12);
    doc.text(
      `Week: ${currentWeek[0]} to ${currentWeek[currentWeek.length - 1]}`,
      14,
      16
    );

    const tableData = clockData.map((data) => {
      const row = [
        data.workerID,
        data.workerName,
        ...daysOfWeek.map((_, dayIndex) => {
          const date = currentWeek[dayIndex];
          const hoursEntry = data.workedHoursPerDay.find(
            (entry) => entry.date === date
          );
          return hoursEntry ? formatHoursAndMinutes(hoursEntry.hours) : "0 hrs";
        }),
      ];
      return row;
    });

    const headers = [
      [
        "ID",
        "Name",
        ...daysOfWeek.map((day, index) => `${day} (${currentWeek[index]})`),
      ],
    ];

    doc.autoTable({
      head: headers,
      body: tableData,
      startY: 20,
      theme: "grid",
      styles: { fontSize: 8, halign: "center" },
    });

    doc.save("clock_dashboard.pdf");
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="bg-blue-500">
          <IonTitle className="text-black">Clock Dashboard</IonTitle>
          <div className="text-center my-5">
            <button
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              onClick={exportToPDF}
            >
              Export to PDF
            </button>
          </div>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {/* Button container */}
        <div className="flex justify-center space-x-4 my-4">
          <button
            className={`px-4 py-2 bg-gray-500 text-white rounded ${
              currentIndex === 0
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-gray-700"
            }`}
            onClick={handlePreviousWeek}
            disabled={currentIndex === 0}
          >
            Previous Week
          </button>

          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
            onClick={handleNextWeek}
          >
            Next Week
          </button>
        </div>

        {/* Table structure */}
        <div className="overflow-x-auto px-5">
          <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th
                  scope="col"
                  className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-r border-gray-300"
                >
                  ID
                </th>
                <th
                  scope="col"
                  className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-r border-gray-300"
                >
                  Name
                </th>
                {daysOfWeek.map((day, index) => (
                  <th
                    key={index}
                    scope="col"
                    className="px-4 py-2 text-center text-sm font-semibold text-gray-700 border-r border-gray-300"
                  >
                    <div>{day}</div>
                    <div className="text-gray-500 text-xs">
                      {currentWeek[index]}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clockData.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-left text-sm text-gray-900 border-r border-gray-300">
                    {item.workerID}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900 text-left border-r border-gray-300">
                    {item.workerName}
                  </td>
                  {daysOfWeek.map((_, dayIndex) => {
                    const date = currentWeek[dayIndex];
                    const hoursEntry = item.workedHoursPerDay.find(
                      (entry) => entry.date === date
                    );
                    const formattedHours = hoursEntry
                      ? formatHoursAndMinutes(hoursEntry.hours)
                      : "0 hrs";
                    return (
                      <td
                        key={dayIndex}
                        className="px-4 py-2 text-sm text-gray-900 text-center border-r border-gray-300"
                      >
                        {formattedHours}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Export button */}
        {/* <div className="text-center my-5">
          <button
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            onClick={exportToExcel}
          >
            Export to Excel
          </button>
        </div> */}
      </IonContent>
    </IonPage>
  );
};

export default ClockDashboard;
