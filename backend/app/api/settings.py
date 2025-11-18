"""
系统设置API

提供系统配置参数的查询和修改接口。

作者：MiniMax Agent
版本：v1.0
日期：2025-11-18
"""

from flask import request, current_app
from app.api import bp
from app.models import Settings
from app import db
from app.utils.response import success_response, error_response

@bp.route('/settings', methods=['GET'])
def get_settings():
    """获取所有系统设置"""
    
    try:
        category = request.args.get('category')
        search = request.args.get('search', '')
        
        # 构建查询
        query = Settings.query
        
        if category:
            query = query.filter(Settings.category == category)
        
        if search:
            query = query.filter(
                Settings.key.ilike(f'%{search}%') |
                Settings.description.ilike(f'%{search}%')
            )
        
        # 按分类和键名排序
        query = query.order_by(Settings.category, Settings.key)
        
        settings_data = []
        for setting in query.all():
            settings_data.append({
                'id': setting.id,
                'key': setting.key,
                'value': setting.value,
                'description': setting.description,
                'data_type': setting.data_type,
                'category': setting.category,
                'is_encrypted': setting.is_encrypted,
                'created_at': setting.created_at.isoformat() if setting.created_at else None,
                'updated_at': setting.updated_at.isoformat() if setting.updated_at else None
            })
        
        # 按分类汇总
        categories = {}
        for setting in settings_data:
            cat = setting['category']
            if cat not in categories:
                categories[cat] = []
            categories[cat].append(setting)
        
        return success_response({
            'settings': settings_data,
            'categories': categories,
            'total_count': len(settings_data)
        })
        
    except Exception as e:
        current_app.logger.error(f'获取系统设置失败: {str(e)}')
        return error_response('获取设置失败', 500)

@bp.route('/settings/<key>', methods=['GET'])
def get_setting(key):
    """获取指定设置项"""
    
    try:
        setting = Settings.query.filter_by(key=key).first()
        if not setting:
            return error_response('设置项不存在', 404)
        
        return success_response({
            'setting': {
                'id': setting.id,
                'key': setting.key,
                'value': setting.value,
                'description': setting.description,
                'data_type': setting.data_type,
                'category': setting.category,
                'is_encrypted': setting.is_encrypted,
                'created_at': setting.created_at.isoformat() if setting.created_at else None,
                'updated_at': setting.updated_at.isoformat() if setting.updated_at else None
            }
        })
        
    except Exception as e:
        current_app.logger.error(f'获取设置项失败: {str(e)}')
        return error_response('获取设置项失败', 500)

@bp.route('/settings/<key>', methods=['PUT'])
def update_setting(key):
    """更新指定设置项"""
    
    data = request.get_json()
    if not data or 'value' not in data:
        return error_response('设置值不能为空', 400)
    
    try:
        setting = Settings.query.filter_by(key=key).first()
        if not setting:
            return error_response('设置项不存在', 404)
        
        # 数据类型验证和转换
        value = data['value']
        if setting.data_type == 'integer':
            try:
                value = int(value)
            except ValueError:
                return error_response(f'设置值应为整数类型', 400)
        
        elif setting.data_type == 'float':
            try:
                value = float(value)
            except ValueError:
                return error_response(f'设置值应为浮点数类型', 400)
        
        elif setting.data_type == 'boolean':
            if isinstance(value, str):
                value = value.lower() in ('true', '1', 'yes', 'on')
            else:
                value = bool(value)
        
        # 更新设置值
        setting.value = str(value)
        if 'description' in data:
            setting.description = data['description']
        
        db.session.commit()
        
        return success_response({
            'key': setting.key,
            'value': setting.value,
            'message': '设置更新成功'
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'更新设置项失败: {str(e)}')
        return error_response('更新设置失败', 500)

@bp.route('/settings/batch', methods=['PUT'])
def batch_update_settings():
    """批量更新设置项"""
    
    data = request.get_json()
    if not data or 'settings' not in data:
        return error_response('设置数据不能为空', 400)
    
    settings_to_update = data['settings']
    
    if not isinstance(settings_to_update, list):
        return error_response('设置数据格式错误', 400)
    
    try:
        updated_count = 0
        errors = []
        
        for item in settings_to_update:
            key = item.get('key')
            value = item.get('value')
            
            if not key or value is None:
                errors.append(f'设置项缺少键名或值: {item}')
                continue
            
            setting = Settings.query.filter_by(key=key).first()
            if not setting:
                errors.append(f'设置项不存在: {key}')
                continue
            
            try:
                # 数据类型验证和转换
                if setting.data_type == 'integer':
                    value = int(value)
                elif setting.data_type == 'float':
                    value = float(value)
                elif setting.data_type == 'boolean':
                    if isinstance(value, str):
                        value = value.lower() in ('true', '1', 'yes', 'on')
                    else:
                        value = bool(value)
                
                setting.value = str(value)
                updated_count += 1
                
            except ValueError as e:
                errors.append(f'设置项 {key} 数据类型错误: {str(e)}')
        
        if updated_count > 0:
            db.session.commit()
        
        return success_response({
            'updated_count': updated_count,
            'errors': errors,
            'message': f'成功更新 {updated_count} 个设置项'
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'批量更新设置失败: {str(e)}')
        return error_response('批量更新设置失败', 500)

@bp.route('/settings/categories', methods=['GET'])
def get_setting_categories():
    """获取所有设置分类"""
    
    try:
        categories = db.session.query(
            Settings.category,
            db.func.count(Settings.id).label('count')
        ).group_by(Settings.category).all()
        
        categories_data = []
        for cat, count in categories:
            categories_data.append({
                'category': cat,
                'count': count
            })
        
        return success_response({
            'categories': categories_data
        })
        
    except Exception as e:
        current_app.logger.error(f'获取设置分类失败: {str(e)}')
        return error_response('获取分类失败', 500)

@bp.route('/settings/reset', methods=['POST'])
def reset_settings():
    """重置设置到默认值"""
    
    data = request.get_json() or {}
    category = data.get('category')
    keys = data.get('keys', [])
    
    try:
        query = Settings.query
        
        if category:
            query = query.filter(Settings.category == category)
        
        if keys:
            query = query.filter(Settings.key.in_(keys))
        
        # 这里应该从默认配置中恢复值
        # 目前只是重置到模拟的默认值
        updated_count = 0
        for setting in query.all():
            if setting.key == 'crawler.max_concurrent':
                setting.value = '5'
            elif setting.key == 'crawler.request_timeout':
                setting.value = '30'
            elif setting.key == 'scheduler.tender_scan_interval':
                setting.value = '6'
            elif setting.key == 'scheduler.hospital_scan_interval':
                setting.value = '24'
            elif setting.key == 'export.max_records':
                setting.value = '50000'
            else:
                # 默认处理：如果是布尔类型设为false，数值类型设为0，其他类型设为空
                if setting.data_type == 'boolean':
                    setting.value = 'false'
                elif setting.data_type in ['integer', 'float']:
                    setting.value = '0'
                else:
                    setting.value = ''
            
            updated_count += 1
        
        db.session.commit()
        
        return success_response({
            'updated_count': updated_count,
            'message': f'已重置 {updated_count} 个设置项'
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'重置设置失败: {str(e)}')
        return error_response('重置设置失败', 500)