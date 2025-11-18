import axios from 'axios'
import type { 
  ApiResponse, 
  PaginationResponse, 
  Hospital, 
  HospitalFilters,
  Tender,
  TenderFilters,
  Region,
  CrawlerStatus,
  CrawlerLog,
  Statistics,
  User,
  CreateHospitalForm,
  SystemSettings,
  HospitalScanHistory,
  ScheduledTask,
  CreateScheduledTaskForm,
  UpdateScheduledTaskForm
} from '../types'

// API基础配置
const API_BASE_URL = 'http://localhost:5000/api/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_info')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// 医院API服务
export const hospitalApi = {
  // 获取医院列表
  getHospitals: async (filters?: HospitalFilters): Promise<PaginationResponse<Hospital>> => {
    const params = {
      page: filters?.page || 1,
      per_page: filters?.per_page || 20,
      ...filters
    }
    return api.get('/hospitals', { params })
  },

  // 获取医院详情
  getHospitalById: async (id: number): Promise<ApiResponse<Hospital>> => {
    return api.get(`/hospitals/${id}`)
  },

  // 创建医院
  createHospital: async (data: CreateHospitalForm): Promise<ApiResponse<Hospital>> => {
    return api.post('/hospitals', data)
  },

  // 更新医院
  updateHospital: async (id: number, data: Partial<CreateHospitalForm>): Promise<ApiResponse<Hospital>> => {
    return api.put(`/hospitals/${id}`, data)
  },

  // 删除医院
  deleteHospital: async (id: number): Promise<ApiResponse<boolean>> => {
    return api.delete(`/hospitals/${id}`)
  },

  // 搜索医院
  searchHospitals: async (keyword: string): Promise<ApiResponse<Hospital[]>> => {
    return api.get('/hospitals/search', { params: { keyword } })
  },

  // 批量导入医院
  batchImportHospitals: async (formData: FormData): Promise<ApiResponse<{ success: number; failed: number; errors: any[] }>> => {
    return api.post('/hospitals/batch_import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  // 扫描医院
  scanHospital: async (id: number): Promise<ApiResponse<{ status: string; message: string }>> => {
    return api.post(`/hospitals/${id}/scan`)
  },

  // 批量扫描
  batchScanHospitals: async (ids: number[]): Promise<ApiResponse<{ status: string; task_id: string }>> => {
    return api.post('/crawler/trigger', {
      hospital_ids: ids,
      priority: 'normal'
    })
  },

  // 获取医院扫描历史
  getScanHistory: async (hospitalId: number, params?: { page?: number; per_page?: number }): Promise<PaginationResponse<HospitalScanHistory>> => {
    return api.get(`/hospitals/${hospitalId}/scan_history`, { params })
  }
}

// 招投标API服务
export const tenderApi = {
  // 获取招投标列表
  getTenders: async (filters?: TenderFilters): Promise<PaginationResponse<Tender>> => {
    const params = {
      page: filters?.page || 1,
      per_page: filters?.per_page || 20,
      ...filters
    }
    return api.get('/tenders', { params })
  },

  // 获取招投标详情
  getTenderById: async (id: number): Promise<ApiResponse<Tender>> => {
    return api.get(`/tenders/${id}`)
  },

  // 标记重要
  markAsImportant: async (id: number, important: boolean): Promise<ApiResponse<Tender>> => {
    return api.patch(`/tenders/${id}`, { is_important: important })
  },

  // 批量标记重要
  batchMarkImportant: async (ids: number[], important: boolean): Promise<ApiResponse<{ success: number; failed: number }>> => {
    return api.patch('/tenders', {
      ids,
      is_important: important
    })
  },

  // 更新状态
  updateStatus: async (id: number, status: string): Promise<ApiResponse<Tender>> => {
    return api.patch(`/tenders/${id}`, { status })
  },

  // 导出数据
  exportTenders: async (filters: Omit<TenderFilters, 'page' | 'per_page'>): Promise<Blob> => {
    const params = { ...filters }
    const response = await api.get('/tenders/export', {
      params,
      responseType: 'blob'
    })
    return response.data
  },

  // 获取统计信息
  getStatistics: async (): Promise<ApiResponse<any>> => {
    return api.get('/tenders/stats')
  }
}

// 地区API服务
export const regionApi = {
  // 获取地区树形结构
  getRegionsTree: async (): Promise<ApiResponse<Region[]>> => {
    return api.get('/regions')
  },

  // 获取地区详情
  getRegionById: async (id: number): Promise<ApiResponse<Region>> => {
    return api.get(`/regions/${id}`)
  },

  // 获取地区下的医院
  getHospitalsByRegion: async (id: number): Promise<ApiResponse<Hospital[]>> => {
    return api.get(`/regions/${id}/hospitals`)
  },

  // 搜索地区
  searchRegions: async (keyword: string): Promise<ApiResponse<Region[]>> => {
    return api.get('/regions/search', { params: { keyword } })
  }
}

// 爬虫API服务
export const crawlerApi = {
  // 启动爬虫
  startCrawler: async (data?: { hospital_ids?: number[]; force_update?: boolean }): Promise<ApiResponse<{ status: string; task_id: string }>> => {
    return api.post('/crawler/start', data || {})
  },

  // 停止爬虫
  stopCrawler: async (): Promise<ApiResponse<{ status: string; message: string }>> => {
    return api.post('/crawler/stop')
  },

  // 获取爬虫状态
  getCrawlerStatus: async (): Promise<ApiResponse<CrawlerStatus>> => {
    return api.get('/crawler/status')
  },

  // 获取爬虫日志
  getCrawlerLogs: async (params?: { page?: number; per_page?: number; level?: string }): Promise<ApiResponse<{ logs: CrawlerLog[]; pagination: any }>> => {
    return api.get('/crawler/logs', { params })
  },

  // 手动触发爬虫
  triggerCrawler: async (data: { hospital_ids?: number[]; priority?: 'low' | 'normal' | 'high' }): Promise<ApiResponse<{ status: string; task_id: string }>> => {
    return api.post('/crawler/trigger', data)
  }
}

// 统计API服务
export const statisticsApi = {
  // 获取统计数据
  getStatistics: async (): Promise<ApiResponse<Statistics>> => {
    return api.get('/statistics')
  },

  // 获取趋势数据
  getTrendData: async (params?: { date_from?: string; date_to?: string; granularity?: 'daily' | 'weekly' | 'monthly' }): Promise<ApiResponse<any>> => {
    return api.get('/statistics/trend', { params })
  },

  // 获取仪表板数据
  getDashboardData: async (): Promise<ApiResponse<any>> => {
    return api.get('/statistics/dashboard')
  }
}

// 系统API服务
export const systemApi = {
  // 获取系统设置
  getSettings: async (): Promise<ApiResponse<SystemSettings>> => {
    return api.get('/settings')
  },

  // 更新系统设置
  updateSettings: async (settings: SystemSettings): Promise<ApiResponse<SystemSettings>> => {
    return api.put('/settings', settings)
  },

  // 测试邮件配置
  testEmail: async (config: { smtp_server: string; smtp_port: number; username: string; password: string; recipients: string[] }): Promise<ApiResponse<{ success: boolean }>> => {
    return api.post('/settings/test_email', config)
  },

  // 测试短信配置
  testSms: async (config: { api_key: string; recipients: string[] }): Promise<ApiResponse<{ success: boolean }>> => {
    return api.post('/settings/test_sms', config)
  },

  // 获取系统信息
  getSystemInfo: async (): Promise<ApiResponse<{ version: string; uptime: number; health: string }>> => {
    return api.get('/settings/system_info')
  },

  // 重置设置为默认值
  resetToDefaults: async (): Promise<ApiResponse<SystemSettings>> => {
    return api.post('/settings/reset_defaults')
  }
}

// 定时任务API服务
export const schedulerApi = {
  // 获取定时任务列表
  getScheduledTasks: async (params?: { page?: number; per_page?: number }): Promise<PaginationResponse<ScheduledTask>> => {
    const queryParams = {
      page: params?.page || 1,
      per_page: params?.per_page || 20
    }
    return api.get('/scheduler/tasks', { params: queryParams })
  },

  // 创建定时任务
  createScheduledTask: async (task: CreateScheduledTaskForm): Promise<ApiResponse<ScheduledTask>> => {
    return api.post('/scheduler/tasks', task)
  },

  // 更新定时任务
  updateScheduledTask: async (id: string, task: UpdateScheduledTaskForm): Promise<ApiResponse<ScheduledTask>> => {
    return api.put(`/scheduler/tasks/${id}`, task)
  },

  // 删除定时任务
  deleteScheduledTask: async (id: string): Promise<ApiResponse<boolean>> => {
    return api.delete(`/scheduler/tasks/${id}`)
  },

  // 启用/禁用定时任务
  toggleScheduledTask: async (id: string, enabled: boolean): Promise<ApiResponse<ScheduledTask>> => {
    return api.patch(`/scheduler/tasks/${id}`, { enabled })
  },

  // 手动执行定时任务
  executeScheduledTask: async (id: string): Promise<ApiResponse<{ status: string; task_id: string }>> => {
    return api.post(`/scheduler/tasks/${id}/execute`)
  }
}

export default api