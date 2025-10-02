import React, { useState } from "react";
import { WorkerBlockData } from "../../../utils/mockData";
import { SearchIcon, RefreshCwIcon } from "lucide-react";

interface WorkerBlockWidgetProps {
  title: string;
  data: WorkerBlockData[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

const WorkerBlockWidget: React.FC<WorkerBlockWidgetProps> = ({
  title,
  data,
  isLoading = false,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBlock, setFilterBlock] = useState<string>("all");
  const [filterJobType, setFilterJobType] = useState<string>("all");

  // Extract unique block names and job types for filters
  const uniqueBlocks = ["all", ...new Set(data.map((item) => item.blockName))];
  const uniqueJobTypes = [
    "all",
    ...new Set(data.map((item) => item.job_type).filter(Boolean)),
  ];

  // Filter data based on search term and filters
  const filteredData = data.filter((item) => {
    const matchesSearch =
      item.workerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.workerID.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.rowNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.blockName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesBlock =
      filterBlock === "all" || item.blockName === filterBlock;

    const matchesJobType =
      filterJobType === "all" || item.job_type === filterJobType;

    return matchesSearch && matchesBlock && matchesJobType;
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 animate-pulse">
        <div className="p-6">
          <div className="h-5 bg-gray-200 rounded w-1/4 mb-6"></div>
        </div>
        <div className="border-t border-gray-200">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="px-6 py-4 border-b border-gray-200 last:border-b-0"
            >
              <div className="flex items-center">
                <div className="h-4 bg-gray-200 rounded w-1/4 mr-4"></div>
                <div className="h-4 bg-gray-200 rounded w-2/5"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none"
              aria-label="Refresh data"
            >
              <RefreshCwIcon size={18} />
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <SearchIcon size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 text-black bg-white border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search workers, IDs, blocks, rows..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Block filter */}
          <div className="w-full md:w-48">
            <select
              value={filterBlock}
              onChange={(e) => setFilterBlock(e.target.value)}
              className="w-full py-2 px-3 border text-black bg-white border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              {uniqueBlocks.map((block) => (
                <option key={block} value={block}>
                  {block === "all" ? "All Blocks" : block}
                </option>
              ))}
            </select>
          </div>

          {/* Job Type filter */}
          <div className="w-full md:w-48">
            <select
              value={filterJobType}
              onChange={(e) => setFilterJobType(e.target.value)}
              className="w-full py-2 px-3 border text-black bg-white border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              {uniqueJobTypes.map((jobType) => (
                <option key={jobType} value={jobType}>
                  {jobType === "all"
                    ? "All Job Types"
                    : jobType || "Unassigned"}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Block / Row
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Worker
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Job Type
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredData.length > 0 ? (
              filteredData.map((item, index) => {
                // Determine status based on remaining stocks
                let status = "In Progress";
                let statusColor = "bg-green-100 text-green-800";

                if (item.remainingStocks === 0) {
                  status = "Completed";
                  statusColor = "bg-blue-100 text-blue-800";
                } else if (item.remainingStocks === item.stockCount) {
                  status = "Not Started";
                  statusColor = "bg-gray-100 text-gray-800";
                }

                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {item.blockName}
                      </div>
                      <div className="text-xs text-gray-500">
                        Row {item.rowNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {item.workerName}
                      </div>
                      <div className="text-xs text-gray-500">
                        ID: {item.workerID}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          item.job_type
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {item.job_type || "Unassigned"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${statusColor}`}
                      >
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  No results found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer with count */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          Showing {filteredData.length} of {data.length} assignments
          {(searchTerm || filterBlock !== "all" || filterJobType !== "all") && (
            <span className="ml-2 text-blue-600">(filtered)</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkerBlockWidget;
