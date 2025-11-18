# regions_data 项目详细报告

## 项目基本信息

**项目名称：** regions_data  
**作者：** slightlee  
**项目链接：** https://github.com/slightlee/regions_data  
**项目Stars：** 44  
**项目分支：** 13  
**最新更新：** 2024年6月7日  

## 项目描述

这是一个包含中国省、市、区县、乡镇街道、社区村五级行政区划数据的开源项目。项目支持多种数据格式（SQL、JSON、CSV），并提供在线预览功能。数据来源于国家统计局，具有权威性和准确性。

## 数据结构说明

### 五级行政区划数据：
1. **省级** - 省、自治区、直辖市、特别行政区
2. **市级** - 地级市、地区、盟、自治州等
3. **区县级** - 市辖区、县级市、县、自治县等
4. **乡镇级** - 镇、乡、民族乡、苏木等
5. **村级** - 村民委员会、居民委员会

### 支持的数据格式：
- **SQL数据库文件** - SQLite格式(.db)
- **JSON格式** - 结构化数据文件
- **CSV格式** - 逗号分隔值文件

## 项目文件结构

```
regions_data/
├── api/                    # API接口
├── data/                   # 主要数据文件目录
│   ├── [JSON数据文件]       # JSON格式的行政区划数据
│   └── [CSV数据文件]        # CSV格式的行政区划数据
├── data_/                  # 额外数据处理目录
├── images/                 # 图片资源
├── templates/              # 页面模板
├── .gitignore/             # Git忽略文件
├── README.md               # 项目说明文档
├── main.py                 # 主程序文件
├── regions.db              # SQLite数据库文件
├── requirements.txt        # Python依赖包
└── vercel.json             # Vercel配置文件
```

## 数据文件获取方式

### 1. 直接下载方式

**主要数据目录：** https://github.com/slightlee/regions_data/tree/main/data

该目录包含所有JSON和CSV格式的数据文件。

**数据库文件：** https://github.com/slightlee/regions_data/blob/main/regions.db

SQLite格式的完整数据库文件。

### 2. Release版本下载

**最新版本：** v1.0.1 (2024年7月17日发布)  
**Release页面：** https://github.com/slightlee/regions_data/releases

Release版本包含经过打包处理的完整数据集。

### 3. 在线预览

**预览地址：** https://regions-data.vercel.app/

提供在线查看数据结构和内容的完整界面。

### 4. 克隆仓库

```bash
git clone https://github.com/slightlee/regions_data.git
```

## 使用方法

### 方法一：直接使用现有数据文件

1. **访问项目页面：** https://github.com/slightlee/regions_data
2. **进入data目录：** https://github.com/slightlee/regions_data/tree/main/data
3. **下载所需格式文件**（JSON/CSV）
4. **直接集成到您的项目中**

### 方法二：通过API接口使用

1. **查看api目录：** https://github.com/slightlee/regions_data/tree/main/api
2. **部署API服务**（项目已配置Vercel）
3. **通过REST API调用数据**

### 源码运行

1. **克隆项目**
2. **安装依赖：**
   ```bash
   pip install -r requirements.txt
   ```
3. **运行主程序：**
   ```bash
   python main.py
   ```

## 数据来源与更新

- **数据来源：** 国家统计局
- **数据链接：** https://www.stats.gov.cn/sj/tjbz/tjyqhdmhcxhfdm/2023/
- **最新同步：** 2024年6月7日
- **数据完整性：** 包含完整的五级行政区划

## 技术栈

- **主要语言：** Python (83.2%)
- **前端：** HTML (16.8%)
- **数据库：** SQLite
- **部署：** Vercel

## 使用注意事项

1. **数据准确性：** 数据来源于国家统计局官方数据，具有权威性
2. **使用限制：** 请遵守相关法律法规，遵循开源协议
3. **更新频率：** 建议定期检查数据更新
4. **技术支持：** 如有问题可在GitHub Issues中提问

## 许可证

项目遵循开源许可证，具体许可证信息请查看项目根目录的LICENSE文件。

## 联系信息

- **作者：** slightlee
- **项目Issues：** https://github.com/slightlee/regions_data/issues
- **在线演示：** https://regions-data.vercel.app/

---

*报告生成时间：2025-11-18 10:27:47*  
*数据最后同步：2024年6月7日*
## 数据文件下载链接汇总

### 主要数据目录
**完整数据目录：** https://github.com/slightlee/regions_data/tree/main/data
- 包含JSON和CSV格式的行政区划数据文件
- 支持五级行政区划数据的完整下载

### 特定文件下载链接

1. **SQLite数据库文件**
   - 直接下载：https://github.com/slightlee/regions_data/blob/main/regions.db
   - 格式：.db (SQLite)
   - 包含完整的五级行政区划关系数据

2. **数据处理目录**
   - 扩展数据目录：https://github.com/slightlee/regions_data/tree/main/data_
   - 包含处理后的额外数据文件

### Release版本下载

**最新Release：v1.0.1** (2024年7月17日)
- Release页面：https://github.com/slightlee/regions_data/releases
- 包含打包好的完整数据集
- 推荐下载方式：完整版本，无需单独下载多个文件

### Raw文件直接下载

GitHub支持直接下载Raw文件，格式如下：
```
https://github.com/slightlee/regions_data/raw/main/data/文件名.json
https://github.com/slightlee/regions_data/raw/main/data/文件名.csv
```

## 项目使用建议

### 快速开始
1. **获取最新数据：** 访问 https://regions-data.vercel.app/ 在线预览
2. **下载完整版：** 使用Release v1.0.1
3. **API集成：** 查看api目录文档

### 数据格式选择
- **JSON格式：** 适合程序处理，支持嵌套结构
- **CSV格式：** 适合数据分析，Excel打开
- **SQLite数据库：** 适合关系查询，支持复杂关联

### 开发集成
1. 直接使用预构建数据文件
2. 通过Vercel部署的API接口
3. 自建API服务（基于main.py）

## 数据文件详细说明

### JSON数据结构
根据项目描述，JSON文件包含：
- **省级数据：** 省、自治区、直辖市信息
- **市级数据：** 地级市、地区等信息
- **区县级数据：** 市辖区、县级市等信息
- **乡镇级数据：** 镇、乡等信息
- **村级数据：** 村民委员会、居民委员会信息

### 数据字段
每个级别的数据通常包含：
- **代码：** 行政区划代码
- **名称：** 行政区划名称
- **级别：** 行政区划级别
- **上级编码：** 所属上级行政区划代码
- **完整名称：** 带层级的完整名称

## 技术支持与联系

- **在线预览：** https://regions-data.vercel.app/
- **Issues反馈：** https://github.com/slightlee/regions_data/issues
- **作者主页：** https://github.com/slightlee
- **数据来源：** https://www.stats.gov.cn/sj/tjbz/tjyqhdmhcxhfdm/2023/

---

*报告生成时间：2025-11-18 10:27:47*  
*最后更新：2024年6月7日*