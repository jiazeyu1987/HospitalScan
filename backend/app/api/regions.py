"""
行政区划API

提供行政区划数据的查询接口。

作者：MiniMax Agent
版本：v1.0
日期：2025-11-18
"""

from flask import request, current_app
from sqlalchemy import or_, and_
from app.api import bp
from app.models import Region, Hospital
from app import db
from app.utils.response import success_response, error_response

@bp.route('/regions', methods=['GET'])
def get_regions():
    """获取行政区划列表"""
    
    # 获取查询参数
    level = request.args.get('level')
    parent_id = request.args.get('parent_id', type=int)
    search = request.args.get('search', '')
    include_children = request.args.get('include_children', 'false').lower() == 'true'
    
    # 构建查询
    query = Region.query
    
    # 过滤条件
    if level:
        query = query.filter(Region.level == level)
    
    if parent_id is not None:
        query = query.filter(Region.parent_id == parent_id)
    
    if search:
        query = query.filter(Region.name.ilike(f'%{search}%'))
    
    # 排序
    query = query.order_by(Region.level, Region.sort_order, Region.name)
    
    regions_data = []
    for region in query.all():
        region_dict = {
            'id': region.id,
            'name': region.name,
            'code': region.code,
            'level': region.level,
            'parent_id': region.parent_id,
            'sort_order': region.sort_order,
            'longitude': float(region.longitude) if region.longitude else None,
            'latitude': float(region.latitude) if region.latitude else None,
            'area_code': region.area_code,
            'postal_code': region.postal_code,
            'hospital_count': region.hospital_count,
            'created_at': region.created_at.isoformat() if region.created_at else None,
            'updated_at': region.updated_at.isoformat() if region.updated_at else None
        }
        
        # 是否包含子级地区
        if include_children and region.children:
            region_dict['children'] = [
                {
                    'id': child.id,
                    'name': child.name,
                    'code': child.code,
                    'level': child.level,
                    'parent_id': child.parent_id,
                    'hospital_count': child.hospital_count
                }
                for child in region.children
            ]
        
        regions_data.append(region_dict)
    
    return success_response({
        'regions': regions_data,
        'total_count': len(regions_data)
    })

@bp.route('/regions/tree', methods=['GET'])
def get_regions_tree():
    """获取完整的行政区划树形结构"""
    
    try:
        # 获取所有根级地区（国家级）
        root_regions = Region.query.filter_by(level='country').all()
        
        def build_tree_node(region):
            """递归构建树形节点"""
            node = {
                'id': region.id,
                'name': region.name,
                'code': region.code,
                'level': region.level,
                'hospital_count': region.hospital_count,
                'children': []
            }
            
            # 获取子级地区
            children = Region.query.filter_by(parent_id=region.id).order_by(Region.sort_order, Region.name).all()
            for child in children:
                node['children'].append(build_tree_node(child))
            
            return node
        
        tree_data = [build_tree_node(region) for region in root_regions]
        
        return success_response({
            'tree': tree_data,
            'total_count': len(tree_data)
        })
        
    except Exception as e:
        current_app.logger.error(f'获取地区树形结构失败: {str(e)}')
        return error_response('获取地区树形结构失败', 500)

@bp.route('/regions/<int:region_id>', methods=['GET'])
def get_region(region_id):
    """获取指定地区详情"""
    
    region = Region.query.get_or_404(region_id)
    
    region_dict = {
        'id': region.id,
        'name': region.name,
        'code': region.code,
        'level': region.level,
        'parent_id': region.parent_id,
        'sort_order': region.sort_order,
        'longitude': float(region.longitude) if region.longitude else None,
        'latitude': float(region.latitude) if region.latitude else None,
        'area_code': region.area_code,
        'postal_code': region.postal_code,
        'hospital_count': region.hospital_count,
        'created_at': region.created_at.isoformat() if region.created_at else None,
        'updated_at': region.updated_at.isoformat() if region.updated_at else None,
        'parent': {
            'id': region.parent.id,
            'name': region.parent.name,
            'code': region.parent.code,
            'level': region.parent.level
        } if region.parent else None,
        'children_count': len(region.children)
    }
    
    return success_response({'region': region_dict})

@bp.route('/regions/<int:region_id>/hospitals', methods=['GET'])
def get_region_hospitals(region_id):
    """获取指定地区的医院列表"""
    
    # 获取查询参数
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 20, type=int), 100)
    search = request.args.get('search', '')
    hospital_type = request.args.get('hospital_type')
    verified = request.args.get('verified')
    
    # 获取地区信息
    region = Region.query.get_or_404(region_id)
    
    # 构建查询
    # 如果是省级，获取所有下级地区的医院
    if region.level == 'province':
        # 获取所有子级地区ID（包括市、区县）
        child_region_ids = db.session.query(Region.id).filter(
            Region.parent_id == region.id
        ).subquery()
        
        query = Hospital.query.filter(
            Hospital.region_id.in_(child_region_ids)
        )
    else:
        # 直接获取该地区的医院
        query = Hospital.query.filter_by(region_id=region_id)
    
    # 搜索过滤
    if search:
        query = query.filter(
            Hospital.name.ilike(f'%{search}%') |
            Hospital.official_name.ilike(f'%{search}%') |
            Hospital.address.ilike(f'%{search}%')
        )
    
    # 医院类型过滤
    if hospital_type:
        query = query.filter(Hospital.hospital_type == hospital_type)
    
    # 验证状态过滤
    if verified is not None:
        query = query.filter(Hospital.verified == (verified.lower() == 'true'))
    
    # 排序
    query = query.order_by(Hospital.name)
    
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
            'address': hospital.address,
            'phone': hospital.phone,
            'website_url': hospital.website_url,
            'tender_count': hospital.tender_count,
            'created_at': hospital.created_at.isoformat() if hospital.created_at else None
        }
        hospitals_data.append(hospital_dict)
    
    return success_response({
        'region': {
            'id': region.id,
            'name': region.name,
            'code': region.code,
            'level': region.level
        },
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

@bp.route('/regions/<int:region_id>/statistics', methods=['GET'])
def get_region_statistics(region_id):
    """获取指定地区的统计信息"""
    
    try:
        region = Region.query.get_or_404(region_id)
        
        # 基础统计
        if region.level == 'province':
            # 省级统计：包含所有下级地区
            child_region_ids = db.session.query(Region.id).filter(
                Region.parent_id == region.id
            ).subquery()
            
            total_hospitals = db.session.query(Hospital).filter(
                Hospital.region_id.in_(child_region_ids)
            ).count()
            
            verified_hospitals = db.session.query(Hospital).filter(
                Hospital.region_id.in_(child_region_ids),
                Hospital.verified == True
            ).count()
        else:
            # 地市级统计：直接统计该地区
            total_hospitals = Hospital.query.filter_by(region_id=region_id).count()
            verified_hospitals = Hospital.query.filter_by(region_id=region_id, verified=True).count()
        
        # 按医院类型统计
        type_stats = {}
        if region.level == 'province':
            child_region_ids = db.session.query(Region.id).filter(
                Region.parent_id == region.id
            ).subquery()
            hospital_query = Hospital.query.filter(Hospital.region_id.in_(child_region_ids))
        else:
            hospital_query = Hospital.query.filter_by(region_id=region_id)
        
        for htype in ['public', 'private', 'community', 'specialized', 'traditional']:
            count = hospital_query.filter_by(hospital_type=htype).count()
            type_stats[htype] = count
        
        # 子级地区统计
        children_stats = []
        if region.children:
            for child in region.children:
                child_hospital_count = Hospital.query.filter_by(region_id=child.id).count()
                children_stats.append({
                    'id': child.id,
                    'name': child.name,
                    'level': child.level,
                    'hospital_count': child_hospital_count
                })
        
        return success_response({
            'region': {
                'id': region.id,
                'name': region.name,
                'code': region.code,
                'level': region.level
            },
            'overview': {
                'total_hospitals': total_hospitals,
                'verified_hospitals': verified_hospitals,
                'verification_rate': round(verified_hospitals / total_hospitals * 100, 2) if total_hospitals > 0 else 0,
                'children_count': len(region.children)
            },
            'by_type': type_stats,
            'children': children_stats
        })
        
    except Exception as e:
        current_app.logger.error(f'获取地区统计信息失败: {str(e)}')
        return error_response('获取统计信息失败', 500)