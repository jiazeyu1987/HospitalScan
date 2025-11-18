"""
招投标数据API

提供招投标信息查询、导出等功能接口。

作者：MiniMax Agent
版本：v1.0
日期：2025-11-18
"""

from flask import request, jsonify, current_app
from sqlalchemy import or_, and_, desc, asc
from datetime import datetime, timedelta
from app.api import bp
from app.models import TenderRecord, Hospital, Region
from app import db
from app.utils.response import success_response, error_response

@bp.route('/tenders', methods=['GET'])
def get_tenders():
    """获取招投标列表"""
    
    # 获取查询参数
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 20, type=int), 100)
    hospital_id = request.args.get('hospital_id', type=int)
    tender_type = request.args.get('tender_type')
    status = request.args.get('status')
    search = request.args.get('search', '')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    is_important = request.args.get('important')
    sort_by = request.args.get('sort_by', 'publish_date')
    sort_order = request.args.get('sort_order', 'desc')
    
    # 构建查询
    query = TenderRecord.query
    
    # 关联医院信息
    query = query.join(Hospital, Hospital.id == TenderRecord.hospital_id)
    
    # 过滤条件
    if hospital_id:
        query = query.filter(TenderRecord.hospital_id == hospital_id)
    
    if tender_type:
        query = query.filter(TenderRecord.tender_type == tender_type)
    
    if status:
        query = query.filter(TenderRecord.status == status)
    
    if search:
        # 搜索标题和内容
        search_filter = or_(
            TenderRecord.title.ilike(f'%{search}%'),
            TenderRecord.content.ilike(f'%{search}%'),
            Hospital.name.ilike(f'%{search}%')
        )
        query = query.filter(search_filter)
    
    if start_date:
        try:
            start_dt = datetime.strptime(start_date, '%Y-%m-%d')
            query = query.filter(TenderRecord.publish_date >= start_dt)
        except ValueError:
            pass
    
    if end_date:
        try:
            end_dt = datetime.strptime(end_date, '%Y-%m-%d')
            query = query.filter(TenderRecord.publish_date <= end_dt)
        except ValueError:
            pass
    
    if is_important is not None:
        query = query.filter(TenderRecord.is_important == (is_important.lower() == 'true'))
    
    # 排序
    if sort_by == 'publish_date':
        order_field = TenderRecord.publish_date
    elif sort_by == 'budget_amount':
        order_field = TenderRecord.budget_amount
    elif sort_by == 'deadline_date':
        order_field = TenderRecord.deadline_date
    else:
        order_field = TenderRecord.created_at
    
    if sort_order == 'desc':
        query = query.order_by(desc(order_field))
    else:
        query = query.order_by(asc(order_field))
    
    # 分页
    pagination = query.paginate(
        page=page,
        per_page=per_page,
        error_out=False
    )
    
    tenders_data = []
    for tender in pagination.items:
        tender_dict = {
            'id': tender.id,
            'title': tender.title,
            'hospital_name': tender.hospital.name if tender.hospital else None,
            'tender_type': tender.tender_type,
            'tender_category': tender.tender_category,
            'status': tender.status,
            'budget_amount': float(tender.budget_amount) if tender.budget_amount else None,
            'budget_currency': tender.budget_currency,
            'publish_date': tender.publish_date.isoformat() if tender.publish_date else None,
            'deadline_date': tender.deadline_date.isoformat() if tender.deadline_date else None,
            'source_url': tender.source_url,
            'is_important': tender.is_important,
            'content_hash': tender.content_hash,
            'created_at': tender.created_at.isoformat() if tender.created_at else None
        }
        tenders_data.append(tender_dict)
    
    return success_response({
        'tenders': tenders_data,
        'pagination': {
            'page': pagination.page,
            'per_page': pagination.per_page,
            'total': pagination.total,
            'pages': pagination.pages,
            'has_next': pagination.has_next,
            'has_prev': pagination.has_prev
        }
    })

@bp.route('/tenders/<int:tender_id>', methods=['GET'])
def get_tender(tender_id):
    """获取招投标详情"""
    
    tender = TenderRecord.query.get_or_404(tender_id)
    
    tender_dict = {
        'id': tender.id,
        'hospital_id': tender.hospital_id,
        'hospital_name': tender.hospital.name if tender.hospital else None,
        'title': tender.title,
        'content': tender.content,
        'tender_type': tender.tender_type,
        'tender_category': tender.tender_category,
        'budget_amount': float(tender.budget_amount) if tender.budget_amount else None,
        'budget_currency': tender.budget_currency,
        'publish_date': tender.publish_date.isoformat() if tender.publish_date else None,
        'deadline_date': tender.deadline_date.isoformat() if tender.deadline_date else None,
        'start_date': tender.start_date.isoformat() if tender.start_date else None,
        'end_date': tender.end_date.isoformat() if tender.end_date else None,
        'source_url': tender.source_url,
        'detail_url': tender.detail_url,
        'content_hash': tender.content_hash,
        'html_hash': tender.html_hash,
        'status': tender.status,
        'is_important': tender.is_important,
        'importance_reason': tender.importance_reason,
        'source_page_title': tender.source_page_title,
        'source_section': tender.source_section,
        'crawl_method': tender.crawl_method,
        'verified': tender.verified,
        'view_count': tender.view_count,
        'download_count': tender.download_count,
        'created_at': tender.created_at.isoformat() if tender.created_at else None,
        'updated_at': tender.updated_at.isoformat() if tender.updated_at else None
    }
    
    return success_response({'tender': tender_dict})

@bp.route('/tenders/statistics', methods=['GET'])
def get_tender_statistics():
    """获取招投标统计信息"""
    
    try:
        # 基础统计
        total_tenders = TenderRecord.query.count()
        active_tenders = TenderRecord.query.filter_by(status='in_progress').count()
        closed_tenders = TenderRecord.query.filter_by(status='closed').count()
        important_tenders = TenderRecord.query.filter_by(is_important=True).count()
        
        # 按类型统计
        type_stats = {}
        for ttype in ['procurement', 'construction', 'service', 'medical', 'equipment', 'other']:
            count = TenderRecord.query.filter_by(tender_type=ttype).count()
            type_stats[ttype] = count
        
        return success_response({
            'overview': {
                'total_tenders': total_tenders,
                'active_tenders': active_tenders,
                'closed_tenders': closed_tenders,
                'important_tenders': important_tenders
            },
            'by_type': type_stats
        })
        
    except Exception as e:
        current_app.logger.error(f'获取招投标统计信息失败: {str(e)}')
        return error_response('获取统计信息失败', 500)

@bp.route('/tenders/export', methods=['POST'])
def export_tenders():
    """导出招投标数据"""
    
    data = request.get_json() or {}
    
    try:
        # 模拟导出处理
        export_data = {
            'total_records': 0,
            'export_format': data.get('format', 'excel'),
            'export_time': datetime.utcnow().isoformat(),
            'message': '导出功能开发中...'
        }
        
        return success_response({
            'export_task_id': f"export_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
            'message': '导出任务已创建',
            'data': export_data
        })
        
    except Exception as e:
        current_app.logger.error(f'导出招投标数据失败: {str(e)}')
        return error_response('导出失败', 500)