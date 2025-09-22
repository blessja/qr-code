// Mock data utilities to simulate database data
export interface StatsData {
  id: string;
  title: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down';
  changeText: string;
}
export interface ChartData {
  name: string;
  value: number;
  [key: string]: string | number;
}
export interface TableData {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'pending';
  date: string;
  amount: number;
}
export interface ActivityData {
  id: string;
  user: string;
  action: string;
  target: string;
  time: string;
  avatar: string;
}
// New interface for worker block data
export interface WorkerBlockData {
  blockName: string;
  job_type: string;
  rowNumber: string;
  workerID: string;
  workerName: string;
  stockCount: number;
  startTime: string;
  remainingStocks: number;
}
// Mock stats cards data
export const getStatsData = (): StatsData[] => [{
  id: '1',
  title: 'Total Revenue',
  value: '$54,238',
  change: 12.5,
  trend: 'up',
  changeText: 'from last month'
}, {
  id: '2',
  title: 'Active Users',
  value: '2,423',
  change: 8.2,
  trend: 'up',
  changeText: 'from last week'
}, {
  id: '3',
  title: 'Conversion Rate',
  value: '3.6%',
  change: -1.8,
  trend: 'down',
  changeText: 'from yesterday'
}, {
  id: '4',
  title: 'Avg. Session',
  value: '4m 32s',
  change: 9.1,
  trend: 'up',
  changeText: 'from last week'
}];
// Mock chart data
export const getRevenueData = (): ChartData[] => [{
  name: 'Jan',
  value: 4000,
  revenue: 4000,
  profit: 2400
}, {
  name: 'Feb',
  value: 3000,
  revenue: 3000,
  profit: 1398
}, {
  name: 'Mar',
  value: 2000,
  revenue: 2000,
  profit: 9800
}, {
  name: 'Apr',
  value: 2780,
  revenue: 2780,
  profit: 3908
}, {
  name: 'May',
  value: 1890,
  revenue: 1890,
  profit: 4800
}, {
  name: 'Jun',
  value: 2390,
  revenue: 2390,
  profit: 3800
}, {
  name: 'Jul',
  value: 3490,
  revenue: 3490,
  profit: 4300
}, {
  name: 'Aug',
  value: 4000,
  revenue: 4000,
  profit: 2400
}, {
  name: 'Sep',
  value: 3000,
  revenue: 3000,
  profit: 1398
}, {
  name: 'Oct',
  value: 2000,
  revenue: 2000,
  profit: 9800
}, {
  name: 'Nov',
  value: 2780,
  revenue: 2780,
  profit: 3908
}, {
  name: 'Dec',
  value: 3890,
  revenue: 3890,
  profit: 4800
}];
// Mock pie chart data
export const getUserSegmentData = (): ChartData[] => [{
  name: 'Enterprise',
  value: 400
}, {
  name: 'Small Business',
  value: 300
}, {
  name: 'Consumer',
  value: 300
}, {
  name: 'Government',
  value: 200
}];
// Mock table data
export const getRecentTransactionsData = (): TableData[] => [{
  id: '1',
  name: 'Jane Cooper',
  email: 'jane.cooper@example.com',
  status: 'active',
  date: '2023-10-24',
  amount: 250.0
}, {
  id: '2',
  name: 'Wade Warren',
  email: 'wade.warren@example.com',
  status: 'inactive',
  date: '2023-10-23',
  amount: 160.0
}, {
  id: '3',
  name: 'Esther Howard',
  email: 'esther.howard@example.com',
  status: 'active',
  date: '2023-10-22',
  amount: 320.0
}, {
  id: '4',
  name: 'Cameron Williamson',
  email: 'cameron.williamson@example.com',
  status: 'pending',
  date: '2023-10-21',
  amount: 190.0
}, {
  id: '5',
  name: 'Brooklyn Simmons',
  email: 'brooklyn.simmons@example.com',
  status: 'active',
  date: '2023-10-20',
  amount: 210.0
}];
// Mock activity data
export const getRecentActivityData = (): ActivityData[] => [{
  id: '1',
  user: 'John Smith',
  action: 'created a new project',
  target: 'Website Redesign',
  time: '2 minutes ago',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
}, {
  id: '2',
  user: 'Emily Davis',
  action: 'commented on',
  target: 'Marketing Campaign',
  time: '10 minutes ago',
  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
}, {
  id: '3',
  user: 'Michael Johnson',
  action: 'completed task',
  target: 'Database Migration',
  time: '1 hour ago',
  avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
}, {
  id: '4',
  user: 'Sarah Williams',
  action: 'uploaded document',
  target: 'Q3 Financial Report',
  time: '3 hours ago',
  avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
}, {
  id: '5',
  user: 'David Brown',
  action: 'invited you to',
  target: 'Product Launch Meeting',
  time: '5 hours ago',
  avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
}];
// Mock worker block data based on provided sample
export const getWorkerBlockData = (): WorkerBlockData[] => [{
  blockName: 'Block 4',
  job_type: '',
  rowNumber: '1A',
  workerID: '5194',
  workerName: 'Visser Bianca',
  stockCount: 14,
  startTime: '2025-09-22T18:37:16.893Z',
  remainingStocks: 14
}, {
  blockName: 'Block 4',
  job_type: 'SUIER',
  rowNumber: '1B',
  workerID: '6006',
  workerName: 'Rooi Lena',
  stockCount: 14,
  startTime: '2025-09-22T18:37:41.288Z',
  remainingStocks: 14
}, {
  blockName: 'Block 4',
  job_type: 'SUIER',
  rowNumber: '2A',
  workerID: '6006',
  workerName: 'Rooi Lena',
  stockCount: 24,
  startTime: '2025-09-22T18:38:04.215Z',
  remainingStocks: 24
}, {
  blockName: 'Block 3',
  job_type: 'PRUNER',
  rowNumber: '3A',
  workerID: '5201',
  workerName: 'John Smith',
  stockCount: 18,
  startTime: '2025-09-22T18:39:12.215Z',
  remainingStocks: 10
}, {
  blockName: 'Block 5',
  job_type: 'SUIER',
  rowNumber: '1C',
  workerID: '5194',
  workerName: 'Visser Bianca',
  stockCount: 20,
  startTime: '2025-09-22T18:40:04.215Z',
  remainingStocks: 8
}, {
  blockName: 'Block 3',
  job_type: 'PRUNER',
  rowNumber: '4B',
  workerID: '5301',
  workerName: 'Maria Garcia',
  stockCount: 22,
  startTime: '2025-09-22T18:41:22.215Z',
  remainingStocks: 22
}];
// Simulate API call with delay
export const fetchData = <T,>(dataFn: () => T, delay = 1000): Promise<T> => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(dataFn());
    }, delay);
  });
};