import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Hospital, HospitalFilters, Tender, TenderFilters, Region, CrawlerStatus, Statistics, SystemSettings, HospitalScanHistory, ScheduledTask } from '../types'
import { hospitalApi, tenderApi, regionApi, crawlerApi, statisticsApi, systemApi, schedulerApi } from '../services/api'

// 全局通知状态
export const useNotificationStore = create((set) => ({
  notifications: [],
  addNotification: (notification: { type: 'success' | 'error' | 'warning' | 'info'; message: string; title?: string }) => {
    const id = Date.now()
    set((state) => ({
      notifications: [...state.notifications, { ...notification, id }]
    }))
    
    // 自动移除通知
    setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id)
      }))
    }, 5000)
  }
}))

// 医院状态管理
interface HospitalState {
  hospitals: Hospital[]
  currentHospital: Hospital | null
  total: number
  loading: boolean
  filters: HospitalFilters
  
  fetchHospitals: (filters?: HospitalFilters) => Promise<void>
  fetchHospitalById: (id: number) => Promise<Hospital | null>
  createHospital: (data: any) => Promise<Hospital>
  updateHospital: (id: number, data: any) => Promise<Hospital>
  deleteHospital: (id: number) => Promise<void>
  scanHospital: (id: number) => Promise<void>
  batchScanHospitals: (ids: number[]) => Promise<void>
  setFilters: (filters: Partial<HospitalFilters>) => void
  clearFilters: () => void
}

export const useHospitalStore = create<HospitalState>()(
  devtools(
    (set, get) => ({
      hospitals: [],
      currentHospital: null,
      total: 0,
      loading: false,
      filters: {},

      fetchHospitals: async (filters = {}) => {
        set({ loading: true })
        try {
          const response = await hospitalApi.getHospitals({
            ...get().filters,
            ...filters
          })
          set({
            hospitals: response.data,
            total: response.pagination.total,
            loading: false
          })
        } catch (error) {
          set({ loading: false })
          throw error
        }
      },

      fetchHospitalById: async (id: number) => {
        set({ loading: true })
        try {
          const response = await hospitalApi.getHospitalById(id)
          set({ currentHospital: response.data, loading: false })
          return response.data
        } catch (error) {
          set({ loading: false })
          throw error
        }
      },

      createHospital: async (data) => {
        set({ loading: true })
        try {
          const response = await hospitalApi.createHospital(data)
          set((state) => ({
            hospitals: [response.data, ...state.hospitals],
            total: state.total + 1,
            loading: false
          }))
          return response.data
        } catch (error) {
          set({ loading: false })
          throw error
        }
      },

      updateHospital: async (id, data) => {
        set({ loading: true })
        try {
          const response = await hospitalApi.updateHospital(id, data)
          set((state) => ({
            hospitals: state.hospitals.map(h => h.id === id ? response.data : h),
            currentHospital: state.currentHospital?.id === id ? response.data : state.currentHospital,
            loading: false
          }))
          return response.data
        } catch (error) {
          set({ loading: false })
          throw error
        }
      },

      deleteHospital: async (id: number) => {
        set({ loading: true })
        try {
          await hospitalApi.deleteHospital(id)
          set((state) => ({
            hospitals: state.hospitals.filter(h => h.id !== id),
            total: Math.max(0, state.total - 1),
            loading: false
          }))
        } catch (error) {
          set({ loading: false })
          throw error
        }
      },

      scanHospital: async (id: number) => {
        try {
          await hospitalApi.scanHospital(id)
          // 刷新医院数据
          await get().fetchHospitalById(id)
        } catch (error) {
          throw error
        }
      },

      batchScanHospitals: async (ids: number[]) => {
        try {
          await hospitalApi.batchScanHospitals(ids)
        } catch (error) {
          throw error
        }
      },

      setFilters: (filters) => {
        set((state) => ({
          filters: { ...state.filters, ...filters }
        }))
      },

      clearFilters: () => {
        set({ filters: {} })
      }
    })
  )
)

// 招投标状态管理
interface TenderState {
  tenders: Tender[]
  currentTender: Tender | null
  total: number
  loading: boolean
  filters: TenderFilters
  selectedRowKeys: string[]
  
  fetchTenders: (filters?: TenderFilters) => Promise<void>
  fetchTenderById: (id: number) => Promise<Tender | null>
  markAsImportant: (id: number, important: boolean) => Promise<void>
  batchMarkImportant: (ids: number[], important: boolean) => Promise<void>
  updateStatus: (id: number, status: string) => Promise<void>
  exportData: (filters: Omit<TenderFilters, 'page' | 'per_page'>) => Promise<void>
  setFilters: (filters: Partial<TenderFilters>) => void
  clearFilters: () => void
  setSelectedRowKeys: (keys: string[]) => void
}

export const useTenderStore = create<TenderState>()(
  devtools(
    (set, get) => ({
      tenders: [],
      currentTender: null,
      total: 0,
      loading: false,
      filters: {},
      selectedRowKeys: [],

      fetchTenders: async (filters = {}) => {
        set({ loading: true })
        try {
          const response = await tenderApi.getTenders({
            ...get().filters,
            ...filters
          })
          set({
            tenders: response.data,
            total: response.pagination.total,
            loading: false
          })
        } catch (error) {
          set({ loading: false })
          throw error
        }
      },

      fetchTenderById: async (id: number) => {
        set({ loading: true })
        try {
          const response = await tenderApi.getTenderById(id)
          set({ currentTender: response.data, loading: false })
          return response.data
        } catch (error) {
          set({ loading: false })
          throw error
        }
      },

      markAsImportant: async (id: number, important: boolean) => {
        try {
          await tenderApi.markAsImportant(id, important)
          set((state) => ({
            tenders: state.tenders.map(t => t.id === id ? { ...t, is_important: important } : t)
          }))
        } catch (error) {
          throw error
        }
      },

      batchMarkImportant: async (ids: number[], important: boolean) => {
        try {
          await tenderApi.batchMarkImportant(ids, important)
          set((state) => ({
            tenders: state.tenders.map(t => ids.includes(t.id) ? { ...t, is_important: important } : t)
          }))
        } catch (error) {
          throw error
        }
      },

      updateStatus: async (id: number, status: string) => {
        try {
          const response = await tenderApi.updateStatus(id, status)
          set((state) => ({
            tenders: state.tenders.map(t => t.id === id ? response.data : t)
          }))
        } catch (error) {
          throw error
        }
      },

      exportData: async (filters) => {
        try {
          const blob = await tenderApi.exportTenders(filters)
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `tenders_${new Date().toISOString().split('T')[0]}.xlsx`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)
        } catch (error) {
          throw error
        }
      },

      setFilters: (filters) => {
        set((state) => ({
          filters: { ...state.filters, ...filters }
        }))
      },

      clearFilters: () => {
        set({ filters: {} })
      },

      setSelectedRowKeys: (keys) => {
        set({ selectedRowKeys: keys })
      }
    })
  )
)

// 地区状态管理
interface RegionState {
  regions: Region[]
  selectedRegion: Region | null
  loading: boolean
  
  fetchRegionsTree: () => Promise<void>
  setSelectedRegion: (region: Region | null) => void
}

export const useRegionStore = create<RegionState>()(
  devtools(
    (set, get) => ({
      regions: [],
      selectedRegion: null,
      loading: false,

      fetchRegionsTree: async () => {
        set({ loading: true })
        try {
          const response = await regionApi.getRegionsTree()
          set({ regions: response.data, loading: false })
        } catch (error) {
          set({ loading: false })
          throw error
        }
      },

      setSelectedRegion: (region) => {
        set({ selectedRegion: region })
      }
    })
  )
)

// 爬虫状态管理
interface CrawlerState {
  status: CrawlerStatus | null
  logs: CrawlerLog[]
  totalLogs: number
  loading: boolean
  
  fetchCrawlerStatus: () => Promise<void>
  fetchCrawlerLogs: (params?: { page?: number; per_page?: number; level?: string }) => Promise<void>
  startCrawler: (data?: { hospital_ids?: number[]; force_update?: boolean }) => Promise<void>
  stopCrawler: () => Promise<void>
  triggerCrawler: (data: { hospital_ids?: number[]; priority?: 'low' | 'normal' | 'high' }) => Promise<void>
}

export const useCrawlerStore = create<CrawlerState>()(
  devtools(
    (set, get) => ({
      status: null,
      logs: [],
      totalLogs: 0,
      loading: false,

      fetchCrawlerStatus: async () => {
        try {
          const response = await crawlerApi.getCrawlerStatus()
          set({ status: response.data })
        } catch (error) {
          throw error
        }
      },

      fetchCrawlerLogs: async (params = {}) => {
        try {
          const response = await crawlerApi.getCrawlerLogs(params)
          set({
            logs: response.data.logs,
            totalLogs: response.data.pagination.total
          })
        } catch (error) {
          throw error
        }
      },

      startCrawler: async (data) => {
        set({ loading: true })
        try {
          await crawlerApi.startCrawler(data)
          set({ loading: false })
          await get().fetchCrawlerStatus()
        } catch (error) {
          set({ loading: false })
          throw error
        }
      },

      stopCrawler: async () => {
        set({ loading: true })
        try {
          await crawlerApi.stopCrawler()
          set({ loading: false })
          await get().fetchCrawlerStatus()
        } catch (error) {
          set({ loading: false })
          throw error
        }
      },

      triggerCrawler: async (data) => {
        set({ loading: true })
        try {
          await crawlerApi.triggerCrawler(data)
          set({ loading: false })
          await get().fetchCrawlerStatus()
        } catch (error) {
          set({ loading: false })
          throw error
        }
      }
    })
  )
)

// 统计数据管理
interface StatisticsState {
  statistics: Statistics | null
  dashboardData: any | null
  trendData: any[] | null
  loading: boolean
  
  fetchStatistics: () => Promise<void>
  fetchDashboardData: () => Promise<void>
  fetchTrendData: (params?: { date_from?: string; date_to?: string; granularity?: 'daily' | 'weekly' | 'monthly' }) => Promise<void>
}

export const useStatisticsStore = create<StatisticsState>()(
  devtools(
    (set, get) => ({
      statistics: null,
      dashboardData: null,
      trendData: null,
      loading: false,

      fetchStatistics: async () => {
        set({ loading: true })
        try {
          const response = await statisticsApi.getStatistics()
          set({ statistics: response.data, loading: false })
        } catch (error) {
          set({ loading: false })
          throw error
        }
      },

      fetchDashboardData: async () => {
        set({ loading: true })
        try {
          const response = await statisticsApi.getDashboardData()
          set({ dashboardData: response.data, loading: false })
        } catch (error) {
          set({ loading: false })
          throw error
        }
      },

      fetchTrendData: async (params) => {
        try {
          const response = await statisticsApi.getTrendData(params)
          set({ trendData: response.data })
        } catch (error) {
          throw error
        }
      }
    })
  )
)

// 医院扫描历史状态管理
interface HospitalScanHistoryState {
  scanHistory: HospitalScanHistory[]
  total: number
  loading: boolean
  
  fetchScanHistory: (hospitalId: number, params?: { page?: number; per_page?: number }) => Promise<void>
  clearScanHistory: () => void
}

export const useHospitalScanHistoryStore = create<HospitalScanHistoryState>()(
  devtools(
    (set, get) => ({
      scanHistory: [],
      total: 0,
      loading: false,

      fetchScanHistory: async (hospitalId, params = {}) => {
        set({ loading: true })
        try {
          const response = await hospitalApi.getScanHistory(hospitalId, params)
          set({ 
            scanHistory: response.data, 
            total: response.pagination.total,
            loading: false 
          })
        } catch (error) {
          set({ loading: false })
          throw error
        }
      },

      clearScanHistory: () => {
        set({ scanHistory: [], total: 0 })
      }
    })
  )
)

// 定时任务状态管理
interface SchedulerState {
  tasks: ScheduledTask[]
  total: number
  loading: boolean
  
  fetchScheduledTasks: (params?: { page?: number; per_page?: number }) => Promise<void>
  createScheduledTask: (task: any) => Promise<void>
  updateScheduledTask: (id: string, task: any) => Promise<void>
  deleteScheduledTask: (id: string) => Promise<void>
  toggleScheduledTask: (id: string, enabled: boolean) => Promise<void>
  executeScheduledTask: (id: string) => Promise<void>
}

export const useSchedulerStore = create<SchedulerState>()(
  devtools(
    (set, get) => ({
      tasks: [],
      total: 0,
      loading: false,

      fetchScheduledTasks: async (params = {}) => {
        set({ loading: true })
        try {
          const response = await schedulerApi.getScheduledTasks(params)
          set({ 
            tasks: response.data, 
            total: response.pagination.total,
            loading: false 
          })
        } catch (error) {
          set({ loading: false })
          throw error
        }
      },

      createScheduledTask: async (task) => {
        set({ loading: true })
        try {
          const response = await schedulerApi.createScheduledTask(task)
          set((state) => ({
            tasks: [response.data, ...state.tasks],
            total: state.total + 1,
            loading: false
          }))
        } catch (error) {
          set({ loading: false })
          throw error
        }
      },

      updateScheduledTask: async (id, task) => {
        set({ loading: true })
        try {
          const response = await schedulerApi.updateScheduledTask(id, task)
          set((state) => ({
            tasks: state.tasks.map(t => t.id === id ? response.data : t),
            loading: false
          }))
        } catch (error) {
          set({ loading: false })
          throw error
        }
      },

      deleteScheduledTask: async (id) => {
        set({ loading: true })
        try {
          await schedulerApi.deleteScheduledTask(id)
          set((state) => ({
            tasks: state.tasks.filter(t => t.id !== id),
            total: state.total - 1,
            loading: false
          }))
        } catch (error) {
          set({ loading: false })
          throw error
        }
      },

      toggleScheduledTask: async (id, enabled) => {
        try {
          const response = await schedulerApi.toggleScheduledTask(id, enabled)
          set((state) => ({
            tasks: state.tasks.map(t => t.id === id ? response.data : t)
          }))
        } catch (error) {
          throw error
        }
      },

      executeScheduledTask: async (id) => {
        try {
          await schedulerApi.executeScheduledTask(id)
        } catch (error) {
          throw error
        }
      }
    })
  )
)

// 系统设置状态管理
interface SystemSettingsState {
  settings: SystemSettings | null
  systemInfo: { version: string; uptime: number; health: string } | null
  loading: boolean
  
  fetchSettings: () => Promise<void>
  updateSettings: (settings: SystemSettings) => Promise<void>
  testEmail: (config: { smtp_server: string; smtp_port: number; username: string; password: string; recipients: string[] }) => Promise<void>
  testSms: (config: { api_key: string; recipients: string[] }) => Promise<void>
  fetchSystemInfo: () => Promise<void>
  resetToDefaults: () => Promise<void>
}

export const useSystemSettingsStore = create<SystemSettingsState>()(
  devtools(
    (set, get) => ({
      settings: null,
      systemInfo: null,
      loading: false,

      fetchSettings: async () => {
        set({ loading: true })
        try {
          const response = await systemApi.getSettings()
          set({ settings: response.data, loading: false })
        } catch (error) {
          set({ loading: false })
          throw error
        }
      },

      updateSettings: async (settings: SystemSettings) => {
        set({ loading: true })
        try {
          const response = await systemApi.updateSettings(settings)
          set({ settings: response.data, loading: false })
        } catch (error) {
          set({ loading: false })
          throw error
        }
      },

      testEmail: async (config) => {
        try {
          await systemApi.testEmail(config)
        } catch (error) {
          throw error
        }
      },

      testSms: async (config) => {
        try {
          await systemApi.testSms(config)
        } catch (error) {
          throw error
        }
      },

      fetchSystemInfo: async () => {
        try {
          const response = await systemApi.getSystemInfo()
          set({ systemInfo: response.data })
        } catch (error) {
          throw error
        }
      },

      resetToDefaults: async () => {
        set({ loading: true })
        try {
          const response = await systemApi.resetToDefaults()
          set({ settings: response.data, loading: false })
        } catch (error) {
          set({ loading: false })
          throw error
        }
      }
    })
  )
)