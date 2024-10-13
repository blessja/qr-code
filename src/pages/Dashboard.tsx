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
import "./Dashboard.css";
import { useHistory } from "react-router-dom";

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
  block_names: string;
  row_numbers: string;
}

const Pagination: React.FC<{
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}> = ({ totalPages, currentPage, onPageChange }) => {
  return (
    <div className="pagination">
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        Previous
      </button>
      {Array.from({ length: totalPages }, (_, index) => (
        <button
          key={index}
          onClick={() => onPageChange(index + 1)}
          className={currentPage === index + 1 ? "active" : ""}
        >
          {index + 1}
        </button>
      ))}
      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Next
      </button>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const [workersData, setWorkersData] = useState<Worker[]>([]);
  const [filteredData, setFilteredData] = useState<AggregatedData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          "https://farm-managment-app.onrender.com/api/workers"
        );
        setWorkersData(response.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const aggregateData = () => {
      const aggregatedData: AggregatedData[] = workersData.reduce(
        (acc, worker) => {
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
                  block_names: "",
                  row_numbers: "",
                };
              }

              workerDataByDate[dateKey].total_stock_count += row.stock_count;
              workerDataByDate[dateKey].block_names += `${block.block_name} `;
              workerDataByDate[dateKey].row_numbers += `${row.row_number}, `;
            });
          });

          acc.push(...Object.values(workerDataByDate));
          return acc;
        },
        [] as AggregatedData[]
      );

      setFilteredData(aggregatedData);
    };

    aggregateData();
  }, [workersData]);

  const handleSearch = (e: any) => {
    const value = e.target.value!.toLowerCase();
    setSearchTerm(value);

    // Check if the search term contains both block and row information
    const match = value.match(/block\s*(\d+)\s*([\w\d]+)/i);
    const block = match ? match[1].toLowerCase() : "";
    const row = match ? match[2].toLowerCase() : "";

    const filtered = filteredData.filter((data) => {
      const blockInData = data.block_names
        .toLowerCase()
        .includes(`block ${block}`);
      const rowInData = data.row_numbers.toLowerCase().includes(row);

      return block && row ? blockInData && rowInData : blockInData || rowInData;
    });

    setFilteredData(filtered);
  };

  const exportToExcel = () => {
    const exportData = filteredData.map((data) => ({
      WorkerID: data.workerID,
      WorkerName: data.name,
      TotalStockCount: data.total_stock_count,
      Blocks: data.block_names.slice(0, -2),
      Date: data.date,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Workers Data");
    XLSX.writeFile(workbook, "workers_data.xlsx");
  };

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const history = useHistory();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Dashboard</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonInput
          placeholder="Search by Block and Row (e.g., Block 7 41B)"
          value={searchTerm}
          onIonInput={handleSearch}
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
              <IonLabel>Blocks</IonLabel>
            </IonCol>
            <IonCol className="centered-col">
              <IonLabel>Rows</IonLabel>
            </IonCol>
            <IonCol className="centered-col">
              <IonLabel>Date</IonLabel>
            </IonCol>
          </IonRow>
          {currentData.map((data, index) => (
            <IonRow key={index}>
              <IonCol className="centered-col-2">{data.workerID}</IonCol>
              <IonCol className="centered-col-2">{data.name}</IonCol>
              <IonCol className="centered-col-2">
                {data.total_stock_count}
              </IonCol>
              <IonCol className="centered-col-2">
                {data.block_names.slice(0, -2)}
              </IonCol>
              <IonCol className="centered-col-2">
                {data.row_numbers.slice(0, -2)}
              </IonCol>
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

        {/* Pagination Component */}
        <Pagination
          totalPages={totalPages}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      </IonContent>
    </IonPage>
  );
};

export default Dashboard;
