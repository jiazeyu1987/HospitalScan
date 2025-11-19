"""
全国医院官网扫描与招投标监控系统 - Flask应用

这是一个基于Flask的医院信息监控和招投标追踪系统，
提供完整的医院官网扫描、招投标监控和数据导出功能。

主要功能：
- 全国医院官网自动发现和验证
- 招投标信息自动提取和监控
- 多维度数据查询和导出
- 定时任务调度和监控

作者：MiniMax Agent
版本：v1.0
日期：2025-11-18
"""

import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from datetime import datetime, timedelta
import logging
from logging.handlers import RotatingFileHandler

# 导入配置
from config import Config

# 初始化扩展
db = SQLAlchemy()
migrate = Migrate()

# 创建应用工厂函数
def create_app(config_name=None):
    """Flask应用工厂函数"""
    
    # 获取配置
    if config_name is None:
        config_name = os.environ.get('FLASK_CONFIG', 'default')
    
    from config import get_config
    config_class = get_config()
    
    # 创建Flask应用
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # 初始化扩展
    db.init_app(app)
    migrate.init_app(app, db)
    
    # 配置CORS
    CORS(app, origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173", "http://127.0.0.1:5173"])
    
    # 配置日志
    configure_logging(app)
    
    # 注册蓝图
    register_blueprints(app)
    
    # 配置错误处理
    configure_error_handlers(app)
    
    # 创建数据库表
    with app.app_context():
        # 先检查表是否存在，如果不存在则创建
        db.create_all()
        
        # 初始化基础数据（只在开发环境下进行）
        if config_class.DEBUG:
            from app.models.initial_data import init_basic_data
            init_basic_data()
        
        # 启动任务调度器
        from app.services.task_scheduler import start_scheduler
        start_scheduler()
    
    @app.before_request
    def before_request():
        """请求前置处理"""
        request.start_time = datetime.now()
    
    @app.after_request
    def after_request(response):
        """请求后置处理"""
        # 添加响应头
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        
        # 记录请求耗时
        if hasattr(request, 'start_time'):
            duration = (datetime.now() - request.start_time).total_seconds()
            app.logger.info(f'Request: {request.method} {request.path} - {response.status_code} - {duration:.3f}s')
        
        return response
    
    return app

def configure_logging(app):
    """配置应用日志"""
    
    # 确保日志目录存在
    log_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'logs')
    os.makedirs(log_dir, exist_ok=True)
    
    # 配置日志格式
    formatter = logging.Formatter(
        '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
    )
    
    # 文件日志处理器
    file_handler = RotatingFileHandler(
        os.path.join(log_dir, 'hospital_monitor.log'),
        maxBytes=10485760,  # 10MB
        backupCount=10
    )
    file_handler.setFormatter(formatter)
    file_handler.setLevel(logging.INFO)
    app.logger.addHandler(file_handler)
    
    # 控制台日志处理器
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    console_handler.setLevel(logging.INFO)
    app.logger.addHandler(console_handler)
    
    app.logger.setLevel(logging.INFO)
    app.logger.info('医院监控系统启动')

def register_blueprints(app):
    """注册蓝图"""

    # 注册API蓝图
    from app.api import bp as api_bp
    app.register_blueprint(api_bp, url_prefix='/api/v1')

    # 注册管理员蓝图（如果需要）
    # from app.admin import bp as admin_bp
    # app.register_blueprint(admin_bp, url_prefix='/admin')

    # 添加必要的API路由
    @app.route('/api/v1/health')
    def health_check():
        return {'status': 'success', 'data': {'status': 'healthy', 'message': '系统运行正常'}}

    @app.route('/api/v1/statistics')
    def general_statistics():
        return {
            'status': 'success',
            'data': {
                'hospitals': {'total': 0, 'verified': 0},
                'tenders': {'total': 0, 'recent': 0},
                'scans': {'today': 0, 'total': 0, 'success_rate': 0},
                'last_update': '2025-11-19T10:00:00'
            }
        }

    @app.route('/api/v1/statistics/dashboard')
    def dashboard_statistics():
        return {
            'status': 'success',
            'data': {
                'hospitals': {'total': 0, 'verified': 0, 'unverified': 0},
                'tenders': {'total': 0, 'recent': 0},
                'scans': {'today': 0, 'total': 0, 'success_rate': 0},
                'last_update': '2025-11-19T10:00:00'
            }
        }

    @app.route('/api/v1/statistics/trend')
    def trend_statistics():
        return {
            'status': 'success',
            'data': {
                'granularity': 'daily',
                'period': {'start': '2025-10-19', 'end': '2025-11-19'},
                'tender_trend': {},
                'scan_trend': {},
                'last_update': '2025-11-19T10:00:00'
            }
        }

    @app.route('/api/v1/crawler/status')
    def crawler_status():
        return {
            'status': 'success',
            'data': {
                'status': 'stopped',
                'uptime': '0:00:00',
                'scanned_hospitals': 0,
                'found_tenders': 0
            }
        }

    @app.route('/api/v1/test')
    def test():
        return {'status': 'success', 'message': 'API is working'}

def configure_error_handlers(app):
    """配置错误处理器"""
    
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({
            'error': 'Bad Request',
            'message': '请求参数错误',
            'status_code': 400
        }), 400
    
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            'error': 'Not Found',
            'message': '资源未找到',
            'status_code': 404
        }), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return jsonify({
            'error': 'Internal Server Error',
            'message': '服务器内部错误',
            'status_code': 500
        }), 500