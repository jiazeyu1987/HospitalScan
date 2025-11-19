import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider, App as AntApp } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import 'dayjs/locale/zh-cn'
import dayjs from 'dayjs'

// Pages
import LoginPage from './pages/LoginPage'
import MainLayout from './components/MainLayout'
import Dashboard from './pages/Dashboard'
import HospitalsPage from './pages/HospitalsPage'
import HospitalDetailPage from './pages/HospitalDetailPage'
import HospitalEditPage from './pages/HospitalEditPage'
import TendersPage from './pages/TendersPage'
import RegionsPage from './pages/RegionsPage'
import SchedulerPage from './pages/SchedulerPage'
import StatisticsPage from './pages/StatisticsPage'
import Settings from './pages/Settings'
import CrawlerDashboard from './pages/CrawlerDashboard'

// Store
import { useCrawlerStore } from './store'

// Error Boundary
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="text-center">
              <h2 className="text-lg font-medium text-gray-900 mb-4">页面出现错误</h2>
              <p className="text-gray-500 mb-4">抱歉，页面加载过程中出现了错误。请刷新页面重试。</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                刷新页面
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Auth Guard
const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('auth_token')
  
  if (!token) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

// Main App Component
const App: React.FC = () => {
  const { fetchCrawlerStatus } = useCrawlerStore()

  useEffect(() => {
    // 设置 dayjs 中文
    dayjs.locale('zh-cn')
    
    // 初始化爬虫状态
    fetchCrawlerStatus()
    
    // 设置定时刷新爬虫状态
    const interval = setInterval(fetchCrawlerStatus, 30000) // 30秒刷新一次
    return () => clearInterval(interval)
  }, [fetchCrawlerStatus])

  return (
    <ErrorBoundary>
      <ConfigProvider locale={zhCN} theme={{
        token: {
          colorPrimary: '#1890ff',
          colorSuccess: '#52c41a',
          colorWarning: '#faad14',
          colorError: '#f5222d',
          colorInfo: '#1890ff',
          borderRadius: 6,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial, sans-serif'
        },
        components: {
          Layout: {
            bodyBg: '#f5f5f5',
            headerBg: '#ffffff',
            siderBg: '#ffffff'
          },
          Menu: {
            itemBg: 'transparent',
            itemSelectedBg: '#e6f7ff',
            itemHoverBg: '#f5f5f5'
          }
        }
      }}>
        <AntApp>
          <Router>
            <div className="min-h-screen bg-gray-50">
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<LoginPage />} />
                
                {/* Protected Routes */}
                <Route
                  path="/"
                  element={
                    <AuthGuard>
                      <MainLayout />
                    </AuthGuard>
                  }
                >
                  <Route index element={<Dashboard />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="hospitals" element={<HospitalsPage />} />
                  <Route path="hospitals/create" element={<HospitalEditPage mode="create" />} />
                  <Route path="hospitals/:id" element={<HospitalDetailPage />} />
                  <Route path="hospitals/:id/edit" element={<HospitalEditPage mode="edit" />} />
                  <Route path="tenders" element={<TendersPage />} />
                  <Route path="regions" element={<RegionsPage />} />
                  <Route path="scheduler" element={<CrawlerDashboard />} />
                  <Route path="statistics" element={<StatisticsPage />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
                
                {/* 404 Route */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </div>
          </Router>
        </AntApp>
      </ConfigProvider>
    </ErrorBoundary>
  )
}

export default App