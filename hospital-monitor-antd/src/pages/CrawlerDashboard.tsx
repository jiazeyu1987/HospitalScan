import React, { useState, useEffect } from 'react'
import {
  Card,
  Button,
  Space,
  Progress,
  List,
  Tag,
  Typography,
  Row,
  Col,
  Statistic,
  Alert,
  Switch,
  Select,
  Modal,
  message,
  Tooltip,
  Timeline,
  Badge,
  Divider,
  Spin
} from 'antd'
import {
  PlayCircleOutlined,
  StopCircleOutlined,
  ReloadOutlined,
  LogOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  ScanOutlined,
  BugOutlined,
  ClockCircleOutlined,
  DashboardOutlined,
  ThunderboltOutlined,
  SettingOutlined
} from '@ant-design/icons'
import type { CrawlerStatus, CrawlerLog } from '../types'

// Store
import { useCrawlerStore } from '../store'

const { Title, Text, Paragraph } = Typography
const { Option } = Select

const CrawlerDashboard: React.FC = () => {
  const {
    status,
    logs,
    totalLogs,
    loading,
    fetchCrawlerStatus,
    fetchCrawlerLogs,
    startCrawler,
    stopCrawler,
    triggerCrawler
  } = useCrawlerStore()

  const [logsRefreshInterval, setLogsRefreshInterval] = useState<NodeJS.Timeout | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [logLevel, setLogLevel] = useState<string>('all')
  const [manualTriggerModalVisible, setManualTriggerModalVisible] = useState(false)

  useEffect(() => {
    // 初始加载数据
    loadData()

    // 设置定时刷新爬虫状态（每5秒）
    const statusInterval = setInterval(() => {
      fetchCrawlerStatus()
    }, 5000)

    return () => {
      clearInterval(statusInterval)
      if (logsRefreshInterval) {
        clearInterval(logsRefreshInterval)
      }
    }
  }, [])

  useEffect(() => {
    // 自动刷新日志
    if (autoRefresh && status?.status === 'running') {
      const interval = setInterval(() => {
        fetchCrawlerLogs({
          page: 1,
          per_page: 50,
          level: logLevel === 'all' ? undefined : logLevel
        })
      }, 3000)
      setLogsRefreshInterval(interval)
      return () => clearInterval(interval)
    } else if (logsRefreshInterval) {
      clearInterval(logsRefreshInterval)
      setLogsRefreshInterval(null)
    }
  }, [autoRefresh, logLevel, status?.status])

  const loadData = async () => {
    try {
      await Promise.all([
        fetchCrawlerStatus(),
        fetchCrawlerLogs({
          page: 1,
          per_page: 50,
          level: logLevel === 'all' ? undefined : logLevel
        })
      ])
    } catch (error) {
      message.error('加载数据失败')
    }
  }

  // 操作处理
  const handleStartCrawler = async () => {
    try {
      await startCrawler()
      message.success('爬虫启动成功')
      await fetchCrawlerStatus()
    } catch (error) {
      message.error('启动爬虫失败')
    }
  }

  const handleStopCrawler = async () => {
    Modal.confirm({
      title: '确认停止爬虫',
      content: '确定要停止当前运行的爬虫任务吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          await stopCrawler()
          message.success('爬虫已停止')
          await fetchCrawlerStatus()
        } catch (error) {
          message.error('停止爬虫失败')
        }
      }
    })
  }

  const handleManualTrigger = async (data: { hospital_ids?: number[]; priority?: 'low' | 'normal' | 'high' }) => {
    try {
      await triggerCrawler(data)
      message.success('手动触发成功')
      setManualTriggerModalVisible(false)
      await fetchCrawlerStatus()
    } catch (error) {
      message.error('触发失败')
    }
  }

  // 获取状态配置
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'running':
        return {
          color: 'success',
          icon: <PlayCircleOutlined />,
          text: '运行中',
          description: '爬虫正在正常工作'
        }
      case 'error':
        return {
          color: 'error',
          icon: <CloseCircleOutlined />,
          text: '错误',
          description: '爬虫遇到错误，需要检查'
        }
      case 'stopped':
      default:
        return {
          color: 'default',
          icon: <StopCircleOutlined />,
          text: '已停止',
          description: '爬虫已停止运行'
        }
    }
  }

  // 获取日志级别配置
  const getLogLevelConfig = (level: string) => {
    switch (level) {
      case 'info':
        return { color: 'blue', icon: <InfoCircleOutlined /> }
      case 'warning':
        return { color: 'orange', icon: <ExclamationCircleOutlined /> }
      case 'error':
        return { color: 'red', icon: <CloseCircleOutlined /> }
      default:
        return { color: 'default', icon: <InfoCircleOutlined /> }
    }
  }

  // 格式化时间
  const formatTime = (timeStr: string) => {
    return new Date(timeStr).toLocaleString('zh-CN')
  }

  // 计算进度百分比
  const getProgress = () => {
    if (!status || status.total_tasks === 0) return 0
    return Math.round((status.completed_tasks / status.total_tasks) * 100)
  }

  const statusConfig = status ? getStatusConfig(status.status) : getStatusConfig('stopped')

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <Title level={2} className="mb-2">爬虫控制中心</Title>
          <Text type="secondary">
            监控和管理医院官网爬虫系统
          </Text>
        </div>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={loadData}
            loading={loading}
          >
            刷新
          </Button>
          <Button
            type="primary"
            icon={<SettingOutlined />}
            onClick={() => setManualTriggerModalVisible(true)}
          >
            手动触发
          </Button>
        </Space>
      </div>

      {/* 爬虫状态卡片 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card>
            <div className="text-center">
              <Badge
                status={statusConfig.color as any}
                icon={statusConfig.icon}
                className="mb-4"
              />
              <Title level={3} className="mb-2">
                {statusConfig.text}
              </Title>
              <Text type="secondary">{statusConfig.description}</Text>
              
              {status && status.status === 'running' && status.start_time && (
                <div className="mt-4 p-3 bg-blue-50 rounded">
                  <Text type="secondary">
                    开始时间: {formatTime(status.start_time)}
                  </Text>
                </div>
              )}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Text strong>扫描进度</Text>
                <Text type="secondary">
                  {status?.completed_tasks || 0} / {status?.total_tasks || 0}
                </Text>
              </div>
              <Progress
                percent={getProgress()}
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
                showInfo={true}
              />
              
              {status && status.current_task && (
                <div className="mt-4 p-3 bg-gray-50 rounded">
                  <Text strong>当前任务:</Text>
                  <Paragraph className="mb-0 mt-1" ellipsis>
                    {status.current_task}
                  </Paragraph>
                </div>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      {/* 控制按钮 */}
      <Card>
        <div className="flex items-center justify-between">
          <Space>
            <Button
              type="primary"
              size="large"
              icon={<PlayCircleOutlined />}
              onClick={handleStartCrawler}
              disabled={status?.status === 'running'}
              loading={loading}
            >
              启动爬虫
            </Button>
            <Button
              danger
              size="large"
              icon={<StopCircleOutlined />}
              onClick={handleStopCrawler}
              disabled={status?.status !== 'running'}
              loading={loading}
            >
              停止爬虫
            </Button>
          </Space>
          
          <Space>
            <Text>自动刷新日志:</Text>
            <Switch
              checked={autoRefresh}
              onChange={setAutoRefresh}
              checkedChildren="开"
              unCheckedChildren="关"
            />
          </Space>
        </div>
      </Card>

      {/* 统计信息 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="总任务数"
              value={status?.total_tasks || 0}
              prefix={<ScanOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="已完成"
              value={status?.completed_tasks || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="日志总数"
              value={totalLogs}
              prefix={<LogOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="运行时间"
              value={status?.start_time ? Math.round((Date.now() - new Date(status.start_time).getTime()) / 1000 / 60) : 0}
              suffix="分钟"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 实时日志 */}
      <Card
        title={
          <div className="flex items-center justify-between">
            <Space>
              <LogOutlined />
              <Text>实时日志</Text>
            </Space>
            <Select
              value={logLevel}
              onChange={setLogLevel}
              style={{ width: 120 }}
            >
              <Option value="all">全部级别</Option>
              <Option value="info">信息</Option>
              <Option value="warning">警告</Option>
              <Option value="error">错误</Option>
            </Select>
          </div>
        }
      >
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {loading && logs.length === 0 ? (
            <div className="text-center py-8">
              <Spin size="large" />
              <div className="mt-2">
                <Text type="secondary">正在加载日志...</Text>
              </div>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8">
              <LogOutlined className="text-4xl text-gray-300 mb-4" />
              <Text type="secondary">暂无日志记录</Text>
            </div>
          ) : (
            <Timeline>
              {logs.map((log) => {
                const levelConfig = getLogLevelConfig(log.level)
                return (
                  <Timeline.Item
                    key={log.id}
                    dot={levelConfig.icon}
                    color={levelConfig.color}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <Tag color={levelConfig.color} size="small">
                            {log.level.toUpperCase()}
                          </Tag>
                          <Text type="secondary" className="text-sm">
                            {formatTime(log.timestamp)}
                          </Text>
                          {log.hospital_name && (
                            <Text type="secondary" className="text-sm">
                              - {log.hospital_name}
                            </Text>
                          )}
                        </div>
                        <Text>{log.message}</Text>
                      </div>
                    </div>
                  </Timeline.Item>
                )
              })}
            </Timeline>
          )}
        </div>
      </Card>

      {/* 手动触发模态框 */}
      <Modal
        title="手动触发爬虫"
        open={manualTriggerModalVisible}
        onCancel={() => setManualTriggerModalVisible(false)}
        footer={null}
        width={600}
      >
        <div className="space-y-4">
          <Alert
            message="手动触发说明"
            description="手动触发可以立即开始扫描指定的医院或所有医院。建议在系统空闲时使用。"
            type="info"
            showIcon
          />
          
          <div className="space-y-4">
            <div>
              <Text strong>触发方式:</Text>
              <div className="mt-2 space-x-2">
                <Button
                  type="primary"
                  icon={<ThunderboltOutlined />}
                  onClick={() => handleManualTrigger({ priority: 'high' })}
                >
                  扫描全部医院
                </Button>
                <Button
                  icon={<ScanOutlined />}
                  onClick={() => handleManualTrigger({ hospital_ids: [], priority: 'normal' })}
                >
                  增量扫描
                </Button>
              </div>
            </div>

            <Divider />

            <div>
              <Text strong>紧急操作:</Text>
              <div className="mt-2">
                <Button
                  danger
                  icon={<ReloadOutlined />}
                  onClick={() => {
                    Modal.confirm({
                      title: '确认重置',
                      content: '这将停止当前任务并重新开始，确定继续吗？',
                      onOk: () => handleManualTrigger({ priority: 'high', hospital_ids: [] })
                    })
                  }}
                >
                  强制重启
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default CrawlerDashboard