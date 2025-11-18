import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  DatePicker,
  message,
  Row,
  Col,
  Statistic,
  Modal,
  Tooltip,
  Typography,
  Popconfirm,
  Badge
} from 'antd'
import {
  EyeOutlined,
  ExportOutlined,
  SearchOutlined,
  ReloadOutlined,
  StarOutlined,
  StarFilled,
  FilterOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'

// Store
import { useTenderStore } from '../store'
import { useHospitalStore } from '../store'
import type { Tender, Hospital } from '../types'
import { tenderApi } from '../services/api'

const { Option } = Select
const { RangePicker } = DatePicker
const { Title, Text } = Typography

const TendersPage: React.FC = () => {
  const navigate = useNavigate()
  const {
    tenders,
    total,
    loading,
    filters,
    selectedRowKeys,
    fetchTenders,
    markAsImportant,
    updateStatus,
    setFilters,
    clearFilters,
    setSelectedRowKeys
  } = useTenderStore()

  const { hospitals, fetchHospitals } = useHospitalStore()

  const [searchKeyword, setSearchKeyword] = useState('')
  const [hospitalId, setHospitalId] = useState<number | undefined>(undefined)
  const [status, setStatus] = useState<string>('')
  const [tenderType, setTenderType] = useState<string>('')
  const [important, setImportant] = useState<boolean | undefined>(undefined)
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  useEffect(() => {
    loadTenders()
  }, [currentPage, pageSize, filters])

  useEffect(() => {
    // 加载医院列表用于筛选
    fetchHospitals({ page: 1, per_page: 1000 })
  }, [])

  const loadTenders = () => {
    const dateRangeParams = dateRange ? {
      publish_date_start: dateRange[0]?.format('YYYY-MM-DD'),
      publish_date_end: dateRange[1]?.format('YYYY-MM-DD')
    } : {}

    fetchTenders({
      ...filters,
      ...dateRangeParams,
      page: currentPage,
      per_page: pageSize
    })
  }

  // 表格列定义
  const columns: ColumnsType<Tender> = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 300,
      fixed: 'left',
      render: (title: string, record: Tender) => (
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Text strong>{title}</Text>
            {record.is_important && (
              <Tooltip title="重要招投标">
                <StarFilled className="text-yellow-500" />
              </Tooltip>
            )}
          </div>
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <span>ID: {record.id}</span>
            <Tag size="small" color={getTenderTypeColor(record.tender_type)}>
              {getTenderTypeText(record.tender_type)}
            </Tag>
          </div>
        </div>
      )
    },
    {
      title: '所属医院',
      dataIndex: 'hospital_name',
      key: 'hospital_name',
      width: 200,
      render: (name: string, record: Tender) => (
        <div>
          <Text>{name}</Text>
          <div className="text-xs text-gray-500">
            ID: {record.hospital_id}
          </div>
        </div>
      )
    },
    {
      title: '发布日期',
      dataIndex: 'publish_date',
      key: 'publish_date',
      width: 120,
      render: (date?: string) => date ? date.split('T')[0] : '-'
    },
    {
      title: '截止日期',
      dataIndex: 'deadline_date',
      key: 'deadline_date',
      width: 120,
      render: (date?: string) => date ? (
        <div>
          <div>{date.split('T')[0]}</div>
          {isDeadlineClose(date) && (
            <div className="text-xs text-red-500">
              即将截止
            </div>
          )}
        </div>
      ) : '-'
    },
    {
      title: '预算金额',
      dataIndex: 'budget_amount',
      key: 'budget_amount',
      width: 150,
      render: (amount?: number, record: Tender) => {
        if (!amount) return <Text type="secondary">未公布</Text>
        return (
          <div className="text-right">
            <div className="font-medium">
              ¥{amount.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">
              {record.budget_currency}
            </div>
          </div>
        )
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
          {getStatusText(status)}
        </Tag>
      )
    },
    {
      title: '来源',
      dataIndex: 'source_url',
      key: 'source_url',
      width: 100,
      render: (url?: string) => (
        url ? (
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-blue-500"
            onClick={(e) => e.stopPropagation()}
          >
            查看原文
          </a>
        ) : (
          <Text type="secondary">无来源</Text>
        )
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      fixed: 'right',
      render: (_, record: Tender) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/tenders/${record.id}`)}
            />
          </Tooltip>
          <Tooltip title={record.is_important ? '取消重要' : '标记重要'}>
            <Button
              size="small"
              icon={record.is_important ? <StarFilled /> : <StarOutlined />}
              onClick={() => handleToggleImportant(record.id, !record.is_important)}
              type={record.is_important ? 'primary' : 'default'}
            />
          </Tooltip>
        </Space>
      )
    }
  ]

  // 搜索和筛选处理
  const handleSearch = () => {
    setFilters({
      keyword: searchKeyword || undefined,
      hospital_id: hospitalId,
      status: status || undefined,
      tender_type: tenderType || undefined,
      is_important: important
    })
    setCurrentPage(1)
  }

  const handleReset = () => {
    setSearchKeyword('')
    setHospitalId(undefined)
    setStatus('')
    setTenderType('')
    setImportant(undefined)
    setDateRange(null)
    clearFilters()
    setCurrentPage(1)
  }

  // 操作处理
  const handleToggleImportant = async (tenderId: number, important: boolean) => {
    try {
      await markAsImportant(tenderId, important)
      message.success(important ? '已标记为重要' : '已取消重要标记')
    } catch (error) {
      message.error('操作失败')
    }
  }

  const handleBatchToggleImportant = async (important: boolean) => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要操作的招投标')
      return
    }

    try {
      const ids = selectedRowKeys.map(id => Number(id))
      await Promise.all(
        ids.map(id => markAsImportant(id, important))
      )
      message.success(`已${important ? '标记为重要' : '取消重要标记'} ${ids.length} 条招投标`)
      setSelectedRowKeys([])
    } catch (error) {
      message.error('批量操作失败')
    }
  }

  const handleExport = async () => {
    try {
      const exportFilters = {
        keyword: searchKeyword || undefined,
        hospital_id: hospitalId,
        status: status || undefined,
        tender_type: tenderType || undefined,
        is_important: important,
        publish_date_start: dateRange?.[0]?.format('YYYY-MM-DD'),
        publish_date_end: dateRange?.[1]?.format('YYYY-MM-DD')
      }
      
      // 使用tenderApi的exportTenders函数
      const blob = await tenderApi.exportTenders(exportFilters)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `招投标数据_${new Date().toLocaleDateString()}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      message.success('数据导出成功')
    } catch (error) {
      message.error('导出失败')
    }
  }

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedKeys: string[]) => {
      setSelectedRowKeys(newSelectedKeys)
    }
  }

  // 统计卡片数据
  const stats = {
    total: total,
    important: tenders.filter(t => t.is_important).length,
    inProgress: tenders.filter(t => t.status === 'in_progress').length,
    expiringSoon: tenders.filter(t => 
      t.deadline_date && dayjs(t.deadline_date).diff(dayjs(), 'days') <= 7
    ).length
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <Title level={2} className="mb-2">招投标管理</Title>
          <Text type="secondary">
            管理和监控全国医院招投标信息
          </Text>
        </div>
        <Button
          type="primary"
          icon={<ExportOutlined />}
          onClick={handleExport}
        >
          导出数据
        </Button>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="招投标总数"
              value={stats.total}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="重要招投标"
              value={stats.important}
              prefix={<StarFilled />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="进行中"
              value={stats.inProgress}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="即将截止"
              value={stats.expiringSoon}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索和筛选 */}
      <Card>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={6}>
            <Input
              placeholder="搜索招投标标题"
              prefix={<SearchOutlined />}
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onPressEnter={handleSearch}
            />
          </Col>
          <Col xs={24} sm={4}>
            <Select
              placeholder="选择医院"
              value={hospitalId}
              onChange={setHospitalId}
              allowClear
              showSearch
              className="w-full"
              filterOption={(input, option) =>
                (option?.children as string)?.toLowerCase().includes(input.toLowerCase())
              }
            >
              {hospitals.map(hospital => (
                <Option key={hospital.id} value={hospital.id}>
                  {hospital.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={3}>
            <Select
              placeholder="招投标类型"
              value={tenderType}
              onChange={setTenderType}
              allowClear
              className="w-full"
            >
              <Option value="construction">工程建设</Option>
              <Option value="procurement">设备采购</Option>
              <Option value="service">服务外包</Option>
              <Option value="medical">医疗服务</Option>
              <Option value="equipment">设备采购</Option>
              <Option value="other">其他</Option>
            </Select>
          </Col>
          <Col xs={24} sm={3}>
            <Select
              placeholder="状态"
              value={status}
              onChange={setStatus}
              allowClear
              className="w-full"
            >
              <Option value="published">已发布</Option>
              <Option value="in_progress">进行中</Option>
              <Option value="closed">已截止</Option>
              <Option value="cancelled">已取消</Option>
              <Option value="awarded">已中标</Option>
            </Select>
          </Col>
          <Col xs={24} sm={4}>
            <Select
              placeholder="重要程度"
              value={important}
              onChange={setImportant}
              allowClear
              className="w-full"
            >
              <Option value={true}>重要</Option>
              <Option value={false}>普通</Option>
            </Select>
          </Col>
          <Col xs={24} sm={4}>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                搜索
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                重置
              </Button>
            </Space>
          </Col>
        </Row>
        <Row gutter={[16, 16]} className="mt-4">
          <Col xs={24} sm={12}>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">发布日期:</span>
              <RangePicker
                value={dateRange}
                onChange={setDateRange}
                format="YYYY-MM-DD"
                placeholder={['开始日期', '结束日期']}
                style={{ width: '100%' }}
              />
            </div>
          </Col>
        </Row>
      </Card>

      {/* 工具栏 */}
      <Card>
        <div className="flex items-center justify-between">
          <Space>
            <Button
              icon={<StarOutlined />}
              onClick={() => handleBatchToggleImportant(true)}
              disabled={selectedRowKeys.length === 0}
            >
              批量标记重要 ({selectedRowKeys.length})
            </Button>
            <Button
              icon={<StarFilled />}
              onClick={() => handleBatchToggleImportant(false)}
              disabled={selectedRowKeys.length === 0}
            >
              取消重要标记
            </Button>
            <Button icon={<ExportOutlined />} onClick={handleExport}>
              导出Excel
            </Button>
          </Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={loadTenders}
            loading={loading}
          >
            刷新
          </Button>
        </div>
      </Card>

      {/* 招投标列表 */}
      <Card>
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={tenders}
          rowKey="id"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            onChange: (page, size) => {
              setCurrentPage(page)
              setPageSize(size || 20)
            },
            onShowSizeChange: (current, size) => {
              setCurrentPage(current)
              setPageSize(size)
            }
          }}
          scroll={{ x: 1200 }}
          size="small"
        />
      </Card>
    </div>
  )
}

// 辅助函数
const getTenderTypeText = (type: string) => {
  const textMap = {
    construction: '工程建设',
    procurement: '设备采购',
    service: '服务外包',
    medical: '医疗服务',
    equipment: '设备采购',
    other: '其他'
  }
  return textMap[type as keyof typeof textMap] || type
}

const getTenderTypeColor = (type: string) => {
  const colorMap = {
    construction: 'blue',
    procurement: 'green',
    service: 'orange',
    medical: 'purple',
    equipment: 'cyan',
    other: 'default'
  }
  return colorMap[type as keyof typeof colorMap] || 'default'
}

const getStatusText = (status: string) => {
  const textMap = {
    published: '已发布',
    in_progress: '进行中',
    closed: '已截止',
    cancelled: '已取消',
    awarded: '已中标'
  }
  return textMap[status as keyof typeof textMap] || status
}

const getStatusColor = (status: string) => {
  const colorMap = {
    published: 'blue',
    in_progress: 'green',
    closed: 'orange',
    cancelled: 'red',
    awarded: 'purple'
  }
  return colorMap[status as keyof typeof colorMap] || 'default'
}

const getStatusIcon = (status: string) => {
  const iconMap = {
    published: <FileTextOutlined />,
    in_progress: <ClockCircleOutlined />,
    closed: <CloseCircleOutlined />,
    cancelled: <CloseCircleOutlined />,
    awarded: <CheckCircleOutlined />
  }
  return iconMap[status as keyof typeof iconMap]
}

const isDeadlineClose = (deadlineDate: string) => {
  const deadline = dayjs(deadlineDate)
  const now = dayjs()
  const diffDays = deadline.diff(now, 'days')
  return diffDays <= 7 && diffDays >= 0
}

export default TendersPage