# React前端界面设计文档

**作者：** MiniMax Agent  
**版本：** v1.0  
**日期：** 2025-11-18  
**项目：** 全国医院官网扫描与招投标监控系统

---

## 🎯 一、系统概述

### 1.1 设计目标
React前端界面系统为医院招投标监控系统提供直观、高效的Web管理界面，支持地区树形展示、医院信息管理、招投标数据查看、实时监控等功能。

### 1.2 技术架构

```typescript
// 前端技术栈
React Application:
├── Framework & Tools     // 框架和工具
│   ├── React 18         // React框架
│   ├── TypeScript       // 类型安全
│   ├── Vite             // 构建工具
│   ├── Ant Design       // UI组件库
│   └── Zustand          // 状态管理
├── Component Layer     // 组件层
│   ├── Layout          // 布局组件
│   ├── Tree            // 树形组件
│   ├── Table           // 表格组件
│   ├── Form            // 表单组件
│   ├── Chart           // 图表组件
│   └── Modal           // 弹窗组件
├── Service Layer       // 服务层
│   ├── API Service     // API接口服务
│   ├── Data Service    // 数据服务
│   └── Cache Service   // 缓存服务
├── Store Layer         // 状态层
│   ├── Global Store    // 全局状态
│   ├── Page Store      // 页面状态
│   └── Component Store // 组件状态
└── Utility Layer       // 工具层
    ├── Utils           // 通用工具
    ├── Helpers          // 辅助函数
    └── Constants        // 常量定义
```

### 1.3 页面结构

```
├── 登录页面 (/login)
├── 主界面 (/app)
│   ├── 头部导航栏
│   ├── 侧边栏菜单
│   ├── 内容区域
│   │   ├── 地区医院管理 (/regions)
│   │   ├── 医院列表 (/hospitals)
│   │   ├── 招投标监控 (/tenders)
│   │   ├── 任务调度 (/scheduler)
│   │   ├── 数据统计 (/statistics)
│   │   └── 系统设置 (/settings)
│   └── 底部状态栏
└── 404页面 (/404)
```

---

## 🏗️ 二、项目初始化和配置

### 2.1 项目结构

```bash
hospital-tender-monitor-frontend/
├── public/
│   ├── index.html
│   ├── favicon.ico
│   └── robots.txt
├── src/
│   ├── components/          # 通用组件
│   │   ├── common/         # 通用业务组件
│   │   ├── layout/         # 布局组件
│   │   ├── forms/          # 表单组件
│   │   ├── charts/         # 图表组件
│   │   └── modals/         # 弹窗组件
│   ├── pages/              # 页面组件
│   │   ├── login/
│   │   ├── layout/
│   │   ├── regions/
│   │   ├── hospitals/
│   │   ├── tenders/
│   │   ├── scheduler/
│   │   ├── statistics/
│   │   └── settings/
│   ├── services/           # 服务层
│   │   ├── api/
│   │   ├── data/
│   │   └── cache/
│   ├── store/              # 状态管理
│   │   ├── global.ts
│   │   ├── auth.ts
│   │   ├── regions.ts
│   │   ├── hospitals.ts
│   │   ├── tenders.ts
│   │   └── ui.ts
│   ├── hooks/              # 自定义Hooks
│   │   ├── useApi.ts
│   │   ├── useAuth.ts
│   │   ├── usePagination.ts
│   │   └── useWebSocket.ts
│   ├── utils/              # 工具函数
│   │   ├── api.ts
│   │   ├── date.ts
│   │   ├── format.ts
│   │   └── validation.ts
│   ├── types/              # 类型定义
│   │   ├── api.ts
│   │   ├── domain.ts
│   │   └── ui.ts
│   ├── constants/          # 常量定义
│   │   ├── api.ts
│   │   ├── routes.ts
│   │   └── config.ts
│   ├── styles/             # 样式文件
│   │   ├── global.css
│   │   ├── variables.css
│   │   └── components/
│   ├── App.tsx             # 主应用组件
│   ├── main.tsx            # 应用入口
│   └── vite-env.d.ts       # Vite类型定义
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

### 2.2 基础配置文件

```json
// package.json
{
  "name": "hospital-tender-monitor-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.0",
    "antd": "^5.12.0",
    "@ant-design/icons": "^5.2.0",
    "zustand": "^4.4.0",
    "axios": "^1.6.0",
    "dayjs": "^1.11.0",
    "lodash-es": "^4.17.0",
    "classnames": "^2.3.0",
    "react-query": "^3.39.0",
    "recharts": "^2.8.0",
    "react-beautiful-dnd": "^13.1.1",
    "react-window": "^1.8.0",
    "react-window-infinite-loader": "^1.0.7"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/node": "^20.0.0",
    "@types/lodash-es": "^4.17.0",
    "@types/classnames": "^2.3.0",
    "@types/react-beautiful-dnd": "^13.1.4",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0",
    "eslint": "^8.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@services': path.resolve(__dirname, './src/services'),
      '@store': path.resolve(__dirname, './src/store'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types')
    }
  },
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          antd: ['antd', '@ant-design/icons'],
          utils: ['lodash-es', 'dayjs', 'axios']
        }
      }
    }
  }
})
```

```typescript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        }
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem'
      }
    },
  },
  plugins: [],
}
```

---

## 🎨 三、UI布局设计

### 3.1 主布局组件

```tsx
// src/components/layout/MainLayout.tsx
import React, { useState } from 'react'
import { Layout, Menu, Avatar, Dropdown, Badge, Space } from 'antd'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  EnvironmentOutlined,
  HospitalOutlined,
  FileTextOutlined,
  ScheduleOutlined,
  BarChartOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  BellOutlined
} from '@ant-design/icons'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@store/auth'
import { useUIStore } from '@store/ui'

const { Header, Sider, Content } = Layout

const MainLayout: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const { sidebarCollapsed, setSidebarCollapsed } = useUIStore()

  const menuItems = [
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
      icon: <HospitalOutlined />,
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

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
  }

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: logout
    }
  ]

  const siderWidth = sidebarCollapsed ? 80 : 200

  return (
    <Layout className="min-h-screen">
      {/* 侧边栏 */}
      <Sider
        trigger={null}
        collapsible
        collapsed={sidebarCollapsed}
        width={siderWidth}
        className="bg-white shadow-lg"
        theme="light"
      >
        {/* Logo */}
        <div className="flex items-center justify-center h-16 border-b border-gray-200">
          {sidebarCollapsed ? (
            <HospitalOutlined className="text-2xl text-blue-600" />
          ) : (
            <div className="flex items-center space-x-2">
              <HospitalOutlined className="text-2xl text-blue-600" />
              <span className="text-lg font-semibold text-gray-800">
                医院监控
              </span>
            </div>
          )}
        </div>

        {/* 菜单 */}
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          className="border-none"
        />
      </Sider>

      <Layout>
        {/* 头部 */}
        <Header className="bg-white px-4 shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-full">
            {/* 折叠按钮 */}
            <div className="flex items-center">
              {React.createElement(
                sidebarCollapsed ? MenuUnfoldOutlined : MenuFoldOutlined,
                {
                  className: 'text-xl cursor-pointer hover:text-blue-600 transition-colors',
                  onClick: () => setSidebarCollapsed(!sidebarCollapsed)
                }
              )}
            </div>

            {/* 右侧菜单 */}
            <Space size="large">
              {/* 通知 */}
              <Badge count={5} size="small">
                <BellOutlined className="text-lg cursor-pointer hover:text-blue-600" />
              </Badge>

              {/* 用户信息 */}
              <Dropdown
                menu={{ items: userMenuItems }}
                placement="bottomRight"
                trigger={['click']}
              >
                <Space className="cursor-pointer hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors">
                  <Avatar icon={<UserOutlined />} />
                  <span className="text-sm font-medium">
                    {user?.name || '管理员'}
                  </span>
                </Space>
              </Dropdown>
            </Space>
          </div>
        </Header>

        {/* 内容区域 */}
        <Content className="m-6 p-6 bg-white rounded-lg shadow-sm">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
```

### 3.2 响应式设计

```css
/* src/styles/responsive.css */

/* 移动端适配 */
@media (max-width: 768px) {
  .ant-layout-sider {
    position: fixed !important;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: 1000;
  }
  
  .ant-layout-sider-collapsed {
    left: -200px;
  }
  
  .ant-layout-content {
    margin-left: 0 !important;
  }
}

/* 平板端适配 */
@media (max-width: 1024px) {
  .ant-layout-sider {
    width: 60px !important;
  }
  
  .ant-layout-content {
    margin-left: 60px !important;
  }
}

/* 大屏端优化 */
@media (min-width: 1920px) {
  .ant-layout-content {
    max-width: 1400px;
    margin: 0 auto;
  }
}
```

---

## 🏢 四、核心业务组件

### 4.1 地区医院树形组件

```tsx
// src/components/common/RegionHospitalTree.tsx
import React, { useState, useEffect, useCallback } from 'react'
import { Tree, Spin, Input, Badge, Space, Button } from 'antd'
import { 
  EnvironmentOutlined, 
  HospitalOutlined, 
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined
} from '@ant-design/icons'
import { useRegionsStore } from '@store/regions'
import { useHospitalsStore } from '@store/hospitals'
import type { DataNode } from 'antd/es/tree'

const { Search } = Input

interface RegionHospitalTreeProps {
  onRegionSelect?: (regionId: number) => void
  onHospitalSelect?: (hospitalId: number) => void
  selectedKeys?: string[]
  onAddHospital?: (regionId: number) => void
}

const RegionHospitalTree: React.FC<RegionHospitalTreeProps> = ({
  onRegionSelect,
  onHospitalSelect,
  selectedKeys = [],
  onAddHospital
}) => {
  const [expandedKeys, setExpandedKeys] = useState<string[]>(['0'])
  const [autoExpandParent, setAutoExpandParent] = useState(true)
  const [searchValue, setSearchValue] = useState('')
  
  const { 
    regions, 
    loading: regionsLoading, 
    fetchRegionsTree,
    searchRegions
  } = useRegionsStore()
  
  const {
    hospitals,
    loading: hospitalsLoading,
    fetchHospitalsByRegion
  } = useHospitalsStore()

  useEffect(() => {
    fetchRegionsTree()
  }, [fetchRegionsTree])

  // 转换数据为Tree组件格式
  const convertToTreeData = useCallback((regions: any[], searchValue: string = ''): DataNode[] => {
    const filterTree = (nodes: any[]): any[] => {
      return nodes
        .filter(node => {
          if (searchValue && !node.name.includes(searchValue)) {
            return false
          }
          return true
        })
        .map(node => ({
          ...node,
          key: String(node.id),
          title: renderTreeTitle(node, searchValue),
          children: node.children ? filterTree(node.children) : []
        }))
    }

    const renderTreeTitle = (node: any, search: string) => {
      const isHospital = node.level === 'hospital'
      const title = search ? 
        node.name.replace(new RegExp(search, 'g'), `**${search}**`) : 
        node.name

      return (
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center space-x-2">
            {isHospital ? (
              <HospitalOutlined className="text-blue-500" />
            ) : (
              <EnvironmentOutlined className="text-green-500" />
            )}
            <span 
              dangerouslySetInnerHTML={{ __html: title }}
              className="text-sm"
            />
          </div>
          
          <div className="flex items-center space-x-1">
            {isHospital && (
              <Badge 
                count={node.tender_count || 0} 
                size="small" 
                className="text-xs"
              />
            )}
            {!isHospital && (
              <Badge 
                count={node.hospital_count || 0} 
                size="small" 
                className="text-xs"
              />
            )}
          </div>
        </div>
      )
    }

    return filterTree(regions)
  }, [])

  // 树节点选择处理
  const handleSelect = (selectedKeys: string[], info: any) => {
    const key = selectedKeys[0]
    const node = info.node
    
    if (node.level < 3) { // 地区节点
      onRegionSelect?.(Number(key))
      // 加载该地区的医院
      fetchHospitalsByRegion(Number(key))
    } else { // 医院节点
      onHospitalSelect?.(Number(key))
    }
  }

  // 搜索处理
  const handleSearch = (value: string) => {
    setSearchValue(value)
    if (value.trim()) {
      searchRegions(value)
    }
  }

  // 刷新数据
  const handleRefresh = () => {
    fetchRegionsTree()
  }

  const treeData = convertToTreeData(regions, searchValue)

  return (
    <div className="h-full flex flex-col">
      {/* 搜索和操作栏 */}
      <div className="p-4 border-b border-gray-200">
        <Space direction="vertical" className="w-full" size="small">
          <Search
            placeholder="搜索地区或医院"
            prefix={<SearchOutlined />}
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
            allowClear
          />
          
          <Space className="w-full justify-between">
            <Button
              icon={<ReloadOutlined />}
              size="small"
              onClick={handleRefresh}
              loading={regionsLoading}
            >
              刷新
            </Button>
            
            {onAddHospital && (
              <Button
                icon={<PlusOutlined />}
                size="small"
                type="primary"
                onClick={() => onAddHospital(Number(selectedKeys[0]) || 1)}
              >
                添加医院
              </Button>
            )}
          </Space>
        </Space>
      </div>

      {/* 树形组件 */}
      <div className="flex-1 overflow-auto">
        <Spin spinning={regionsLoading}>
          <Tree
            onExpand={(expandedKeysValue) => {
              setExpandedKeys(expandedKeysValue)
              setAutoExpandParent(false)
            }}
            expandedKeys={expandedKeys}
            autoExpandParent={autoExpandParent}
            onSelect={handleSelect}
            selectedKeys={selectedKeys}
            treeData={treeData}
            showIcon
            defaultExpandAll={false}
            className="p-2"
          />
        </Spin>
      </div>
    </div>
  )
}

export default RegionHospitalTree
```

### 4.2 医院信息卡片组件

```tsx
// src/components/common/HospitalCard.tsx
import React, { useState } from 'react'
import { 
  Card, 
  Descriptions, 
  Tag, 
  Space, 
  Button, 
  Badge,
  Progress,
  Statistic,
  Tooltip
} from 'antd'
import { 
  EnvironmentOutlined,
  PhoneOutlined,
  GlobalOutlined,
  EyeOutlined,
  EditOutlined,
  ScanOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import type { Hospital } from '@types/domain'

interface HospitalCardProps {
  hospital: Hospital
  onEdit?: (hospital: Hospital) => void
  onScan?: (hospitalId: number) => void
  onViewDetails?: (hospital: Hospital) => void
}

const HospitalCard: React.FC<HospitalCardProps> = ({
  hospital,
  onEdit,
  onScan,
  onViewDetails
}) => {
  const [loading, setLoading] = useState(false)

  const handleScan = async () => {
    setLoading(true)
    try {
      await onScan?.(hospital.id)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success'
      case 'inactive': return 'warning'
      case 'closed': return 'error'
      default: return 'default'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '正常运营'
      case 'inactive': return '暂停运营'
      case 'closed': return '已关闭'
      case 'relocated': return '已迁移'
      default: return '未知'
    }
  }

  const getHospitalTypeText = (type: string) => {
    switch (type) {
      case 'public': return '公立医院'
      case 'private': return '私立医院'
      case 'community': return '社区卫生服务中心'
      case 'specialized': return '专科医院'
      case 'traditional': return '中医院'
      default: return '未知类型'
    }
  }

  const getLevelText = (level: string) => {
    switch (level) {
      case 'level1': return '一级医院'
      case 'level2': return '二级医院'
      case 'level3': return '三级医院'
      case 'level3a': return '三级甲等'
      default: return '等级未知'
    }
  }

  return (
    <Card
      title={
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <HospitalOutlined className="text-blue-500" />
            <span className="font-semibold">{hospital.name}</span>
            {hospital.verified && (
              <Tooltip title="已验证">
                <CheckCircleOutlined className="text-green-500" />
              </Tooltip>
            )}
            {!hospital.website_url && (
              <Tooltip title="无官网">
                <ExclamationCircleOutlined className="text-orange-500" />
              </Tooltip>
            )}
          </div>
          
          <Tag color={getStatusColor(hospital.status)}>
            {getStatusText(hospital.status)}
          </Tag>
        </div>
      }
      extra={
        <Space>
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => onViewDetails?.(hospital)}
          >
            查看详情
          </Button>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => onEdit?.(hospital)}
          >
            编辑
          </Button>
        </Space>
      }
      className="hover:shadow-lg transition-shadow"
    >
      <div className="space-y-4">
        {/* 基本信息 */}
        <Descriptions column={2} size="small" bordered>
          <Descriptions.Item label="医院类型">
            <Tag>{getHospitalTypeText(hospital.hospital_type)}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="医院等级">
            <Tag color="blue">{getLevelText(hospital.hospital_level)}</Tag>
          </Descriptions.Item>
          
          <Descriptions.Item label="地址" span={2}>
            <Space>
              <EnvironmentOutlined />
              {hospital.address || '未填写'}
            </Space>
          </Descriptions.Item>
          
          {hospital.phone && (
            <Descriptions.Item label="电话" span={2}>
              <Space>
                <PhoneOutlined />
                {hospital.phone}
              </Space>
            </Descriptions.Item>
          )}
          
          {hospital.website_url && (
            <Descriptions.Item label="官网" span={2}>
              <Space>
                <GlobalOutlined />
                <a 
                  href={hospital.website_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-700"
                >
                  {hospital.website_url}
                </a>
              </Space>
            </Descriptions.Item>
          )}
        </Descriptions>

        {/* 统计数据 */}
        <div className="grid grid-cols-2 gap-4">
          <Statistic
            title="招投标记录"
            value={hospital.tender_count || 0}
            valueStyle={{ color: '#3f8600' }}
            prefix={<FileTextOutlined />}
          />
          
          <Statistic
            title="扫描成功率"
            value={hospital.scan_success_count || 0}
            suffix={
              hospital.scan_success_count + hospital.scan_failed_count > 0 
                ? `/${
                    hospital.scan_success_count + hospital.scan_failed_count
                  }`
                : undefined
            }
            valueStyle={{ color: '#1890ff' }}
            prefix={<ScanOutlined />}
          />
        </div>

        {/* 最后扫描时间 */}
        {hospital.last_scan_time && (
          <div className="text-sm text-gray-500">
            最后扫描时间: {new Date(hospital.last_scan_time).toLocaleString()}
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex justify-end space-x-2">
          <Button
            icon={<ScanOutlined />}
            onClick={handleScan}
            loading={loading}
            type="primary"
            disabled={!hospital.website_url}
          >
            扫描招投标
          </Button>
        </div>
      </div>
    </Card>
  )
}

export default HospitalCard
```

---

## 📊 五、数据展示组件

### 5.1 招投标列表组件

```tsx
// src/components/common/TenderList.tsx
import React, { useState, useEffect, useMemo } from 'react'
import { 
  Table, 
  Tag, 
  Space, 
  Button, 
  Input, 
  Select, 
  DatePicker, 
  Tooltip,
  Badge,
  Popover,
  Modal,
  Card
} from 'antd'
import { 
  SearchOutlined,
  FilterOutlined,
  DownloadOutlined,
  EyeOutlined,
  StarOutlined,
  CalendarOutlined,
  LinkOutlined,
  TagOutlined
} from '@ant-design/icons'
import { useTendersStore } from '@store/tenders'
import { formatCurrency, formatDate } from '@utils/format'
import type { Tender } from '@types/domain'

const { RangePicker } = DatePicker
const { Search } = Input
const { Option } = Select

interface TenderListProps {
  hospitalId?: number
  regionId?: number
  showFilters?: boolean
  showPagination?: boolean
  pageSize?: number
  onExport?: (filters: any) => void
}

const TenderList: React.FC<TenderListProps> = ({
  hospitalId,
  regionId,
  showFilters = true,
  showPagination = true,
  pageSize = 20,
  onExport
}) => {
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
  const [filters, setFilters] = useState({
    keyword: '',
    tender_type: '',
    status: '',
    dateRange: null as [string, string] | null,
    is_important: undefined as boolean | undefined
  })

  const {
    tenders,
    loading,
    total,
    fetchTenders,
    exportTenders
  } = useTendersStore()

  useEffect(() => {
    loadData()
  }, [currentPage, hospitalId, regionId, filters])

  const loadData = async () => {
    const queryFilters = {
      ...filters,
      hospital_id: hospitalId,
      region_id: regionId,
      page: currentPage,
      per_page: pageSize
    }
    await fetchTenders(queryFilters)
  }

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const handleResetFilters = () => {
    setFilters({
      keyword: '',
      tender_type: '',
      status: '',
      dateRange: null,
      is_important: undefined
    })
    setCurrentPage(1)
  }

  const handleExport = async () => {
    if (onExport) {
      await onExport(filters)
    } else {
      await exportTenders(filters)
    }
  }

  const getTenderTypeColor = (type: string) => {
    const colors = {
      construction: 'blue',
      procurement: 'green',
      service: 'orange',
      medical: 'red',
      equipment: 'purple',
      other: 'default'
    }
    return colors[type as keyof typeof colors] || 'default'
  }

  const getTenderTypeText = (type: string) => {
    const texts = {
      construction: '工程建设',
      procurement: '货物采购',
      service: '服务采购',
      medical: '医疗器械',
      equipment: '设备采购',
      other: '其他'
    }
    return texts[type as keyof typeof texts] || '未知'
  }

  const getStatusColor = (status: string) => {
    const colors = {
      published: 'success',
      in_progress: 'processing',
      closed: 'default',
      cancelled: 'error',
      awarded: 'success'
    }
    return colors[status as keyof typeof colors] || 'default'
  }

  const getStatusText = (status: string) => {
    const texts = {
      published: '已发布',
      in_progress: '进行中',
      closed: '已截止',
      cancelled: '已取消',
      awarded: '已中标'
    }
    return texts[status as keyof typeof texts] || '未知'
  }

  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 400,
      ellipsis: {
        showTitle: false
      },
      render: (title: string, record: Tender) => (
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-800">{title}</span>
            {record.is_important && (
              <StarOutlined className="text-yellow-500" />
            )}
          </div>
          {record.source_url && (
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <LinkOutlined />
              <span>来源链接</span>
            </div>
          )}
        </div>
      )
    },
    {
      title: '医院',
      dataIndex: 'hospital_name',
      key: 'hospital_name',
      width: 150,
      ellipsis: true
    },
    {
      title: '类型',
      dataIndex: 'tender_type',
      key: 'tender_type',
      width: 100,
      render: (type: string) => (
        <Tag color={getTenderTypeColor(type)}>
          {getTenderTypeText(type)}
        </Tag>
      )
    },
    {
      title: '预算金额',
      dataIndex: 'budget_amount',
      key: 'budget_amount',
      width: 120,
      render: (amount: number, record: Tender) => {
        if (!amount) return '-'
        return (
          <div className="text-right">
            <div>{formatCurrency(amount, record.budget_currency)}</div>
            <div className="text-xs text-gray-500">{record.budget_currency}</div>
          </div>
        )
      }
    },
    {
      title: '发布日期',
      dataIndex: 'publish_date',
      key: 'publish_date',
      width: 120,
      render: (date: string) => date ? formatDate(date) : '-',
      sorter: (a: Tender, b: Tender) => {
        if (!a.publish_date || !b.publish_date) return 0
        return new Date(a.publish_date).getTime() - new Date(b.publish_date).getTime()
      }
    },
    {
      title: '截止日期',
      dataIndex: 'deadline_date',
      key: 'deadline_date',
      width: 120,
      render: (date: string, record: Tender) => {
        if (!date) return '-'
        const isOverdue = new Date(date) < new Date()
        return (
          <div className={isOverdue ? 'text-red-500' : ''}>
            {formatDate(date)}
            {isOverdue && <Badge dot className="ml-1" />}
          </div>
        )
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      fixed: 'right' as const,
      render: (_, record: Tender) => (
        <Space>
          <Tooltip title="查看详情">
            <Button 
              icon={<EyeOutlined />} 
              size="small"
              onClick={() => {
                // 打开详情弹窗
                Modal.info({
                  title: record.title,
                  content: (
                    <div className="space-y-4 mt-4">
                      <Descriptions column={1} size="small" bordered>
                        <Descriptions.Item label="医院">{record.hospital_name}</Descriptions.Item>
                        <Descriptions.Item label="类型">{getTenderTypeText(record.tender_type)}</Descriptions.Item>
                        <Descriptions.Item label="预算">
                          {record.budget_amount ? formatCurrency(record.budget_amount, record.budget_currency) : '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label="发布日期">
                          {record.publish_date ? formatDate(record.publish_date) : '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label="截止日期">
                          {record.deadline_date ? formatDate(record.deadline_date) : '-'}
                        </Descriptions.Item>
                      </Descriptions>
                      
                      {record.content && (
                        <Card title="内容摘要" size="small">
                          <div className="text-sm text-gray-600 max-h-40 overflow-y-auto">
                            {record.content}
                          </div>
                        </Card>
                      )}
                      
                      {record.source_url && (
                        <div>
                          <a 
                            href={record.source_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-700"
                          >
                            查看原文 →
                          </a>
                        </div>
                      )}
                    </div>
                  ),
                  width: 600
                })
              }}
            />
          </Tooltip>
        </Space>
      )
    }
  ]

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: string[]) => setSelectedRowKeys(keys)
  }

  return (
    <div className="space-y-4">
      {/* 筛选栏 */}
      {showFilters && (
        <Card size="small">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Search
              placeholder="搜索标题内容"
              value={filters.keyword}
              onChange={(e) => handleFilterChange('keyword', e.target.value)}
              allowClear
            />
            
            <Select
              placeholder="招标类型"
              value={filters.tender_type}
              onChange={(value) => handleFilterChange('tender_type', value)}
              allowClear
            >
              <Option value="construction">工程建设</Option>
              <Option value="procurement">货物采购</Option>
              <Option value="service">服务采购</Option>
              <Option value="medical">医疗器械</Option>
              <Option value="equipment">设备采购</Option>
              <Option value="other">其他</Option>
            </Select>
            
            <Select
              placeholder="状态"
              value={filters.status}
              onChange={(value) => handleFilterChange('status', value)}
              allowClear
            >
              <Option value="published">已发布</Option>
              <Option value="in_progress">进行中</Option>
              <Option value="closed">已截止</Option>
              <Option value="cancelled">已取消</Option>
              <Option value="awarded">已中标</Option>
            </Select>
            
            <RangePicker
              placeholder={['开始日期', '结束日期']}
              value={filters.dateRange}
              onChange={(dates) => handleFilterChange('dateRange', dates)}
            />
          </div>
          
          <div className="flex justify-between items-center mt-4">
            <Space>
              <Button icon={<FilterOutlined />} onClick={handleResetFilters}>
                重置筛选
              </Button>
              <Badge count={total} showZero />
              <span className="text-gray-500">条记录</span>
            </Space>
            
            <Space>
              <Button 
                icon={<DownloadOutlined />}
                onClick={handleExport}
                disabled={total === 0}
              >
                导出数据
              </Button>
            </Space>
          </div>
        </Card>
      )}

      {/* 数据表格 */}
      <Table
        rowSelection={rowSelection}
        columns={columns}
        dataSource={tenders}
        loading={loading}
        rowKey="id"
        pagination={showPagination ? {
          current: currentPage,
          pageSize,
          total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          onChange: (page) => setCurrentPage(page),
          onShowSizeChange: (_, size) => {
            // 处理每页数量变化
          }
        } : false}
        scroll={{ x: 1200 }}
        size="small"
        className="bg-white"
      />
    </div>
  )
}

export default TenderList
```

### 5.2 数据统计图表组件

```tsx
// src/components/charts/StatisticsCharts.tsx
import React, { useState, useEffect } from 'react'
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  DatePicker,
  Space,
  Tabs
} from 'antd'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { 
  ArrowUpOutlined, 
  ArrowDownOutlined,
  TrophyOutlined,
  HospitalOutlined,
  FileTextOutlined,
  ScanOutlined
} from '@ant-design/icons'
import { useStatisticsStore } from '@store/statistics'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker
const { TabPane } = Tabs

const StatisticsCharts: React.FC = () => {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'days'),
    dayjs()
  ])

  const {
    statistics,
    loading,
    fetchStatistics
  } = useStatisticsStore()

  useEffect(() => {
    loadData()
  }, [dateRange])

  const loadData = async () => {
    await fetchStatistics({
      date_from: dateRange[0].format('YYYY-MM-DD'),
      date_to: dateRange[1].format('YYYY-MM-DD')
    })
  }

  // 颜色配置
  const COLORS = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1']

  // 趋势数据转换
  const trendData = statistics?.trend_data?.map(item => ({
    ...item,
    date: dayjs(item.date).format('MM-DD')
  })) || []

  // 医院类型分布数据
  const hospitalTypeData = statistics?.hospital_type_distribution?.map((item, index) => ({
    name: getHospitalTypeText(item.type),
    value: item.count,
    color: COLORS[index % COLORS.length]
  })) || []

  // 招投标类型分布数据
  const tenderTypeData = statistics?.tender_type_distribution?.map((item, index) => ({
    name: getTenderTypeText(item.type),
    value: item.count,
    color: COLORS[index % COLORS.length]
  })) || []

  const getHospitalTypeText = (type: string) => {
    const texts = {
      public: '公立医院',
      private: '私立医院',
      community: '社区卫生中心',
      specialized: '专科医院',
      traditional: '中医院'
    }
    return texts[type as keyof typeof texts] || type
  }

  const getTenderTypeText = (type: string) => {
    const texts = {
      construction: '工程建设',
      procurement: '货物采购',
      service: '服务采购',
      medical: '医疗器械',
      equipment: '设备采购',
      other: '其他'
    }
    return texts[type as keyof typeof texts] || type
  }

  return (
    <div className="space-y-6">
      {/* 时间选择器 */}
      <Card>
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">数据统计分析</h2>
          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            allowClear={false}
          />
        </div>
      </Card>

      {/* 核心指标卡片 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总医院数"
              value={statistics?.total_hospitals || 0}
              prefix={<HospitalOutlined />}
              valueStyle={{ color: '#1890ff' }}
              suffix={
                <div className="text-xs">
                  <div>已验证: {statistics?.verified_hospitals || 0}</div>
                  <div>活跃: {statistics?.active_hospitals || 0}</div>
                </div>
              }
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="招投标记录"
              value={statistics?.total_tenders || 0}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#52c41a' }}
              suffix={
                <div className="text-xs">
                  <div>本周新增: {statistics?.weekly_new_tenders || 0}</div>
                  <div>本月新增: {statistics?.monthly_new_tenders || 0}</div>
                </div>
              }
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="扫描成功率"
              value={statistics?.scan_success_rate || 0}
              suffix="%"
              prefix={<ScanOutlined />}
              valueStyle={{ color: '#faad14' }}
              formatter={(value) => `${value?.toFixed(1) || 0}%`}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="预算总额"
              value={statistics?.total_budget || 0}
              prefix="¥"
              valueStyle={{ color: '#722ed1' }}
              precision={2}
              formatter={(value) => {
                const num = Number(value) || 0
                if (num >= 100000000) {
                  return `${(num / 100000000).toFixed(1)}亿`
                } else if (num >= 10000) {
                  return `${(num / 10000).toFixed(1)}万`
                }
                return num.toFixed(2)
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* 图表展示 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="招投标趋势" loading={loading}>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  labelFormatter={(label) => `日期: ${label}`}
                  formatter={(value, name) => [value, getMetricName(name)]}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="new_tenders" 
                  stroke="#1890ff" 
                  strokeWidth={2}
                  name="新增招投标"
                />
                <Line 
                  type="monotone" 
                  dataKey="active_hospitals" 
                  stroke="#52c41a" 
                  strokeWidth={2}
                  name="活跃医院"
                />
                <Line 
                  type="monotone" 
                  dataKey="scan_count" 
                  stroke="#faad14" 
                  strokeWidth={2}
                  name="扫描次数"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="医院类型分布" loading={loading}>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={hospitalTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {hospitalTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="招投标类型分布" loading={loading}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={tenderTypeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#1890ff" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="预算金额分布" loading={loading}>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`¥${Number(value).toLocaleString()}`, '总预算']}
                />
                <Area 
                  type="monotone" 
                  dataKey="total_budget" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* 详细数据表格 */}
      <Card title="详细统计数据" loading={loading}>
        <Tabs defaultActiveKey="regions">
          <TabPane tab="按地区" key="regions">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">地区</th>
                    <th className="text-right p-2">医院数量</th>
                    <th className="text-right p-2">招投标数量</th>
                    <th className="text-right p-2">总预算(万元)</th>
                    <th className="text-right p-2">平均预算(万元)</th>
                  </tr>
                </thead>
                <tbody>
                  {statistics?.region_statistics?.map((item, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-2">{item.region_name}</td>
                      <td className="text-right p-2">{item.hospital_count}</td>
                      <td className="text-right p-2">{item.tender_count}</td>
                      <td className="text-right p-2">
                        {((item.total_budget || 0) / 10000).toFixed(2)}
                      </td>
                      <td className="text-right p-2">
                        {item.tender_count > 0 
                          ? ((item.total_budget || 0) / 10000 / item.tender_count).toFixed(2)
                          : '0.00'
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabPane>
          
          <TabPane tab="按医院" key="hospitals">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">医院名称</th>
                    <th className="text-left p-2">地区</th>
                    <th className="text-right p-2">招投标数量</th>
                    <th className="text-right p-2">总预算(万元)</th>
                    <th className="text-left p-2">最后扫描</th>
                  </tr>
                </thead>
                <tbody>
                  {statistics?.top_hospitals?.map((item, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-2">{item.hospital_name}</td>
                      <td className="p-2">{item.region_name}</td>
                      <td className="text-right p-2">{item.tender_count}</td>
                      <td className="text-right p-2">
                        {((item.total_budget || 0) / 10000).toFixed(2)}
                      </td>
                      <td className="p-2">
                        {item.last_scan_time 
                          ? dayjs(item.last_scan_time).format('YYYY-MM-DD')
                          : '从未扫描'
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  )
}

export default StatisticsCharts
```

---

## 🎛️ 六、状态管理

### 6.1 全局状态设计

```typescript
// src/store/global.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface GlobalState {
  theme: 'light' | 'dark'
  language: 'zh-CN' | 'en-US'
  sidebarCollapsed: boolean
  loading: boolean
  notifications: Notification[]
  
  // Actions
  setTheme: (theme: 'light' | 'dark') => void
  setLanguage: (language: 'zh-CN' | 'en-US') => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setLoading: (loading: boolean) => void
  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
}

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  timestamp: number
}

export const useGlobalStore = create<GlobalState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      language: 'zh-CN',
      sidebarCollapsed: false,
      loading: false,
      notifications: [],

      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      setLoading: (loading) => set({ loading }),

      addNotification: (notification) => {
        const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const newNotification = {
          ...notification,
          id,
          timestamp: Date.now()
        }
        set((state) => ({
          notifications: [newNotification, ...state.notifications].slice(0, 50) // 最多保留50条
        }))
      },

      removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id)
      })),

      clearNotifications: () => set({ notifications: [] })
    }),
    {
      name: 'global-storage',
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        sidebarCollapsed: state.sidebarCollapsed
      })
    }
  )
)

// 快捷通知函数
export const showNotification = (type: Notification['type'], title: string, message: string, duration = 4000) => {
  useGlobalStore.getState().addNotification({ type, title, message, duration })
}
```

### 6.2 医院状态管理

```typescript
// src/store/hospitals.ts
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { hospitalService } from '@services/api/hospital'
import type { Hospital, HospitalFilters } from '@types/domain'

interface HospitalState {
  hospitals: Hospital[]
  currentHospital: Hospital | null
  total: number
  loading: boolean
  filters: HospitalFilters
  
  // Actions
  fetchHospitals: (filters?: HospitalFilters, page?: number, perPage?: number) => Promise<void>
  fetchHospitalById: (id: number) => Promise<Hospital | null>
  createHospital: (data: Partial<Hospital>) => Promise<Hospital>
  updateHospital: (id: number, data: Partial<Hospital>) => Promise<Hospital>
  deleteHospital: (id: number) => Promise<boolean>
  scanHospital: (id: number) => Promise<void>
  getStatistics: (id: number) => Promise<any>
  setFilters: (filters: Partial<HospitalFilters>) => void
  clearFilters: () => void
}

export const useHospitalsStore = create<HospitalState>()(
  devtools(
    (set, get) => ({
      hospitals: [],
      currentHospital: null,
      total: 0,
      loading: false,
      filters: {},

      fetchHospitals: async (filters = {}, page = 1, perPage = 20) => {
        set({ loading: true })
        try {
          const result = await hospitalService.getHospitals({
            ...get().filters,
            ...filters,
            page,
            per_page: perPage
          })
          set({
            hospitals: result.data,
            total: result.pagination.total,
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
          const hospital = await hospitalService.getHospitalById(id)
          set({ currentHospital: hospital, loading: false })
          return hospital
        } catch (error) {
          set({ loading: false })
          throw error
        }
      },

      createHospital: async (data: Partial<Hospital>) => {
        set({ loading: true })
        try {
          const hospital = await hospitalService.createHospital(data)
          set((state) => ({
            hospitals: [hospital, ...state.hospitals],
            total: state.total + 1,
            loading: false
          }))
          return hospital
        } catch (error) {
          set({ loading: false })
          throw error
        }
      },

      updateHospital: async (id: number, data: Partial<Hospital>) => {
        set({ loading: true })
        try {
          const hospital = await hospitalService.updateHospital(id, data)
          set((state) => ({
            hospitals: state.hospitals.map(h => h.id === id ? hospital : h),
            currentHospital: state.currentHospital?.id === id ? hospital : state.currentHospital,
            loading: false
          }))
          return hospital
        } catch (error) {
          set({ loading: false })
          throw error
        }
      },

      deleteHospital: async (id: number) => {
        set({ loading: true })
        try {
          const success = await hospitalService.deleteHospital(id)
          if (success) {
            set((state) => ({
              hospitals: state.hospitals.filter(h => h.id !== id),
              total: Math.max(0, state.total - 1),
              currentHospital: state.currentHospital?.id === id ? null : state.currentHospital,
              loading: false
            }))
          }
          return success
        } catch (error) {
          set({ loading: false })
          throw error
        }
      },

      scanHospital: async (id: number) => {
        set({ loading: true })
        try {
          await hospitalService.scanHospital(id)
          // 刷新医院数据
          await get().fetchHospitalById(id)
          set({ loading: false })
        } catch (error) {
          set({ loading: false })
          throw error
        }
      },

      getStatistics: async (id: number) => {
        try {
          return await hospitalService.getStatistics(id)
        } catch (error) {
          throw error
        }
      },

      setFilters: (newFilters) => {
        set((state) => ({
          filters: { ...state.filters, ...newFilters }
        }))
      },

      clearFilters: () => {
        set({ filters: {} })
      }
    }),
    {
      name: 'hospitals-store'
    }
  )
)
```

---

## 🎨 七、样式设计

### 7.1 全局样式

```css
/* src/styles/global.css */
@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';

/* 自定义全局样式 */
:root {
  --primary-color: #1890ff;
  --success-color: #52c41a;
  --warning-color: #faad14;
  --error-color: #f5222d;
  --text-color: #000000d9;
  --text-color-secondary: #00000073;
  --disabled-color: #00000040;
  --background-color: #f0f2f5;
  --component-background: #ffffff;
  --border-color: #d9d9d9;
}

/* 暗色主题 */
[data-theme='dark'] {
  --text-color: #ffffffd9;
  --text-color-secondary: #ffffff73;
  --disabled-color: #ffffff40;
  --background-color: #141414;
  --component-background: #1f1f1f;
  --border-color: #434343;
}

/* 基础样式重置 */
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: var(--background-color);
  color: var(--text-color);
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 自定义组件样式 */
.ant-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.ant-table {
  border-radius: 8px;
}

.ant-table-thead > tr > th {
  background-color: #fafafa;
  border-bottom: 1px solid #f0f0f0;
}

.ant-btn {
  border-radius: 6px;
}

.ant-input,
.ant-select-selector,
.ant-picker {
  border-radius: 6px;
}

/* 响应式网格 */
.responsive-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

/* 动画效果 */
.fade-enter {
  opacity: 0;
}

.fade-enter-active {
  opacity: 1;
  transition: opacity 300ms;
}

.fade-exit {
  opacity: 1;
}

.fade-exit-active {
  opacity: 0;
  transition: opacity 300ms;
}

/* 加载动画 */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

/* 通知样式 */
.notification-item {
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.notification-success {
  background-color: #f6ffed;
  border: 1px solid #b7eb8f;
  color: #389e0d;
}

.notification-error {
  background-color: #fff2f0;
  border: 1px solid #ffccc7;
  color: #cf1322;
}

.notification-warning {
  background-color: #fffbe6;
  border: 1px solid #ffe58f;
  color: #d48806;
}

.notification-info {
  background-color: #f0f9ff;
  border: 1px solid #91d5ff;
  color: #0958d9;
}

/* 状态指示器 */
.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  margin-right: 8px;
}

.status-active {
  background-color: #52c41a;
}

.status-inactive {
  background-color: #faad14;
}

.status-closed {
  background-color: #f5222d;
}

/* 徽章样式 */
.badge-custom {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 12px;
  background-color: #f0f0f0;
  color: #595959;
}

.badge-primary {
  background-color: #e6f7ff;
  color: #1890ff;
}

.badge-success {
  background-color: #f6ffed;
  color: #52c41a;
}

.badge-warning {
  background-color: #fffbe6;
  color: #faad14;
}

.badge-error {
  background-color: #fff2f0;
  color: #f5222d;
}

/* 工具提示样式 */
.tooltip-content {
  max-width: 200px;
  padding: 8px 12px;
  background-color: rgba(0, 0, 0, 0.85);
  color: #ffffff;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.4;
}

/* 打印样式 */
@media print {
  .no-print {
    display: none !important;
  }
  
  .print-only {
    display: block !important;
  }
  
  .ant-layout-sider,
  .ant-layout-header,
  .ant-btn,
  .ant-pagination {
    display: none !important;
  }
  
  .ant-layout-content {
    margin: 0 !important;
    padding: 0 !important;
  }
}
```

### 7.2 组件样式

```css
/* src/styles/components.css */

/* 医院卡片样式 */
.hospital-card {
  transition: all 0.3s ease;
  border-radius: 8px;
  overflow: hidden;
}

.hospital-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.hospital-card-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 16px;
  position: relative;
}

.hospital-card-header::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 100px;
  height: 100px;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
  border-radius: 50%;
  transform: translate(30%, -30%);
}

/* 树形组件样式 */
.region-tree {
  height: 100%;
  overflow-y: auto;
}

.region-tree .ant-tree-node-content-wrapper {
  border-radius: 6px;
  transition: all 0.3s ease;
}

.region-tree .ant-tree-node-content-wrapper:hover {
  background-color: #f5f5f5;
}

.region-tree .ant-tree-node-selected .ant-tree-node-content-wrapper {
  background-color: #e6f7ff !important;
  color: #1890ff;
}

/* 表格样式增强 */
.enhanced-table .ant-table-thead > tr > th {
  background-color: #fafafa;
  font-weight: 600;
  border-bottom: 2px solid #f0f0f0;
}

.enhanced-table .ant-table-tbody > tr:hover > td {
  background-color: #f5f5f5;
}

.enhanced-table .ant-table-tbody > tr:nth-child(even) > td {
  background-color: #fafafa;
}

/* 统计卡片样式 */
.stat-card {
  text-align: center;
  padding: 24px;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
  animation: pulse 3s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.1); opacity: 0.8; }
}

.stat-card .stat-number {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 8px;
  position: relative;
  z-index: 1;
}

.stat-card .stat-label {
  font-size: 14px;
  opacity: 0.9;
  position: relative;
  z-index: 1;
}

/* 加载状态样式 */
.loading-skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.skeleton-text {
  height: 16px;
  border-radius: 4px;
  margin-bottom: 8px;
}

.skeleton-title {
  height: 24px;
  border-radius: 4px;
  margin-bottom: 16px;
  width: 60%;
}

/* 表单样式 */
.enhanced-form .ant-form-item-label > label {
  font-weight: 500;
}

.enhanced-form .ant-input,
.enhanced-form .ant-select-selector,
.enhanced-form .ant-picker {
  border-radius: 6px;
  transition: all 0.3s ease;
}

.enhanced-form .ant-input:focus,
.enhanced-form .ant-select-focused .ant-select-selector,
.enhanced-form .ant-picker-focused {
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

/* 工具栏样式 */
.toolbar {
  padding: 16px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  margin-bottom: 16px;
}

.toolbar .ant-btn {
  margin-right: 8px;
}

.toolbar .ant-btn:last-child {
  margin-right: 0;
}

/* 侧边栏样式 */
.sidebar {
  height: 100vh;
  background: white;
  border-right: 1px solid #f0f0f0;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.06);
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: 600;
  color: #1890ff;
}

.sidebar-menu {
  padding: 16px 0;
}

.sidebar-menu .ant-menu-item {
  margin: 4px 8px;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.sidebar-menu .ant-menu-item:hover {
  background-color: #f5f5f5;
}

.sidebar-menu .ant-menu-item-selected {
  background-color: #e6f7ff !important;
  color: #1890ff !important;
}

/* 头部样式 */
.header {
  background: white;
  border-bottom: 1px solid #f0f0f0;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.header-title {
  font-size: 20px;
  font-weight: 600;
  color: #262626;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* 响应式适配 */
@media (max