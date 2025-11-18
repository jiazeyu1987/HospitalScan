"""
系统健康检查API

提供系统状态监控和健康检查功能。

作者：MiniMax Agent
版本：v1.0
日期：2025-11-18
"""

from flask import request
from app.api import bp
from app.utils.response import success_response, error_response

@bp.route('/health', methods=['GET'])
def health_check():
    """系统健康检查"""
    return success_response({
        'status': 'healthy',
        'message': '系统运行正常',
        'timestamp': '2025-11-18T13:25:00Z'
    })

@bp.route('/version', methods=['GET'])
def get_version():
    """获取系统版本信息"""
    return success_response({
        'version': '1.0.0',
        'name': '全国医院官网扫描与招投标监控系统',
        'author': 'MiniMax Agent',
        'date': '2025-11-18'
    })