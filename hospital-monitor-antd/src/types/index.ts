// API基础类型
export interface ApiResponse<T = any> {
  success: boolean
  data: T
  message?: string
  error?: string
}

export interface PaginationResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number
    per_page: number
    total: number
    pages: number
  }
}

// 医院相关类型
export interface Hospital {
  id: number
  name: string
  hospital_type: 'public' | 'private' | 'community' | 'specialized' | 'traditional'
  hospital_level: 'level1' | 'level2' | 'level3' | 'level3a' | null
  status: 'active' | 'inactive' | 'closed' | 'relocated'
  address?: string
  phone?: string
  website_url?: string
  region_id: number
  verified: boolean
  tender_count: number
  scan_success_count: number
  scan_failed_count: number
  last_scan_time?: string
  created_at: string
  updated_at: string
}

export interface HospitalFilters {
  name?: string
  hospital_type?: string
  status?: string
  region_id?: number
  verified?: boolean
  page?: number
  per_page?: number
}

// 招投标相关类型
export interface Tender {
  id: number
  hospital_id: number
  title: string
  content?: string
  tender_type: 'construction' | 'procurement' | 'service' | 'medical' | 'equipment' | 'other'
  budget_amount?: number
  budget_currency: string
  publish_date?: string
  deadline_date?: string
  status: 'published' | 'in_progress' | 'closed' | 'cancelled' | 'awarded'
  source_url?: string
  is_important: boolean
  hospital_name?: string
  created_at: string
  updated_at: string
}

export interface TenderFilters {
  keyword?: string
  tender_type?: string
  status?: string
  hospital_id?: number
  region_id?: number
  is_important?: boolean
  date_range?: [string, string]
  page?: number
  per_page?: number
}

// 地区相关类型
export interface Region {
  id: number
  name: string
  level: number
  parent_id: number | null
  hospital_count?: number
  children?: Region[]
  tender_count?: number
}

// 爬虫相关类型
export interface CrawlerStatus {
  status: 'running' | 'stopped' | 'error'
  progress: number
  current_task?: string
  total_tasks: number
  completed_tasks: number
  start_time?: string
  end_time?: string
}

export interface CrawlerLog {
  id: number
  timestamp: string
  level: 'info' | 'warning' | 'error'
  message: string
  hospital_id?: number
  hospital_name?: string
}

// 用户认证类型
export interface User {
  id: number
  username: string
  name: string
  email: string
  role: string
  created_at: string
  last_login?: string
}

// 统计数据类型
export interface Statistics {
  total_hospitals: number
  verified_hospitals: number
  active_hospitals: number
  total_tenders: number
  weekly_new_tenders: number
  monthly_new_tenders: number
  scan_success_rate: number
  total_budget: number
  
  trend_data: {
    date: string
    new_tenders: number
    active_hospitals: number
    scan_count: number
    total_budget: number
  }[]
  
  hospital_type_distribution: {
    type: string
    count: number
  }[]
  
  tender_type_distribution: {
    type: string
    count: number
  }[]
}

// 定时任务表单类型
export interface CreateScheduledTaskForm {
  name: string
  description?: string
  type: ScheduledTask['type']
  cron_expression: string
  enabled: boolean
}

export interface UpdateScheduledTaskForm {
  name?: string
  description?: string
  cron_expression?: string
  enabled?: boolean
}

// 表单类型
export interface LoginForm {
  username: string
  password: string
}


  name: string
  hospital_type: Hospital['hospital_type']
  hospital_level: Hospital['hospital_level']
  status: Hospital['status']
  address?: string
  phone?: string
  website_url?: string
  region_id: number
}

// 系统设置类型
export interface SystemSettings {
  // 爬虫配置
  crawler: {
    scan_interval: number // 扫描间隔(秒)
    concurrent_requests: number // 并发数
    request_timeout: number // 请求超时时间(秒)
    max_retries: number // 最大重试次数
    user_agent: string // 用户代理
    proxy_enabled: boolean // 是否启用代理
    proxy_url?: string // 代理URL
  }
  
  // 通知配置
  notification: {
    email_enabled: boolean // 是否启用邮件通知
    email_smtp_server?: string // SMTP服务器
    email_smtp_port?: number // SMTP端口
    email_username?: string // 邮箱用户名
    email_password?: string // 邮箱密码
    email_recipients: string[] // 邮件接收者
    sms_enabled: boolean // 是否启用短信通知
    sms_api_key?: string // 短信API密钥
    sms_recipients: string[] // 短信接收者
  }
  
  // 数据保留设置
  data_retention: {
    logs_retention_days: number // 日志保留天数
    tenders_retention_days: number // 招投标数据保留天数
    auto_cleanup_enabled: boolean // 是否启用自动清理
    cleanup_schedule: string // 清理计划(cron表达式)
  }
  
  // API配置
  api: {
    rate_limit: number // API速率限制
    api_key_rotation_days: number // API密钥轮换天数
    debug_mode: boolean // 调试模式
  }
}

// 医院扫描历史类型
export interface HospitalScanHistory {
  id: number
  hospital_id: number
  scan_time: string
  status: 'success' | 'failed' | 'partial'
  tenders_found: number
  response_time: number
  error_message?: string
  details?: any
}

// 定时任务类型
export interface ScheduledTask {
  id: string
  name: string
  description: string
  type: 'daily' | 'weekly' | 'monthly' | 'custom'
  cron_expression: string
  enabled: boolean
  last_run?: string
  next_run?: string
  status: 'active' | 'inactive' | 'running' | 'error'
  success_count: number
  failure_count: number
  created_at: string
}

// 表单类型
export interface CreateHospitalForm {
  name: string
  hospital_type: Hospital['hospital_type']
  hospital_level: Hospital['hospital_level']
  status: Hospital['status']
  address?: string
  phone?: string
  website_url?: string
  region_id: number
}