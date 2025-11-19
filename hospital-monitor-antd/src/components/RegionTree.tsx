import React, { useState, useEffect } from 'react'
import { Tree, Spin, Input, Badge, Button, Space, message } from 'antd'
import { 
  EnvironmentOutlined, 
  MedicineBoxOutlined, 
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  FolderOutlined
} from '@ant-design/icons'
import type { DataNode } from 'antd/es/tree'

// Store
import { useRegionStore, useHospitalStore } from '../store'
import type { Region } from '../types'

const { Search } = Input

// 地区树形组件
interface RegionTreeProps {
  onRegionSelect?: (region: Region) => void
  onHospitalSelect?: (hospitalId: number) => void
  onAddHospital?: (regionId: number) => void
  selectedKeys?: string[]
}

const RegionTree: React.FC<RegionTreeProps> = ({
  onRegionSelect,
  onHospitalSelect,
  onAddHospital,
  selectedKeys = []
}) => {
  const [expandedKeys, setExpandedKeys] = useState<string[]>(['0'])
  const [searchValue, setSearchValue] = useState('')
  const [autoExpandParent, setAutoExpandParent] = useState(true)
  
  const { regions, loading, fetchRegionsTree } = useRegionStore()
  const { fetchHospitals } = useHospitalStore()

  useEffect(() => {
    fetchRegionsTree()
  }, [fetchRegionsTree])

  // 转换数据为Tree组件格式
  const convertToTreeData = (regions: Region[], keyword: string = ''): DataNode[] => {
    const filterTree = (nodes: Region[]): Region[] => {
      return nodes
        .filter(node => {
          if (!keyword || node.name.includes(keyword)) {
            return true
          }
          // 如果节点本身不匹配，检查子节点
          if (node.children) {
            return filterTree(node.children).length > 0
          }
          return false
        })
        .map(node => {
          const filteredChildren = node.children ? filterTree(node.children) : []
          return {
            ...node,
            children: filteredChildren.length > 0 ? filteredChildren : undefined
          }
        })
    }

    return filterTree(regions).map(convertNodeToTreeNode)
  }

  const convertNodeToTreeNode = (region: Region): DataNode => {
    const isHospital = region.level === 4 // 假设医院级别为4
    const title = renderTreeTitle(region)

    return {
      key: String(region.id),
      title,
      isLeaf: !region.children || region.children.length === 0,
      children: region.children ? region.children.map(convertNodeToTreeNode) : [],
      ...region
    }
  }

  const renderTreeTitle = (region: Region) => {
    const isHospital = region.level === 4
    const icon = isHospital ? 
      <MedicineBoxOutlined className="text-blue-500" /> : 
      <EnvironmentOutlined className="text-green-500" />

    return (
      <div className="flex items-center justify-between py-1">
        <div className="flex items-center space-x-2">
          {icon}
          <span className="text-sm">{region.name}</span>
        </div>
        
        <div className="flex items-center space-x-1">
          {isHospital ? (
            <Badge count={region.tender_count || 0} size="small" className="text-xs" />
          ) : (
            <Badge count={region.hospital_count || 0} size="small" className="text-xs" />
          )}
        </div>
      </div>
    )
  }

  // 树节点选择处理
  const handleSelect = (selectedKeys: string[], info: any) => {
    const node = info.node as Region & DataNode
    
    if (node.level < 4) { // 地区节点
      onRegionSelect?.(node)
      // 加载该地区的医院
      fetchHospitals({ region_id: node.id })
    } else { // 医院节点
      onHospitalSelect?.(node.id)
    }
  }

  // 搜索处理
  const handleSearch = (value: string) => {
    setSearchValue(value)
    
    // 如果有搜索值，展开根节点
    if (value.trim()) {
      const expandedKeys = regions.map(region => String(region.id))
      setExpandedKeys(expandedKeys)
      setAutoExpandParent(true)
    }
  }

  // 刷新数据
  const handleRefresh = () => {
    fetchRegionsTree()
    message.success('地区数据已刷新')
  }

  const treeData = convertToTreeData(regions, searchValue)

  return (
    <div className="h-full flex flex-col bg-white rounded-lg border">
      {/* 搜索和操作栏 */}
      <div className="p-4 border-b border-gray-200">
        <Space direction="vertical" className="w-full" size="small">
          <Search
            placeholder="搜索地区或医院"
            prefix={<SearchOutlined />}
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
            allowClear
          />
          
          <div className="flex justify-between">
            <Button
              icon={<ReloadOutlined />}
              size="small"
              onClick={handleRefresh}
              loading={loading}
            >
              刷新
            </Button>
            
            {onAddHospital && (
              <Button
                icon={<PlusOutlined />}
                size="small"
                type="primary"
                onClick={() => {
                  const regionId = selectedKeys[0] ? Number(selectedKeys[0]) : 1
                  onAddHospital(regionId)
                }}
              >
                添加医院
              </Button>
            )}
          </div>
        </Space>
      </div>

      {/* 树形组件 */}
      <div className="flex-1 overflow-auto p-2">
        <Spin spinning={loading}>
          <Tree
            onExpand={(expandedKeysValue) => {
              setExpandedKeys(expandedKeysValue)
              setAutoExpandParent(false)
            }}
            expandedKeys={expandedKeys}
            autoExpandParent={autoExpandParent}
            onSelect={handleSelect}
            selectedKeys={selectedKeys}
            treeData={treeData}
            showIcon
            defaultExpandAll={false}
            height={600}
          />
        </Spin>
      </div>
    </div>
  )
}

export default RegionTree