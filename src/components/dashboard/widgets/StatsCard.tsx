import React from "react";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { StatsData } from "../../../utils/mockData";
interface StatsCardProps {
  data: StatsData;
  isLoading?: boolean;
}
const StatsCard: React.FC<StatsCardProps> = ({ data, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    );
  }
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <h3 className="text-sm font-medium text-gray-500">{data.title}</h3>
      <p className="mt-2 text-3xl font-semibold text-gray-900">{data.value}</p>
      <div className="mt-2 flex items-center text-sm">
        <span
          className={`flex items-center ${
            data.trend === "up" ? "text-green-600" : "text-red-600"
          }`}
        >
          {data.trend === "up" ? (
            <ArrowUpIcon size={16} className="mr-1" />
          ) : (
            <ArrowDownIcon size={16} className="mr-1" />
          )}
          {Math.abs(data.change)}%
        </span>
        <span className="ml-2 text-gray-500">{data.changeText}</span>
      </div>
    </div>
  );
};
export default StatsCard;
