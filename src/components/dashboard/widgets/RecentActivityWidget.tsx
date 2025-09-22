import React from "react";
import { ActivityData } from "../../../utils/mockData";
interface RecentActivityWidgetProps {
  title: string;
  data: ActivityData[];
  isLoading?: boolean;
}
const RecentActivityWidget: React.FC<RecentActivityWidgetProps> = ({
  title,
  data,
  isLoading = false,
}) => {
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
              className="px-6 py-4 flex items-center border-b border-gray-100 last:border-b-0"
            >
              <div className="h-10 w-10 rounded-full bg-gray-200 mr-4"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
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
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      </div>
      <div>
        {data.map((item) => (
          <div
            key={item.id}
            className="px-6 py-4 border-b border-gray-100 last:border-b-0"
          >
            <div className="flex items-start">
              <img
                src={item.avatar}
                alt={item.user}
                className="h-10 w-10 rounded-full mr-4"
              />
              <div>
                <p className="text-sm text-gray-900">
                  <span className="font-medium">{item.user}</span> {item.action}{" "}
                  <span className="font-medium">{item.target}</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">{item.time}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default RecentActivityWidget;
