import React, { useState, useEffect } from 'react'
import {
  Card,
  Form,
  Input,
  Switch,
  Select,
  Button,
  Row,
  Col,
  Tabs,
  InputNumber,
  Space,
  Typography,
  message,
  Alert,
  Divider,
  Popconfirm,
  Modal,
  Tag,
  Statistic
} from 'antd'
import {
  SaveOutlined,
  ReloadOutlined,
  TestTubeOutlined,
  SettingOutlined,
  NotificationOutlined,
  DatabaseOutlined,
  ApiOutlined,
  SecurityScanOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined
} from '@ant-design/icons'
import type { SystemSettings } from '../types'

// Store
import { useSystemSettingsStore } from '../store'

const { Title, Text, Paragraph } = Typography
const { Option } = Select
const { TextArea } = Input
const { TabPane } = Tabs

const Settings: React.FC = () => {
  const [form] = Form.useForm()
  const [hasChanges, setHasChanges] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('crawler')

  const {
    settings,
    systemInfo,
    fetchSettings,
    updateSettings,
    testEmail,
    testSms,
    fetchSystemInfo,
    resetToDefaults
  } = useSystemSettingsStore()

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (settings) {
      form.setFieldsValue(settings)
    }
  }, [settings, form])

  const loadData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchSettings(),
        fetchSystemInfo()
      ])
    } catch (error) {
      message.error('加载设置失败')
    } finally {
      setLoading(false)
    }
  }

  const handleValuesChange = () => {
    setHasChanges(true)
  }

  const handleSave = async (values: SystemSettings) => {
    try {
      await updateSettings(values)
      setHasChanges(false)
      message.success('设置保存成功')
    } catch (error) {
      message.error('保存设置失败')
    }
  }

  const handleTestEmail = async () => {
    const emailConfig = form.getFieldValue('notification')
    if (!emailConfig || !emailConfig.email_enabled) {
      message.warning('请先启用邮件通知并配置相关参数')
      return
    }

    try {
      await testEmail({
        smtp_server: emailConfig.email_smtp_server,
        smtp_port: emailConfig.email_smtp_port,
        username: emailConfig.email_username,
        password: emailConfig.email_password,
        recipients: emailConfig.email_recipients
      })
      message.success('邮件测试成功')
    } catch (error) {
      message.error('邮件测试失败')
    }
  }

  const handleTestSms = async () => {
    const smsConfig = form.getFieldValue('notification')
    if (!smsConfig || !smsConfig.sms_enabled) {
      message.warning('请先启用短信通知并配置相关参数')
      return
    }

    try {
      await testSms({
        api_key: smsConfig.sms_api_key,
        recipients: smsConfig.sms_recipients
      })
      message.success('短信测试成功')
    } catch (error) {
      message.error('短信测试失败')
    }
  }

  const handleReset = () => {
    Modal.confirm({
      title: '重置设置',
      content: '确定要重置所有设置为默认值吗？此操作不可撤销。',
      onOk: async () => {
        try {
          await resetToDefaults()
          message.success('设置已重置为默认值')
          setHasChanges(false)
        } catch (error) {
          message.error('重置设置失败')
        }
      }
    })
  }

  // 表单提交处理
  const onFinish = (values: SystemSettings) => {
    handleSave(values)
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <Title level={2} className="mb-2">系统设置</Title>
          <Text type="secondary">
            配置系统参数和运行策略
          </Text>
        </div>
        <Space>
          {hasChanges && (
            <Alert
              message="有未保存的更改"
              type="warning"
              showIcon
              className="mr-4"
            />
          )}
          <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading}>
            刷新
          </Button>
          <Button icon={<SettingOutlined />} onClick={handleReset}>
            重置默认
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={() => form.submit()}
            disabled={!hasChanges}
            loading={loading}
          >
            保存设置
          </Button>
        </Space>
      </div>

      {/* 系统信息卡片 */}
      {systemInfo && (
        <Card>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <Statistic
                title="系统版本"
                value={systemInfo.version}
                prefix={<ThunderboltOutlined />}
              />
            </Col>
            <Col xs={24} sm={8}>
              <Statistic
                title="运行时间"
                value={Math.round(systemInfo.uptime / 3600)}
                suffix="小时"
                prefix={<ClockCircleOutlined />}
              />
            </Col>
            <Col xs={24} sm={8}>
              <Statistic
                title="系统状态"
                value={systemInfo.health}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: systemInfo.health === 'healthy' ? '#52c41a' : '#faad14' }}
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* 设置表单 */}
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          onValuesChange={handleValuesChange}
          initialValues={{
            crawler: {
              scan_interval: 3600,
              concurrent_requests: 10,
              request_timeout: 30,
              max_retries: 3,
              user_agent: 'Mozilla/5.0 (compatible; HospitalMonitor/1.0)',
              proxy_enabled: false
            },
            notification: {
              email_enabled: false,
              sms_enabled: false,
              email_recipients: [],
              sms_recipients: []
            },
            data_retention: {
              logs_retention_days: 30,
              tenders_retention_days: 365,
              auto_cleanup_enabled: false,
              cleanup_schedule: '0 2 * * *'
            },
            api: {
              rate_limit: 1000,
              api_key_rotation_days: 30,
              debug_mode: false
            }
          }}
        >
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            {/* 爬虫配置 */}
            <TabPane 
              tab={
                <span>
                  <SecurityScanOutlined />
                  爬虫配置
                </span>
              } 
              key="crawler"
            >
              <Form.Item
                name={['crawler', 'scan_interval']}
                label="扫描间隔"
                tooltip="两次扫描之间的间隔时间(秒)"
              >
                <InputNumber
                  min={60}
                  max={86400}
                  className="w-full"
                  addonAfter="秒"
                />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name={['crawler', 'concurrent_requests']}
                    label="并发请求数"
                    tooltip="同时进行扫描的医院数量"
                  >
                    <InputNumber
                      min={1}
                      max={50}
                      className="w-full"
                      addonAfter="个"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name={['crawler', 'request_timeout']}
                    label="请求超时"
                    tooltip="单个请求的最大等待时间(秒)"
                  >
                    <InputNumber
                      min={10}
                      max={300}
                      className="w-full"
                      addonAfter="秒"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name={['crawler', 'max_retries']}
                    label="最大重试次数"
                    tooltip="请求失败后的最大重试次数"
                  >
                    <InputNumber
                      min={0}
                      max={10}
                      className="w-full"
                      addonAfter="次"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name={['crawler', 'proxy_enabled']}
                    label="启用代理"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name={['crawler', 'user_agent']}
                label="用户代理"
                tooltip="爬虫请求时使用的User-Agent"
              >
                <Input placeholder="Mozilla/5.0 (compatible; HospitalMonitor/1.0)" />
              </Form.Item>

              <Form.Item
                name={['crawler', 'proxy_url']}
                label="代理服务器"
                tooltip="HTTP代理服务器地址(可选)"
              >
                <Input placeholder="http://proxy.example.com:8080" />
              </Form.Item>
            </TabPane>

            {/* 通知配置 */}
            <TabPane 
              tab={
                <span>
                  <NotificationOutlined />
                  通知配置
                </span>
              } 
              key="notification"
            >
              <Alert
                message="通知配置说明"
                description="配置系统通知方式，包括邮件和短信提醒。当发现重要招投标或系统异常时发送通知。"
                type="info"
                showIcon
                className="mb-4"
              />

              <Divider>邮件通知</Divider>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name={['notification', 'email_enabled']}
                    label="启用邮件通知"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Button
                    type="dashed"
                    icon={<TestTubeOutlined />}
                    onClick={handleTestEmail}
                    disabled={!form.getFieldValue('notification')?.email_enabled}
                  >
                    测试邮件
                  </Button>
                </Col>
              </Row>

              <Form.Item
                name={['notification', 'email_smtp_server']}
                label="SMTP服务器"
                tooltip="邮件发送服务器地址"
              >
                <Input placeholder="smtp.gmail.com" />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name={['notification', 'email_smtp_port']}
                    label="SMTP端口"
                  >
                    <InputNumber
                      min={1}
                      max={65535}
                      className="w-full"
                      addonAfter="端口"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name={['notification', 'email_username']}
                    label="邮箱用户名"
                  >
                    <Input placeholder="your-email@gmail.com" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name={['notification', 'email_password']}
                label="邮箱密码或应用密码"
              >
                <Input.Password placeholder="请输入邮箱密码" />
              </Form.Item>

              <Form.Item
                name={['notification', 'email_recipients']}
                label="邮件接收者"
                tooltip="接收通知邮件的邮箱地址"
              >
                <Select
                  mode="tags"
                  placeholder="输入邮箱地址，按回车添加"
                  tokenSeparators={[',', ' ']}
                />
              </Form.Item>

              <Divider>短信通知</Divider>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name={['notification', 'sms_enabled']}
                    label="启用短信通知"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Button
                    type="dashed"
                    icon={<TestTubeOutlined />}
                    onClick={handleTestSms}
                    disabled={!form.getFieldValue('notification')?.sms_enabled}
                  >
                    测试短信
                  </Button>
                </Col>
              </Row>

              <Form.Item
                name={['notification', 'sms_api_key']}
                label="短信API密钥"
                tooltip="短信服务提供商的API密钥"
              >
                <Input.Password placeholder="请输入短信API密钥" />
              </Form.Item>

              <Form.Item
                name={['notification', 'sms_recipients']}
                label="短信接收者"
                tooltip="接收短信通知的手机号码"
              >
                <Select
                  mode="tags"
                  placeholder="输入手机号码，按回车添加"
                  tokenSeparators={[',', ' ']}
                />
              </Form.Item>
            </TabPane>

            {/* 数据保留 */}
            <TabPane 
              tab={
                <span>
                  <DatabaseOutlined />
                  数据保留
                </span>
              } 
              key="data_retention"
            >
              <Alert
                message="数据保留配置"
                description="配置系统日志和数据的保留期限，过期数据将被自动清理。"
                type="info"
                showIcon
                className="mb-4"
              />

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name={['data_retention', 'logs_retention_days']}
                    label="日志保留天数"
                    tooltip="系统日志的保留期限"
                  >
                    <InputNumber
                      min={1}
                      max={365}
                      className="w-full"
                      addonAfter="天"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name={['data_retention', 'tenders_retention_days']}
                    label="招投标数据保留天数"
                    tooltip="招投标数据的保留期限"
                  >
                    <InputNumber
                      min={30}
                      max={3650}
                      className="w-full"
                      addonAfter="天"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name={['data_retention', 'auto_cleanup_enabled']}
                    label="启用自动清理"
                    valuePropName="checked"
                    tooltip="是否启用自动数据清理"
                  >
                    <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name={['data_retention', 'cleanup_schedule']}
                    label="清理计划"
                    tooltip="自动清理任务的执行时间(Cron表达式)"
                  >
                    <Input placeholder="0 2 * * *" />
                  </Form.Item>
                </Col>
              </Row>

              <Alert
                message="清理计划说明"
                description="使用Cron表达式定义清理任务的执行时间。格式: 秒 分 时 日 月 星期。例如: 0 2 * * * 表示每天凌晨2点执行清理任务。"
                type="warning"
                showIcon
              />
            </TabPane>

            {/* API配置 */}
            <TabPane 
              tab={
                <span>
                  <ApiOutlined />
                  API配置
                </span>
              } 
              key="api"
            >
              <Alert
                message="API配置说明"
                description="配置系统的API接口参数和安全策略。"
                type="info"
                showIcon
                className="mb-4"
              />

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name={['api', 'rate_limit']}
                    label="API速率限制"
                    tooltip="每分钟API调用的最大次数"
                  >
                    <InputNumber
                      min={1}
                      max={10000}
                      className="w-full"
                      addonAfter="次/分钟"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name={['api', 'api_key_rotation_days']}
                    label="API密钥轮换天数"
                    tooltip="自动轮换API密钥的间隔天数"
                  >
                    <InputNumber
                      min={1}
                      max={365}
                      className="w-full"
                      addonAfter="天"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name={['api', 'debug_mode']}
                label="调试模式"
                tooltip="启用后将显示详细的调试信息"
                valuePropName="checked"
              >
                <Switch checkedChildren="开启" unCheckedChildren="关闭" />
              </Form.Item>

              {form.getFieldValue('api')?.debug_mode && (
                <Alert
                  message="调试模式已启用"
                  description="调试模式会显示详细的错误信息和请求日志，可能影响系统性能。"
                  type="warning"
                  showIcon
                  closable
                />
              )}
            </TabPane>
          </Tabs>
        </Form>
      </Card>
    </div>
  )
}

export default Settings