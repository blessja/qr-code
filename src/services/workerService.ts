// services/workerService.ts

export interface WorkerData {
  _id: string;
  workerID?: string;
  worker_id?: string | null;
  name?: string;
  total_stock_count: number;
  blocks: Array<{
    block_name: string;
    rows: Array<{
      row_number: string;
      stock_count: number;
      time_spent: number;
      date: string;
      day_of_week: string;
      job_type?: string;
    }>;
    _id: string;
  }>;
  syncLogs: Array<{
    syncId: string;
    deviceId: string;
    type: string;
    time: string;
    _id: string;
  }>;
  __v: number;
  clockInTime?: string;
  currentBlock?: string;
  currentRow?: number;
  isClockedIn?: boolean;
  jobType?: string;
}

export interface ProcessedWorkerData extends Omit<WorkerData, 'workerID' | 'worker_id'> {
  workerID: string;
  name: string;
  totalHours: number;
  position: number;
  efficiency: 'Excellent' | 'High' | 'Medium' | 'Low';
  totalDays: number;
  averageVinesPerDay: number;
  lastActiveDate: string;
}

class WorkerService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:8080/api') {
    this.baseUrl = baseUrl;
  }

  /**
   * Fetch all workers from the API
   */
  async fetchWorkers(): Promise<WorkerData[]> {
    try {
      const response = await fetch(`${this.baseUrl}/workers`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: WorkerData[] = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching workers:', error);
      throw new Error('Failed to fetch workers data. Please check your connection and try again.');
    }
  }

  /**
   * Process raw worker data to include calculated fields
   */
  processWorkerData(rawWorkers: WorkerData[]): ProcessedWorkerData[] {
    return rawWorkers
      .map(worker => this.processIndividualWorker(worker))
      .filter(worker => worker.workerID && worker.name) // Filter out workers without ID or name
      .sort((a, b) => b.position - a.position); // Sort by position (highest first)
  }

  /**
   * Process individual worker data
   */
  private processIndividualWorker(worker: WorkerData): ProcessedWorkerData {
    // Get worker ID (handle both possible field names)
    const workerID = worker.workerID || worker.worker_id || 'Unknown';
    const name = worker.name || 'Unknown';

    // Calculate total hours and collect dates
    let totalHours = 0;
    const workDates = new Set<string>();
    
    worker.blocks.forEach(block => {
      block.rows.forEach(row => {
        totalHours += row.time_spent || 0;
        if (row.date) {
          workDates.add(row.date.split('T')[0]); // Get date part only
        }
      });
    });

    // Round to 2 decimal places
    totalHours = Math.round(totalHours * 100) / 100;

    // Calculate position (vines per hour)
    const position = totalHours > 0 ? 
      Math.round((worker.total_stock_count / totalHours) * 100) / 100 : 0;

    // Determine efficiency rating based on position
    let efficiency: 'Excellent' | 'High' | 'Medium' | 'Low' = 'Low';
    if (position > 50) efficiency = 'Excellent';
    else if (position > 30) efficiency = 'High';
    else if (position > 15) efficiency = 'Medium';

    // Calculate additional metrics
    const totalDays = workDates.size;
    const averageVinesPerDay = totalDays > 0 ? 
      Math.round((worker.total_stock_count / totalDays) * 100) / 100 : 0;

    // Get last active date
    const allDates = Array.from(workDates).sort();
    const lastActiveDate = allDates[allDates.length - 1] || 'Never';

    return {
      ...worker,
      workerID: workerID.toString(),
      name,
      totalHours,
      position,
      efficiency,
      totalDays,
      averageVinesPerDay,
      lastActiveDate
    };
  }

  /**
   * Get worker statistics
   */
  getWorkerStatistics(workers: ProcessedWorkerData[]) {
    const totalWorkers = workers.length;
    const totalVines = workers.reduce((sum, worker) => sum + worker.total_stock_count, 0);
    const totalHours = workers.reduce((sum, worker) => sum + worker.totalHours, 0);
    const averagePosition = totalHours > 0 ? Math.round((totalVines / totalHours) * 100) / 100 : 0;
    
    // Efficiency distribution
    const efficiencyCount = workers.reduce((acc, worker) => {
      acc[worker.efficiency] = (acc[worker.efficiency] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Top performers (top 10%)
    const topPerformersCount = Math.max(1, Math.ceil(totalWorkers * 0.1));
    const topPerformers = workers.slice(0, topPerformersCount);

    // Active workers (worked in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const activeWorkers = workers.filter(worker => {
      if (worker.lastActiveDate === 'Never') return false;
      const lastActiveDate = new Date(worker.lastActiveDate);
      return lastActiveDate >= sevenDaysAgo;
    });

    return {
      totalWorkers,
      totalVines,
      totalHours,
      averagePosition,
      efficiencyDistribution: efficiencyCount,
      topPerformers,
      activeWorkersCount: activeWorkers.length,
      averageVinesPerWorker: totalWorkers > 0 ? Math.round((totalVines / totalWorkers) * 100) / 100 : 0,
      averageHoursPerWorker: totalWorkers > 0 ? Math.round((totalHours / totalWorkers) * 100) / 100 : 0
    };
  }

  /**
   * Filter workers based on search criteria
   */
  filterWorkers(workers: ProcessedWorkerData[], searchCriteria: {
    searchText?: string;
    efficiency?: string;
    minPosition?: number;
    maxPosition?: number;
  }): ProcessedWorkerData[] {
    let filtered = [...workers];

    // Text search
    if (searchCriteria.searchText && searchCriteria.searchText.trim()) {
      const searchTerm = searchCriteria.searchText.toLowerCase().trim();
      filtered = filtered.filter(worker => 
        worker.name.toLowerCase().includes(searchTerm) ||
        worker.workerID.toLowerCase().includes(searchTerm)
      );
    }

    // Efficiency filter
    if (searchCriteria.efficiency && searchCriteria.efficiency !== 'all') {
      filtered = filtered.filter(worker => worker.efficiency === searchCriteria.efficiency);
    }

    // Position range filter
    if (typeof searchCriteria.minPosition === 'number') {
      filtered = filtered.filter(worker => worker.position >= searchCriteria.minPosition!);
    }

    if (typeof searchCriteria.maxPosition === 'number') {
      filtered = filtered.filter(worker => worker.position <= searchCriteria.maxPosition!);
    }

    return filtered;
  }
}

// Export a singleton instance
export const workerService = new WorkerService();
export default WorkerService;