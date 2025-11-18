# Flask后端API系统设计文档

**作者：** MiniMax Agent  
**版本：** v1.0  
**日期：** 2025-11-18  
**项目：** 全国医院官网扫描与招投标监控系统

---

## 🎯 一、系统概述

### 1.1 设计目标
Flask后端API系统为医院招投标监控系统提供完整的RESTful API服务，支持医院管理、爬虫控制、数据查询、导出等功能，并集成定时任务调度和系统监控。

### 1.2 核心功能模块

```python
# 系统架构
Flask API Server:
├── API Routes          # 路由层
│   ├── /api/regions   # 行政区划接口
│   ├── /api/hospitals # 医院管理接口
│   ├── /api/tenders   # 招投标接口
│   ├── /api/crawler   # 爬虫控制接口
│   ├── /api/export    # 导出接口
│   └── /api/config    # 配置接口
├── Business Logic     # 业务逻辑层
│   ├── RegionService  # 行政区划服务
│   ├── HospitalService # 医院服务
│   ├── TenderService  # 招投标服务
│   ├── CrawlerService # 爬虫服务
│   ├── ExportService  # 导出服务
│   └── ConfigService  # 配置服务
├── Data Access       # 数据访问层
│   ├── Database      # 数据库操作
│   ├── Repository    # 仓储模式
│   └── Cache        # 缓存管理
├── Scheduling       # 定时任务
│   ├── APScheduler  # 任务调度器
│   ├── Tasks        # 任务定义
│   └── Monitor      # 任务监控
└── Infrastructure   # 基础设施
    ├── Logging      # 日志系统
    ├── Error Handling # 错误处理
    └── Security     # 安全验证
```

---

## 🚀 二、Flask应用初始化

### 2.1 应用配置

```python
# app.py
from flask import Flask
from flask_cors import CORS
from flask_restx import Api
from apscheduler.schedulers.background import BackgroundScheduler
import logging
from logging.handlers import RotatingFileHandler
import os

def create_app(config_name='development'):
    """工厂函数：创建Flask应用"""
    app = Flask(__name__)
    
    # 加载配置
    app.config.from_object(config[config_name])
    
    # 初始化扩展
    initialize_extensions(app)
    
    # 注册蓝图
    register_blueprints(app)
    
    # 配置定时任务
    setup_scheduler(app)
    
    # 配置日志
    setup_logging(app)
    
    # 注册错误处理器
    register_error_handlers(app)
    
    return app

def initialize_extensions(app):
    """初始化扩展"""
    # CORS配置
    CORS(app, 
         origins=["http://localhost:3000", "http://127.0.0.1:3000"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         allow_headers=["Content-Type", "Authorization", "X-Requested-With"])
    
    # API文档配置
    api = Api(app, 
              version='1.0', 
              title='医院招投标监控API',
              description='全国医院官网扫描与招投标监控系统API文档',
              doc='/docs/',
              prefix='/api')
    
    app.api = api
    
    # 数据库连接
    from database import init_db
    init_db(app.config['DATABASE_PATH'])
    
    # 缓存配置
    from cache import cache
    cache.init_app(app)

# 配置文件
config = {
    'development': 'config.DevelopmentConfig',
    'production': 'config.ProductionConfig',
    'testing': 'config.TestingConfig'
}

# config.py
import os
from datetime import timedelta

class BaseConfig:
    """基础配置"""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key'
    DATABASE_PATH = os.environ.get('DATABASE_PATH') or 'hospital_monitor.db'
    
    # 缓存配置
    CACHE_TYPE = 'SimpleCache'
    CACHE_DEFAULT_TIMEOUT = 300
    
    # 爬虫配置
    CRAWLER_REQUEST_DELAY = (2, 5)  # 请求延迟范围（秒）
    CRAWLER_MAX_CONCURRENT = 3
    CRAWLER_TIMEOUT = 30
    CRAWLER_USER_AGENT = 'HospitalTenderMonitor/1.0 (Research Purpose Only)'
    
    # 定时任务配置
    SCHEDULER_TIMEZONE = 'Asia/Shanghai'
    HOSPITAL_SCAN_INTERVAL_HOURS = 168  # 每周一次
    TENDER_MONITOR_INTERVAL_HOURS = 6   # 每6小时
    
    # 导出配置
    EXPORT_MAX_RECORDS = 10000
    EXPORT_TEMP_DIR = 'exports'

class DevelopmentConfig(BaseConfig):
    """开发环境配置"""
    DEBUG = True
    TESTING = False
    DATABASE_PATH = 'dev_hospital_monitor.db'

class ProductionConfig(BaseConfig):
    """生产环境配置"""
    DEBUG = False
    TESTING = False
    DATABASE_PATH = '/data/hospital_monitor.db'
    CACHE_TYPE = 'Redis'
    CACHE_REDIS_URL = 'redis://localhost:6379/0'

class TestingConfig(BaseConfig):
    """测试环境配置"""
    DEBUG = True
    TESTING = True
    DATABASE_PATH = ':memory:'
```

### 2.2 数据库初始化

```python
# database.py
import sqlite3
import logging
from contextlib import contextmanager

def init_db(db_path: str):
    """初始化数据库"""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # 创建表结构
    create_tables(cursor)
    
    # 创建索引
    create_indexes(cursor)
    
    # 创建视图
    create_views(cursor)
    
    conn.commit()
    conn.close()
    
    logging.info(f"数据库初始化完成: {db_path}")

def create_tables(cursor):
    """创建表结构"""
    # regions表
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS regions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(100) NOT NULL,
            code VARCHAR(20) UNIQUE NOT NULL,
            level ENUM('country', 'province', 'city', 'county') NOT NULL,
            parent_id INTEGER,
            sort_order INTEGER DEFAULT 0,
            hospital_count INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (parent_id) REFERENCES regions(id)
        )
    """)
    
    # hospitals表
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS hospitals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(200) NOT NULL,
            website_url VARCHAR(500),
            domain_name VARCHAR(100),
            is_https BOOLEAN DEFAULT FALSE,
            hospital_type ENUM('public', 'private', 'community', 'specialized', 'traditional') DEFAULT 'public',
            hospital_level ENUM('unknown', 'level1', 'level2', 'level3', 'level3a') DEFAULT 'unknown',
            ownership ENUM('government', 'private', 'collective', 'foreign', 'mixed') DEFAULT 'government',
            region_id INTEGER NOT NULL,
            address TEXT,
            phone VARCHAR(50),
            email VARCHAR(100),
            status ENUM('active', 'inactive', 'closed', 'relocated') DEFAULT 'active',
            verified BOOLEAN DEFAULT FALSE,
            verification_date TIMESTAMP,
            last_scan_time TIMESTAMP,
            last_success_scan_time TIMESTAMP,
            tender_count INTEGER DEFAULT 0,
            scan_success_count INTEGER DEFAULT 0,
            scan_failed_count INTEGER DEFAULT 0,
            description TEXT,
            specialties TEXT,
            bed_count INTEGER,
            staff_count INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (region_id) REFERENCES regions(id)
        )
    """)
    
    # tender_records表
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tender_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            hospital_id INTEGER NOT NULL,
            title VARCHAR(500) NOT NULL,
            content TEXT,
            tender_type ENUM('procurement', 'construction', 'service', 'medical', 'equipment', 'other') DEFAULT 'other',
            tender_category ENUM('construction', 'medical_equipment', 'drugs', 'service', 'it', 'other') DEFAULT 'other',
            budget_amount DECIMAL(15, 2),
            budget_currency ENUM('CNY', 'USD', 'EUR', 'other') DEFAULT 'CNY',
            publish_date DATE,
            deadline_date DATE,
            start_date DATE,
            end_date DATE,
            source_url VARCHAR(500),
            detail_url VARCHAR(500),
            content_hash VARCHAR(64) UNIQUE NOT NULL,
            html_hash VARCHAR(64),
            status ENUM('published', 'in_progress', 'closed', 'cancelled', 'awarded') DEFAULT 'published',
            is_important BOOLEAN DEFAULT FALSE,
            importance_reason TEXT,
            source_page_title VARCHAR(500),
            source_section VARCHAR(100),
            crawl_method ENUM('auto', 'manual') DEFAULT 'auto',
            verified BOOLEAN DEFAULT FALSE,
            view_count INTEGER DEFAULT 0,
            download_count INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
        )
    """)
    
    # scan_history表
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS scan_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id VARCHAR(50) UNIQUE NOT NULL,
            task_name VARCHAR(200) NOT NULL,
            scan_type ENUM('hospital_discovery', 'hospital_scan', 'tender_monitor', 'full_scan') NOT NULL,
            target_type ENUM('region', 'hospital') NOT NULL,
            target_id INTEGER,
            target_description TEXT,
            start_time TIMESTAMP NOT NULL,
            end_time TIMESTAMP,
            duration_seconds INTEGER,
            status ENUM('pending', 'running', 'success', 'failed', 'partial', 'cancelled') DEFAULT 'pending',
            total_count INTEGER DEFAULT 0,
            success_count INTEGER DEFAULT 0,
            failed_count INTEGER DEFAULT 0,
            new_records INTEGER DEFAULT 0,
            records_found INTEGER DEFAULT 0,
            hospitals_discovered INTEGER DEFAULT 0,
            tenders_found INTEGER DEFAULT 0,
            error_code VARCHAR(20),
            error_message TEXT,
            error_details TEXT,
            system_version VARCHAR(20),
            crawler_config TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # settings表
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key_name VARCHAR(100) UNIQUE NOT NULL,
            key_value TEXT,
            key_type ENUM('string', 'integer', 'float', 'boolean', 'json') DEFAULT 'string',
            description TEXT,
            is_system BOOLEAN DEFAULT FALSE,
            is_editable BOOLEAN DEFAULT TRUE,
            category VARCHAR(50) DEFAULT 'general',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

def create_indexes(cursor):
    """创建索引"""
    indexes = [
        "CREATE INDEX IF NOT EXISTS idx_hospitals_region ON hospitals(region_id)",
        "CREATE INDEX IF NOT EXISTS idx_hospitals_verified ON hospitals(verified)",
        "CREATE INDEX IF NOT EXISTS idx_hospitals_type ON hospitals(hospital_type)",
        "CREATE INDEX IF NOT EXISTS idx_hospitals_status ON hospitals(status)",
        "CREATE INDEX IF NOT EXISTS idx_hospitals_scan_time ON hospitals(last_scan_time)",
        
        "CREATE INDEX IF NOT EXISTS idx_tenders_hospital_date ON tender_records(hospital_id, publish_date)",
        "CREATE INDEX IF NOT EXISTS idx_tenders_date ON tender_records(publish_date)",
        "CREATE INDEX IF NOT EXISTS idx_tenders_type ON tender_records(tender_type)",
        "CREATE INDEX IF NOT EXISTS idx_tenders_status ON tender_records(status)",
        "CREATE INDEX IF NOT EXISTS idx_tenders_hash ON tender_records(content_hash)",
        
        "CREATE INDEX IF NOT EXISTS idx_regions_parent ON regions(parent_id)",
        "CREATE INDEX IF NOT EXISTS idx_regions_level ON regions(level)",
        "CREATE INDEX IF NOT EXISTS idx_scan_history_time ON scan_history(start_time)",
        "CREATE INDEX IF NOT EXISTS idx_scan_history_type ON scan_history(scan_type)"
    ]
    
    for index_sql in indexes:
        cursor.execute(index_sql)

@contextmanager
def get_db_connection():
    """数据库连接上下文管理器"""
    conn = sqlite3.connect(current_app.config['DATABASE_PATH'])
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()
```

---

## 🔌 三、API路由设计

### 3.1 医院管理接口

```python
# routes/hospitals.py
from flask import Blueprint, request, jsonify
from flask_restx import Resource, fields, Namespace
from marshmallow import Schema, fields as ma_fields, validate
from services.hospital_service import HospitalService
from decorators.auth import require_api_key
from decorators.rate_limit import rate_limit
from utils.response import success_response, error_response

api = Namespace('hospitals', description='医院管理接口')
hospital_service = HospitalService()

# 请求/响应模型
hospital_model = api.model('Hospital', {
    'id': fields.Integer(readOnly=True),
    'name': fields.String(required=True, description='医院名称'),
    'website_url': fields.String(description='官网地址'),
    'hospital_type': fields.String(enum=['public', 'private', 'community', 'specialized', 'traditional']),
    'region_id': fields.Integer(required=True, description='地区ID'),
    'address': fields.String(description='地址'),
    'phone': fields.String(description='电话'),
    'description': fields.String(description='描述'),
    'status': fields.String(enum=['active', 'inactive', 'closed', 'relocated']),
    'verified': fields.Boolean(description='是否已验证')
})

hospital_create_model = api.model('HospitalCreate', {
    'name': fields.String(required=True, description='医院名称'),
    'website_url': fields.String(description='官网地址'),
    'hospital_type': fields.String(enum=['public', 'private', 'community', 'specialized', 'traditional'], 
                                  default='public'),
    'region_id': fields.Integer(required=True, description='地区ID'),
    'address': fields.String(description='地址'),
    'phone': fields.String(description='电话'),
    'description': fields.String(description='描述'),
    'status': fields.String(enum=['active', 'inactive', 'closed', 'relocated'], default='active')
})

hospital_update_model = api.model('HospitalUpdate', {
    'name': fields.String(description='医院名称'),
    'website_url': fields.String(description='官网地址'),
    'hospital_type': fields.String(enum=['public', 'private', 'community', 'specialized', 'traditional']),
    'region_id': fields.Integer(description='地区ID'),
    'address': fields.String(description='地址'),
    'phone': fields.String(description='电话'),
    'description': fields.String(description='描述'),
    'status': fields.String(enum=['active', 'inactive', 'closed', 'relocated']),
    'verified': fields.Boolean(description='是否已验证')
})

pagination_model = api.model('Pagination', {
    'page': fields.Integer(description='页码', default=1),
    'per_page': fields.Integer(description='每页数量', default=20),
    'total': fields.Integer(description='总数'),
    'pages': fields.Integer(description='总页数')
})

hospital_list_response = api.model('HospitalListResponse', {
    'success': fields.Boolean(description='是否成功'),
    'data': fields.List(fields.Nested(hospital_model)),
    'pagination': fields.Nested(pagination_model),
    'message': fields.String(description='消息')
})

@api.route('/')
class HospitalList(Resource):
    @api.doc('list_hospitals')
    @api.expect(pagination_model)
    @api.marshal_with(hospital_list_response)
    @rate_limit(requests_per_minute=60)
    def get(self):
        """获取医院列表"""
        try:
            # 获取查询参数
            page = request.args.get('page', 1, type=int)
            per_page = min(request.args.get('per_page', 20, type=int), 100)
            
            # 构建过滤条件
            filters = {}
            if request.args.get('region_id'):
                filters['region_id'] = request.args.get('region_id', type=int)
            if request.args.get('status'):
                filters['status'] = request.args.get('status')
            if request.args.get('verified'):
                filters['verified'] = request.args.get('verified', type=bool)
            if request.args.get('hospital_type'):
                filters['hospital_type'] = request.args.get('hospital_type')
            if request.args.get('keyword'):
                filters['keyword'] = request.args.get('keyword')
            
            # 获取医院列表
            result = hospital_service.get_hospitals(filters, page, per_page)
            
            return success_response({
                'data': result['hospitals'],
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': result['total'],
                    'pages': (result['total'] + per_page - 1) // per_page
                }
            })
            
        except Exception as e:
            logging.error(f"获取医院列表失败: {e}")
            return error_response("获取医院列表失败", 500)

    @api.doc('create_hospital')
    @api.expect(hospital_create_model)
    @api.marshal_with(hospital_model)
    @require_api_key
    def post(self):
        """创建医院"""
        try:
            data = request.get_json()
            
            # 数据验证
            if not data.get('name'):
                return error_response("医院名称不能为空", 400)
            if not data.get('region_id'):
                return error_response("地区ID不能为空", 400)
            
            # 创建医院
            hospital = hospital_service.create_hospital(data)
            
            return success_response(hospital, 201)
            
        except Exception as e:
            logging.error(f"创建医院失败: {e}")
            return error_response("创建医院失败", 500)

@api.route('/<int:hospital_id>')
class HospitalDetail(Resource):
    @api.doc('get_hospital')
    @api.marshal_with(hospital_model)
    @rate_limit(requests_per_minute=120)
    def get(self, hospital_id):
        """获取医院详情"""
        try:
            hospital = hospital_service.get_hospital_by_id(hospital_id)
            if not hospital:
                return error_response("医院不存在", 404)
            
            return success_response(hospital)
            
        except Exception as e:
            logging.error(f"获取医院详情失败: {e}")
            return error_response("获取医院详情失败", 500)

    @api.doc('update_hospital')
    @api.expect(hospital_update_model)
    @api.marshal_with(hospital_model)
    @require_api_key
    def put(self, hospital_id):
        """更新医院"""
        try:
            data = request.get_json()
            
            # 检查医院是否存在
            existing_hospital = hospital_service.get_hospital_by_id(hospital_id)
            if not existing_hospital:
                return error_response("医院不存在", 404)
            
            # 更新医院
            hospital = hospital_service.update_hospital(hospital_id, data)
            
            return success_response(hospital)
            
        except Exception as e:
            logging.error(f"更新医院失败: {e}")
            return error_response("更新医院失败", 500)

    @api.doc('delete_hospital')
    @require_api_key
    def delete(self, hospital_id):
        """删除医院"""
        try:
            # 检查医院是否存在
            existing_hospital = hospital_service.get_hospital_by_id(hospital_id)
            if not existing_hospital:
                return error_response("医院不存在", 404)
            
            # 删除医院
            success = hospital_service.delete_hospital(hospital_id)
            if success:
                return success_response(None, 204)
            else:
                return error_response("删除医院失败", 500)
                
        except Exception as e:
            logging.error(f"删除医院失败: {e}")
            return error_response("删除医院失败", 500)

@api.route('/<int:hospital_id>/scan')
class HospitalScan(Resource):
    @api.doc('scan_hospital_tenders')
    @require_api_key
    def post(self, hospital_id):
        """手动扫描医院招投标"""
        try:
            # 检查医院是否存在
            hospital = hospital_service.get_hospital_by_id(hospital_id)
            if not hospital:
                return error_response("医院不存在", 404)
            
            # 启动扫描任务
            task_id = hospital_service.start_manual_scan(hospital_id)
            
            return success_response({
                'task_id': task_id,
                'message': f'已启动医院 {hospital["name"]} 的扫描任务'
            })
            
        except Exception as e:
            logging.error(f"启动扫描任务失败: {e}")
            return error_response("启动扫描任务失败", 500)

@api.route('/<int:hospital_id>/statistics')
class HospitalStatistics(Resource):
    @api.doc('get_hospital_statistics')
    def get(self, hospital_id):
        """获取医院统计信息"""
        try:
            # 检查医院是否存在
            hospital = hospital_service.get_hospital_by_id(hospital_id)
            if not hospital:
                return error_response("医院不存在", 404)
            
            # 获取统计信息
            stats = hospital_service.get_hospital_statistics(hospital_id)
            
            return success_response(stats)
            
        except Exception as e:
            logging.error(f"获取医院统计失败: {e}")
            return error_response("获取医院统计失败", 500)
```

### 3.2 行政区划接口

```python
# routes/regions.py
from flask import Blueprint, request, jsonify
from flask_restx import Resource, fields, Namespace
from services.region_service import RegionService
from decorators.rate_limit import rate_limit
from utils.response import success_response, error_response

api = Namespace('regions', description='行政区划接口')
region_service = RegionService()

region_model = api.model('Region', {
    'id': fields.Integer(readOnly=True),
    'name': fields.String(description='地区名称'),
    'code': fields.String(description='行政区划代码'),
    'level': fields.String(description='层级'),
    'parent_id': fields.Integer(description='父级ID'),
    'hospital_count': fields.Integer(description='医院数量')
})

region_tree_response = api.model('RegionTreeResponse', {
    'success': fields.Boolean(),
    'data': fields.List(fields.Nested(region_model))
})

@api.route('/tree')
class RegionTree(Resource):
    @api.doc('get_region_tree')
    @api.marshal_with(region_tree_response)
    @rate_limit(requests_per_minute=30)
    def get(self):
        """获取地区树形结构"""
        try:
            root_level = request.args.get('root_level', 0, type=int)
            tree = region_service.get_regions_tree(root_level)
            
            return success_response(tree)
            
        except Exception as e:
            logging.error(f"获取地区树失败: {e}")
            return error_response("获取地区树失败", 500)

@api.route('/search')
class RegionSearch(Resource):
    @api.doc('search_regions')
    @api.marshal_list_with(region_model)
    @rate_limit(requests_per_minute=60)
    def get(self):
        """搜索地区"""
        try:
            keyword = request.args.get('keyword', '')
            if not keyword:
                return error_response("搜索关键词不能为空", 400)
            
            max_results = request.args.get('max_results', 50, type=int)
            regions = region_service.search_regions(keyword, max_results)
            
            return success_response(regions)
            
        except Exception as e:
            logging.error(f"搜索地区失败: {e}")
            return error_response("搜索地区失败", 500)

@api.route('/statistics')
class RegionStatistics(Resource):
    @api.doc('get_region_statistics')
    def get(self):
        """获取地区统计信息"""
        try:
            stats = region_service.get_region_statistics()
            
            return success_response(stats)
            
        except Exception as e:
            logging.error(f"获取地区统计失败: {e}")
            return error_response("获取地区统计失败", 500)
```

### 3.3 招投标数据接口

```python
# routes/tenders.py
from flask import request, send_file
from flask_restx import Resource, fields, Namespace
from services.tender_service import TenderService
from decorators.rate_limit import rate_limit
from utils.response import success_response, error_response
import tempfile
import os

api = Namespace('tenders', description='招投标接口')
tender_service = TenderService()

tender_model = api.model('Tender', {
    'id': fields.Integer(readOnly=True),
    'hospital_id': fields.Integer(description='医院ID'),
    'hospital_name': fields.String(description='医院名称'),
    'title': fields.String(description='标题'),
    'content': fields.String(description='内容'),
    'tender_type': fields.String(description='招标类型'),
    'tender_category': fields.String(description='招标分类'),
    'budget_amount': fields.Float(description='预算金额'),
    'budget_currency': fields.String(description='币种'),
    'publish_date': fields.Date(description='发布日期'),
    'deadline_date': fields.Date(description='截止日期'),
    'source_url': fields.String(description='来源URL'),
    'status': fields.String(description='状态'),
    'is_important': fields.Boolean(description='是否重要'),
    'created_at': fields.DateTime(description='创建时间')
})

tender_list_response = api.model('TenderListResponse', {
    'success': fields.Boolean(),
    'data': fields.List(fields.Nested(tender_model)),
    'pagination': fields.Nested(api.model('Pagination', {
        'page': fields.Integer(),
        'per_page': fields.Integer(),
        'total': fields.Integer(),
        'pages': fields.Integer()
    }))
})

@api.route('/')
class TenderList(Resource):
    @api.doc('list_tenders')
    @api.marshal_with(tender_list_response)
    @rate_limit(requests_per_minute=60)
    def get(self):
        """获取招投标列表"""
        try:
            # 获取查询参数
            page = request.args.get('page', 1, type=int)
            per_page = min(request.args.get('per_page', 20, type=int), 100)
            
            # 构建过滤条件
            filters = {}
            if request.args.get('hospital_id'):
                filters['hospital_id'] = request.args.get('hospital_id', type=int)
            if request.args.get('region_id'):
                filters['region_id'] = request.args.get('region_id', type=int)
            if request.args.get('tender_type'):
                filters['tender_type'] = request.args.get('tender_type')
            if request.args.get('status'):
                filters['status'] = request.args.get('status')
            if request.args.get('date_from'):
                filters['date_from'] = request.args.get('date_from')
            if request.args.get('date_to'):
                filters['date_to'] = request.args.get('date_to')
            if request.args.get('keyword'):
                filters['keyword'] = request.args.get('keyword')
            if request.args.get('is_important'):
                filters['is_important'] = request.args.get('is_important', type=bool)
            
            # 获取招投标列表
            result = tender_service.get_tenders(filters, page, per_page)
            
            return success_response({
                'data': result['tenders'],
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': result['total'],
                    'pages': (result['total'] + per_page - 1) // per_page
                }
            })
            
        except Exception as e:
            logging.error(f"获取招投标列表失败: {e}")
            return error_response("获取招投标列表失败", 500)

@api.route('/statistics')
class TenderStatistics(Resource):
    @api.doc('get_tender_statistics')
    def get(self):
        """获取招投标统计信息"""
        try:
            # 获取时间范围
            date_from = request.args.get('date_from')
            date_to = request.args.get('date_to')
            
            # 获取统计信息
            stats = tender_service.get_statistics(date_from, date_to)
            
            return success_response(stats)
            
        except Exception as e:
            logging.error(f"获取招投标统计失败: {e}")
            return error_response("获取招投标统计失败", 500)

@api.route('/export')
class TenderExport(Resource):
    @api.doc('export_tenders')
    @rate_limit(requests_per_minute=10)
    def get(self):
        """导出招投标数据"""
        try:
            # 获取过滤条件
            filters = {}
            if request.args.get('hospital_ids'):
                filters['hospital_ids'] = [int(x) for x in request.args.get('hospital_ids').split(',')]
            if request.args.get('date_from'):
                filters['date_from'] = request.args.get('date_from')
            if request.args.get('date_to'):
                filters['date_to'] = request.args.get('date_to')
            if request.args.get('include_content'):
                filters['include_content'] = request.args.get('include_content', type=bool)
            
            # 导出数据
            export_result = tender_service.export_tenders(filters)
            
            if export_result['success']:
                # 返回文件
                return send_file(
                    export_result['file_path'],
                    as_attachment=True,
                    download_name=export_result['file_name']
                )
            else:
                return error_response(export_result['error'], 500)
                
        except Exception as e:
            logging.error(f"导出招投标数据失败: {e}")
            return error_response("导出招投标数据失败", 500)
```

---

## 🕰️ 四、APScheduler定时任务调度

### 4.1 任务调度器

```python
# scheduler.py
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.triggers.cron import CronTrigger
from apscheduler.executors.pool import ThreadPoolExecutor
from apscheduler.jobstores.memory import MemoryJobStore
from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore
from apscheduler.events import EVENT_JOB_EXECUTED, EVENT_JOB_ERROR
import logging
from datetime import datetime
import pytz

class HospitalTenderScheduler:
    """医院招投标监控调度器"""
    
    def __init__(self, app=None, db_path=None):
        self.scheduler = None
        self.app = app
        self.db_path = db_path
        self.timezone = pytz.timezone('Asia/Shanghai')
        
    def init_app(self, app, db_path):
        """初始化调度器"""
        self.app = app
        self.db_path = db_path
        
        # 配置调度器
        self._setup_scheduler()
        
        # 添加任务
        self._add_jobs()
        
        # 启动调度器
        self.scheduler.start()
        
        logging.info("任务调度器初始化完成")
    
    def _setup_scheduler(self):
        """设置调度器"""
        # 任务存储
        jobstores = {
            'default': SQLAlchemyJobStore(url=f'sqlite:///{self.db_path}')
        }
        
        # 执行器
        executors = {
            'default': ThreadPoolExecutor(max_workers=5)
        }
        
        # 任务配置
        job_defaults = {
            'coalesce': False,
            'max_instances': 3
        }
        
        # 创建调度器
        self.scheduler = BackgroundScheduler(
            jobstores=jobstores,
            executors=executors,
            job_defaults=job_defaults,
            timezone=self.timezone
        )
        
        # 添加事件监听器
        self.scheduler.add_listener(
            self._job_listener,
            EVENT_JOB_EXECUTED | EVENT_JOB_ERROR
        )
    
    def _add_jobs(self):
        """添加定时任务"""
        # 医院扫描任务（每周一次）
        self.scheduler.add_job(
            func=self._scan_all_hospitals,
            trigger=IntervalTrigger(hours=24*7),
            id='scan_all_hospitals',
            name='全量扫描医院官网',
            replace_existing=True
        )
        
        # 招投标监控任务（每6小时）
        self.scheduler.add_job(
            func=self._monitor_tender_updates,
            trigger=IntervalTrigger(hours=6),
            id='monitor_tender_updates',
            name='监控招投标信息更新',
            replace_existing=True
        )
        
        # 数据清理任务（每天凌晨2点）
        self.scheduler.add_job(
            func=self._cleanup_old_data,
            trigger=CronTrigger(hour=2, minute=0),
            id='cleanup_old_data',
            name='清理旧数据',
            replace_existing=True
        )
        
        # 统计报告任务（每周一上午9点）
        self.scheduler.add_job(
            func=self._generate_weekly_report,
            trigger=CronTrigger(day_of_week='mon', hour=9, minute=0),
            id='generate_weekly_report',
            name='生成周报',
            replace_existing=True
        )
        
        # 健康检查任务（每30分钟）
        self.scheduler.add_job(
            func=self._health_check,
            trigger=IntervalTrigger(minutes=30),
            id='health_check',
            name='系统健康检查',
            replace_existing=True
        )
    
    def _scan_all_hospitals(self):
        """扫描所有医院"""
        try:
            logging.info("开始全量扫描医院")
            
            from services.hospital_service import HospitalService
            hospital_service = HospitalService()
            
            # 获取所有活跃医院
            hospitals = hospital_service.get_active_hospitals()
            
            for hospital in hospitals:
                try:
                    # 逐个扫描医院
                    hospital_service.scan_hospital_tenders(hospital['id'])
                    
                    # 添加延迟，避免过于频繁的请求
                    import time
                    time.sleep(2)
                    
                except Exception as e:
                    logging.error(f"扫描医院 {hospital['name']} 失败: {e}")
            
            logging.info("全量扫描医院完成")
            
        except Exception as e:
            logging.error(f"全量扫描任务失败: {e}")
    
    def _monitor_tender_updates(self):
        """监控招投标信息更新"""
        try:
            logging.info("开始监控招投标更新")
            
            from services.tender_service import TenderService
            tender_service = TenderService()
            
            # 获取需要监控的医院（近期有招投标更新的）
            hospitals_to_monitor = tender_service.get_hospitals_for_monitoring()
            
            for hospital in hospitals_to_monitor:
                try:
                    # 监控医院招投标更新
                    tender_service.monitor_hospital_updates(hospital['id'])
                    
                    # 添加延迟
                    import time
                    time.sleep(1)
                    
                except Exception as e:
                    logging.error(f"监控医院 {hospital['name']} 失败: {e}")
            
            logging.info("招投标更新监控完成")
            
        except Exception as e:
            logging.error(f"招投标监控任务失败: {e}")
    
    def _cleanup_old_data(self):
        """清理旧数据"""
        try:
            logging.info("开始清理旧数据")
            
            from services.data_service import DataService
            data_service = DataService()
            
            # 清理3个月前的扫描历史
            cleaned_count = data_service.cleanup_old_scan_history(days=90)
            logging.info(f"清理了 {cleaned_count} 条旧扫描记录")
            
            # 清理6个月前的日志记录
            cleaned_count = data_service.cleanup_old_logs(days=180)
            logging.info(f"清理了 {cleaned_count} 条旧日志记录")
            
            # 清理过期缓存
            from cache import cache
            cache.clear()
            logging.info("已清理过期缓存")
            
            logging.info("数据清理完成")
            
        except Exception as e:
            logging.error(f"数据清理任务失败: {e}")
    
    def _generate_weekly_report(self):
        """生成周报"""
        try:
            logging.info("开始生成周报")
            
            from services.report_service import ReportService
            report_service = ReportService()
            
            # 生成周报
            report = report_service.generate_weekly_report()
            
            # 发送通知
            from services.notification_service import NotificationService
            notification_service = NotificationService()
            notification_service.send_weekly_report(report)
            
            logging.info("周报生成完成")
            
        except Exception as e:
            logging.error(f"周报生成任务失败: {e}")
    
    def _health_check(self):
        """系统健康检查"""
        try:
            logging.info("开始系统健康检查")
            
            from services.health_service import HealthService
            health_service = HealthService()
            
            # 执行健康检查
            health_status = health_service.perform_health_check()
            
            # 记录状态
            logging.info(f"系统健康状态: {health_status['status']}")
            
            # 如果有问题，发送告警
            if health_status['status'] != 'healthy':
                from services.notification_service import NotificationService
                notification_service = NotificationService()
                notification_service.send_health_alert(health_status)
            
            logging.info("健康检查完成")
            
        except Exception as e:
            logging.error(f"健康检查任务失败: {e}")
    
    def _job_listener(self, event):
        """任务执行监听器"""
        if event.exception:
            logging.error(f"任务 {event.job_id} 执行失败: {event.exception}")
        else:
            logging.info(f"任务 {event.job_id} 执行成功")
    
    def start_job(self, job_id: str):
        """启动任务"""
        try:
            self.scheduler.resume_job(job_id)
            logging.info(f"任务 {job_id} 已启动")
            return True
        except Exception as e:
            logging.error(f"启动任务 {job_id} 失败: {e}")
            return False
    
    def stop_job(self, job_id: str):
        """停止任务"""
        try:
            self.scheduler.pause_job(job_id)
            logging.info(f"任务 {job_id} 已停止")
            return True
        except Exception as e:
            logging.error(f"停止任务 {job_id} 失败: {e}")
            return False
    
    def get_job_status(self, job_id: str):
        """获取任务状态"""
        try:
            job = self.scheduler.get_job(job_id)
            if job:
                return {
                    'job_id': job_id,
                    'name': job.name,
                    'next_run_time': job.next_run_time,
                    'trigger': str(job.trigger),
                    'func': str(job.func),
                    'args': job.args,
                    'kwargs': job.kwargs
                }
            return None
        except Exception as e:
            logging.error(f"获取任务状态失败: {e}")
            return None
    
    def get_all_jobs_status(self):
        """获取所有任务状态"""
        try:
            jobs = []
            for job in self.scheduler.get_jobs():
                jobs.append({
                    'job_id': job.id,
                    'name': job.name,
                    'next_run_time': job.next_run_time,
                    'trigger': str(job.trigger),
                    'func': str(job.func)
                })
            return jobs
        except Exception as e:
            logging.error(f"获取任务列表失败: {e}")
            return []
```

### 4.2 任务管理接口

```python
# routes/scheduler.py
from flask import Blueprint, request, jsonify
from flask_restx import Resource, fields, Namespace
from scheduler import HospitalTenderScheduler
from decorators.auth import require_api_key
from decorators.rate_limit import rate_limit
from utils.response import success_response, error_response

api = Namespace('scheduler', description='任务调度接口')
scheduler = None

job_model = api.model('Job', {
    'job_id': fields.String(description='任务ID'),
    'name': fields.String(description='任务名称'),
    'next_run_time': fields.DateTime(description='下次执行时间'),
    'trigger': fields.String(description='触发器'),
    'func': fields.String(description='执行函数')
})

job_status_response = api.model('JobStatusResponse', {
    'success': fields.Boolean(),
    'data': fields.List(fields.Nested(job_model))
})

def init_scheduler(app, db_path):
    """初始化调度器"""
    global scheduler
    scheduler = HospitalTenderScheduler(app, db_path)
    scheduler.init_app(app, db_path)

@api.route('/jobs')
class JobList(Resource):
    @api.doc('get_all_jobs')
    @api.marshal_with(job_status_response)
    @require_api_key
    @rate_limit(requests_per_minute=30)
    def get(self):
        """获取所有任务状态"""
        try:
            if not scheduler:
                return error_response("调度器未初始化", 500)
            
            jobs = scheduler.get_all_jobs_status()
            return success_response(jobs)
            
        except Exception as e:
            logging.error(f"获取任务列表失败: {e}")
            return error_response("获取任务列表失败", 500)

@api.route('/jobs/<job_id>/start')
class JobStart(Resource):
    @api.doc('start_job')
    @require_api_key
    def post(self, job_id):
        """启动任务"""
        try:
            if not scheduler:
                return error_response("调度器未初始化", 500)
            
            success = scheduler.start_job(job_id)
            if success:
                return success_response({'message': f'任务 {job_id} 已启动'})
            else:
                return error_response(f"启动任务 {job_id} 失败", 500)
                
        except Exception as e:
            logging.error(f"启动任务失败: {e}")
            return error_response("启动任务失败", 500)

@api.route('/jobs/<job_id>/stop')
class JobStop(Resource):
    @api.doc('stop_job')
    @require_api_key
    def post(self, job_id):
        """停止任务"""
        try:
            if not scheduler:
                return error_response("调度器未初始化", 500)
            
            success = scheduler.stop_job(job_id)
            if success:
                return success_response({'message': f'任务 {job_id} 已停止'})
            else:
                return error_response(f"停止任务 {job_id} 失败", 500)
                
        except Exception as e:
            logging.error(f"停止任务失败: {e}")
            return error_response("停止任务失败", 500)

@api.route('/jobs/<job_id>/status')
class JobStatus(Resource):
    @api.doc('get_job_status')
    @require_api_key
    def get(self, job_id):
        """获取任务状态"""
        try:
            if not scheduler:
                return error_response("调度器未初始化", 500)
            
            status = scheduler.get_job_status(job_id)
            if status:
                return success_response(status)
            else:
                return error_response("任务不存在", 404)
                
        except Exception as e:
            logging.error(f"获取任务状态失败: {e}")
            return error_response("获取任务状态失败", 500)

@api.route('/trigger/<job_id>')
class JobTrigger(Resource):
    @api.doc('trigger_job')
    @require_api_key
    def post(self, job_id):
        """立即触发任务"""
        try:
            if not scheduler:
                return error_response("调度器未初始化", 500)
            
            job = scheduler.scheduler.get_job(job_id)
            if job:
                scheduler.scheduler.add_job(
                    job.func,
                    'date',
                    args=job.args,
                    kwargs=job.kwargs,
                    id=f'{job_id}_manual_{int(time.time())}',
                    name=f'{job.name}_手动执行'
                )
                return success_response({'message': f'任务 {job_id} 已触发'})
            else:
                return error_response("任务不存在", 404)
                
        except Exception as e:
            logging.error(f"触发任务失败: {e}")
            return error_response("触发任务失败", 500)
```

---

## 🔧 五、错误处理和日志记录

### 5.1 全局错误处理

```python
# error_handlers.py
from flask import Flask, jsonify
from flask_restx import Api
import logging
import traceback
from datetime import datetime

def register_error_handlers(app: Flask):
    """注册错误处理器"""
    
    @app.errorhandler(400)
    def bad_request(error):
        """400错误处理"""
        logging.warning(f"Bad Request: {error.description}")
        return jsonify({
            'success': False,
            'error': {
                'code': 400,
                'message': '请求参数错误',
                'details': error.description if hasattr(error, 'description') else '无效的请求'
            },
            'timestamp': datetime.now().isoformat()
        }), 400
    
    @app.errorhandler(401)
    def unauthorized(error):
        """401错误处理"""
        logging.warning(f"Unauthorized: {error.description}")
        return jsonify({
            'success': False,
            'error': {
                'code': 401,
                'message': '未授权访问',
                'details': '请提供有效的API密钥'
            },
            'timestamp': datetime.now().isoformat()
        }), 401
    
    @app.errorhandler(403)
    def forbidden(error):
        """403错误处理"""
        logging.warning(f"Forbidden: {error.description}")
        return jsonify({
            'success': False,
            'error': {
                'code': 403,
                'message': '禁止访问',
                'details': error.description if hasattr(error, 'description') else '权限不足'
            },
            'timestamp': datetime.now().isoformat()
        }), 403
    
    @app.errorhandler(404)
    def not_found(error):
        """404错误处理"""
        logging.info(f"Resource Not Found: {error.description}")
        return jsonify({
            'success': False,
            'error': {
                'code': 404,
                'message': '资源不存在',
                'details': '请求的资源未找到'
            },
            'timestamp': datetime.now().isoformat()
        }), 404
    
    @app.errorhandler(405)
    def method_not_allowed(error):
        """405错误处理"""
        logging.warning(f"Method Not Allowed: {error.method}")
        return jsonify({
            'success': False,
            'error': {
                'code': 405,
                'message': '方法不允许',
                'details': f'不支持的HTTP方法: {error.method}'
            },
            'timestamp': datetime.now().isoformat()
        }), 405
    
    @app.errorhandler(422)
    def unprocessable_entity(error):
        """422错误处理"""
        logging.warning(f"Unprocessable Entity: {error.description}")
        return jsonify({
            'success': False,
            'error': {
                'code': 422,
                'message': '数据验证失败',
                'details': error.description if hasattr(error, 'description') else '请求数据格式错误'
            },
            'timestamp': datetime.now().isoformat()
        }), 422
    
    @app.errorhandler(429)
    def too_many_requests(error):
        """429错误处理"""
        logging.warning(f"Too Many Requests: {error.description}")
        return jsonify({
            'success': False,
            'error': {
                'code': 429,
                'message': '请求过于频繁',
                'details': '请降低请求频率'
            },
            'timestamp': datetime.now().isoformat()
        }), 429
    
    @app.errorhandler(500)
    def internal_server_error(error):
        """500错误处理"""
        logging.error(f"Internal Server Error: {error}")
        logging.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': '服务器内部错误',
                'details': '服务器处理请求时发生错误，请稍后重试'
            },
            'timestamp': datetime.now().isoformat()
        }), 500
    
    @app.errorhandler(502)
    def bad_gateway(error):
        """502错误处理"""
        logging.error(f"Bad Gateway: {error}")
        return jsonify({
            'success': False,
            'error': {
                'code': 502,
                'message': '网关错误',
                'details': '上游服务器返回无效响应'
            },
            'timestamp': datetime.now().isoformat()
        }), 502
    
    @app.errorhandler(503)
    def service_unavailable(error):
        """503错误处理"""
        logging.error(f"Service Unavailable: {error}")
        return jsonify({
            'success': False,
            'error': {
                'code': 503,
                'message': '服务不可用',
                'details': '服务器暂时过载或正在维护中'
            },
            'timestamp': datetime.now().isoformat()
        }), 503

# 异常类定义
class APIException(Exception):
    """API异常基类"""
    def __init__(self, message, status_code=400, error_code=None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.error_code = error_code

class ValidationError(APIException):
    """数据验证错误"""
    def __init__(self, message="数据验证失败"):
        super().__init__(message, 422, 'VALIDATION_ERROR')

class NotFoundError(APIException):
    """资源未找到错误"""
    def __init__(self, message="资源不存在"):
        super().__init__(message, 404, 'NOT_FOUND')

class UnauthorizedError(APIException):
    """未授权错误"""
    def __init__(self, message="未授权访问"):
        super().__init__(message, 401, 'UNAUTHORIZED')

class ForbiddenError(APIException):
    """禁止访问错误"""
    def __init__(self, message="禁止访问"):
        super().__init__(message, 403, 'FORBIDDEN')

class ConflictError(APIException):
    """资源冲突错误"""
    def __init__(self, message="资源冲突"):
        super().__init__(message, 409, 'CONFLICT')

class RateLimitError(APIException):
    """频率限制错误"""
    def __init__(self, message="请求过于频繁"):
        super().__init__(message, 429, 'RATE_LIMIT')

# 异常处理器
def handle_api_exception(error):
    """处理API异常"""
    response = {
        'success': False,
        'error': {
            'code': error.error_code or 'API_ERROR',
            'message': error.message,
            'details': str(error)
        },
        'timestamp': datetime.now().isoformat()
    }
    return jsonify(response), error.status_code

# 注册API异常处理器
def register_api_exception_handlers(api: Api):
    """注册API异常处理器"""
    api.error_handler(APIException)(handle_api_exception)
    api.error_handler(ValidationError)(handle_api_exception)
    api.error_handler(NotFoundError)(handle_api_exception)
    api.error_handler(UnauthorizedError)(handle_api_exception)
    api.error_handler(ForbiddenError)(handle_api_exception)
    api.error_handler(ConflictError)(handle_api_exception)
    api.error_handler(RateLimitError)(handle_api_exception)
```

### 5.2 日志配置

```python
# logging_config.py
import logging
import logging.handlers
import os
from datetime import datetime

def setup_logging(app):
    """配置日志"""
    
    # 创建日志目录
    log_dir = app.config.get('LOG_DIR', 'logs')
    os.makedirs(log_dir, exist_ok=True)
    
    # 配置日志格式
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s'
    )
    
    # 配置根日志记录器
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    
    # 文件日志处理器（按日期轮转）
    file_handler = logging.handlers.TimedRotatingFileHandler(
        filename=os.path.join(log_dir, 'app.log'),
        when='midnight',
        interval=1,
        backupCount=30,
        encoding='utf-8'
    )
    file_handler.setFormatter(formatter)
    file_handler.setLevel(logging.INFO)
    
    # 错误日志处理器
    error_handler = logging.handlers.TimedRotatingFileHandler(
        filename=os.path.join(log_dir, 'error.log'),
        when='midnight',
        interval=1,
        backupCount=90,
        encoding='utf-8'
    )
    error_handler.setFormatter(formatter)
    error_handler.setLevel(logging.ERROR)
    
    # 控制台日志处理器
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    console_handler.setLevel(logging.WARNING)
    
    # 添加处理器
    root_logger.addHandler(file_handler)
    root_logger.addHandler(error_handler)
    root_logger.addHandler(console_handler)
    
    # 配置特定模块的日志级别
    logging.getLogger('urllib3').setLevel(logging.WARNING)
    logging.getLogger('requests').setLevel(logging.WARNING)
    logging.getLogger('apscheduler').setLevel(logging.WARNING)
    logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)
    
    logging.info("日志系统初始化完成")

class APILogger:
    """API访问日志记录器"""
    
    @staticmethod
    def log_request(request_data):
        """记录API请求"""
        logging.info(f"API Request: {request_data}")
    
    @staticmethod
    def log_response(response_data):
        """记录API响应"""
        logging.info(f"API Response: {response_data}")
    
    @staticmethod
    def log_error(error_data):
        """记录API错误"""
        logging.error(f"API Error: {error_data}")

class DatabaseLogger:
    """数据库操作日志记录器"""
    
    @staticmethod
    def log_query(query, params=None):
        """记录数据库查询"""
        logging.debug(f"DB Query: {query} - Params: {params}")
    
    @staticmethod
    def log_transaction(operation, duration):
        """记录数据库事务"""
        logging.info(f"DB Transaction: {operation} - Duration: {duration}s")

class CrawlerLogger:
    """爬虫操作日志记录器"""
    
    @staticmethod
    def log_crawl_start(url, hospital_id):
        """记录爬取开始"""
        logging.info(f"Crawl Start: URL={url}, Hospital ID={hospital_id}")
    
    @staticmethod
    def log_crawl_success(url, records_found, duration):
        """记录爬取成功"""
        logging.info(f"Crawl Success: URL={url}, Records={records_found}, Duration={duration}s")
    
    @staticmethod
    def log_crawl_error(url, error, hospital_id):
        """记录爬取错误"""
        logging.error(f"Crawl Error: URL={url}, Error={error}, Hospital ID={hospital_id}")
```

---

## 🎯 六、总结

本Flask后端API系统设计提供了：

### 6.1 核心功能
1. **完整的RESTful API** - 支持医院管理、行政区划、招投标数据等所有功能
2. **智能任务调度** - APScheduler定时任务，支持全量扫描、增量监控等
3. **完善的错误处理** - 全局错误处理器，标准化错误响应
4. **全面的日志记录** - 多级别日志，支持文件轮转和分级记录
5. **API安全控制** - 访问频率限制、API密钥验证
6. **数据导出功能** - 支持Excel格式的招投标数据导出

### 6.2 技术特点
- **标准化设计** - 遵循RESTful API设计原则
- **模块化架构** - 清晰的层级分离，易于维护和扩展
- **高效性能** - 连接池、缓存优化、异步处理
- **健壮性保证** - 完善的错误处理和异常恢复机制
- **可观测性** - 全面的日志和监控支持

### 6.3 预期性能
- **API响应时间** ≤ 200ms（简单查询）
- **并发处理能力** 支持100+并发请求
- **定时任务准确性** ≥ 99%
- **系统可用性** ≥ 99.5%
- **数据导出速度** 10,000条记录 ≤ 30秒

该系统为前端界面和外部集成提供了稳定、高效的API服务支撑，确保整个医院招投标监控系统的可靠运行。

**下一步：** 基于此设计方案，实现具体的业务服务层和前端界面开发。