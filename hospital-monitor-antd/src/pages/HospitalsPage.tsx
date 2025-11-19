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
  Badge,
  Popconfirm,
  message,
  Row,
  Col,
  Statistic,
  Modal,
  Tooltip,
  Typography
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ScanOutlined,
  ExportOutlined,
  FilterOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

// Store
import { useHospitalStore } from '../store'
import type { Hospital } from '../types'

const { Option } = Select
const { Title, Text } = Typography

const HospitalsPage: React.FC = () => {
  const navigate = useNavigate()
  const {
    hospitals,
    total,
    loading,
    filters,
    selectedRowKeys,
    fetchHospitals,
    deleteHospital,
    scanHospital,
    batchScanHospitals,
    setFilters,
    clearFilters,
    setSelectedRowKeys
  } = useHospitalStore()

  const [searchKeyword, setSearchKeyword] = useState('')
  const [hospitalType, setHospitalType] = useState<string>('')
  const [status, setStatus] = useState<string>('')
  const [verified, setVerified] = useState<boolean | undefined>(undefined)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  useEffect(() => {
    loadHospitals()
  }, [currentPage, pageSize, filters])

  const loadHospitals = () => {
    fetchHospitals({
      ...filters,
      page: currentPage,
      per_page: pageSize
    })
  }

  // 表格列定义
  const columns: ColumnsType<Hospital> = [
    {
      title: '医院名称',
      dataIndex: 'name',
      key: 'name',
      width: 250,
      fixed: 'left',
      render: (name: string, record: Hospital) => (
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Text strong>{name}</Text>
            {record.verified ? (
              <Tooltip title="已验证">
                <CheckCircleOutlined className="text-green-500" />
              </Tooltip>
            ) : (
              <Tooltip title="未验证">
                <ExclamationCircleOutlined className="text-orange-500" />
              </Tooltip>
            )}
            {!record.website_url && (
              <Tooltip title="无官网">
                <ExclamationCircleOutlined className="text-red-500" />
              </Tooltip>
            )}
          </div>
          <div className="text-xs text-gray-500">
            ID: {record.id}
          </div>
        </div>
      )
    },
    {
      title: '类型',
      dataIndex: 'hospital_type',
      key: 'hospital_type',
      width: 120,
      render: (type: string) => (
        <Tag color={getHospitalTypeColor(type)}>
          {getHospitalTypeText(type)}
        </Tag>
      )
    },
    {
      title: '等级',
      dataIndex: 'hospital_level',
      key: 'hospital_level',
      width: 100,
      render: (level: any) => (
        <Tag color={getLevelColor(level)}>
          {getLevelText(level)}
        </Tag>
      )
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
      title: '地址',
      dataIndex: 'address',
      key: 'address',
      width: 200,
      ellipsis: true
    },
    {
      title: '官网',
      dataIndex: 'website_url',
      key: 'website_url',
      width: 150,
      render: (url?: string) => (
        url ? (
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500">
            查看官网
          </a>
        ) : (
          <Text type="secondary">无官网</Text>
        )
      )
    },
    {
      title: '招投标',
      dataIndex: 'tender_count',
      key: 'tender_count',
      width: 100,
      render: (count: number) => (
        <Badge count={count} showZero={false} />
      )
    },
    {
      title: '扫描成功率',
      key: 'success_rate',
      width: 120,
      render: (_, record: Hospital) => {
        const total = (record.scan_success_count || 0) + (record.scan_failed_count || 0)
        const rate = total > 0 ? ((record.scan_success_count || 0) / total * 100).toFixed(1) : '0'
        return (
          <Text>{rate}%</Text>
        )
      }
    },
    {
      title: '最后扫描',
      dataIndex: 'last_scan_time',
      key: 'last_scan_time',
      width: 150,
      render: (time?: string) => time ? time.split('T')[0] : '-'
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_, record: Hospital) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/hospitals/${record.id}`)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => navigate(`/hospitals/${record.id}/edit`)}
            />
          </Tooltip>
          <Tooltip title="扫描招投标">
            <Button
              size="small"
              icon={<ScanOutlined />}
              onClick={() => handleScan(record.id)}
              disabled={!record.website_url}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这个医院吗？"
            description="删除后无法恢复，请确认操作"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ]

  // 搜索和筛选处理
  const handleSearch = () => {
    setFilters({
      name: searchKeyword || undefined,
      hospital_type: hospitalType || undefined,
      status: status || undefined,
      verified
    })
    setCurrentPage(1)
  }

  const handleReset = () => {
    setSearchKeyword('')
    setHospitalType('')
    setStatus('')
    setVerified(undefined)
    clearFilters()
    setCurrentPage(1)
  }

  // 操作处理
  const handleScan = async (hospitalId: number) => {
    try {
      await scanHospital(hospitalId)
      message.success('扫描任务已启动')
    } catch (error) {
      message.error('启动扫描失败')
    }
  }

  const handleBatchScan = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要扫描的医院')
      return
    }

    try {
      await batchScanHospitals(selectedRowKeys.map(id => Number(id)))
      message.success(`已启动 ${selectedRowKeys.length} 个医院的扫描任务`)
      setSelectedRowKeys([])
    } catch (error) {
      message.error('批量扫描失败')
    }
  }

  const handleDelete = async (hospitalId: number) => {
    try {
      await deleteHospital(hospitalId)
      message.success('医院删除成功')
    } catch (error) {
      message.error('删除医院失败')
    }
  }

  const handleExport = () => {
    message.info('导出功能开发中...')
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
    active: hospitals.filter(h => h.status === 'active').length,
    verified: hospitals.filter(h => h.verified).length,
    withWebsite: hospitals.filter(h => h.website_url).length
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <Title level={2} className="mb-2">医院管理</Title>
          <Text type="secondary">
            管理和监控全国医院信息
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/hospitals/create')}
        >
          添加医院
        </Button>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="医院总数"
              value={stats.total}
              prefix={<EyeOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="正常运营"
              value={stats.active}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="已验证"
              value={stats.verified}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="有官网"
              value={stats.withWebsite}
              prefix={<ScanOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索和筛选 */}
      <Card>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8}>
            <Input
              placeholder="搜索医院名称"
              prefix={<SearchOutlined />}
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onPressEnter={handleSearch}
            />
          </Col>
          <Col xs={24} sm={4}>
            <Select
              placeholder="医院类型"
              value={hospitalType}
              onChange={setHospitalType}
              allowClear
              className="w-full"
            >
              <Option value="public">公立医院</Option>
              <Option value="private">私立医院</Option>
              <Option value="community">社区卫生服务中心</Option>
              <Option value="specialized">专科医院</Option>
              <Option value="traditional">中医院</Option>
            </Select>
          </Col>
          <Col xs={24} sm={4}>
            <Select
              placeholder="状态"
              value={status}
              onChange={setStatus}
              allowClear
              className="w-full"
            >
              <Option value="active">正常运营</Option>
              <Option value="inactive">暂停运营</Option>
              <Option value="closed">已关闭</Option>
              <Option value="relocated">已迁移</Option>
            </Select>
          </Col>
          <Col xs={24} sm={4}>
            <Select
              placeholder="验证状态"
              value={verified}
              onChange={setVerified}
              allowClear
              className="w-full"
            >
              <Option value={true}>已验证</Option>
              <Option value={false}>未验证</Option>
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
      </Card>

      {/* 工具栏 */}
      <Card>
        <div className="flex items-center justify-between">
          <Space>
            <Button
              icon={<ScanOutlined />}
              onClick={handleBatchScan}
              disabled={selectedRowKeys.length === 0}
            >
              批量扫描 ({selectedRowKeys.length})
            </Button>
            <Button icon={<ExportOutlined />} onClick={handleExport}>
              导出数据
            </Button>
          </Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={loadHospitals}
            loading={loading}
          >
            刷新
          </Button>
        </div>
      </Card>

      {/* 医院列表 */}
      <Card>
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={hospitals}
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
const getHospitalTypeText = (type: string) => {
  const textMap = {
    public: '公立医院',
    private: '私立医院',
    community: '社区卫生服务中心',
    specialized: '专科医院',
    traditional: '中医院'
  }
  return textMap[type as keyof typeof textMap] || type
}

const getHospitalTypeColor = (type: string) => {
  const colorMap = {
    public: 'blue',
    private: 'green',
    community: 'orange',
    specialized: 'purple',
    traditional: 'red'
  }
  return colorMap[type as keyof typeof colorMap] || 'default'
}

const getStatusText = (status: string) => {
  const textMap = {
    active: '正常运营',
    inactive: '暂停运营',
    closed: '已关闭',
    relocated: '已迁移'
  }
  return textMap[status as keyof typeof textMap] || status
}

const getStatusColor = (status: string) => {
  const colorMap = {
    active: 'success',
    inactive: 'warning',
    closed: 'error',
    relocated: 'default'
  }
  return colorMap[status as keyof typeof colorMap] || 'default'
}

const getLevelText = (level: any) => {
  if (!level || typeof level === 'string') {
    const textMap = {
      level1: '一级医院',
      level2: '二级医院',
      level3: '三级医院',
      level3a: '三级甲等'
    }
    return textMap[level as keyof typeof textMap] || '未分级'
  }
  return '未分级'
}

const getLevelColor = (level: any) => {
  const colorMap = {
    level1: 'green',
    level2: 'blue',
    level3: 'orange',
    level3a: 'red'
  }
  return colorMap[level as keyof typeof colorMap] || 'default'
}

export default HospitalsPage