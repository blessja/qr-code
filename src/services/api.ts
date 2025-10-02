import axios from 'axios'

// API configuration
const API_CONFIG = {
  baseURL: 'https://farm-server-02-961069822730.europe-west1.run.app/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
}

// Export the base URL for components that don't need the full ApiService
export const API_BASE_URL = API_CONFIG.baseURL

// Create axios instance with configuration
const apiClient = axios.create(API_CONFIG)

// API Service class
export class ApiService {
  // Fetch worker block data from the API
  static async getWorkerBlocks(): Promise<any[]> {
    try {
      const response = await apiClient.get('/workers/current-checkins')
      return response.data
    } catch (error) {
      console.error('Error fetching worker blocks:', error)
      throw error
    }
  }

  // Get workers data
  static async getWorkers(): Promise<any[]> {
    try {
      const response = await apiClient.get('/workers')
      return response.data
    } catch (error) {
      console.error('Error fetching worker blocks:', error)
      throw error
    }
  }

  // Get blocks
  static async getBlocks(): Promise<string[]> {
    try {
      const response = await apiClient.get('/blocks')
      return response.data
    } catch (error) {
      console.error('Error fetching blocks:', error)
      throw error
    }
  }

  // Worker check-in
  static async checkIn(data: {
    workerID: string
    workerName: string
    blockName: string
    rowNumber: string
    jobType: string
  }): Promise<any> {
    try {
      const response = await apiClient.post('/checkin', data)
      return response.data
    } catch (error) {
      console.error('Error during check-in:', error)
      throw error
    }
  }
}