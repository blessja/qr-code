import axios from 'axios'
import { WorkerBlockData } from '../utils/mockData'
// API configuration
const API_CONFIG = {
  baseURL: 'https://farm-server-02-961069822730.europe-west1.run.app/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
}
// Create axios instance with configuration
const apiClient = axios.create(API_CONFIG)
// API Service class
export class ApiService {
  // Fetch worker block data from the API
  static async getWorkerBlocks(): Promise<WorkerBlockData[]> {
    try {
      // Assuming the endpoint is /worker-blocks - adjust as needed based on your API
      const response = await apiClient.get('/workers/current-checkins')
      return response.data
    } catch (error) {
      console.error('Error fetching worker blocks:', error)
      throw error
    }
  }
  // Add more API methods as needed
  // For example:
  // static async updateWorkerBlock(id: string, data: Partial<WorkerBlockData>): Promise<WorkerBlockData> {
  //   const response = await apiClient.put(`/worker-blocks/${id}`, data);
  //   return response.data;
  // }
}
