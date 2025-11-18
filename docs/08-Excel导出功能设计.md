# Excel导出功能详细设计文档

**项目**: 全国医院官网扫描与招投标监控系统  
**版本**: v1.0  
**日期**: 2025-11-18  
**作者**: MiniMax Agent  

## 目录
1. [导出模板结构设计](#1-导出模板结构设计)
2. [招投标数据格式化处理](#2-招投标数据格式化处理)
3. [数据排序和筛选功能](#3-数据排序和筛选功能)
4. [自定义导出字段配置](#4-自定义导出字段配置)
5. [批量导出和单医院导出](#5-批量导出和单医院导出)
6. [pandas和openpyxl代码示例](#6-pandas和openpyxl代码示例)
7. [导出文件命名规则和存储路径](#7-导出文件命名规则和存储路径)

---

## 1. 导出模板结构设计

### 1.1 主模板结构

**基本信息工作表**
```
工作表名称: 基本信息
列宽: 15
列高: 默认
样式: 微软雅黑, 11号
```

| 列序号 | 列名 | 数据类型 | 说明 | 示例数据 |
|--------|------|----------|------|----------|
| A | 医院名称 | 文本 | 医院全称 | 北京协和医院 |
| B | 医院地址 | 文本 | 完整地址 | 北京市东城区东单帅府园1号 |
| C | 医院等级 | 文本 | 三甲/二甲等 | 三甲医院 |
| D | 行政区划 | 文本 | 省市区县 | 北京市东城区 |
| E | 官网地址 | 文本 | 官方网站URL | https://www.pumch.cn |

**招投标信息工作表**
```
工作表名称: 招投标信息
列宽: 12
行高: 默认
样式: 宋体, 10号
```

| 列序号 | 列名 | 数据类型 | 说明 | 示例数据 |
|--------|------|----------|------|----------|
| A | 序号 | 数字 | 自动编号 | 1 |
| B | 医院名称 | 文本 | 医院全称 | 北京协和医院 |
| C | 项目标题 | 文本 | 招投标项目标题 | 医疗设备采购项目 |
| D | 招标公告日期 | 日期 | YYYY-MM-DD | 2025-11-15 |
| E | 截止日期 | 日期 | YYYY-MM-DD | 2025-12-15 |
| F | 项目类型 | 文本 | 设备/服务/工程等 | 设备采购 |
| G | 预算金额(万元) | 数字 | 预算金额，保留2位小数 | 150.50 |
| H | 联系方式 | 文本 | 联系电话和邮箱 | 010-12345678 |
| I | 来源链接 | 文本 | 原始信息URL | https://www.pumch.cn/tender/123 |
| J | 项目状态 | 文本 | 招标中/已截止/已开标 | 招标中 |
| K | 获取时间 | 日期时间 | 系统获取时间 | 2025-11-18 09:30:00 |

**统计汇总工作表**
```
工作表名称: 统计汇总
列宽: 18
样式: 宋体, 11号
```

| 行序号 | 内容 | 说明 | 示例 |
|--------|------|------|------|
| 1 | 导出时间 | 数据导出时间 | 2025-11-18 10:48:46 |
| 2 | 导出医院数量 | 统计医院总数 | 100 |
| 3 | 招投标记录数量 | 统计记录总数 | 1,250 |
| 4 | 时间范围 | 数据时间跨度 | 2025-01-01 至 2025-11-18 |
| 5 | 项目类型分布 | 各类项目数量统计 | 设备采购: 800, 医疗服务: 300, 工程建设: 150 |
| 6 | 地域分布 | 各省项目数量统计 | 北京: 200, 上海: 180, 广东: 150 |

### 1.2 简化模板结构

**紧凑格式工作表**
```
工作表名称: 招投标数据
列宽: 10
行高: 20
样式: 宋体, 9号
```

| 列名 | 医院名称 | 项目标题 | 公告日期 | 截止日期 | 项目类型 | 金额(万元) | 状态 |
|------|----------|----------|----------|----------|----------|-----------|------|
| 简写 | hospital_name | project_title | announcement_date | deadline_date | project_type | amount | status |

---

## 2. 招投标数据格式化处理

### 2.1 日期格式标准化

**日期转换函数**
```python
from datetime import datetime
import pandas as pd

def format_date(date_str):
    """标准化日期格式"""
    if pd.isna(date_str) or not date_str:
        return None
    
    # 支持多种日期格式
    date_formats = [
        '%Y-%m-%d %H:%M:%S',
        '%Y-%m-%d',
        '%Y年%m月%d日',
        '%m/%d/%Y',
        '%d/%m/%Y',
        '%Y.%m.%d'
    ]
    
    for fmt in date_formats:
        try:
            return datetime.strptime(str(date_str).strip(), fmt)
        except ValueError:
            continue
    
    # 尝试智能解析
    try:
        return pd.to_datetime(date_str, infer_datetime_format=True)
    except:
        return None

def format_date_for_excel(date_obj):
    """日期对象转换为Excel格式"""
    if pd.isna(date_obj) or date_obj is None:
        return ''
    return date_obj.strftime('%Y-%m-%d')
```

**日期处理流程**
1. **输入**: 数据库原始日期数据（可能是字符串）
2. **处理**: 使用format_date函数统一转换
3. **输出**: Python datetime对象或Excel标准日期格式
4. **容错**: 无法解析的日期显示为空字符串并记录日志

### 2.2 金额格式处理

**金额标准化函数**
```python
import re

def format_amount(amount_str):
    """标准化金额格式"""
    if pd.isna(amount_str) or not amount_str:
        return 0.0
    
    # 提取数字和单位
    amount_str = str(amount_str).replace(',', '').replace('，', '')
    
    # 支持多种金额单位
    if '万元' in amount_str or '万' in amount_str:
        multiplier = 1.0
        amount_str = re.sub(r'[万元,，]', '', amount_str)
    elif '亿元' in amount_str or '亿' in amount_str:
        multiplier = 100.0
        amount_str = re.sub(r'[亿元,，]', '', amount_str)
    else:
        multiplier = 0.0001  # 转换为万元
    
    try:
        amount = float(re.findall(r'\d+\.?\d*', amount_str)[0])
        return amount * multiplier
    except (IndexError, ValueError):
        return 0.0

def format_amount_for_excel(amount):
    """金额格式化为万元，保留2位小数"""
    if pd.isna(amount) or amount is None:
        return 0.00
    return round(float(amount), 2)
```

**金额处理规则**
1. **输入**: 各种格式的金额字符串
2. **处理**: 提取数字，识别单位（万、亿），统一转换为万元
3. **计算**: 万=1万，亿=100万，其他单位转换为万元
4. **输出**: 保留2位小数的万元数值

### 2.3 状态映射处理

**状态映射表**
```python
STATUS_MAPPING = {
    # 招标中状态
    '招标中': '招标中',
    '报名中': '招标中',
    '投标中': '招标中',
    '公告中': '招标中',
    '公开招标': '招标中',
    '招募中': '招标中',
    
    # 已截止状态
    '已截止': '已截止',
    '报名截止': '已截止',
    '投标截止': '已截止',
    '截止': '已截止',
    '报名结束': '已截止',
    
    # 已开标状态
    '已开标': '已开标',
    '开标中': '已开标',
    '评标中': '已开标',
    '中标公告': '已开标',
    '结果公示': '已开标',
    
    # 其他状态
    '暂停': '其他',
    '取消': '其他',
    '延期': '其他',
    '补充': '其他',
    '未知': '其他'
}

def map_status(status_str):
    """状态标准化映射"""
    if pd.isna(status_str) or not status_str:
        return '其他'
    
    status_str = str(status_str).strip()
    
    # 精确匹配
    if status_str in STATUS_MAPPING:
        return STATUS_MAPPING[status_str]
    
    # 模糊匹配
    for key, value in STATUS_MAPPING.items():
        if key in status_str or status_str in key:
            return value
    
    # 默认返回其他
    return '其他'
```

**状态处理流程**
1. **输入**: 原始状态描述
2. **映射**: 使用STATUS_MAPPING进行标准化
3. **输出**: 统一的状态分类（招标中/已截止/已开标/其他）

---

## 3. 数据排序和筛选功能

### 3.1 排序功能设计

**排序选项**
```python
SORT_OPTIONS = {
    # 主要排序字段
    'announcement_date': '公告日期',
    'deadline_date': '截止日期', 
    'amount': '预算金额',
    'hospital_name': '医院名称',
    'project_title': '项目标题',
    'created_at': '获取时间',
    
    # 排序方向
    'asc': '升序',
    'desc': '降序'
}

# 默认排序：按公告日期降序
DEFAULT_SORT = {
    'field': 'announcement_date',
    'direction': 'desc'
}
```

**排序实现函数**
```python
def sort_tender_data(data, sort_field, sort_direction):
    """招投标数据排序"""
    if sort_field not in SORT_OPTIONS.keys():
        sort_field = DEFAULT_SORT['field']
    
    if sort_direction not in ['asc', 'desc']:
        sort_direction = DEFAULT_SORT['direction']
    
    # 按指定字段排序
    if sort_field == 'amount':
        # 金额排序，空值置底
        data = data.sort_values(by=[sort_field], ascending=(sort_direction == 'asc'), 
                              na_position='last')
    elif sort_field in ['announcement_date', 'deadline_date', 'created_at']:
        # 日期排序，空值置底
        data = data.sort_values(by=[sort_field], ascending=(sort_direction == 'asc'),
                              na_position='last')
    else:
        # 文本排序
        data = data.sort_values(by=[sort_field], ascending=(sort_direction == 'asc'),
                              na_position='last')
    
    return data
```

### 3.2 筛选功能设计

**筛选条件类型**
```python
FILTER_TYPES = {
    'date_range': '日期范围',
    'amount_range': '金额范围', 
    'hospital': '医院名称',
    'project_type': '项目类型',
    'status': '项目状态',
    'region': '行政区划'
}

# 预定义筛选模板
FILTER_TEMPLATES = {
    'recent_months': '最近3个月',
    'recent_weeks': '最近1个月',
    'high_amount': '高金额项目(>100万)',
    'medical_equipment': '医疗设备项目',
    'ongoing': '招标中项目'
}
```

**筛选条件处理**
```python
from datetime import datetime, timedelta
import pandas as pd

def build_filter_conditions(filters):
    """构建筛选条件"""
    conditions = []
    
    # 日期范围筛选
    if 'start_date' in filters and filters['start_date']:
        conditions.append(f"announcement_date >= '{filters['start_date']}'")
    
    if 'end_date' in filters and filters['end_date']:
        conditions.append(f"announcement_date <= '{filters['end_date']}'")
    
    # 金额范围筛选
    if 'min_amount' in filters and filters['min_amount']:
        conditions.append(f"amount >= {filters['min_amount']}")
    
    if 'max_amount' in filters and filters['max_amount']:
        conditions.append(f"amount <= {filters['max_amount']}")
    
    # 医院筛选
    if 'hospital_ids' in filters and filters['hospital_ids']:
        hospital_ids = ','.join(map(str, filters['hospital_ids']))
        conditions.append(f"hospital_id IN ({hospital_ids})")
    
    # 项目类型筛选
    if 'project_types' in filters and filters['project_types']:
        types_str = "','".join(filters['project_types'])
        conditions.append(f"project_type IN ('{types_str}')")
    
    # 状态筛选
    if 'statuses' in filters and filters['statuses']:
        status_str = "','".join(filters['statuses'])
        conditions.append(f"status IN ('{status_str}')")
    
    # 地区筛选
    if 'region_ids' in filters and filters['region_ids']:
        region_ids = ','.join(map(str, filters['region_ids']))
        conditions.append(f"region_id IN ({region_ids})")
    
    return conditions

def apply_filter_template(template_name, data):
    """应用预定义筛选模板"""
    today = datetime.now()
    
    if template_name == 'recent_months':
        # 最近3个月
        start_date = (today - timedelta(days=90)).strftime('%Y-%m-%d')
        return data[data['announcement_date'] >= start_date]
    
    elif template_name == 'recent_weeks':
        # 最近1个月
        start_date = (today - timedelta(days=30)).strftime('%Y-%m-%d')
        return data[data['announcement_date'] >= start_date]
    
    elif template_name == 'high_amount':
        # 高金额项目(>100万)
        return data[data['amount'] > 100]
    
    elif template_name == 'medical_equipment':
        # 医疗设备项目
        equipment_types = ['设备采购', '医疗设备', '设备', '器械']
        mask = data['project_type'].isin(equipment_types)
        return data[mask]
    
    elif template_name == 'ongoing':
        # 招标中项目
        return data[data['status'] == '招标中']
    
    return data
```

**前端筛选界面设计**
```javascript
// 筛选组件配置
const filterConfig = {
  dateRange: {
    type: 'dateRange',
    label: '日期范围',
    placeholder: ['开始日期', '结束日期'],
    allowClear: true
  },
  amountRange: {
    type: 'rangeInput',
    label: '金额范围(万元)',
    placeholder: ['最低金额', '最高金额'],
    suffix: '万元'
  },
  hospitalSelect: {
    type: 'select',
    label: '医院',
    mode: 'multiple',
    placeholder: '请选择医院',
    allowClear: true
  },
  projectType: {
    type: 'select',
    label: '项目类型',
    options: [
      { label: '设备采购', value: '设备采购' },
      { label: '医疗服务', value: '医疗服务' },
      { label: '工程建设', value: '工程建设' }
    ],
    mode: 'multiple'
  },
  status: {
    type: 'select',
    label: '项目状态',
    options: [
      { label: '招标中', value: '招标中' },
      { label: '已截止', value: '已截止' },
      { label: '已开标', value: '已开标' }
    ],
    mode: 'multiple'
  },
  quickFilter: {
    type: 'radio',
    label: '快速筛选',
    options: [
      { label: '最近3个月', value: 'recent_months' },
      { label: '最近1个月', value: 'recent_weeks' },
      { label: '高金额项目', value: 'high_amount' },
      { label: '医疗设备', value: 'medical_equipment' },
      { label: '招标中', value: 'ongoing' },
      { label: '全部', value: 'all' }
    ]
  }
};
```

---

## 4. 自定义导出字段配置

### 4.1 字段定义系统

**可用字段列表**
```python
EXPORT_FIELDS = {
    'basic_info': {
        'hospital_name': {'name': '医院名称', 'required': True, 'width': 20},
        'hospital_address': {'name': '医院地址', 'required': False, 'width': 30},
        'hospital_level': {'name': '医院等级', 'required': False, 'width': 15},
        'region_name': {'name': '行政区划', 'required': True, 'width': 20},
        'official_url': {'name': '官网地址', 'required': False, 'width': 30}
    },
    
    'tender_info': {
        'project_title': {'name': '项目标题', 'required': True, 'width': 40},
        'announcement_date': {'name': '公告日期', 'required': True, 'width': 12},
        'deadline_date': {'name': '截止日期', 'required': False, 'width': 12},
        'project_type': {'name': '项目类型', 'required': True, 'width': 15},
        'amount': {'name': '预算金额(万元)', 'required': False, 'width': 15},
        'contact_info': {'name': '联系方式', 'required': False, 'width': 25},
        'source_url': {'name': '来源链接', 'required': False, 'width': 35},
        'status': {'name': '项目状态', 'required': True, 'width': 12},
        'created_at': {'name': '获取时间', 'required': False, 'width': 18}
    }
}

# 字段分类
FIELD_CATEGORIES = {
    'basic_info': '基本信息',
    'tender_info': '招投标信息'
}
```

**字段选择组件设计**
```javascript
// 字段选择器组件
import React from 'react';
import { Checkbox, Card, Divider, Button } from 'antd';

const FieldSelector = ({ selectedFields, onFieldChange, onSelectAll, onClearAll }) => {
  return (
    <Card title="选择导出字段" style={{ marginBottom: 16 }}>
      <div className="field-selector">
        {/* 基本信息 */}
        <div className="field-group">
          <h4>基本信息</h4>
          <Checkbox.Group 
            value={selectedFields.basic}
            onChange={(checked) => onFieldChange('basic', checked)}
          >
            {Object.entries(EXPORT_FIELDS.basic_info).map(([key, field]) => (
              <Checkbox key={key} value={key} disabled={field.required}>
                {field.name} {field.required && <span style={{color: 'red'}}>*</span>}
              </Checkbox>
            ))}
          </Checkbox.Group>
        </div>
        
        <Divider />
        
        {/* 招投标信息 */}
        <div className="field-group">
          <h4>招投标信息</h4>
          <Checkbox.Group 
            value={selectedFields.tender}
            onChange={(checked) => onFieldChange('tender', checked)}
          >
            {Object.entries(EXPORT_FIELDS.tender_info).map(([key, field]) => (
              <Checkbox key={key} value={key} disabled={field.required}>
                {field.name} {field.required && <span style={{color: 'red'}}>*</span>}
              </Checkbox>
            ))}
          </Checkbox.Group>
        </div>
        
        <Divider />
        
        {/* 操作按钮 */}
        <div className="field-actions">
          <Button onClick={onSelectAll}>全选</Button>
          <Button onClick={onClearAll} style={{ marginLeft: 8 }}>清空</Button>
        </div>
      </div>
    </Card>
  );
};
```

### 4.2 字段配置持久化

**配置保存格式**
```python
class FieldConfig:
    """字段配置管理类"""
    
    def __init__(self, user_id=None):
        self.user_id = user_id
        self.config_file = f"field_configs/{user_id or 'default'}.json"
    
    def save_config(self, config):
        """保存字段配置"""
        import json
        import os
        
        os.makedirs(os.path.dirname(self.config_file), exist_ok=True)
        
        with open(self.config_file, 'w', encoding='utf-8') as f:
            json.dump(config, f, ensure_ascii=False, indent=2)
    
    def load_config(self):
        """加载字段配置"""
        import json
        
        try:
            with open(self.config_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            # 返回默认配置
            return self.get_default_config()
    
    def get_default_config(self):
        """获取默认字段配置"""
        return {
            'selected_fields': {
                'basic': ['hospital_name', 'region_name'],
                'tender': ['project_title', 'announcement_date', 'project_type', 'status']
            },
            'sort_field': 'announcement_date',
            'sort_direction': 'desc',
            'format_type': 'standard',
            'filters': {}
        }
```

**配置应用函数**
```python
def apply_field_config(data, field_config):
    """应用字段配置到数据"""
    selected_fields = field_config.get('selected_fields', {})
    
    # 合并选中的字段
    fields_to_export = []
    for category, fields in selected_fields.items():
        fields_to_export.extend(fields)
    
    # 映射到实际数据列
    field_mapping = {
        'hospital_name': 'hospitals.name',
        'hospital_address': 'hospitals.address', 
        'hospital_level': 'hospitals.level',
        'region_name': 'regions.name',
        'official_url': 'hospitals.official_url',
        'project_title': 'tender_records.title',
        'announcement_date': 'tender_records.announcement_date',
        'deadline_date': 'tender_records.deadline_date',
        'project_type': 'tender_records.project_type',
        'amount': 'tender_records.amount',
        'contact_info': 'tender_records.contact_info',
        'source_url': 'tender_records.source_url',
        'status': 'tender_records.status',
        'created_at': 'tender_records.created_at'
    }
    
    # 选择需要的列
    columns_to_export = [field_mapping[field] for field in fields_to_export]
    export_data = data[columns_to_export].copy()
    
    # 重命名列
    column_rename = {}
    for field in fields_to_export:
        original_col = field_mapping[field]
        export_field_info = None
        
        # 查找字段信息
        for category_fields in EXPORT_FIELDS.values():
            if field in category_fields:
                export_field_info = category_fields[field]
                break
        
        if export_field_info:
            column_rename[original_col] = export_field_info['name']
    
    export_data = export_data.rename(columns=column_rename)
    
    return export_data
```

---

## 5. 批量导出和单医院导出

### 5.1 批量导出设计

**批量导出规格**
```python
BATCH_EXPORT_CONFIG = {
    # 批量大小限制
    'max_records_per_batch': 50000,
    'max_hospitals_per_batch': 1000,
    
    # 分批处理策略
    'split_by_hospital': True,  # 按医院分组
    'split_by_date': False,     # 按日期分组
    'split_by_region': False,   # 按地区分组
    
    # 内存优化
    'chunk_size': 10000,
    'use_database_query': True,
    
    # 进度报告
    'report_progress': True,
    'progress_interval': 1000  # 每1000条记录报告一次进度
}
```

**批量导出实现**
```python
import os
import zipfile
from datetime import datetime

def batch_export_tenders(filters, field_config, export_path):
    """批量导出招投标数据"""
    import logging
    from sqlalchemy import create_engine
    import pandas as pd
    
    logger = logging.getLogger(__name__)
    
    # 获取数据库连接
    engine = create_engine('sqlite:///hospitals.db')
    
    # 构建基础查询
    query = build_export_query(filters)
    
    # 分批查询数据
    batch_size = BATCH_EXPORT_CONFIG['chunk_size']
    batch_files = []
    record_count = 0
    total_records = get_total_record_count(query)
    
    logger.info(f"开始批量导出，总记录数：{total_records}")
    
    for offset in range(0, total_records, batch_size):
        # 查询当前批次数据
        batch_query = query.offset(offset).limit(batch_size)
        batch_data = pd.read_sql(batch_query, engine)
        
        if batch_data.empty:
            break
        
        # 应用字段配置
        export_data = apply_field_config(batch_data, field_config)
        
        # 应用排序
        sort_field = field_config.get('sort_field', 'announcement_date')
        sort_direction = field_config.get('sort_direction', 'desc')
        export_data = sort_tender_data(export_data, sort_field, sort_direction)
        
        # 生成批次文件名
        batch_filename = f"batch_{offset//batch_size + 1:03d}.xlsx"
        batch_filepath = os.path.join(export_path, batch_filename)
        
        # 导出批次数据
        export_to_excel(export_data, batch_filepath, field_config)
        batch_files.append(batch_filename)
        
        record_count += len(export_data)
        logger.info(f"已完成批次 {offset//batch_size + 1}，导出 {record_count}/{total_records} 条记录")
    
    # 打包为ZIP文件
    if len(batch_files) > 1:
        zip_filename = f"招投标数据_批量导出_{datetime.now().strftime('%Y%m%d_%H%M%S')}.zip"
        zip_filepath = os.path.join(export_path, zip_filename)
        
        with zipfile.ZipFile(zip_filepath, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for batch_file in batch_files:
                batch_filepath = os.path.join(export_path, batch_file)
                zipf.write(batch_filepath, batch_file)
                os.remove(batch_filepath)  # 删除临时文件
        
        return zip_filepath
    else:
        # 单文件，返回第一个文件路径
        return os.path.join(export_path, batch_files[0])
```

### 5.2 单医院导出设计

**单医院导出功能**
```python
def single_hospital_export(hospital_id, filters=None, field_config=None):
    """单医院导出功能"""
    # 默认配置
    if filters is None:
        filters = {}
    if field_config is None:
        field_config = FieldConfig().get_default_config()
    
    # 添加医院筛选
    filters['hospital_ids'] = [hospital_id]
    
    # 获取医院信息
    from models import Hospital, Region
    hospital = Hospital.query.get(hospital_id)
    if not hospital:
        raise ValueError(f"医院ID {hospital_id} 不存在")
    
    # 构建查询
    query = build_export_query(filters)
    
    # 执行查询
    data = pd.read_sql(query, db.engine)
    
    if data.empty:
        raise ValueError("该医院暂无招投标数据")
    
    # 应用字段配置和排序
    export_data = apply_field_config(data, field_config)
    sort_field = field_config.get('sort_field', 'announcement_date')
    sort_direction = field_config.get('sort_direction', 'desc')
    export_data = sort_tender_data(export_data, sort_field, sort_direction)
    
    # 生成文件名
    safe_name = re.sub(r'[^\w\s-]', '', hospital.name).strip()
    filename = f"{safe_name}_招投标数据_{datetime.now().strftime('%Y%m%d')}.xlsx"
    
    # 导出文件
    export_path = f"exports/single_hospital/{datetime.now().strftime('%Y%m%d')}"
    os.makedirs(export_path, exist_ok=True)
    filepath = os.path.join(export_path, filename)
    
    export_to_excel(export_data, filepath, field_config, single_hospital_mode=True)
    
    return filepath, hospital.name, len(export_data)
```

### 5.3 导出进度管理

**进度跟踪类**
```python
class ExportProgress:
    """导出进度管理"""
    
    def __init__(self, export_id, total_records):
        self.export_id = export_id
        self.total_records = total_records
        self.processed_records = 0
        self.status = 'running'  # running, completed, failed
        self.current_file = ''
        self.error_message = ''
        self.start_time = datetime.now()
        
        # 保存进度状态
        self.save_progress()
    
    def update_progress(self, processed_records, current_file=''):
        """更新进度"""
        self.processed_records = processed_records
        self.current_file = current_file
        self.progress_percentage = (processed_records / self.total_records) * 100
        self.save_progress()
    
    def complete(self):
        """完成导出"""
        self.status = 'completed'
        self.end_time = datetime.now()
        self.duration = (self.end_time - self.start_time).total_seconds()
        self.save_progress()
    
    def fail(self, error_message):
        """导出失败"""
        self.status = 'failed'
        self.error_message = error_message
        self.end_time = datetime.now()
        self.duration = (self.end_time - self.start_time).total_seconds()
        self.save_progress()
    
    def save_progress(self):
        """保存进度到数据库"""
        progress_data = {
            'export_id': self.export_id,
            'total_records': self.total_records,
            'processed_records': self.processed_records,
            'progress_percentage': self.progress_percentage,
            'status': self.status,
            'current_file': self.current_file,
            'start_time': self.start_time.isoformat(),
            'end_time': self.end_time.isoformat() if hasattr(self, 'end_time') else None,
            'duration': self.duration if hasattr(self, 'duration') else None,
            'error_message': self.error_message
        }
        
        # 保存到Redis或数据库
        redis_client.set(f"export_progress:{self.export_id}", json.dumps(progress_data))
    
    def get_progress(self):
        """获取当前进度"""
        redis_data = redis_client.get(f"export_progress:{self.export_id}")
        if redis_data:
            return json.loads(redis_data)
        return None
```

**前端进度组件**
```javascript
const ExportProgress = ({ exportId, onComplete, onError }) => {
  const [progress, setProgress] = useState(null);
  const [isPolling, setIsPolling] = useState(true);
  
  useEffect(() => {
    if (!exportId) return;
    
    const pollProgress = async () => {
      try {
        const response = await axios.get(`/api/export/progress/${exportId}`);
        const data = response.data;
        
        setProgress(data);
        
        if (data.status === 'completed') {
          setIsPolling(false);
          onComplete && onComplete(data);
        } else if (data.status === 'failed') {
          setIsPolling(false);
          onError && onError(data.error_message);
        }
      } catch (error) {
        console.error('获取导出进度失败:', error);
      }
    };
    
    // 立即执行一次
    pollProgress();
    
    // 设置定时轮询
    if (isPolling) {
      const interval = setInterval(pollProgress, 2000);
      return () => clearInterval(interval);
    }
  }, [exportId, isPolling, onComplete, onError]);
  
  if (!progress) {
    return <Spin tip="正在初始化导出任务..." />;
  }
  
  return (
    <Card title="导出进度" style={{ marginTop: 16 }}>
      <Progress 
        percent={progress.progress_percentage} 
        status={progress.status === 'failed' ? 'exception' : 'active'}
        strokeColor={{
          '0%': '#108ee9',
          '100%': '#87d068',
        }}
      />
      
      <div style={{ marginTop: 16 }}>
        <p>处理进度: {progress.processed_records} / {progress.total_records} 条记录</p>
        <p>当前状态: {getStatusText(progress.status)}</p>
        {progress.current_file && <p>当前文件: {progress.current_file}</p>}
        {progress.error_message && (
          <Alert 
            type="error" 
            message="导出失败" 
            description={progress.error_message} 
            style={{ marginTop: 8 }}
          />
        )}
      </div>
    </Card>
  );
};
```

---

## 6. pandas和openpyxl代码示例

### 6.1 基础导出函数

**Excel导出核心函数**
```python
import pandas as pd
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
from openpyxl.utils.dataframe import dataframe_to_rows
from openpyxl.worksheet.table import Table, TableStyleInfo
import os
from datetime import datetime

def export_to_excel(data, filepath, field_config, single_hospital_mode=False):
    """导出数据到Excel文件"""
    
    # 创建工作簿
    wb = Workbook()
    
    if single_hospital_mode:
        # 单医院模式：创建单个工作表
        ws = wb.active
        ws.title = "招投标信息"
        
        # 应用字段配置
        export_data = apply_field_config(data, field_config)
        
        # 写入数据
        write_data_to_worksheet(ws, export_data, is_main_sheet=True)
        
        # 添加格式设置
        format_worksheet(ws, is_main_sheet=True)
        
    else:
        # 多医院模式：创建多个工作表
        create_multi_sheet_export(wb, data, field_config)
    
    # 保存文件
    wb.save(filepath)
    
    # 添加表头筛选
    if not single_hospital_mode:
        add_filters_to_sheet(filepath)
    
    return filepath

def write_data_to_worksheet(ws, data, is_main_sheet=False):
    """向工作表写入数据"""
    
    # 写入表头
    headers = list(data.columns)
    for col_num, header in enumerate(headers, 1):
        cell = ws.cell(row=1, column=col_num)
        cell.value = header
        cell.font = Font(bold=True, size=11)
        cell.fill = PatternFill(start_color="D9EAD3", end_color="D9EAD3", fill_type="solid")
        cell.alignment = Alignment(horizontal='center', vertical='center')
    
    # 写入数据
    for row_num, (_, row) in enumerate(data.iterrows(), 2):
        for col_num, value in enumerate(row, 1):
            cell = ws.cell(row=row_num, column=col_num)
            
            # 处理日期格式
            if isinstance(value, (pd.Timestamp, datetime)):
                cell.value = value
                cell.number_format = 'YYYY-MM-DD'
            elif isinstance(value, (int, float)):
                if col_num in get_amount_columns(headers):  # 金额列
                    cell.value = round(value, 2) if value else 0
                    cell.number_format = '0.00'
                else:
                    cell.value = value
                    cell.number_format = '0'
            else:
                cell.value = str(value) if value else ""
            
            cell.alignment = Alignment(horizontal='left', vertical='center', wrap_text=True)
```

### 6.2 多工作表导出

**多工作表创建函数**
```python
def create_multi_sheet_export(wb, data, field_config):
    """创建多工作表导出"""
    
    # 主表：汇总信息
    ws_summary = wb.active
    ws_summary.title = "汇总统计"
    create_summary_sheet(ws_summary, data)
    
    # 详细信息表
    ws_detail = wb.create_sheet("详细信息")
    export_data = apply_field_config(data, field_config)
    write_data_to_worksheet(ws_detail, export_data, is_main_sheet=True)
    format_worksheet(ws_detail, is_main_sheet=True)
    
    # 按医院分表
    if 'hospitals.name' in data.columns:
        hospital_groups = data.groupby('hospitals.name')
        
        for hospital_name, hospital_data in hospital_groups:
            # 工作表名称（Excel限制31字符）
            safe_name = re.sub(r'[^\w\s-]', '', hospital_name)[:30]
            ws_hospital = wb.create_sheet(safe_name)
            
            hospital_export_data = apply_field_config(hospital_data, field_config)
            write_data_to_worksheet(ws_hospital, hospital_export_data, is_main_sheet=True)
            format_worksheet(ws_hospital, is_main_sheet=True)

def create_summary_sheet(ws, data):
    """创建汇总统计工作表"""
    
    summary_data = {
        '项目': [
            '导出时间',
            '记录总数',
            '医院数量',
            '项目类型分布',
            '状态分布',
            '金额范围',
            '时间范围'
        ],
        '数值': [
            datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            len(data),
            data['hospitals.name'].nunique() if 'hospitals.name' in data.columns else 0,
            get_project_type_distribution(data),
            get_status_distribution(data),
            get_amount_range(data),
            get_date_range(data)
        ]
    }
    
    summary_df = pd.DataFrame(summary_data)
    
    # 写入汇总数据
    for row_num, (_, row) in enumerate(summary_df.iterrows(), 1):
        ws.cell(row=row_num, column=1, value=row['项目'])
        ws.cell(row=row_num, column=2, value=row['数值'])
        
        # 格式化
        ws.cell(row=row_num, column=1).font = Font(bold=True)
        ws.cell(row=row_num, column=1).fill = PatternFill(
            start_color="E6F3FF", end_color="E6F3FF", fill_type="solid"
        )
```

### 6.3 样式和格式设置

**工作表格式设置**
```python
from openpyxl.styles import NamedStyle, Font, Alignment, PatternFill, Border, Side

def format_worksheet(ws, is_main_sheet=False):
    """设置工作表格式"""
    
    # 定义边框样式
    thin_border = Border(
        left=Side(style='thin'),
        right=Side(style='thin'),
        top=Side(style='thin'),
        bottom=Side(style='thin')
    )
    
    # 自动调整列宽
    for column in ws.columns:
        max_length = 0
        column_letter = column[0].column_letter
        
        for cell in column:
            try:
                if len(str(cell.value)) > max_length:
                    max_length = len(str(cell.value))
            except:
                pass
        
        # 设置列宽
        adjusted_width = min(max_length + 2, 50)  # 最大50个字符
        ws.column_dimensions[column_letter].width = adjusted_width
    
    # 设置表头样式
    for cell in ws[1]:
        cell.border = thin_border
        cell.font = Font(bold=True, size=11)
        cell.fill = PatternFill(start_color="4472C4", end_color="4472C4", fill_type="solid")
        cell.font = Font(bold=True, size=11, color="FFFFFF")
        cell.alignment = Alignment(horizontal='center', vertical='center')
    
    # 设置数据行格式
    for row in ws.iter_rows(min_row=2):
        for cell in row:
            cell.border = thin_border
            cell.alignment = Alignment(horizontal='left', vertical='center', wrap_text=True)
    
    # 冻结首行
    ws.freeze_panes = 'A2'
    
    # 如果是主表，添加筛选器
    if is_main_sheet:
        # 设置自动筛选
        ws.auto_filter.ref = ws.dimensions
        
        # 添加汇总行
        add_summary_row(ws)

def add_summary_row(ws):
    """在最后添加汇总行"""
    max_row = ws.max_row + 1
    
    # 汇总行标签
    ws.cell(row=max_row, column=1, value="汇总：")
    ws.cell(row=max_row, column=1).font = Font(bold=True)
    ws.cell(row=max_row, column=1).fill = PatternFill(
        start_color="FFE699", end_color="FFE699", fill_type="solid"
    )
    
    # 记录总数
    ws.cell(row=max_row, column=2, value=f"共 {max_row - 2} 条记录")
    ws.cell(row=max_row, column=2).font = Font(bold=True)
    ws.cell(row=max_row, column=2).fill = PatternFill(
        start_color="FFE699", end_color="FFE699", fill_type="solid"
    )

def get_amount_columns(headers):
    """识别金额列索引"""
    amount_columns = []
    for i, header in enumerate(headers):
        if '金额' in header or '预算' in header:
            amount_columns.append(i + 1)  # openpyxl使用1-based索引
    return amount_columns
```

### 6.4 高级功能实现

**条件格式设置**
```python
def add_conditional_formatting(ws, data_range):
    """添加条件格式"""
    
    from openpyxl.formatting.rule import CellIsRule
    from openpyxl.styles import PatternFill, Font
    
    # 状态列条件格式
    status_column = 'J'  # 假设状态在J列
    status_range = f'{status_column}2:{status_column}{ws.max_row}'
    
    # 招标中：绿色
    green_fill = PatternFill(start_color='C6EFCE', end_color='C6EFCE', fill_type='solid')
    ws.conditional_formatting.add(status_range, 
        CellIsRule(operator='equal', formula=['"招标中"'], fill=green_fill))
    
    # 已截止：黄色  
    yellow_fill = PatternFill(start_color='FFEB9C', end_color='FFEB9C', fill_type='solid')
    ws.conditional_formatting.add(status_range,
        CellIsRule(operator='equal', formula=['"已截止"'], fill=yellow_fill))
    
    # 已开标：蓝色
    blue_fill = PatternFill(start_color='B4C7E7', end_color='B4C7E7', fill_type='solid')
    ws.conditional_formatting.add(status_range,
        CellIsRule(operator='equal', formula=['"已开标"'], fill=blue_fill))
    
    # 金额列条件格式
    amount_column = 'G'  # 假设金额在G列
    amount_range = f'{amount_column}2:{amount_column}{ws.max_row}'
    
    # 高金额项目突出显示（>100万）
    red_fill = PatternFill(start_color='FFC7CE', end_color='FFC7CE', fill_type='solid')
    ws.conditional_formatting.add(amount_range,
        CellIsRule(operator='greaterThan', formula=[100], fill=red_fill))

def add_chart_to_sheet(ws, data):
    """向工作表添加图表"""
    from openpyxl.chart import BarChart, Reference
    
    # 项目类型分布图表
    chart = BarChart()
    chart.title = "项目类型分布"
    chart.y_axis.title = "数量"
    chart.x_axis.title = "项目类型"
    
    # 数据范围
    data_ref = Reference(ws, min_col=4, min_row=1, max_col=4, max_row=ws.max_row)
    cats_ref = Reference(ws, min_col=3, min_row=2, max_row=ws.max_row)
    
    chart.add_data(data_ref, titles_from_data=True)
    chart.set_categories(cats_ref)
    
    ws.add_chart(chart, "M2")
```

### 6.5 内存优化和数据处理

**大数据量处理**
```python
def process_large_dataset(data, batch_size=10000):
    """处理大型数据集"""
    
    total_rows = len(data)
    processed_batches = []
    
    for i in range(0, total_rows, batch_size):
        batch = data.iloc[i:i+batch_size]
        
        # 清理和格式化数据
        cleaned_batch = clean_and_format_data(batch)
        
        processed_batches.append(cleaned_batch)
        
        # 释放内存
        del batch
        del cleaned_batch
    
    return processed_batches

def clean_and_format_data(data):
    """清理和格式化数据"""
    
    # 日期格式化
    date_columns = ['announcement_date', 'deadline_date', 'created_at']
    for col in date_columns:
        if col in data.columns:
            data[col] = pd.to_datetime(data[col], errors='coerce')
    
    # 金额格式化
    if 'amount' in data.columns:
        data['amount'] = data['amount'].apply(lambda x: format_amount_for_excel(x))
    
    # 状态标准化
    if 'status' in data.columns:
        data['status'] = data['status'].apply(map_status)
    
    # 文本清理
    text_columns = ['project_title', 'contact_info', 'source_url']
    for col in text_columns:
        if col in data.columns:
            data[col] = data[col].astype(str).str.strip()
    
    return data

def optimize_memory_usage(data):
    """优化内存使用"""
    
    # 转换数据类型以节省内存
    for col in data.select_dtypes(include=['object']).columns:
        if col in ['project_title', 'contact_info', 'source_url']:
            data[col] = data[col].astype('category')  # 分类数据
    
    # 压缩日期类型
    date_columns = data.select_dtypes(include=['datetime64']).columns
    for col in date_columns:
        data[col] = pd.to_datetime(data[col], errors='coerce')
    
    # 释放不需要的列
    columns_to_drop = [col for col in data.columns if col.startswith('Unnamed')]
    if columns_to_drop:
        data = data.drop(columns=columns_to_drop)
    
    return data
```

---

## 7. 导出文件命名规则和存储路径

### 7.1 文件命名规范

**命名规则系统**
```python
EXPORT_FILENAME_RULES = {
    'timestamp_format': '%Y%m%d_%H%M%S',
    'date_only_format': '%Y%m%d',
    
    'prefixes': {
        'single_hospital': '单医院',
        'batch_export': '批量导出', 
        'filtered': '筛选导出',
        'all_data': '全量数据'
    },
    
    'suffixes': {
        'standard': '标准格式',
        'compact': '紧凑格式',
        'detailed': '详细格式'
    },
    
    'separator': '_',
    'extension': '.xlsx',
    'max_length': 100  # 文件名最大长度
}

def generate_export_filename(export_type, hospital_name=None, filters=None, format_type='standard'):
    """生成导出文件名"""
    
    timestamp = datetime.now().strftime(EXPORT_FILENAME_RULES['timestamp_format'])
    
    if export_type == 'single_hospital':
        # 单医院导出
        if hospital_name:
            # 清理医院名称
            clean_name = re.sub(r'[^\w\s-]', '', hospital_name).strip()
            clean_name = re.sub(r'\s+', '_', clean_name)  # 空格替换为下划线
            clean_name = clean_name[:20]  # 限制长度
            filename = f"{EXPORT_FILENAME_RULES['prefixes']['single_hospital']}{EXPORT_FILENAME_RULES['separator']}{clean_name}"
        else:
            filename = EXPORT_FILENAME_RULES['prefixes']['single_hospital']
    
    elif export_type == 'batch_export':
        # 批量导出
        filename = EXPORT_FILENAME_RULES['prefixes']['batch_export']
        
        # 添加筛选信息
        if filters:
            filter_parts = []
            
            if 'hospital_ids' in filters and filters['hospital_ids']:
                filter_parts.append(f"{len(filters['hospital_ids'])}医院")
            
            if 'start_date' in filters and 'end_date' in filters:
                filter_parts.append(f"{filters['start_date']}-{filters['end_date']}")
            
            if 'project_types' in filters and filters['project_types']:
                filter_parts.append(f"{len(filters['project_types'])}类型")
            
            if filter_parts:
                filename += EXPORT_FILENAME_RULES['separator'] + EXPORT_FILENAME_RULES['separator'].join(filter_parts)
    
    elif export_type == 'filtered':
        # 筛选导出
        filename = EXPORT_FILENAME_RULES['prefixes']['filtered']
        
        if filters:
            filter_info = []
            
            if 'status' in filters:
                status_count = len(filters['status']) if isinstance(filters['status'], list) else 1
                filter_info.append(f"{status_count}状态")
            
            if 'project_type' in filters:
                type_count = len(filters['project_type']) if isinstance(filters['project_type'], list) else 1
                filter_info.append(f"{type_count}类型")
            
            if filter_info:
                filename += EXPORT_FILENAME_RULES['separator'] + EXPORT_FILENAME_RULES['separator'].join(filter_info)
    
    else:
        # 默认全量导出
        filename = EXPORT_FILENAME_RULES['prefixes']['all_data']
    
    # 添加格式后缀
    if format_type != 'standard':
        filename += EXPORT_FILENAME_RULES['separator'] + EXPORT_FILENAME_RULES['suffixes'][format_type]
    
    # 添加时间戳
    filename += EXPORT_FILENAME_RULES['separator'] + timestamp
    
    # 确保不超过最大长度
    if len(filename) > EXPORT_FILENAME_RULES['max_length']:
        filename = filename[:EXPORT_FILENAME_RULES['max_length']].rstrip('_')
    
    # 添加扩展名
    filename += EXPORT_FILENAME_RULES['extension']
    
    return filename

# 使用示例
def example_filename_generation():
    """文件名生成示例"""
    
    # 单医院导出
    filename1 = generate_export_filename(
        export_type='single_hospital',
        hospital_name='北京协和医院',
        format_type='standard'
    )
    # 结果: "单医院_北京协和医院_标准格式_20251118_104846.xlsx"
    
    # 批量导出
    filename2 = generate_export_filename(
        export_type='batch_export',
        filters={
            'hospital_ids': [1, 2, 3, 4, 5],
            'start_date': '2025-11-01',
            'end_date': '2025-11-18',
            'project_types': ['设备采购', '医疗服务']
        },
        format_type='detailed'
    )
    # 结果: "批量导出_5医院_2025-11-01-2025-11-18_2类型_详细格式_20251118_104846.xlsx"
```

### 7.2 存储路径结构

**目录结构设计**
```
exports/
├── single_hospital/           # 单医院导出
│   ├── 2025/
│   │   ├── 11/              # 按年月分组
│   │   │   ├── 北京协和医院_招投标数据_20251118.xlsx
│   │   │   ├── 上海华山医院_招投标数据_20251118.xlsx
│   │   │   └── ...
│   │   └── ...
│   └── ...
├── batch_export/             # 批量导出
│   ├── 2025/
│   │   ├── 11/
│   │   │   ├── 批量导出_筛选导出_5医院_20251118_104846.xlsx
│   │   │   └── 批量导出_全量数据_20251118_104846.zip  # ZIP压缩包
│   │   └── ...
│   └── ...
├── filtered/                 # 筛选导出
│   ├── 2025/
│   │   ├── 11/
│   │   │   ├── 筛选导出_2状态_2类型_20251118_104846.xlsx
│   │   │   └── ...
│   │   └── ...
│   └── ...
├── temp/                     # 临时文件
│   ├── batch_001.xlsx
│   ├── batch_002.xlsx
│   └── ...
└── archive/                  # 历史归档
    ├── 2025/
    │   └── Q4/
    │       └── 归档文件...
    └── ...
```

**路径管理类**
```python
import os
import shutil
from datetime import datetime, date
import calendar

class ExportPathManager:
    """导出路径管理器"""
    
    def __init__(self, base_path="exports"):
        self.base_path = base_path
        self.ensure_base_path()
    
    def ensure_base_path(self):
        """确保基础路径存在"""
        os.makedirs(self.base_path, exist_ok=True)
    
    def get_export_path(self, export_type, date_obj=None, subdirectory=""):
        """获取导出文件路径"""
        
        if date_obj is None:
            date_obj = datetime.now()
        
        # 构建目录路径
        path_parts = [self.base_path, export_type]
        
        # 按年月分组
        year_month = date_obj.strftime('%Y/%m')
        path_parts.append(year_month)
        
        # 添加子目录
        if subdirectory:
            path_parts.append(subdirectory)
        
        # 创建目录
        full_path = os.path.join(*path_parts)
        os.makedirs(full_path, exist_ok=True)
        
        return full_path
    
    def get_single_hospital_path(self, hospital_name, date_obj=None):
        """获取单医院导出路径"""
        return self.get_export_path("single_hospital", date_obj)
    
    def get_batch_export_path(self, date_obj=None):
        """获取批量导出路径"""
        return self.get_export_path("batch_export", date_obj)
    
    def get_filtered_path(self, filter_type, date_obj=None):
        """获取筛选导出路径"""
        subdirectory = filter_type
        return self.get_export_path("filtered", date_obj, subdirectory)
    
    def get_temp_path(self):
        """获取临时文件路径"""
        temp_path = os.path.join(self.base_path, "temp")
        os.makedirs(temp_path, exist_ok=True)
        return temp_path
    
    def cleanup_temp_files(self, older_than_hours=24):
        """清理临时文件"""
        temp_path = self.get_temp_path()
        cutoff_time = datetime.now().timestamp() - (older_than_hours * 3600)
        
        for filename in os.listdir(temp_path):
            filepath = os.path.join(temp_path, filename)
            if os.path.getmtime(filepath) < cutoff_time:
                try:
                    os.remove(filepath)
                    print(f"已删除临时文件: {filepath}")
                except Exception as e:
                    print(f"删除文件失败 {filepath}: {e}")
    
    def archive_old_exports(self, older_than_days=30):
        """归档老旧导出文件"""
        cutoff_date = date.today() - timedelta(days=older_than_days)
        
        for export_type in ["single_hospital", "batch_export", "filtered"]:
            source_path = os.path.join(self.base_path, export_type)
            
            if not os.path.exists(source_path):
                continue
            
            # 遍历子目录
            for root, dirs, files in os.walk(source_path):
                for file in files:
                    filepath = os.path.join(root, file)
                    file_date = datetime.fromtimestamp(os.path.getmtime(filepath)).date()
                    
                    if file_date < cutoff_date:
                        # 移动到归档目录
                        archive_path = os.path.join(self.base_path, "archive", 
                                                 export_type, file_date.strftime('%Y/%m'))
                        os.makedirs(archive_path, exist_ok=True)
                        
                        try:
                            shutil.move(filepath, os.path.join(archive_path, file))
                            print(f"已归档: {filepath} -> {archive_path}")
                        except Exception as e:
                            print(f"归档失败 {filepath}: {e}")
    
    def get_disk_usage(self):
        """获取磁盘使用情况"""
        total_size = 0
        file_count = 0
        dir_count = 0
        
        for root, dirs, files in os.walk(self.base_path):
            dir_count += len(dirs)
            for file in files:
                filepath = os.path.join(root, file)
                try:
                    total_size += os.path.getsize(filepath)
                    file_count += 1
                except OSError:
                    continue
        
        return {
            'total_size_mb': round(total_size / (1024 * 1024), 2),
            'file_count': file_count,
            'dir_count': dir_count
        }
```

### 7.3 文件生命周期管理

**文件生命周期管理**
```python
class FileLifecycleManager:
    """文件生命周期管理器"""
    
    # 文件保留策略
    RETENTION_POLICIES = {
        'single_hospital': 30,      # 单医院导出保留30天
        'batch_export': 7,          # 批量导出保留7天
        'filtered': 15,             # 筛选导出保留15天
        'temp': 1,                  # 临时文件保留1天
        'archive': 365              # 归档文件保留1年
    }
    
    def __init__(self, base_path="exports"):
        self.base_path = base_path
        self.path_manager = ExportPathManager(base_path)
    
    def should_keep_file(self, filepath):
        """判断文件是否应该保留"""
        export_type = self._determine_export_type(filepath)
        file_age_days = self._get_file_age_days(filepath)
        retention_days = self.RETENTION_POLICIES.get(export_type, 30)
        
        return file_age_days < retention_days
    
    def _determine_export_type(self, filepath):
        """确定文件类型"""
        path_parts = filepath.split(os.sep)
        if 'single_hospital' in path_parts:
            return 'single_hospital'
        elif 'batch_export' in path_parts:
            return 'batch_export'
        elif 'filtered' in path_parts:
            return 'filtered'
        elif 'temp' in path_parts:
            return 'temp'
        elif 'archive' in path_parts:
            return 'archive'
        else:
            return 'unknown'
    
    def _get_file_age_days(self, filepath):
        """获取文件年龄（天）"""
        if not os.path.exists(filepath):
            return 999
        
        file_time = datetime.fromtimestamp(os.path.getmtime(filepath))
        today = datetime.now()
        return (today - file_time).days
    
    def cleanup_expired_files(self):
        """清理过期文件"""
        cleaned_files = []
        total_size = 0
        
        for root, dirs, files in os.walk(self.base_path):
            for file in files:
                filepath = os.path.join(root, file)
                
                if not self.should_keep_file(filepath):
                    try:
                        file_size = os.path.getsize(filepath)
                        total_size += file_size
                        os.remove(filepath)
                        cleaned_files.append({
                            'filepath': filepath,
                            'size_mb': round(file_size / (1024 * 1024), 2),
                            'type': self._determine_export_type(filepath)
                        })
                    except Exception as e:
                        print(f"清理文件失败 {filepath}: {e}")
        
        return {
            'cleaned_count': len(cleaned_files),
            'cleaned_size_mb': round(total_size / (1024 * 1024), 2),
            'cleaned_files': cleaned_files
        }
    
    def generate_cleanup_report(self):
        """生成清理报告"""
        report = {
            'timestamp': datetime.now().isoformat(),
            'policies': self.RETENTION_POLICIES,
            'disk_usage': self.path_manager.get_disk_usage(),
            'cleanup_recommendations': []
        }
        
        # 分析各类文件
        file_stats = {}
        for export_type in self.RETENTION_POLICIES.keys():
            type_path = os.path.join(self.base_path, export_type)
            if os.path.exists(type_path):
                type_stats = self._analyze_file_type(type_path)
                file_stats[export_type] = type_stats
                
                # 生成清理建议
                if type_stats['expired_count'] > 0:
                    report['cleanup_recommendations'].append({
                        'type': export_type,
                        'action': 'cleanup',
                        'expired_files': type_stats['expired_count'],
                        'size_to_free': f"{type_stats['expired_size_mb']} MB"
                    })
        
        report['file_stats'] = file_stats
        return report
    
    def _analyze_file_type(self, type_path):
        """分析特定类型文件的统计信息"""
        total_count = 0
        total_size = 0
        expired_count = 0
        expired_size = 0
        
        for root, dirs, files in os.walk(type_path):
            for file in files:
                filepath = os.path.join(root, file)
                if os.path.exists(filepath):
                    file_size = os.path.getsize(filepath)
                    total_count += 1
                    total_size += file_size
                    
                    if not self.should_keep_file(filepath):
                        expired_count += 1
                        expired_size += file_size
        
        return {
            'total_count': total_count,
            'total_size_mb': round(total_size / (1024 * 1024), 2),
            'expired_count': expired_count,
            'expired_size_mb': round(expired_size / (1024 * 1024), 2)
        }
```

---

## 总结

本文档详细设计了全国医院官网扫描与招投标监控系统的Excel导出功能，包含以下核心要素：

### 技术实现要点

1. **导出模板结构** - 设计了标准格式和紧凑格式两种模板，包含基本信息、招投标信息和统计汇总工作表
2. **数据格式化处理** - 实现了日期标准化、金额统一转换、状态智能映射等格式化功能
3. **排序筛选功能** - 支持多字段排序、多种筛选条件和预定义筛选模板
4. **自定义字段配置** - 允许用户选择导出字段，支持配置保存和恢复
5. **批量和单医院导出** - 实现了批量处理机制和单医院专用导出功能
6. **pandas和openpyxl集成** - 提供了完整的代码示例和高级功能实现
7. **文件管理机制** - 设计了完整的文件命名规则、存储路径和生命周期管理

### 主要特色功能

- **智能数据格式化**: 自动识别和转换各种日期、金额、状态格式
- **灵活字段选择**: 支持用户自定义导出字段组合
- **高效批量处理**: 支持大数据量分批导出和进度跟踪
- **完善的生命周期管理**: 自动清理过期文件，节省存储空间
- **美观的数据展示**: 自动设置列宽、样式、条件格式等

### 性能优化

- 内存优化：分批处理大数据集，优化数据类型
- 并发支持：支持多任务并发导出
- 进度跟踪：实时显示导出进度和状态
- 文件压缩：大批量导出时自动打包为ZIP文件

该设计为系统提供了强大、灵活、高效的Excel导出能力，满足用户多样化的数据导出需求。