"""
医院管理API

提供医院信息的增删改查接口，包括：
- 医院列表查询和分页
- 医院详情获取
- 新增医院
- 更新医院信息
- 删除医院
- 医院官网验证
- 批量操作

作者：MiniMax Agent
版本：v1.0
日期：2025-11-18
"""

from flask import request, jsonify, current_app
from sqlalchemy import or_, and_
from datetime import datetime, timedelta
import hashlib
from app.api import bp
from app.models import Hospital, HospitalAlias, Region, TenderRecord
from app import db
from app.services.crawler_service import verify_website
from app.utils.response import success_response, error_response

@bp.route('/hospitals', methods=['GET'])
def get_hospitals():
    """获取医院列表"""
    
    # 获取查询参数
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 20, type=int), 100)
    search = request.args.get('search', '')
    
    # 构建查询
    query = Hospital.query
    
    # 搜索过滤
    if search:
        search_filter = or_(
            Hospital.name.ilike(f'%{search}%'),
            Hospital.official_name.ilike(f'%{search}%'),
            Hospital.address.ilike(f'%{search}%')
        )
        query = query.filter(search_filter)
    
    # 分页
    pagination = query.paginate(
        page=page,
        per_page=per_page,
        error_out=False
    )
    
    hospitals_data = []
    for hospital in pagination.items:
        hospital_dict = {
            'id': hospital.id,
            'name': hospital.name,
            'official_name': hospital.official_name,
            'hospital_type': hospital.hospital_type,
            'hospital_level': hospital.hospital_level,
            'status': hospital.status,
            'verified': hospital.verified,
            'region_name': hospital.region.name if hospital.region else None,
            'tender_count': hospital.tender_count,
            'created_at': hospital.created_at.isoformat() if hospital.created_at else None
        }
        hospitals_data.append(hospital_dict)
    
    return success_response({
        'hospitals': hospitals_data,
        'pagination': {
            'page': pagination.page,
            'per_page': pagination.per_page,
            'total': pagination.total,
            'pages': pagination.pages,
            'has_next': pagination.has_next,
            'has_prev': pagination.has_prev
        }
    })

@bp.route('/hospitals/<int:hospital_id>', methods=['GET'])
def get_hospital(hospital_id):
    """获取医院详情"""
    
    hospital = Hospital.query.get_or_404(hospital_id)
    
    hospital_dict = {
        'id': hospital.id,
        'name': hospital.name,
        'official_name': hospital.official_name,
        'short_name': hospital.short_name,
        'english_name': hospital.english_name,
        'website_url': hospital.website_url,
        'hospital_type': hospital.hospital_type,
        'hospital_level': hospital.hospital_level,
        'ownership': hospital.ownership,
        'region_name': hospital.region.name if hospital.region else None,
        'address': hospital.address,
        'phone': hospital.phone,
        'email': hospital.email,
        'status': hospital.status,
        'verified': hospital.verified,
        'verification_date': hospital.verification_date.isoformat() if hospital.verification_date else None,
        'tender_count': hospital.tender_count,
        'description': hospital.description,
        'specialties': hospital.specialties,
        'created_at': hospital.created_at.isoformat() if hospital.created_at else None,
        'updated_at': hospital.updated_at.isoformat() if hospital.updated_at else None
    }
    
    return success_response({'hospital': hospital_dict})

@bp.route('/hospitals', methods=['POST'])
def create_hospital():
    """创建新医院"""
    
    data = request.get_json()
    if not data:
        return error_response('请求体不能为空', 400)
    
    # 验证必填字段
    if not data.get('name'):
        return error_response('医院名称不能为空', 400)
    
    if not data.get('region_id'):
        return error_response('所属行政区不能为空', 400)
    
    # 检查区域是否存在
    region = Region.query.get(data['region_id'])
    if not region:
        return error_response('指定的行政区不存在', 400)
    
    try:
        hospital = Hospital(
            name=data['name'],
            official_name=data.get('official_name'),
            short_name=data.get('short_name'),
            english_name=data.get('english_name'),
            website_url=data.get('website_url'),
            hospital_type=data.get('hospital_type', 'public'),
            hospital_level=data.get('hospital_level', 'unknown'),
            ownership=data.get('ownership', 'government'),
            region_id=data['region_id'],
            address=data.get('address'),
            phone=data.get('phone'),
            email=data.get('email'),
            description=data.get('description'),
            specialties=data.get('specialties')
        )
        
        db.session.add(hospital)
        db.session.commit()
        
        return success_response({
            'hospital_id': hospital.id,
            'message': '医院创建成功'
        }, 201)
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'创建医院失败: {str(e)}')
        return error_response('创建医院失败', 500)

@bp.route('/hospitals/<int:hospital_id>', methods=['PUT'])
def update_hospital(hospital_id):
    """更新医院信息"""
    
    hospital = Hospital.query.get_or_404(hospital_id)
    data = request.get_json()
    
    if not data:
        return error_response('请求体不能为空', 400)
    
    try:
        # 更新基本信息
        if 'name' in data and data['name']:
            hospital.name = data['name']
        
        if 'official_name' in data:
            hospital.official_name = data['official_name']
        
        if 'short_name' in data:
            hospital.short_name = data['short_name']
        
        if 'english_name' in data:
            hospital.english_name = data['english_name']
        
        if 'website_url' in data:
            hospital.website_url = data['website_url']
        
        if 'hospital_type' in data:
            hospital.hospital_type = data['hospital_type']
        
        if 'hospital_level' in data:
            hospital.hospital_level = data['hospital_level']
        
        if 'ownership' in data:
            hospital.ownership = data['ownership']
        
        if 'region_id' in data:
            region = Region.query.get(data['region_id'])
            if not region:
                return error_response('指定的行政区不存在', 400)
            hospital.region_id = data['region_id']
        
        if 'address' in data:
            hospital.address = data['address']
        
        if 'phone' in data:
            hospital.phone = data['phone']
        
        if 'email' in data:
            hospital.email = data['email']
        
        if 'status' in data:
            hospital.status = data['status']
        
        if 'description' in data:
            hospital.description = data['description']
        
        if 'specialties' in data:
            hospital.specialties = data['specialties']
        
        hospital.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return success_response({
            'hospital_id': hospital.id,
            'message': '医院信息更新成功'
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'更新医院失败: {str(e)}')
        return error_response('更新医院失败', 500)

@bp.route('/hospitals/<int:hospital_id>', methods=['DELETE'])
def delete_hospital(hospital_id):
    """删除医院"""
    
    hospital = Hospital.query.get_or_404(hospital_id)
    
    try:
        db.session.delete(hospital)
        db.session.commit()
        
        return success_response({
            'message': '医院删除成功'
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'删除医院失败: {str(e)}')
        return error_response('删除医院失败', 500)

@bp.route('/hospitals/<int:hospital_id>/verify', methods=['POST'])
def verify_hospital_website(hospital_id):
    """验证医院官网"""
    
    hospital = Hospital.query.get_or_404(hospital_id)
    
    if not hospital.website_url:
        return error_response('该医院没有设置官网URL', 400)
    
    try:
        # 调用验证服务
        verification_result = verify_website(hospital.website_url)
        
        # 更新医院验证信息
        hospital.verified = verification_result['is_valid']
        hospital.verification_date = datetime.utcnow()
        hospital.last_scan_time = datetime.utcnow()
        
        if verification_result['is_valid']:
            hospital.scan_success_count += 1
        else:
            hospital.scan_failed_count += 1
        
        db.session.commit()
        
        return success_response({
            'verification': verification_result,
            'message': '医院官网验证完成'
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'验证医院官网失败: {str(e)}')
        return error_response('验证医院官网失败', 500)

@bp.route('/hospitals/statistics', methods=['GET'])
def get_hospital_statistics():
    """获取医院统计信息"""
    
    try:
        # 基础统计
        total_hospitals = Hospital.query.count()
        verified_hospitals = Hospital.query.filter_by(verified=True).count()
        active_hospitals = Hospital.query.filter_by(status='active').count()
        
        # 按类型统计
        type_stats = {}
        for htype in ['public', 'private', 'community', 'specialized', 'traditional']:
            count = Hospital.query.filter_by(hospital_type=htype).count()
            type_stats[htype] = count
        
        return success_response({
            'overview': {
                'total_hospitals': total_hospitals,
                'verified_hospitals': verified_hospitals,
                'active_hospitals': active_hospitals,
                'verification_rate': round(verified_hospitals / total_hospitals * 100, 2) if total_hospitals > 0 else 0
            },
            'by_type': type_stats
        })
        
    except Exception as e:
        current_app.logger.error(f'获取医院统计信息失败: {str(e)}')
        return error_response('获取统计信息失败', 500)