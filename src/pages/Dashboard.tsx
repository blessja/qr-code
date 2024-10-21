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
  IonInput,
} from "@ionic/react";
import axios from "axios";
import * as XLSX from "xlsx";
import { useHistory } from "react-router-dom";
import "./Dashboard.css";

interface Row {
  row_number: string;
  stock_count: number;
  date: string;
}

interface Block {
  block_name: string;
  rows: Row[];
}

interface Worker {
  workerID: string;
  name: string;
  blocks: Block[];
}

interface AggregatedData {
  workerID: string;
  name: string;
  total_stock_count: number;
  date: string;
  block_rows: string; // This will now store the grouped blocks and rows
}

const Dashboard: React.FC = () => {
  const [workersData, setWorkersData] = useState<Worker[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          "https://farm-managment-app.onrender.com/api/workers"
        );
        setWorkersData(response.data);
      } catch (error) {
        console.error("Error fetching data:", (error as Error).message);
      }
    };

    fetchData();
  }, []);

  const aggregatedData: AggregatedData[] = workersData.reduce((acc, worker) => {
    const workerDataByDate: { [key: string]: AggregatedData } = {};

    worker.blocks.forEach((block) => {
      block.rows.forEach((row) => {
        const dateKey = new Date(row.date).toLocaleDateString("en-GB", {
          weekday: "short",
          day: "2-digit",
          month: "short",
          year: "numeric",
        });

        if (!workerDataByDate[dateKey]) {
          workerDataByDate[dateKey] = {
            workerID: worker.workerID,
            name: worker.name,
            total_stock_count: 0,
            date: dateKey,
            block_rows: "",
          };
        }

        workerDataByDate[dateKey].total_stock_count += row.stock_count;

        // Group rows by block and concatenate them
        const blockName = block.block_name;
        const rowNumber = row.row_number;

        // Check if the block has already been added to avoid repeating it
        if (!workerDataByDate[dateKey].block_rows.includes(blockName)) {
          workerDataByDate[
            dateKey
          ].block_rows += `${blockName}: ${rowNumber}, `;
        } else {
          // Add only the row number if the block is already in the string
          workerDataByDate[dateKey].block_rows = workerDataByDate[
            dateKey
          ].block_rows.replace(`${blockName}:`, `${blockName}: ${rowNumber},`);
        }
      });
    });

    // Clean up the extra commas and spaces
    Object.keys(workerDataByDate).forEach((key) => {
      workerDataByDate[key].block_rows = workerDataByDate[
        key
      ].block_rows.replace(/,\s*$/, "");
    });

    acc.push(...Object.values(workerDataByDate));
    return acc;
  }, [] as AggregatedData[]);

  const sortedAggregatedData = aggregatedData.sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  // Filter the data based on search term (either block + row or name)
  const filteredData = sortedAggregatedData.filter((data) => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return (
      data.name.toLowerCase().includes(lowerCaseSearchTerm) ||
      data.block_rows.toLowerCase().includes(lowerCaseSearchTerm)
    );
  });

  const exportToExcel = () => {
    const exportData = filteredData.map((data) => ({
      WorkerID: data.workerID,
      WorkerName: data.name,
      TotalStockCount: data.total_stock_count,
      BlockRows: data.block_rows, // Use the updated block_rows field
      Date: data.date,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);

    worksheet["!cols"] = [
      { wch: 12 },
      { wch: 20 },
      { wch: 15 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Workers Data");

    XLSX.writeFile(workbook, "workers_data.xlsx");
  };

  const history = useHistory();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Dashboard</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {/* Search input for filtering by block and row or name */}
        <IonInput
          placeholder="Search by block and row (e.g., block 7 2A) or name"
          value={searchTerm}
          onIonChange={(e) => setSearchTerm(e.detail.value!)}
          style={{ margin: "20px" }}
        />

        <IonGrid>
          <IonRow>
            <IonCol className="centered-col">
              <IonLabel>Worker ID</IonLabel>
            </IonCol>
            <IonCol className="centered-col">
              <IonLabel>Worker Name</IonLabel>
            </IonCol>
            <IonCol className="centered-col">
              <IonLabel>Total Stock Count</IonLabel>
            </IonCol>
            <IonCol className="centered-col">
              <IonLabel>Blocks & Rows</IonLabel>
            </IonCol>
            <IonCol className="centered-col">
              <IonLabel>Date</IonLabel>
            </IonCol>
          </IonRow>
          {filteredData.map((data, index) => (
            <IonRow key={index}>
              <IonCol className="centered-col-2">{data.workerID}</IonCol>
              <IonCol className="centered-col-2">{data.name}</IonCol>
              <IonCol className="centered-col-2">
                {data.total_stock_count}
              </IonCol>
              <IonCol className="centered-col-2">{data.block_rows}</IonCol>
              <IonCol className="centered-col-2">{data.date}</IonCol>
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
        <IonButton
          style={{ marginTop: "30px" }}
          expand="block"
          onClick={() => history.push("/piecework_1")}
        >
          Go to Home
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default Dashboard;
