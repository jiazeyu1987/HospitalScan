"""
响应工具函数

提供统一的API响应格式，包括成功响应和错误响应，
确保所有API接口返回的数据格式一致。

作者：MiniMax Agent
版本：v1.0
日期：2025-11-18
"""

from flask import jsonify
from datetime import datetime

def success_response(data=None, status_code=200, message='操作成功'):
    """
    返回成功响应
    
    Args:
        data: 响应数据
        status_code: HTTP状态码
        message: 响应消息
    
    Returns:
        JSON响应
    """
    response = {
        'success': True,
        'code': status_code,
        'message': message,
        'timestamp': datetime.utcnow().isoformat()
    }
    
    if data is not None:
        response['data'] = data
    
    return jsonify(response), status_code

def error_response(message, status_code=400, details=None):
    """
    返回错误响应
    
    Args:
        message: 错误消息
        status_code: HTTP状态码
        details: 错误详情
    
    Returns:
        JSON响应
    """
    response = {
        'success': False,
        'code': status_code,
        'message': message,
        'timestamp': datetime.utcnow().isoformat()
    }
    
    if details:
        response['details'] = details
    
    return jsonify(response), status_code

def validation_error_response(errors, message='数据验证失败'):
    """
    返回数据验证错误响应
    
    Args:
        errors: 验证错误详情
        message: 错误消息
    
    Returns:
        JSON响应
    """
    response = {
        'success': False,
        'code': 400,
        'message': message,
        'errors': errors,
        'timestamp': datetime.utcnow().isoformat()
    }
    
    return jsonify(response), 400

def not_found_response(resource='资源'):
    """
    返回资源未找到响应
    
    Args:
        resource: 资源类型
    
    Returns:
        JSON响应
    """
    return error_response(f'{resource}未找到', 404)

def unauthorized_response(message='未授权访问'):
    """
    返回未授权响应
    
    Args:
        message: 错误消息
    
    Returns:
        JSON响应
    """
    return error_response(message, 401)

def forbidden_response(message='禁止访问'):
    """
    返回禁止访问响应
    
    Args:
        message: 错误消息
    
    Returns:
        JSON响应
    """
    return error_response(message, 403)

def internal_error_response(message='服务器内部错误'):
    """
    返回服务器内部错误响应
    
    Args:
        message: 错误消息
    
    Returns:
        JSON响应
    """
    return error_response(message, 500)