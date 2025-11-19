import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Select,
  DatePicker,
  Row,
  Col,
  Statistic,
  Typography,
  Modal,
  Form,
  Input,
  InputNumber,
  message,
  Progress,
  Timeline,
  Alert,
  Switch
} from 'antd'
import {
  ScheduleOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  ReloadOutlined,
  PlusOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  StopOutlined,
  SettingOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { ScheduledTask } from '../types'

// Store
import { useCrawlerStore } from '../store'
import { useSchedulerStore } from '../store'

const { Title, Text } = Typography
const { Option } = Select
const { RangePicker } = DatePicker

const SchedulerPage: React.FC = () => {
  const {
    status,
    logs,
    fetchCrawlerStatus,
    fetchCrawlerLogs,
    startCrawler,
    stopCrawler,
    triggerCrawler
  } = useCrawlerStore()

  const {
    tasks,
    loading,
    fetchScheduledTasks,
    createScheduledTask,
    updateScheduledTask,
    deleteScheduledTask,
    toggleScheduledTask,
    executeScheduledTask
  } = useSchedulerStore()

  const [modalVisible, setModalVisible] = useState(false)
  const [editingTask, setEditingTask] = useState<ScheduledTask | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    try {
      await fetchScheduledTasks({ page: 1, per_page: 50 })
    } catch (error) {
      message.error('加载定时任务失败')
    }
  }

  // 表格列定义
  const columns: ColumnsType<ScheduledTask> = [
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: ScheduledTask) => (
        <div>
          <Text strong>{name}</Text>
          <div className="text-xs text-gray-500 mt-1">
            {record.description}
          </div>
        </div>
      )
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => {
        const config = {
          daily: { color: 'blue', text: '每日' },
          weekly: { color: 'green', text: '每周' },
          monthly: { color: 'orange', text: '每月' },
          custom: { color: 'purple', text: '自定义' }
        }
        return <Tag color={config[type as keyof typeof config].color}>
          {config[type as keyof typeof config].text}
        </Tag>
      }
    },
    {
      title: '执行计划',
      dataIndex: 'cron_expression',
      key: 'cron_expression',
      width: 120,
      render: (cron: string) => (
        <div>
          <Text code>{cron}</Text>
        </div>
      )
    },

    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const config = {
          active: { color: 'success', icon: <CheckCircleOutlined />, text: '正常' },
          inactive: { color: 'default', icon: <PauseCircleOutlined />, text: '已禁用' },
          running: { color: 'processing', icon: <ClockCircleOutlined />, text: '执行中' },
          error: { color: 'error', icon: <ExclamationCircleOutlined />, text: '错误' }
        }
        const item = config[status as keyof typeof config]
        return <Tag color={item.color} icon={item.icon}>{item.text}</Tag>
      }
    },
    {
      title: '下次执行',
      dataIndex: 'next_run',
      key: 'next_run',
      width: 150,
      render: (time: string) => time ? (
        <div>
          <div>{time.split(' ')[0]}</div>
          <div className="text-xs text-gray-500">{time.split(' ')[1]}</div>
        </div>
      ) : (
        <Text type="secondary">未设置</Text>
      )
    },
    {
      title: '成功率',
      key: 'success_rate',
      width: 120,
      render: (_, record: ScheduledTask) => {
        const total = record.success_count + record.failure_count
        const rate = total > 0 ? Math.round((record.success_count / total) * 100) : 0
        return (
          <div>
            <Progress percent={rate} size="small" />
            <div className="text-xs text-gray-500 mt-1">
              {record.success_count}/{total}
            </div>
          </div>
        )
      }
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_, record: ScheduledTask) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Button
            size="small"
            icon={record.enabled ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            onClick={() => handleToggleStatus(record)}
          />
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          />
        </Space>
      )
    }
  ]

  // 操作处理
  const handleEdit = (task: ScheduledTask) => {
    setEditingTask(task)
    form.setFieldsValue(task)
    setModalVisible(true)
  }

  const handleToggleStatus = async (task: ScheduledTask) => {
    try {
      await toggleScheduledTask(task.id, !task.enabled)
      message.success(`任务已${!task.enabled ? '启用' : '禁用'}`)
      await loadTasks()
    } catch (error) {
      message.error('更新任务状态失败')
    }
  }

  const handleDelete = (taskId: string) => {
    Modal.confirm({
      title: '删除任务',
      content: '确定要删除这个定时任务吗？',
      onOk: async () => {
        try {
          await deleteScheduledTask(taskId)
          message.success('任务已删除')
        } catch (error) {
          message.error('删除任务失败')
        }
      }
    })
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()
      if (editingTask) {
        await updateScheduledTask(editingTask.id, values)
        message.success('任务更新成功')
        await loadTasks()
      } else {
        await createScheduledTask({
          ...values,
          enabled: true
        })
        message.success('任务创建成功')
        await loadTasks()
      }
      setModalVisible(false)
      setEditingTask(null)
      form.resetFields()
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  const handleManualExecute = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    Modal.confirm({
      title: '手动执行任务',
      content: `确定要手动执行任务"${task.name}"吗？`,
      onOk: async () => {
        try {
          await triggerCrawler({
            hospital_ids: task.target_hospitals ? [] : undefined,
            priority: 'high'
          })
          message.success('任务执行成功')
        } catch (error) {
          message.error('任务执行失败')
        }
      }
    })
  }

  // 统计信息
  const stats = {
    total: tasks.length,
    active: tasks.filter(t => t.status === 'active').length,
    paused: tasks.filter(t => t.status === 'paused').length,
    totalHospitals: tasks.reduce((sum, task) => sum + task.target_hospitals, 0)
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <Title level={2} className="mb-2">任务调度</Title>
          <Text type="secondary">
            管理和监控定时任务执行
          </Text>
        </div>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={loadTasks}
          >
            刷新
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalVisible(true)}
          >
            新建任务
          </Button>
        </Space>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="总任务数"
              value={stats.total}
              prefix={<ScheduleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="正常运行"
              value={stats.active}
              prefix={<PlayCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="已禁用"
              value={stats.inactive}
              prefix={<PauseCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>

      </Row>

      {/* 任务列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={tasks}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 任务执行历史 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="最近执行记录">
            <Timeline
              items={[
                {
                  color: 'green',
                  children: (
                    <div>
                      <Text strong>每日医院扫描</Text>
                      <div className="text-xs text-gray-500">2024-11-18 02:00:00</div>
                      <div className="text-sm mt-1">
                        成功扫描 145/150 家医院，耗时 23 分钟
                      </div>
                    </div>
                  )
                },
                {
                  color: 'blue',
                  children: (
                    <div>
                      <Text strong>周度重点医院扫描</Text>
                      <div className="text-xs text-gray-500">2024-11-18 03:00:00</div>
                      <div className="text-sm mt-1">
                        成功扫描 48/50 家医院，耗时 12 分钟
                      </div>
                    </div>
                  )
                },
                {
                  color: 'orange',
                  children: (
                    <div>
                      <Text strong>月度数据清理</Text>
                      <div className="text-xs text-gray-500">2024-11-01 01:00:00</div>
                      <div className="text-sm mt-1">
                        清理过期日志 1,234 条，清理招投标数据 567 条
                      </div>
                    </div>
                  )
                }
              ]}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="执行统计">
            <div style={{ height: 200 }}>
              {/* 这里可以添加图表组件 */}
              <Alert
                message="统计图表"
                description="将显示任务执行的成功率、耗时趋势等统计图表"
                type="info"
                showIcon
              />
            </div>
          </Card>
        </Col>
      </Row>

      {/* 新建/编辑任务模态框 */}
      <Modal
        title={editingTask ? '编辑任务' : '新建任务'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => {
          setModalVisible(false)
          setEditingTask(null)
          form.resetFields()
        }}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="任务名称"
            rules={[{ required: true, message: '请输入任务名称' }]}
          >
            <Input placeholder="例如：每日医院扫描" />
          </Form.Item>

          <Form.Item
            name="description"
            label="任务描述"
          >
            <Input.TextArea placeholder="描述任务的用途和执行内容" rows={3} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="type"
                label="任务类型"
                rules={[{ required: true, message: '请选择任务类型' }]}
              >
                <Select placeholder="选择任务类型">
                  <Option value="daily">每日执行</Option>
                  <Option value="weekly">每周执行</Option>
                  <Option value="monthly">每月执行</Option>
                  <Option value="custom">自定义</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="target_hospitals"
                label="目标医院数"
                rules={[{ required: true, message: '请输入目标医院数' }]}
              >
                <InputNumber min={0} placeholder="0" className="w-full" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="cron_expression"
            label="Cron表达式"
            rules={[{ required: true, message: '请输入Cron表达式' }]}
            extra="使用Cron表达式定义执行时间，例如：0 2 * * * (每天凌晨2点)"
          >
            <Input placeholder="0 2 * * *" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default SchedulerPage