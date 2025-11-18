import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Button,
  List,
  Tag,
  Progress,
  Space,
  Timeline,
  Alert,
  Spin,
  Divider,
  Table,
  Badge,
  Tooltip
} from 'antd'
import {
  DashboardOutlined,
  HospitalOutlined,
  FileTextOutlined,
  ScanOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ReloadOutlined,
  EyeOutlined,
  TrendingUpOutlined,
  TrendingDownOutlined,
  ClockCircleOutlined,
  PlayCircleOutlined,
  StopCircleOutlined,
  ExclamationCircleOutlined,
  EyeTwoTone,
  BugOutlined
} from '@ant-design/icons'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'

// Store
import { useStatisticsStore } from '../store'
import { useCrawlerStore } from '../store'
import { useHospitalStore } from '../store'
import { useTenderStore } from '../store'
import type { Tender } from '../types'

const { Title, Text, Paragraph } = Typography

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const {
    statistics,
    dashboardData,
    trendData,
    loading,
    fetchStatistics,
    fetchDashboardData,
    fetchTrendData
  } = useStatisticsStore()

  const {
    status: crawlerStatus,
    fetchCrawlerStatus
  } = useCrawlerStore()

  const { hospitals: recentHospitals } = useHospitalStore()
  const { tenders: recentTenders } = useTenderStore()

  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadData()
    // 设置定时刷新（每30秒）
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    setRefreshing(true)
    try {
      await Promise.all([
        fetchStatistics(),
        fetchDashboardData(),
        fetchCrawlerStatus(),
        fetchTrendData({ granularity: 'daily' })
      ])
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setRefreshing(false)
    }
  }

  // 获取状态配置
  const getCrawlerStatusConfig = () => {
    if (!crawlerStatus) return null

    switch (crawlerStatus.status) {
      case 'running':
        return {
          color: '#52c41a',
          text: '运行中',
          icon: <PlayCircleOutlined />
        }
      case 'error':
        return {
          color: '#f5222d',
          text: '错误',
          icon: <BugOutlined />
        }
      case 'stopped':
      default:
        return {
          color: '#d9d9d9',
          text: '已停止',
          icon: <StopCircleOutlined />
        }
    }
  }

  // 格式化时间
  const formatTime = (timeStr: string) => {
    return new Date(timeStr).toLocaleString('zh-CN')
  }

  // 获取趋势图标
  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) {
      return <TrendingUpOutlined style={{ color: '#52c41a' }} />
    } else if (current < previous) {
      return <TrendingDownOutlined style={{ color: '#f5222d' }} />
    }
    return <div style={{ width: 16, height: 16 }} />
  }

  const statusConfig = getCrawlerStatusConfig()

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <Title level={2} className="mb-2">数据总览</Title>
          <Text type="secondary">
            医院招投标监控系统运行状态
          </Text>
        </div>
        <Button
          icon={<ReloadOutlined />}
          onClick={loadData}
          loading={refreshing}
        >
          刷新数据
        </Button>
      </div>

      {/* 爬虫状态提示 */}
      {statusConfig && (
        <Alert
          message={`爬虫状态: ${statusConfig.text}`}
          description={
            crawlerStatus?.current_task 
              ? `当前任务: ${crawlerStatus.current_task}`
              : `进度: ${crawlerStatus.completed_tasks}/${crawlerStatus.total_tasks}`
          }
          type={crawlerStatus.status === 'running' ? 'success' : 'warning'}
          showIcon
          icon={statusConfig.icon}
          action={
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => navigate('/scheduler')}
            >
              查看详情
            </Button>
          }
        />
      )}

      {/* 统计概览卡片 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="医院总数"
              value={statistics?.total_hospitals || 0}
              prefix={<HospitalOutlined />}
              suffix="家"
              valueStyle={{ color: '#1890ff' }}
            />
            <div className="mt-2 flex items-center justify-between text-sm">
              <Text type="secondary">已验证: {statistics?.verified_hospitals || 0}</Text>
              <Text type="secondary">活跃: {statistics?.active_hospitals || 0}</Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="招投标总数"
              value={statistics?.total_tenders || 0}
              prefix={<FileTextOutlined />}
              suffix="条"
              valueStyle={{ color: '#52c41a' }}
            />
            <div className="mt-2 flex items-center justify-between text-sm">
              <Text type="secondary">本周新增: {statistics?.weekly_new_tenders || 0}</Text>
              <Text type="secondary">本月新增: {statistics?.monthly_new_tenders || 0}</Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="爬虫成功率"
              value={statistics?.scan_success_rate || 0}
              suffix="%"
              prefix={<CheckCircleOutlined />}
              precision={1}
              valueStyle={{ color: '#faad14' }}
            />
            <div className="mt-2">
              <Progress 
                percent={statistics?.scan_success_rate || 0} 
                size="small"
                strokeColor="#faad14"
                showInfo={false}
              />
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总预算金额"
              value={(statistics?.total_budget || 0) / 1000000}
              prefix="¥"
              suffix="亿元"
              precision={1}
              valueStyle={{ color: '#722ed1' }}
            />
            <div className="mt-2">
              <Text type="secondary">日均增长: ¥{(statistics?.total_budget || 0) / 1000000 / 7}百万</Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={[16, 16]}>
        {/* 趋势图 */}
        <Col xs={24} lg={16}>
          <Card title="招投标趋势" extra={
            <Space>
              <Button size="small" type="link">近7天</Button>
              <Button size="small" type="link">近30天</Button>
            </Space>
          }>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <LineChart data={trendData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <RechartsTooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="tenders"
                    stroke="#1890ff"
                    strokeWidth={2}
                    name="招投标数量"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="budget"
                    stroke="#52c41a"
                    strokeWidth={2}
                    name="总预算(万元)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        {/* 医院类型分布 */}
        <Col xs={24} lg={8}>
          <Card title="医院类型分布">
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                  data={dashboardData?.hospital_type_distribution || [
                    { name: '公立医院', value: 0, color: '#1890ff' },
                    { name: '私立医院', value: 0, color: '#52c41a' },
                    { name: '社区卫生', value: 0, color: '#faad14' },
                    { name: '专科医院', value: 0, color: '#722ed1' }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {(dashboardData?.hospital_type_distribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 活动动态 */}
      <Row gutter={[16, 16]}>
        {/* 最近招投标 */}
        <Col xs={24} lg={12}>
          <Card 
            title={
              <div className="flex items-center justify-between">
                <span>最近招投标</span>
                <Button 
                  type="link" 
                  size="small"
                  onClick={() => navigate('/tenders')}
                >
                  查看全部
                </Button>
              </div>
            }
          >
            <List
              size="small"
              dataSource={(dashboardData?.recent_tenders || []).slice(0, 5)}
              renderItem={(item: any) => (
                <List.Item
                  actions={[
                    <Button 
                      size="small" 
                      type="link"
                      icon={<EyeOutlined />}
                      onClick={() => navigate(`/tenders/${item.id}`)}
                    >
                      查看
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <div className="flex items-center space-x-2">
                        <Text strong className="flex-1">{item.title}</Text>
                        <Tag color={item.status === 'in_progress' ? 'green' : 'blue'}>
                          {item.status === 'in_progress' ? '进行中' : '已发布'}
                        </Tag>
                      </div>
                    }
                    description={
                      <div className="text-xs">
                        <Text type="secondary">{item.hospital_name}</Text>
                        <span className="mx-2">•</span>
                        <Text type="secondary">{item.publish_date}</Text>
                        <span className="mx-2">•</span>
                        <Text type="secondary">¥{item.budget_amount?.toLocaleString()}万元</Text>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* 系统活动 */}
        <Col xs={24} lg={12}>
          <Card 
            title={
              <div className="flex items-center justify-between">
                <span>系统活动</span>
                <Button 
                  type="link" 
                  size="small"
                  onClick={() => navigate('/scheduler')}
                >
                  查看日志
                </Button>
              </div>
            }
          >
            <Timeline size="small">
              <Timeline.Item color="green" dot={<CheckCircleOutlined />}>
                <div>
                  <Text strong>爬虫扫描完成</Text>
                  <div className="text-xs text-gray-500">刚刚</div>
                </div>
                <Paragraph className="text-xs mt-1" ellipsis={{ rows: 1 }}>
                  成功扫描 15 家医院，发现 23 条新招投标信息
                </Paragraph>
              </Timeline.Item>

              <Timeline.Item color="blue" dot={<FileTextOutlined />}>
                <div>
                  <Text strong>数据更新</Text>
                  <div className="text-xs text-gray-500">5分钟前</div>
                </div>
                <Paragraph className="text-xs mt-1" ellipsis={{ rows: 1 }}>
                  定期数据清理完成，删除过期日志 156 条
                </Paragraph>
              </Timeline.Item>

              <Timeline.Item color="orange" dot={<WarningOutlined />}>
                <div>
                  <Text strong>系统警告</Text>
                  <div className="text-xs text-gray-500">10分钟前</div>
                </div>
                <Paragraph className="text-xs mt-1" ellipsis={{ rows: 1 }}>
                  医院官网响应超时，建议检查网络连接
                </Paragraph>
              </Timeline.Item>

              <Timeline.Item color="gray" dot={<ScanOutlined />}>
                <div>
                  <Text strong>定时任务</Text>
                  <div className="text-xs text-gray-500">30分钟前</div>
                </div>
                <Paragraph className="text-xs mt-1" ellipsis={{ rows: 1 }}>
                  启动每日定期扫描任务
                </Paragraph>
              </Timeline.Item>
            </Timeline>
          </Card>
        </Col>
      </Row>

      {/* 快速操作 */}
      <Card title="快速操作">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={6}>
            <Button
              block
              size="large"
              icon={<HospitalOutlined />}
              onClick={() => navigate('/hospitals')}
            >
              管理医院
            </Button>
          </Col>
          <Col xs={24} sm={6}>
            <Button
              block
              size="large"
              icon={<FileTextOutlined />}
              onClick={() => navigate('/tenders')}
            >
              查看招投标
            </Button>
          </Col>
          <Col xs={24} sm={6}>
            <Button
              block
              size="large"
              icon={<ScanOutlined />}
              onClick={() => navigate('/scheduler')}
            >
              爬虫控制
            </Button>
          </Col>
          <Col xs={24} sm={6}>
            <Button
              block
              size="large"
              icon={<DashboardOutlined />}
              onClick={() => navigate('/statistics')}
            >
              数据统计
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 性能指标 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card>
            <Statistic
              title="平均响应时间"
              value={1.2}
              suffix="秒"
              precision={1}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            <div className="mt-2">
              <Progress percent={85} size="small" />
              <Text type="secondary" className="text-sm">相比上周 +5%</Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card>
            <Statistic
              title="系统负载"
              value={65}
              suffix="%"
              prefix={<DashboardOutlined />}
              precision={0}
              valueStyle={{ color: '#52c41a' }}
            />
            <div className="mt-2">
              <Progress percent={65} size="small" strokeColor="#52c41a" />
              <Text type="secondary" className="text-sm">正常范围内</Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card>
            <Statistic
              title="错误率"
              value={0.3}
              suffix="%"
              precision={1}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
            <div className="mt-2">
              <Progress percent={3} size="small" strokeColor="#faad14" />
              <Text type="secondary" className="text-sm">相比上周 -2%</Text>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard