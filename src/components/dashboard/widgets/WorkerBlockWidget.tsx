// src/components/dashboard/widgets/WorkerBlockWidget.tsx
import React, { useState } from "react";
import {
  IonButton,
  IonBadge,
  IonSpinner,
  IonCheckbox,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonAlert,
} from "@ionic/react";
import { RefreshCw, LogOut, CheckCircle, X } from "lucide-react";
import { WorkerBlockData } from "../../../utils/mockData";

interface WorkerBlockWidgetProps {
  title: string;
  data: WorkerBlockData[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

interface CheckoutData {
  workerID: string;
  workerName: string;
  blockName: string;
  rowNumber: string;
  jobType: string;
  remainingStocks: number;
  stocksCompleted: number;
}

const WorkerBlockWidget: React.FC<WorkerBlockWidgetProps> = ({
  title,
  data,
  isLoading = false,
  onRefresh,
}) => {
  const [selectedWorkers, setSelectedWorkers] = useState<Set<string>>(
    new Set()
  );
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [showBulkCheckoutModal, setShowBulkCheckoutModal] = useState(false);
  const [bulkCheckoutData, setBulkCheckoutData] = useState<CheckoutData[]>([]);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const apiBaseUrl =
    "https://farm-backend-fpbmfrgferdjdtah.southafricanorth-01.azurewebsites.net/api";

  // ✅ FIX 1: Create unique key for each worker entry
  const getWorkerKey = (worker: WorkerBlockData) => {
    return `${worker.workerID}-${worker.blockName}-${worker.rowNumber}-${worker.job_type}`;
  };

  const handleToggleWorker = (workerKey: string) => {
    const newSelected = new Set(selectedWorkers);
    if (newSelected.has(workerKey)) {
      newSelected.delete(workerKey);
    } else {
      newSelected.add(workerKey);
    }
    setSelectedWorkers(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedWorkers.size === data.length) {
      setSelectedWorkers(new Set());
    } else {
      setSelectedWorkers(new Set(data.map((w) => getWorkerKey(w))));
    }
  };

  const handleSingleCheckout = (worker: WorkerBlockData) => {
    setCheckoutData({
      workerID: worker.workerID,
      workerName: worker.workerName,
      blockName: worker.blockName,
      rowNumber: worker.rowNumber,
      jobType: worker.job_type,
      remainingStocks: worker.remainingStocks,
      stocksCompleted: worker.remainingStocks, // Default to completing all
    });
    setShowCheckoutModal(true);
  };

  const handleBulkCheckoutInit = () => {
    if (selectedWorkers.size === 0) {
      alert("Please select at least one worker");
      return;
    }

    const selectedData = data
      .filter((w) => selectedWorkers.has(getWorkerKey(w)))
      .map((w) => ({
        workerID: w.workerID,
        workerName: w.workerName,
        blockName: w.blockName,
        rowNumber: w.rowNumber,
        jobType: w.job_type,
        remainingStocks: w.remainingStocks,
        stocksCompleted: w.remainingStocks,
      }));

    setBulkCheckoutData(selectedData);
    setShowBulkCheckoutModal(true);
  };

  const updateStocksCompleted = (
    workerID: string,
    rowNumber: string,
    jobType: string,
    stocks: number
  ) => {
    setBulkCheckoutData((prev) =>
      prev.map((w) =>
        w.workerID === workerID &&
        w.rowNumber === rowNumber &&
        w.jobType === jobType
          ? { ...w, stocksCompleted: stocks }
          : w
      )
    );
  };

  const updateSingleStocksCompleted = (stocks: number) => {
    if (checkoutData) {
      setCheckoutData({ ...checkoutData, stocksCompleted: stocks });
    }
  };

  const executeSingleCheckout = async () => {
    if (!checkoutData) return;

    if (checkoutData.stocksCompleted > checkoutData.remainingStocks) {
      alert(
        `Cannot complete ${checkoutData.stocksCompleted} vines when only ${checkoutData.remainingStocks} remain`
      );
      return;
    }

    if (checkoutData.stocksCompleted < 0) {
      alert("Vines completed must be 0 or greater");
      return;
    }

    setCheckoutLoading(true);

    try {
      const response = await fetch(apiBaseUrl + "/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workerID: checkoutData.workerID,
          workerName: checkoutData.workerName,
          blockName: checkoutData.blockName,
          rowNumber: checkoutData.rowNumber,
          stockCount: checkoutData.stocksCompleted,
          jobType: checkoutData.jobType,
        }),
      });

      if (response.ok) {
        const responseData = await response.json();
        setSuccessMessage(
          `${checkoutData.workerName} checked out successfully!`
        );
        setShowSuccessAlert(true);
        setShowCheckoutModal(false);
        setCheckoutData(null);

        // ✅ FIX 2: Wait for refresh to complete to get updated data
        if (onRefresh) await onRefresh();
      } else {
        const errorData = await response.json();
        alert(`Checkout failed: ${errorData.message}`);
      }
    } catch (error) {
      console.error("Error during checkout:", error);
      alert("An error occurred during checkout");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const executeBulkCheckout = async () => {
    // Validate all workers
    for (const worker of bulkCheckoutData) {
      if (worker.stocksCompleted > worker.remainingStocks) {
        alert(
          `${worker.workerName} cannot complete ${worker.stocksCompleted} vines when only ${worker.remainingStocks} remain`
        );
        return;
      }
      if (worker.stocksCompleted < 0) {
        alert(`${worker.workerName} must complete at least 0 vines`);
        return;
      }
    }

    setCheckoutLoading(true);

    try {
      const checkoutPromises = bulkCheckoutData.map((worker) =>
        fetch(apiBaseUrl + "/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workerID: worker.workerID,
            workerName: worker.workerName,
            blockName: worker.blockName,
            rowNumber: worker.rowNumber,
            stockCount: worker.stocksCompleted,
            jobType: worker.jobType,
          }),
        })
      );

      await Promise.all(checkoutPromises);

      setSuccessMessage(
        `Successfully checked out ${bulkCheckoutData.length} worker(s)!`
      );
      setShowSuccessAlert(true);
      setShowBulkCheckoutModal(false);
      setBulkCheckoutData([]);
      setSelectedWorkers(new Set());

      // ✅ FIX 2: Wait for refresh to complete
      if (onRefresh) await onRefresh();
    } catch (error) {
      console.error("Error during bulk checkout:", error);
      alert("Failed to checkout workers. Please try again.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const formatTimeSpent = (startTime: string) => {
    const start = new Date(startTime).getTime();
    const now = new Date().getTime();
    const diffMinutes = Math.floor((now - start) / (1000 * 60));
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        <div className="flex items-center gap-2">
          {selectedWorkers.size > 0 && (
            <IonButton
              onClick={handleBulkCheckoutInit}
              color="success"
              size="small"
            >
              <LogOut size={16} className="mr-1" />
              Checkout Selected ({selectedWorkers.size})
            </IonButton>
          )}
          {onRefresh && (
            <IonButton onClick={onRefresh} fill="outline" size="small">
              <RefreshCw size={16} className="mr-1" />
              Refresh
            </IonButton>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <IonSpinner name="crescent" />
          <span className="ml-2 text-gray-500">Loading workers...</span>
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No workers currently checked in</p>
        </div>
      ) : (
        <>
          {/* Select All Checkbox */}
          <div className="mb-4 pb-4 border-b border-gray-200">
            <label className="flex items-center cursor-pointer">
              <IonCheckbox
                checked={
                  selectedWorkers.size === data.length && data.length > 0
                }
                onIonChange={handleSelectAll}
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                Select All ({data.length} workers)
              </span>
            </label>
          </div>

          {/* Workers List */}
          <div className="space-y-4">
            {data.map((worker) => {
              const workerKey = getWorkerKey(worker);
              return (
                <div
                  key={workerKey}
                  className={`border rounded-lg p-4 transition-all ${
                    selectedWorkers.has(workerKey)
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <IonCheckbox
                      checked={selectedWorkers.has(workerKey)}
                      onIonChange={() => handleToggleWorker(workerKey)}
                      style={{ marginTop: "4px" }}
                    />

                    {/* Worker Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {worker.workerName}
                          </h3>
                          <p className="text-sm text-gray-600">
                            ID: {worker.workerID}
                          </p>
                        </div>
                        <IonBadge color="primary">
                          {worker.remainingStocks} vines left
                        </IonBadge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600 mb-3">
                        <div>
                          <span className="font-medium">Block:</span>{" "}
                          {worker.blockName}
                        </div>
                        <div>
                          <span className="font-medium">Row:</span>{" "}
                          {worker.rowNumber}
                        </div>
                        <div>
                          <span className="font-medium">Job:</span>{" "}
                          {worker.job_type}
                        </div>
                        <div>
                          <span className="font-medium">Time:</span>{" "}
                          {formatTimeSpent(worker.startTime)}
                        </div>
                      </div>

                      {/* Checkout Button */}
                      <IonButton
                        size="small"
                        color="success"
                        onClick={() => handleSingleCheckout(worker)}
                      >
                        <LogOut size={16} className="mr-1" />
                        Checkout
                      </IonButton>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Single Worker Checkout Modal */}
      <IonModal
        isOpen={showCheckoutModal}
        onDidDismiss={() => {
          setShowCheckoutModal(false);
          setCheckoutData(null);
        }}
      >
        <IonHeader>
          <IonToolbar>
            <IonTitle>Checkout Worker</IonTitle>
            <IonButton
              slot="end"
              fill="clear"
              onClick={() => {
                setShowCheckoutModal(false);
                setCheckoutData(null);
              }}
            >
              <X size={24} />
            </IonButton>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          {checkoutData && (
            <div className="max-w-lg mx-auto">
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">
                  {checkoutData.workerName}
                </h3>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>ID: {checkoutData.workerID}</p>
                  <p>
                    Location: {checkoutData.blockName}, Row{" "}
                    {checkoutData.rowNumber}
                  </p>
                  <p>Job: {checkoutData.jobType}</p>
                  <p className="font-medium">
                    Remaining: {checkoutData.remainingStocks} vines
                  </p>
                </div>
              </div>

              <IonItem>
                <IonLabel position="stacked">Vines Completed *</IonLabel>
                <IonInput
                  type="number"
                  value={checkoutData.stocksCompleted}
                  onIonInput={(e: any) =>
                    updateSingleStocksCompleted(parseInt(e.target.value) || 0)
                  }
                  min={0}
                  max={checkoutData.remainingStocks}
                  placeholder="Enter vines completed"
                />
              </IonItem>

              <p className="text-sm text-gray-600 mt-2 mb-6">
                Leave blank or enter 0 if no work was completed
              </p>

              <IonButton
                expand="block"
                color="success"
                size="large"
                onClick={executeSingleCheckout}
                disabled={checkoutLoading}
              >
                {checkoutLoading ? (
                  "Checking Out..."
                ) : (
                  <>
                    Confirm Checkout
                    <CheckCircle className="ml-2" size={20} />
                  </>
                )}
              </IonButton>
            </div>
          )}
        </IonContent>
      </IonModal>

      {/* Bulk Checkout Modal */}
      <IonModal
        isOpen={showBulkCheckoutModal}
        onDidDismiss={() => {
          setShowBulkCheckoutModal(false);
          setBulkCheckoutData([]);
        }}
      >
        <IonHeader>
          <IonToolbar>
            <IonTitle>Bulk Checkout</IonTitle>
            <IonButton
              slot="end"
              fill="clear"
              onClick={() => {
                setShowBulkCheckoutModal(false);
                setBulkCheckoutData([]);
              }}
            >
              <X size={24} />
            </IonButton>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="max-w-3xl mx-auto">
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-900">
                Checking out {bulkCheckoutData.length} worker(s)
              </h3>
            </div>

            <div className="space-y-4 mb-6">
              {bulkCheckoutData.map((worker, index) => (
                <div
                  key={`${worker.workerID}-${worker.rowNumber}-${worker.jobType}-${index}`}
                  className="p-4 border border-gray-200 rounded-lg bg-white"
                >
                  <div className="mb-3">
                    <h4 className="font-medium text-gray-900">
                      {worker.workerName}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {worker.blockName}, Row {worker.rowNumber} |{" "}
                      {worker.jobType}
                    </p>
                    <p className="text-sm text-gray-600">
                      Remaining: {worker.remainingStocks} vines
                    </p>
                  </div>
                  <IonItem lines="none" className="ion-no-padding">
                    <IonLabel position="stacked">Vines Completed</IonLabel>
                    <IonInput
                      type="number"
                      value={worker.stocksCompleted}
                      onIonInput={(e: any) =>
                        updateStocksCompleted(
                          worker.workerID,
                          worker.rowNumber,
                          worker.jobType,
                          parseInt(e.target.value) || 0
                        )
                      }
                      min={0}
                      max={worker.remainingStocks}
                    />
                  </IonItem>
                </div>
              ))}
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-gray-600">Total Workers:</span>{" "}
                  <span className="font-medium">{bulkCheckoutData.length}</span>
                </p>
                <p>
                  <span className="text-gray-600">Total Vines Completed:</span>{" "}
                  <span className="font-medium">
                    {bulkCheckoutData.reduce(
                      (sum, w) => sum + w.stocksCompleted,
                      0
                    )}
                  </span>
                </p>
              </div>
            </div>

            <IonButton
              expand="block"
              color="success"
              size="large"
              onClick={executeBulkCheckout}
              disabled={checkoutLoading}
            >
              {checkoutLoading ? (
                "Checking Out..."
              ) : (
                <>
                  Checkout All Workers
                  <CheckCircle className="ml-2" size={20} />
                </>
              )}
            </IonButton>
          </div>
        </IonContent>
      </IonModal>

      {/* Success Alert */}
      <IonAlert
        isOpen={showSuccessAlert}
        onDidDismiss={() => setShowSuccessAlert(false)}
        header="Success"
        message={successMessage}
        buttons={["OK"]}
      />
    </div>
  );
};

export default WorkerBlockWidget;
