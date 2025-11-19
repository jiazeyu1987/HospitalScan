import React, { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  Layout,
  Menu,
  Avatar,
  Dropdown,
  Space,
  Badge,
  Button,
  Typography,
  Divider
} from 'antd'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  EnvironmentOutlined,
  MedicineBoxOutlined,
  FileTextOutlined,
  ScheduleOutlined,
  BarChartOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
  ToolOutlined,
  PlayCircleOutlined,
  StopOutlined
} from '@ant-design/icons'
import type { MenuProps } from 'antd'

// Store
import { useCrawlerStore } from '../store'
import type { CrawlerStatus } from '../types'

const { Header, Sider, Content } = Layout
const { Text } = Typography

// 菜单配置
const menuItems: MenuProps['items'] = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: '数据总览'
  },
  {
    key: '/regions',
    icon: <EnvironmentOutlined />,
    label: '地区管理'
  },
  {
    key: '/hospitals',
    icon: <MedicineBoxOutlined />,
    label: '医院管理'
  },
  {
    key: '/tenders',
    icon: <FileTextOutlined />,
    label: '招投标监控'
  },
  {
    key: '/scheduler',
    icon: <ScheduleOutlined />,
    label: '任务调度'
  },
  {
    key: '/statistics',
    icon: <BarChartOutlined />,
    label: '数据统计'
  },
  {
    key: '/settings',
    icon: <SettingOutlined />,
    label: '系统设置'
  }
]

// 爬虫状态指示器组件
const CrawlerStatusIndicator: React.FC<{ status?: CrawlerStatus }> = ({ status }) => {
  if (!status) return null

  const getStatusConfig = () => {
    switch (status.status) {
      case 'running':
        return {
          color: 'success',
          text: '运行中',
          icon: <PlayCircleOutlined />,
          progress: status.progress
        }
      case 'error':
        return {
          color: 'error',
          text: '错误',
          icon: <StopOutlined />
        }
      case 'stopped':
        return {
          color: 'default',
          text: '已停止',
          icon: <StopOutlined />
        }
      default:
        return {
          color: 'default',
          text: '未知',
          icon: <StopOutlined />
        }
    }
  }

  const config = getStatusConfig()

  return (
    <div className="flex items-center space-x-2 px-3 py-2 bg-white rounded-lg border">
      <div className={`w-2 h-2 rounded-full bg-${config.color === 'success' ? 'green' : config.color === 'error' ? 'red' : 'gray'}-500`} />
      <Space size="small">
        {config.icon}
        <Text className="text-sm">{config.text}</Text>
        {status.progress > 0 && config.color === 'success' && (
          <Badge count={status.progress} showZero={false} />
        )}
      </Space>
    </div>
  )
}

// Header 组件
const CustomHeader: React.FC<{
  collapsed: boolean
  onToggle: () => void
  crawlerStatus?: CrawlerStatus
}> = ({ collapsed, onToggle, crawlerStatus }) => {
  const navigate = useNavigate()
  
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料'
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置'
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user_info')
        navigate('/login')
      }
    }
  ]

  return (
    <Header className="bg-white border-b border-gray-200 px-4">
      <div className="flex items-center justify-between h-full">
        {/* 左侧 - 菜单折叠按钮 */}
        <div className="flex items-center">
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={onToggle}
            className="text-lg"
          />
        </div>

        {/* 右侧 - 爬虫状态、通知和用户菜单 */}
        <div className="flex items-center space-x-4">
          {/* 爬虫状态指示器 */}
          <CrawlerStatusIndicator status={crawlerStatus} />

          {/* 通知 */}
          <Badge count={3}>
            <BellOutlined className="text-lg cursor-pointer hover:text-blue-600" />
          </Badge>

          {/* 用户菜单 */}
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space className="cursor-pointer hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors">
              <Avatar icon={<UserOutlined />} />
              <span className="text-sm font-medium">管理员</span>
            </Space>
          </Dropdown>
        </div>
      </div>
    </Header>
  )
}

// Sidebar 组件
const CustomSidebar: React.FC<{
  collapsed: boolean
  location: string
}> = ({ collapsed, location }) => {
  const navigate = useNavigate()

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
  }

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      width={300}
      className="bg-white border-r border-gray-200"
    >
      {/* Logo */}
      <div className="flex items-center justify-center h-16 border-b border-gray-200">
        {collapsed ? (
          <MedicineBoxOutlined className="text-2xl text-blue-600" />
        ) : (
          <div className="flex items-center space-x-2">
            <MedicineBoxOutlined className="text-2xl text-blue-600" />
            <span className="text-lg font-semibold text-gray-800">医院监控系统</span>
          </div>
        )}
      </div>

      {/* 菜单 */}
      <Menu
        mode="inline"
        selectedKeys={[location]}
        items={menuItems}
        onClick={handleMenuClick}
        className="border-none h-full"
      />
    </Sider>
  )
}

// 主布局组件
const MainLayout: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const { status: crawlerStatus } = useCrawlerStore()

  return (
    <Layout className="min-h-screen">
      {/* 侧边栏 */}
      <CustomSidebar collapsed={collapsed} location={location.pathname} />

      <Layout>
        {/* 头部 */}
        <CustomHeader
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
          crawlerStatus={crawlerStatus}
        />

        {/* 主内容区域 */}
        <Content className="bg-gray-50 p-6 overflow-auto">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout