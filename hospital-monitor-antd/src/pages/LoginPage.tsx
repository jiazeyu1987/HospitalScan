import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Form, Input, Button, Typography, Alert, Space } from 'antd'
import { UserOutlined, LockOutlined, HospitalOutlined } from '@ant-design/icons'
import { message } from 'antd'
import type { LoginForm } from '../types'

const { Title, Text } = Typography

// 模拟登录服务
const mockLogin = async (username: string, password: string) => {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // 模拟登录逻辑
  if (username === 'admin' && password === 'admin123') {
    return {
      token: 'mock-jwt-token',
      user: {
        id: 1,
        username: 'admin',
        name: '管理员',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
  }
  
  throw new Error('用户名或密码错误')
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  const handleSubmit = async (values: LoginForm) => {
    setLoading(true)
    try {
      const result = await mockLogin(values.username, values.password)
      
      // 存储登录信息
      localStorage.setItem('auth_token', result.token)
      localStorage.setItem('user_info', JSON.stringify(result.user))
      
      message.success('登录成功')
      navigate('/dashboard')
    } catch (error: any) {
      message.error(error.message || '登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleFillDemo = () => {
    form.setFieldsValue({
      username: 'admin',
      password: 'admin123'
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* 头部 */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center">
              <HospitalOutlined className="h-8 w-8 text-white" />
            </div>
          </div>
          <Title level={2} className="mt-6 text-gray-900">
            医院监控系统
          </Title>
          <Text className="text-gray-600">
            全国医院官网扫描与招投标监控系统
          </Text>
        </div>

        {/* 登录表单 */}
        <Card className="shadow-lg">
          <Form
            form={form}
            name="login"
            onFinish={handleSubmit}
            autoComplete="off"
            size="large"
          >
            <Form.Item
              name="username"
              rules={[
                { required: true, message: '请输入用户名' }
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="用户名"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: '请输入密码' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="密码"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                className="w-full"
                loading={loading}
              >
                登录
              </Button>
            </Form.Item>
          </Form>

          {/* 演示账号提示 */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-800">
              <div className="font-medium mb-2">演示账号：</div>
              <div className="space-y-1">
                <div>用户名：admin</div>
                <div>密码：admin123</div>
              </div>
              <Button 
                type="link" 
                size="small" 
                onClick={handleFillDemo}
                className="p-0 h-auto text-blue-600 hover:text-blue-500"
              >
                点击自动填入
              </Button>
            </div>
          </div>
        </Card>

        {/* 页脚 */}
        <div className="text-center">
          <Text className="text-xs text-gray-500">
            © 2025 医院监控系统. 保留所有权利.
          </Text>
        </div>
      </div>
    </div>
  )
}

export default LoginPage