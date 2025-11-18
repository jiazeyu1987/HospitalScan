import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Form,
  Input,
  Select,
  Button,
  Card,
  Space,
  Typography,
  Row,
  Col,
  message,
  Steps,
  Upload,
  Modal,
  Switch,
  InputNumber
} from 'antd'
import {
  SaveOutlined,
  ArrowLeftOutlined,
  UploadOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'

// Store
import { useHospitalStore } from '../store'
import { useRegionStore } from '../store'
import type { Hospital } from '../types'

const { Title, Text } = Typography
const { Option } = Select
const { TextArea } = Input
const { Step } = Steps

interface HospitalEditPageProps {
  mode: 'create' | 'edit'
}

const HospitalEditPage: React.FC<HospitalEditPageProps> = ({ mode }) => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [uploadModalVisible, setUploadModalVisible] = useState(false)

  const { currentHospital, fetchHospitalById, createHospital, updateHospital } = useHospitalStore()
  const { regions, loadRegions } = useRegionStore()

  useEffect(() => {
    loadRegions()
    
    if (mode === 'edit' && id) {
      loadHospitalData(parseInt(id))
    }
  }, [mode, id])

  const loadHospitalData = async (hospitalId: number) => {
    setLoading(true)
    try {
      await fetchHospitalById(hospitalId)
      if (currentHospital) {
        form.setFieldsValue(currentHospital)
      }
    } catch (error) {
      message.error('加载医院信息失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (values: any) => {
    setLoading(true)
    try {
      if (mode === 'create') {
        await createHospital(values)
        message.success('医院创建成功')
      } else {
        await updateHospital(parseInt(id!), values)
        message.success('医院信息更新成功')
      }
      navigate('/hospitals')
    } catch (error) {
      message.error(mode === 'create' ? '创建医院失败' : '更新医院信息失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    Modal.confirm({
      title: '取消编辑',
      content: '确定要取消编辑吗？未保存的更改将丢失。',
      onOk: () => {
        navigate('/hospitals')
      }
    })
  }

  const steps = [
    {
      title: '基本信息',
      description: '填写医院基本信息'
    },
    {
      title: '详细地址',
      description: '完善医院地址信息'
    },
    {
      title: '网络信息',
      description: '配置官网和联系方式'
    }
  ]

  const nextStep = () => {
    form.validateFields().then(() => {
      setCurrentStep(currentStep + 1)
    })
  }

  const prevStep = () => {
    setCurrentStep(currentStep - 1)
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <Title level={2} className="mb-2">
            {mode === 'create' ? '添加医院' : '编辑医院信息'}
          </Title>
          <Text type="secondary">
            {mode === 'create' ? '新增医院到监控系统' : '修改医院基本信息'}
          </Text>
        </div>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/hospitals')}>
            返回列表
          </Button>
          <Button icon={<UploadOutlined />} onClick={() => setUploadModalVisible(true)}>
            批量导入
          </Button>
        </Space>
      </div>

      {/* 步骤条 */}
      <Card>
        <Steps current={currentStep}>
          {steps.map(item => (
            <Step key={item.title} title={item.title} description={item.description} />
          ))}
        </Steps>
      </Card>

      {/* 表单内容 */}
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={{
            hospital_type: 'public',
            hospital_level: null,
            status: 'active',
            verified: false
          }}
        >
          {/* 步骤1: 基本信息 */}
          {currentStep === 0 && (
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item
                  name="name"
                  label="医院名称"
                  rules={[
                    { required: true, message: '请输入医院名称' },
                    { min: 2, message: '医院名称至少2个字符' }
                  ]}
                >
                  <Input placeholder="请输入医院全称" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="hospital_type"
                  label="医院类型"
                  rules={[{ required: true, message: '请选择医院类型' }]}
                >
                  <Select placeholder="选择医院类型">
                    <Option value="public">公立医院</Option>
                    <Option value="private">私立医院</Option>
                    <Option value="community">社区卫生服务中心</Option>
                    <Option value="specialized">专科医院</Option>
                    <Option value="traditional">中医院</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="hospital_level"
                  label="医院等级"
                >
                  <Select placeholder="选择医院等级" allowClear>
                    <Option value="level1">一级医院</Option>
                    <Option value="level2">二级医院</Option>
                    <Option value="level3">三级医院</Option>
                    <Option value="level3a">三级甲等</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="status"
                  label="运营状态"
                  rules={[{ required: true, message: '请选择运营状态' }]}
                >
                  <Select placeholder="选择运营状态">
                    <Option value="active">正常运营</Option>
                    <Option value="inactive">暂停运营</Option>
                    <Option value="closed">已关闭</Option>
                    <Option value="relocated">已迁移</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  name="region_id"
                  label="所属地区"
                  rules={[{ required: true, message: '请选择所属地区' }]}
                >
                  <Select 
                    placeholder="选择省份/城市" 
                    showSearch
                    filterOption={(input, option) =>
                      (option?.children as string)?.toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {regions.map(region => (
                      <Option key={region.id} value={region.id}>
                        {region.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          )}

          {/* 步骤2: 详细地址 */}
          {currentStep === 1 && (
            <Row gutter={[24, 0]}>
              <Col span={24}>
                <Form.Item
                  name="address"
                  label="详细地址"
                  rules={[
                    { required: true, message: '请输入详细地址' },
                    { min: 5, message: '地址信息过于简短' }
                  ]}
                >
                  <TextArea 
                    rows={3} 
                    placeholder="请输入医院详细地址，包括省市区街道门牌号"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="phone"
                  label="联系电话"
                  rules={[
                    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码' }
                  ]}
                >
                  <Input placeholder="请输入联系电话" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="verified"
                  label="信息验证状态"
                  valuePropName="checked"
                >
                  <Switch 
                    checkedChildren="已验证" 
                    unCheckedChildren="未验证"
                  />
                </Form.Item>
              </Col>
            </Row>
          )}

          {/* 步骤3: 网络信息 */}
          {currentStep === 2 && (
            <Row gutter={[24, 0]}>
              <Col span={24}>
                <Form.Item
                  name="website_url"
                  label="官网地址"
                  rules={[
                    { type: 'url', message: '请输入正确的网址格式' }
                  ]}
                >
                  <Input placeholder="https://www.hospital.com" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  name="description"
                  label="医院简介"
                >
                  <TextArea 
                    rows={4} 
                    placeholder="请简要描述医院的基本情况、科室设置、专科特色等"
                  />
                </Form.Item>
              </Col>
            </Row>
          )}

          {/* 操作按钮 */}
          <Card className="mt-6">
            <div className="flex items-center justify-between">
              <div>
                {currentStep > 0 && (
                  <Button onClick={prevStep}>
                    上一步
                  </Button>
                )}
              </div>
              <Space>
                <Button onClick={handleCancel}>
                  取消
                </Button>
                {currentStep < steps.length - 1 ? (
                  <Button type="primary" onClick={nextStep}>
                    下一步
                  </Button>
                ) : (
                  <Button 
                    type="primary" 
                    htmlType="submit"
                    icon={<SaveOutlined />}
                    loading={loading}
                  >
                    {mode === 'create' ? '创建医院' : '保存修改'}
                  </Button>
                )}
              </Space>
            </div>
          </Card>
        </Form>
      </Card>

      {/* 批量导入模态框 */}
      <Modal
        title="批量导入医院"
        open={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        footer={null}
        width={600}
      >
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded">
            <Title level={5}>导入说明</Title>
            <div className="text-sm space-y-2">
              <p>• 支持Excel格式(.xlsx, .xls)</p>
              <p>• 文件大小不超过10MB</p>
              <p>• 请先下载模板文件填写数据</p>
              <p>• 必填字段：医院名称、医院类型、所属地区</p>
            </div>
          </div>

          <div className="text-center">
            <Upload.Dragger
              name="file"
              multiple={false}
              accept=".xlsx,.xls"
              beforeUpload={() => false}
              onChange={(info) => {
                if (info.fileList.length > 0) {
                  message.success('文件上传成功，正在解析数据...')
                  setUploadModalVisible(false)
                  // 这里应该处理文件上传和解析
                }
              }}
            >
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
              <p className="ant-upload-hint">
                支持Excel格式，文件大小不超过10MB
              </p>
            </Upload.Dragger>
          </div>

          <div className="text-center">
            <Button type="link" icon={<CheckCircleOutlined />}>
              下载Excel模板
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default HospitalEditPage