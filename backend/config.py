"""
系统配置文件

根据环境变量或配置文件加载不同的配置参数，
支持开发和生产环境的不同设置。

作者：MiniMax Agent
版本：v1.0
日期：2025-11-18
"""

import os
from datetime import timedelta

class Config:
    """基础配置类"""
    
    # Flask基础配置
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    
    # 数据库配置
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///' + os.path.join(os.path.dirname(os.path.dirname(__file__)), 'hospital_monitor.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # 生产环境数据库配置（PostgreSQL）
    # DATABASE_URL=postgresql://username:password@localhost:5432/hospital_monitor
    
    # 缓存配置
    REDIS_URL = os.environ.get('REDIS_URL') or 'redis://localhost:6379/0'
    
    # API限流配置
    RATELIMIT_ENABLED = True
    RATELIMIT_DEFAULT = "100 per hour"
    
    # 爬虫配置
    CRAWLER_CONFIG = {
        'USER_AGENTS': [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ],
        'REQUEST_TIMEOUT': 30,  # 请求超时时间（秒）
        'MAX_RETRY': 3,         # 最大重试次数
        'DELAY_RANGE': (1, 5),  # 请求延迟范围（秒）
        'MAX_CONCURRENT': 5,    # 最大并发数
        'ROBOTS_TXT_CHECK': True,  # 是否检查robots.txt
    }
    
    # 搜索引擎API配置
    SEARCH_CONFIG = {
        'DUCKDUCKGO_ENABLED': True,
        'BAIDU_ENABLED': False,  # 需要API密钥
        'GOOGLE_ENABLED': False, # 需要API密钥
    }
    
    # 定时任务配置
    SCHEDULER_CONFIG = {
        'TENDER_SCAN_INTERVAL': 6,  # 招投标扫描间隔（小时）
        'HOSPITAL_SCAN_INTERVAL': 24,  # 医院扫描间隔（小时）
        'DAILY_REPORT_TIME': '02:00',  # 每日报告时间
    }
    
    # 文件上传配置
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB
    
    # 导出配置
    EXPORT_CONFIG = {
        'EXCEL_TEMPLATES_PATH': os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'templates'),
        'MAX_EXPORT_RECORDS': 50000,  # 最大导出记录数
    }
    
    # 日志配置
    LOG_LEVEL = os.environ.get('LOG_LEVEL') or 'INFO'
    LOG_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'logs', 'app.log')

class DevelopmentConfig(Config):
    """开发环境配置"""
    
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///hospital_monitor_dev.db'
    
    # 开发环境启用更多调试信息
    PROPAGATE_EXCEPTIONS = True

class ProductionConfig(Config):
    """生产环境配置"""
    
    DEBUG = False
    TESTING = False
    
    # 生产环境使用PostgreSQL
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'postgresql://user:password@localhost:5432/hospital_monitor'
    
    # 生产环境更严格的限流
    RATELIMIT_DEFAULT = "200 per hour"
    
    # 生产环境更严格的日志级别
    LOG_LEVEL = 'WARNING'

class TestingConfig(Config):
    """测试环境配置"""
    
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    WTF_CSRF_ENABLED = False

# 配置映射
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}

def get_config():
    """获取当前环境的配置"""
    config_name = os.environ.get('FLASK_CONFIG') or 'development'
    return config.get(config_name, config['development'])