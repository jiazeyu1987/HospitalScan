"""
装饰器工具

提供常用的装饰器，包括：
- 分页装饰器
- JSON请求验证装饰器
- 权限检查装饰器
- 请求频率限制装饰器

作者：MiniMax Agent
版本：v1.0
日期：2025-11-18
"""

from functools import wraps
from flask import request, jsonify, current_app
from werkzeug.exceptions import BadRequest

def paginate(per_page_default=20, max_per_page=100):
    """
    分页装饰器
    
    Args:
        per_page_default: 默认每页数量
        max_per_page: 最大每页数量
    
    Returns:
        装饰后的函数
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # 从查询参数获取分页信息
            page = request.args.get('page', 1, type=int)
            per_page = request.args.get('per_page', per_page_default, type=int)
            
            # 验证分页参数
            if page < 1:
                page = 1
            if per_page < 1:
                per_page = per_page_default
            if per_page > max_per_page:
                per_page = max_per_page
            
            # 添加到kwargs中
            kwargs['page'] = page
            kwargs['per_page'] = per_page
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def require_json(required_fields=None, allow_empty=True):
    """
    JSON请求验证装饰器
    
    Args:
        required_fields: 必填字段列表
        allow_empty: 是否允许空JSON
    
    Returns:
        装饰后的函数
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # 检查Content-Type
            if not request.is_json:
                return jsonify({
                    'success': False,
                    'code': 400,
                    'message': '请求必须是JSON格式',
                    'timestamp': datetime.utcnow().isoformat()
                }), 400
            
            try:
                data = request.get_json()
                if data is None:
                    data = {}
                
                # 检查是否为空的JSON
                if not allow_empty and not data:
                    return jsonify({
                        'success': False,
                        'code': 400,
                        'message': '请求体不能为空',
                        'timestamp': datetime.utcnow().isoformat()
                    }), 400
                
                # 验证必填字段
                if required_fields:
                    missing_fields = []
                    for field in required_fields:
                        if field not in data or data[field] is None or (isinstance(data[field], str) and not data[field].strip()):
                            missing_fields.append(field)
                    
                    if missing_fields:
                        return jsonify({
                            'success': False,
                            'code': 400,
                            'message': f'缺少必填字段: {", ".join(missing_fields)}',
                            'errors': {field: '此字段为必填项' for field in missing_fields},
                            'timestamp': datetime.utcnow().isoformat()
                        }), 400
                
                # 将数据添加到kwargs中
                kwargs['json_data'] = data
                
                return f(*args, **kwargs)
                
            except BadRequest:
                return jsonify({
                    'success': False,
                    'code': 400,
                    'message': 'JSON格式错误',
                    'timestamp': datetime.utcnow().isoformat()
                }), 400
            except Exception as e:
                current_app.logger.error(f'JSON解析错误: {str(e)}')
                return jsonify({
                    'success': False,
                    'code': 400,
                    'message': '请求数据处理错误',
                    'timestamp': datetime.utcnow().isoformat()
                }), 400
        return decorated_function
    return decorator

def rate_limit(requests_per_hour=100):
    """
    简单的请求频率限制装饰器（内存版，生产环境建议使用Redis）
    
    Args:
        requests_per_hour: 每小时最大请求数
    
    Returns:
        装饰后的函数
    """
    from collections import defaultdict
    from datetime import datetime, timedelta
    
    # 简单的内存存储（实际生产环境应该使用Redis）
    request_counts = defaultdict(list)
    
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            client_ip = request.remote_addr or 'unknown'
            current_time = datetime.utcnow()
            
            # 清理过期记录（1小时前的）
            cutoff_time = current_time - timedelta(hours=1)
            request_counts[client_ip] = [
                t for t in request_counts[client_ip] 
                if t > cutoff_time
            ]
            
            # 检查是否超过限制
            if len(request_counts[client_ip]) >= requests_per_hour:
                return jsonify({
                    'success': False,
                    'code': 429,
                    'message': f'请求过于频繁，请稍后再试（限制: {requests_per_hour}/小时）',
                    'timestamp': current_time.isoformat()
                }), 429
            
            # 记录请求时间
            request_counts[client_ip].append(current_time)
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def validate_params(*param_names, types=None, required=True, default_values=None):
    """
    参数验证装饰器
    
    Args:
        param_names: 参数名列表
        types: 参数类型字典 {param_name: type}
        required: 是否为必填参数
        default_values: 默认值字典 {param_name: default_value}
    
    Returns:
        装饰后的函数
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            errors = {}
            validated_params = {}
            
            for param_name in param_names:
                # 获取参数值
                param_value = request.args.get(param_name)
                
                # 检查是否为必填参数
                if required and param_value is None:
                    errors[param_name] = '此参数为必填项'
                    continue
                
                # 设置默认值
                if param_value is None and default_values and param_name in default_values:
                    param_value = default_values[param_name]
                
                # 类型转换
                if param_value is not None and types and param_name in types:
                    try:
                        if types[param_name] == int:
                            param_value = int(param_value)
                        elif types[param_name] == float:
                            param_value = float(param_value)
                        elif types[param_name] == bool:
                            param_value = param_value.lower() in ('true', '1', 'yes', 'on')
                    except (ValueError, TypeError):
                        errors[param_name] = f'参数类型错误，应为{types[param_name].__name__}'
                        continue
                
                validated_params[param_name] = param_value
            
            # 如果有错误，返回错误响应
            if errors:
                return jsonify({
                    'success': False,
                    'code': 400,
                    'message': '参数验证失败',
                    'errors': errors,
                    'timestamp': datetime.utcnow().isoformat()
                }), 400
            
            # 将验证后的参数添加到kwargs
            kwargs.update(validated_params)
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def log_request(logger=None):
    """
    请求日志装饰器
    
    Args:
        logger: 日志记录器，默认使用Flask应用的logger
    
    Returns:
        装饰后的函数
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            start_time = datetime.utcnow()
            
            # 记录请求开始
            if logger:
                logger.info(f"API请求开始: {request.method} {request.path}")
            else:
                current_app.logger.info(f"API请求开始: {request.method} {request.path}")
            
            try:
                # 执行原函数
                response = f(*args, **kwargs)
                
                # 计算响应时间
                duration = (datetime.utcnow() - start_time).total_seconds()
                
                # 记录成功响应
                if logger:
                    logger.info(f"API请求成功: {request.method} {request.path} - {duration:.3f}s")
                else:
                    current_app.logger.info(f"API请求成功: {request.method} {request.path} - {duration:.3f}s")
                
                return response
                
            except Exception as e:
                # 计算响应时间
                duration = (datetime.utcnow() - start_time).total_seconds()
                
                # 记录错误
                error_msg = f"API请求失败: {request.method} {request.path} - {str(e)} - {duration:.3f}s"
                if logger:
                    logger.error(error_msg)
                else:
                    current_app.logger.error(error_msg)
                
                raise
        
        return decorated_function
    return decorator

# 导入datetime
from datetime import datetime