import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card,
  Descriptions,
  Button,
  Space,
  Tag,
  Typography,
  Row,
  Col,
  List,
  Timeline,
  Statistic,
  Tabs,
  Badge,
  Alert,
  Modal,
  message
} from 'antd'
import {
  ArrowLeftOutlined,
  EditOutlined,
  ScanOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  GlobalOutlined,
  CalendarOutlined,
  UserOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  RiseOutlined,
  BarChartOutlined
} from '@ant-design/icons'

// Store
import { useHospitalStore } from '../store'
import { useTenderStore } from '../store'
import { useHospitalScanHistoryStore } from '../store'
import { hospitalApi } from '../services/api'

const { Title, Text, Paragraph } = Typography
const { TabPane } = Tabs

interface HospitalDetailProps {
  mode?: 'view' | 'edit'
}

const HospitalDetailPage: React.FC<HospitalDetailProps> = ({ mode = 'view' }) => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentHospital, fetchHospitalById } = useHospitalStore()
  const { tenders, fetchTenders } = useTenderStore()
  const { scanHistory, fetchScanHistory } = useHospitalScanHistoryStore()

  const [activeTab, setActiveTab] = useState('overview')
  const [scanning, setScanning] = useState(false)

  useEffect(() => {
    if (id) {
      loadHospitalDetail(parseInt(id))
    }
  }, [id])

  const loadHospitalDetail = async (hospitalId: number) => {
    try {
      await fetchHospitalById(hospitalId)
      // 加载该医院的招投标数据
      await fetchTenders({ hospital_id: hospitalId, page: 1, per_page: 50 })
      // 加载医院扫描历史
      await fetchScanHistory(hospitalId, { page: 1, per_page: 20 })
    } catch (error) {
      message.error('加载医院详情失败')
    }
  }

  const handleScan = async () => {
    if (!currentHospital) return

    Modal.confirm({
      title: '扫描医院官网',
      content: `确定要扫描"${currentHospital.name}"的官网吗？`,
      onOk: async () => {
        setScanning(true)
        try {
          await hospitalApi.scanHospital(currentHospital.id)
          message.success('扫描任务已启动')
          // 重新加载扫描历史
          await fetchScanHistory(currentHospital.id, { page: 1, per_page: 20 })
        } catch (error) {
          message.error('启动扫描失败')
        } finally {
          setScanning(false)
        }
      }
    })
  }

  const handleEdit = () => {
    navigate(`/hospitals/${id}/edit`)
  }

  // 获取状态配置
  const getStatusConfig = (status: string) => {
    const config = {
      active: { color: 'success', text: '正常运营', icon: <CheckCircleOutlined /> },
      inactive: { color: 'warning', text: '暂停运营', icon: <ExclamationCircleOutlined /> },
      closed: { color: 'error', text: '已关闭', icon: <CloseCircleOutlined /> },
      relocated: { color: 'default', text: '已迁移', icon: <EnvironmentOutlined /> }
    }
    return config[status as keyof typeof config]
  }

  // 获取扫描历史状态配置
  const getScanStatusConfig = (status: string) => {
    const config = {
      success: { color: 'green', text: '成功', icon: <CheckCircleOutlined /> },
      failed: { color: 'red', text: '失败', icon: <CloseCircleOutlined /> },
      partial: { color: 'orange', text: '部分成功', icon: <ExclamationCircleOutlined /> }
    }
    return config[status as keyof typeof config] || config.failed
  }

  
  if (!currentHospital) {
    return (
      <div className="text-center py-8">
        <Text type="secondary">加载中...</Text>
      </div>
    )
  }

  const statusConfig = getStatusConfig(currentHospital.status)

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/hospitals')}
          >
            返回列表
          </Button>
          <div>
            <Title level={2} className="mb-0">{currentHospital.name}</Title>
            <Text type="secondary">医院详情信息</Text>
          </div>
        </Space>
        <Space>
          <Button
            icon={<ScanOutlined />}
            onClick={handleScan}
            disabled={!currentHospital.website_url}
          >
            扫描官网
          </Button>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={handleEdit}
          >
            编辑信息
          </Button>
        </Space>
      </div>

      {/* 基本信息卡片 */}
      <Card>
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            <Descriptions title="基本信息" bordered column={2}>
              <Descriptions.Item label="医院名称">
                <Text strong>{currentHospital.name}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusConfig.color} icon={statusConfig.icon}>
                  {statusConfig.text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="医院类型">
                <Tag color="blue">{currentHospital.hospital_type}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="医院等级">
                <Tag color="orange">{currentHospital.hospital_level || '未分级'}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="地址" span={2}>
                <EnvironmentOutlined className="mr-1" />
                {currentHospital.address || '未填写'}
              </Descriptions.Item>
              <Descriptions.Item label="联系电话">
                <PhoneOutlined className="mr-1" />
                {currentHospital.phone || '未填写'}
              </Descriptions.Item>
              <Descriptions.Item label="官网地址">
                {currentHospital.website_url ? (
                  <a href={currentHospital.website_url} target="_blank" rel="noopener noreferrer">
                    <GlobalOutlined className="mr-1" />
                    {currentHospital.website_url}
                  </a>
                ) : (
                  <Text type="secondary">无官网</Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                <CalendarOutlined className="mr-1" />
                {new Date(currentHospital.created_at).toLocaleDateString('zh-CN')}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                <CalendarOutlined className="mr-1" />
                {new Date(currentHospital.updated_at).toLocaleDateString('zh-CN')}
              </Descriptions.Item>
            </Descriptions>
          </Col>
          <Col xs={24} lg={8}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card size="small">
                  <Statistic
                    title="招投标总数"
                    value={currentHospital.tender_count}
                    prefix={<FileTextOutlined />}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small">
                  <Statistic
                    title="验证状态"
                    value={currentHospital.verified ? '已验证' : '未验证'}
                    prefix={currentHospital.verified ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
                    valueStyle={{ 
                      color: currentHospital.verified ? '#52c41a' : '#faad14' 
                    }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small">
                  <Statistic
                    title="扫描成功"
                    value={currentHospital.scan_success_count || 0}
                    prefix={<CheckCircleOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small">
                  <Statistic
                    title="扫描失败"
                    value={currentHospital.scan_failed_count || 0}
                    prefix={<CloseCircleOutlined />}
                    valueStyle={{ color: '#f5222d' }}
                  />
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      {/* 详细信息标签页 */}
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane 
            tab={
              <span>
                <BarChartOutlined />
                统计数据
              </span>
            } 
            key="statistics"
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} lg={6}>
                <Statistic
                  title="成功率"
                  value={((currentHospital.scan_success_count || 0) / Math.max((currentHospital.scan_success_count || 0) + (currentHospital.scan_failed_count || 0), 1)) * 100}
                  suffix="%"
                  precision={1}
                  prefix={<RiseOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Statistic
                  title="最后扫描"
                  value={currentHospital.last_scan_time ? new Date(currentHospital.last_scan_time).toLocaleDateString('zh-CN') : '从未扫描'}
                  prefix={<ClockCircleOutlined />}
                />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Statistic
                  title="本月招投标"
                  value="12"
                  prefix={<FileTextOutlined />}
                />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Statistic
                  title="平均预算"
                  value="280"
                  suffix="万元"
                  prefix="¥"
                />
              </Col>
            </Row>
          </TabPane>

          <TabPane 
            tab={
              <span>
                <FileTextOutlined />
                招投标记录
              </span>
            } 
            key="tenders"
          >
            <List
              dataSource={tenders}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button size="small" type="link" icon={<EyeOutlined />}>
                      查看
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <div className="flex items-center justify-between">
                        <Text strong>{item.title}</Text>
                        <Tag color={item.status === 'published' ? 'blue' : 'green'}>
                          {item.status === 'published' ? '已发布' : '已截止'}
                        </Tag>
                      </div>
                    }
                    description={
                      <div className="text-sm">
                        <Text type="secondary">发布日期: {item.publish_date}</Text>
                        <span className="mx-2">•</span>
                        <Text type="secondary">截止日期: {item.deadline_date}</Text>
                        <span className="mx-2">•</span>
                        <Text type="secondary">
                          预算: ¥{item.budget_amount.toLocaleString()}
                        </Text>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </TabPane>

          <TabPane 
            tab={
              <span>
                <ScanOutlined />
                扫描历史
              </span>
            } 
            key="scan_history"
          >
            <Timeline
              items={scanHistory.map((scan) => {
                const statusConfig = getScanStatusConfig(scan.status)
                return {
                  key: scan.id,
                  color: statusConfig.color,
                  children: (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <Text strong>扫描时间: {scan.scan_time}</Text>
                          <span className="mx-2">•</span>
                          <Text>耗时: {scan.duration}</Text>
                        </div>
                        <Badge
                          status={statusConfig.color as any}
                          text={statusConfig.text}
                        />
                      </div>
                      <Paragraph className="text-sm mb-0">
                        <Text>发现 {scan.tenders_found} 条招投标信息</Text>
                        <span className="mx-2">•</span>
                        <Text type="secondary">耗时 {Math.round(scan.response_time)}秒</Text>
                        {scan.error_message && (
                          <>
                            <span className="mx-2">•</span>
                            <Text type="danger">{scan.error_message}</Text>
                          </>
                        )}
                      </Paragraph>
                    </>
                  )
                }
              })}
            />
          </TabPane>

          <TabPane 
            tab={
              <span>
                <UserOutlined />
                操作日志
              </span>
            } 
            key="logs"
          >
            <Timeline
              items={[
                {
                  color: 'blue',
                  children: (
                    <div>
                      <Text strong>手动编辑</Text>
                      <div className="text-xs text-gray-500">2024-11-18 10:30:00</div>
                      <Paragraph className="text-sm mt-1" ellipsis={{ rows: 1 }}>
                        更新医院基本信息
                      </Paragraph>
                    </div>
                  )
                },
                {
                  color: 'green',
                  children: (
                    <div>
                      <Text strong>官网扫描</Text>
                      <div className="text-xs text-gray-500">2024-11-18 02:30:15</div>
                      <Paragraph className="text-sm mt-1" ellipsis={{ rows: 1 }}>
                        成功获取5条招投标信息
                      </Paragraph>
                    </div>
                  )
                },
                {
                  color: 'orange',
                  children: (
                    <div>
                      <Text strong>系统更新</Text>
                      <div className="text-xs text-gray-500">2024-11-17 15:45:22</div>
                      <Paragraph className="text-sm mt-1" ellipsis={{ rows: 1 }}>
                        标记为重要医院
                      </Paragraph>
                    </div>
                  )
                },
                {
                  color: 'blue',
                  children: (
                    <div>
                      <Text strong>数据验证</Text>
                      <div className="text-xs text-gray-500">2024-11-16 09:15:33</div>
                      <Paragraph className="text-sm mt-1" ellipsis={{ rows: 1 }}>
                        验证医院信息真实性
                      </Paragraph>
                    </div>
                  )
                }
              ]}
            />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  )
}

export default HospitalDetailPage