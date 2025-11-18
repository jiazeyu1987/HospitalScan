"""
API蓝图

提供系统中所有RESTful API接口的实现，
包括医院管理、爬虫控制、招投标监控等功能。

作者：MiniMax Agent
版本：v1.0
日期：2025-11-18
"""

from flask import Blueprint

# 创建API蓝图
bp = Blueprint('api', __name__)

# 延迟导入各个API模块（在模块内部注册路由）
def init_api():
    """初始化API路由"""
    pass