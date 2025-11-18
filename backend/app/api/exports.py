"""
数据导出API

提供各类数据的导出功能接口。

作者：MiniMax Agent
版本：v1.0
日期：2025-11-18
"""

from flask import request
from app.api import bp
from app.utils.response import success_response, error_response

@bp.route('/exports/hospitals', methods=['POST'])
def export_hospitals():
    """导出医院数据"""
    return success_response({'message': '医院数据导出功能开发中...'})

@bp.route('/exports/tenders', methods=['POST'])
def export_tenders():
    """导出招投标数据"""
    return success_response({'message': '招投标数据导出功能开发中...'})