import React, { useState, useEffect } from 'react'
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Typography, 
  Divider,
  Descriptions,
  List,
  Tag,
  Badge,
  Button,
  Space,
  Alert
} from 'antd'
import {
  EnvironmentOutlined,
  HospitalOutlined,
  FileTextOutlined,
  ReloadOutlined,
  BarChartOutlined
} from '@ant-design/icons'

// Components
import RegionTree from '../components/RegionTree'

// Store
import { useRegionStore, useHospitalStore } from '../store'
import type { Region } from '../types'

const { Title, Text } = Typography

const RegionsPage: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null)
  const [selectedHospitalId, setSelectedHospitalId] = useState<number | null>(null)
  const [stats, setStats] = useState({
    totalRegions: 0,
    totalHospitals: 0,
    totalTenders: 0
  })

  const { regions, loading } = useRegionStore()
  const { hospitals } = useHospitalStore()

  useEffect(() => {
    // 计算统计数据
    const totalRegions = regions.length
    const totalHospitals = regions.reduce((sum, region) => sum + (region.hospital_count || 0), 0)
    const totalTenders = regions.reduce((sum, region) => sum + (region.tender_count || 0), 0)
    
    setStats({
      totalRegions,
      totalHospitals,
      totalTenders
    })
  }, [regions])

  const handleRegionSelect = (region: Region) => {
    setSelectedRegion(region)
  }

  const handleHospitalSelect = (hospitalId: number) => {
    setSelectedHospitalId(hospitalId)
  }

  const handleAddHospital = (regionId: number) => {
    // 跳转到添加医院页面
    console.log('添加医院到地区:', regionId)
  }

  const getHospitalByRegion = (region: Region) => {
    return hospitals.filter(hospital => hospital.region_id === region.id)
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <Title level={2} className="mb-2">地区管理</Title>
        <Text type="secondary">
          管理和浏览全国各地区的医院分布情况
        </Text>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="地区总数"
              value={stats.totalRegions}
              prefix={<EnvironmentOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="医院总数"
              value={stats.totalHospitals}
              prefix={<HospitalOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="招投标记录"
              value={stats.totalTenders}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 主要内容 */}
      <Row gutter={[16, 16]}>
        {/* 左侧 - 地区树形结构 */}
        <Col xs={24} lg={8}>
          <Card
            title="地区树形结构"
            extra={
              <Space>
                <Button
                  icon={<ReloadOutlined />}
                  size="small"
                  onClick={() => window.location.reload()}
                >
                  刷新
                </Button>
              </Space>
            }
            bodyStyle={{ padding: 0 }}
          >
            <RegionTree
              onRegionSelect={handleRegionSelect}
              onHospitalSelect={handleHospitalSelect}
              onAddHospital={handleAddHospital}
              selectedKeys={selectedRegion ? [String(selectedRegion.id)] : []}
            />
          </Card>
        </Col>

        {/* 右侧 - 地区详情和医院列表 */}
        <Col xs={24} lg={16}>
          {selectedRegion ? (
            <div className="space-y-4">
              {/* 地区详情卡片 */}
              <Card title="地区详情">
                <Descriptions bordered column={2}>
                  <Descriptions.Item label="地区名称">
                    <Space>
                      <EnvironmentOutlined />
                      {selectedRegion.name}
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="行政级别">
                    <Tag color="blue">
                      {getLevelText(selectedRegion.level)}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="医院数量">
                    <Badge count={selectedRegion.hospital_count || 0} />
                  </Descriptions.Item>
                  <Descriptions.Item label="招投标数量">
                    <Badge count={selectedRegion.tender_count || 0} />
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              {/* 地区医院列表 */}
              <Card
                title={`${selectedRegion.name} - 医院列表`}
                extra={
                  <Space>
                    <Text type="secondary">
                      共 {getHospitalByRegion(selectedRegion).length} 家医院
                    </Text>
                    <Button type="primary" size="small">
                      添加医院
                    </Button>
                  </Space>
                }
              >
                {getHospitalByRegion(selectedRegion).length > 0 ? (
                  <List
                    dataSource={getHospitalByRegion(selectedRegion)}
                    renderItem={(hospital) => (
                      <List.Item
                        actions={[
                          <Button key="edit" size="small">编辑</Button>,
                          <Button key="detail" size="small">详情</Button>
                        ]}
                      >
                        <List.Item.Meta
                          avatar={<HospitalOutlined className="text-blue-500" />}
                          title={
                            <Space>
                              {hospital.name}
                              <Tag color={getStatusColor(hospital.status)}>
                                {getStatusText(hospital.status)}
                              </Tag>
                              <Tag color={getLevelColor(hospital.hospital_level)}>
                                {getLevelText(hospital.hospital_level)}
                              </Tag>
                              {hospital.verified && (
                                <Tag color="green">已验证</Tag>
                              )}
                            </Space>
                          }
                          description={
                            <div className="space-y-1">
                              {hospital.address && (
                                <Text type="secondary">{hospital.address}</Text>
                              )}
                              {hospital.website_url && (
                                <div>
                                  <Text type="secondary">官网: </Text>
                                  <a href={hospital.website_url} target="_blank" rel="noopener noreferrer">
                                    {hospital.website_url}
                                  </a>
                                </div>
                              )}
                              <div>
                                <Space size="small">
                                  <Text type="secondary">招投标: {hospital.tender_count || 0}</Text>
                                  <Text type="secondary">成功扫描: {hospital.scan_success_count || 0}</Text>
                                </Space>
                              </div>
                            </div>
                          }
                        />
                      </List.Item>
                    )}
                  />
                ) : (
                  <div className="text-center py-8">
                    <Text type="secondary">该地区暂无医院数据</Text>
                  </div>
                )}
              </Card>
            </div>
          ) : (
            <Card>
              <div className="text-center py-12">
                <EnvironmentOutlined className="text-6xl text-gray-300 mb-4" />
                <Title level={4} type="secondary">请选择地区</Title>
                <Text type="secondary">
                  从左侧地区树形结构中选择一个地区查看详细信息
                </Text>
              </div>
            </Card>
          )}
        </Col>
      </Row>

      {/* 帮助信息 */}
      <Alert
        message="使用说明"
        description={
          <div>
            <p>1. 在左侧地区树形结构中点击地区节点查看该地区的医院信息</p>
            <p>2. 树形结构支持四级联动：国家 → 省 → 市 → 县 → 医院</p>
            <p>3. 可以通过搜索框快速查找特定的地区或医院</p>
            <p>4. 点击"添加医院"按钮可以向指定地区添加新的医院信息</p>
          </div>
        }
        type="info"
        showIcon
      />
    </div>
  )
}

// 辅助函数
const getLevelText = (level: any) => {
  if (typeof level === 'string') {
    const levelMap = {
      level1: '一级医院',
      level2: '二级医院',
      level3: '三级医院',
      level3a: '三级甲等'
    }
    return levelMap[level as keyof typeof levelMap] || level
  }
  
  const levelNames = ['国家', '省', '市', '县', '医院']
  return levelNames[level] || `级别${level}`
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

const getStatusText = (status: string) => {
  const textMap = {
    active: '正常运营',
    inactive: '暂停运营',
    closed: '已关闭',
    relocated: '已迁移'
  }
  return textMap[status as keyof typeof textMap] || status
}

const getLevelColor = (level: any) => {
  if (!level || typeof level === 'string') {
    return 'blue'
  }
  const colorMap = ['default', 'blue', 'green', 'orange', 'red']
  return colorMap[level] || 'blue'
}

export default RegionsPage