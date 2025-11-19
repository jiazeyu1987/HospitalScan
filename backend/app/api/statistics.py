"""
统计数据API

提供系统统计数据，包括仪表板数据、趋势分析等。

作者：MiniMax Agent
版本：v1.0
日期：2025-11-18
"""

from flask import request, current_app
from datetime import datetime, timedelta
from app.api import bp
from app.models import Hospital, TenderRecord, ScanHistory, Region, db
from app.utils.response import success_response, error_response
from sqlalchemy import func, text

@bp.route('/statistics/dashboard', methods=['GET'])
def dashboard_statistics():
    """获取仪表板统计数据"""

    try:
        # 基础统计
        total_hospitals = Hospital.query.count()
        verified_hospitals = Hospital.query.filter(Hospital.verified == True).count()
        total_tenders = TenderRecord.query.count()
        recent_tenders = TenderRecord.query.filter(
            TenderRecord.publish_date >= datetime.now() - timedelta(days=30)
        ).count()

        # 今日扫描统计
        today_scans = ScanHistory.query.filter(
            func.date(ScanHistory.start_time) == datetime.now().date()
        ).count()

        # 成功率统计
        successful_scans = ScanHistory.query.filter(
            ScanHistory.status == 'completed'
        ).count()
        total_scans = ScanHistory.query.count()
        success_rate = (successful_scans / total_scans * 100) if total_scans > 0 else 0

        return success_response({
            'hospitals': {
                'total': total_hospitals,
                'verified': verified_hospitals,
                'unverified': total_hospitals - verified_hospitals
            },
            'tenders': {
                'total': total_tenders,
                'recent': recent_tenders
            },
            'scans': {
                'today': today_scans,
                'total': total_scans,
                'success_rate': round(success_rate, 2)
            },
            'last_update': datetime.now().isoformat()
        })

    except Exception as e:
        current_app.logger.error(f'获取仪表板统计数据失败: {str(e)}')
        return error_response('获取统计数据失败', 500)

@bp.route('/statistics/trend', methods=['GET'])
def trend_statistics():
    """获取趋势统计数据"""

    try:
        # 获取参数
        granularity = request.args.get('granularity', 'daily')  # daily, weekly, monthly
        days = request.args.get('days', 30, type=int)

        # 限制查询天数
        days = min(days, 365)

        # 计算时间范围
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)

        # 根据粒度确定SQL分组格式
        if granularity == 'daily':
            date_format = '%Y-%m-%d'
            sql_group = func.date(TenderRecord.publish_date)
        elif granularity == 'weekly':
            date_format = '%Y-%u'
            sql_group = func.strftime('%Y-%W', TenderRecord.publish_date)
        elif granularity == 'monthly':
            date_format = '%Y-%m'
            sql_group = func.strftime('%Y-%m', TenderRecord.publish_date)
        else:
            return error_response('不支持的时间粒度，支持的粒度: daily, weekly, monthly', 400)

        # 招投标趋势
        tender_trend = db.session.query(
            sql_group.label('period'),
            func.count(TenderRecord.id).label('count')
        ).filter(
            TenderRecord.publish_date >= start_date,
            TenderRecord.publish_date <= end_date
        ).group_by(sql_group).order_by(sql_group).all()

        # 医院扫描趋势
        scan_trend = db.session.query(
            func.date(ScanHistory.start_time).label('period'),
            func.count(ScanHistory.id).label('count')
        ).filter(
            ScanHistory.start_time >= start_date,
            ScanHistory.start_time <= end_date,
            ScanHistory.status == 'completed'
        ).group_by(func.date(ScanHistory.start_time)).order_by(func.date(ScanHistory.start_time)).all()

        # 转换为字典格式
        tender_data = {str(row.period): row.count for row in tender_trend}
        scan_data = {str(row.period): row.count for row in scan_trend}

        return success_response({
            'granularity': granularity,
            'period': {
                'start': start_date.isoformat(),
                'end': end_date.isoformat()
            },
            'tender_trend': tender_data,
            'scan_trend': scan_data,
            'last_update': datetime.now().isoformat()
        })

    except Exception as e:
        current_app.logger.error(f'获取趋势统计数据失败: {str(e)}')
        return error_response('获取趋势数据失败', 500)

@bp.route('/statistics', methods=['GET'])
def general_statistics():
    """获取综合统计数据"""

    try:
        # 地区分布统计 - 注意由于模型设计，这里需要通过region关联查询
        region_stats = db.session.query(
            Region.name,
            func.count(Hospital.id).label('hospital_count'),
            func.count(func.nullif(TenderRecord.id, None)).label('tender_count')
        ).outerjoin(Region, Hospital.region_id == Region.id)\
         .outerjoin(TenderRecord, Hospital.id == TenderRecord.hospital_id)\
         .group_by(Region.name).all()

        # 医院等级分布
        level_stats = db.session.query(
            Hospital.level,
            func.count(Hospital.id).label('count')
        ).filter(Hospital.level.isnot(None)).group_by(Hospital.level).all()

        # 近期活动统计
        recent_activity = {
            'hospitals_added_7d': Hospital.query.filter(
                Hospital.created_at >= datetime.now() - timedelta(days=7)
            ).count(),
            'tenders_added_7d': TenderRecord.query.filter(
                TenderRecord.created_at >= datetime.now() - timedelta(days=7)
            ).count(),
            'scans_completed_7d': ScanHistory.query.filter(
                ScanHistory.start_time >= datetime.now() - timedelta(days=7),
                ScanHistory.status == 'completed'
            ).count()
        }

        return success_response({
            'region_distribution': [
                {
                    'province': row.name or '未知',
                    'hospital_count': row.hospital_count,
                    'tender_count': row.tender_count or 0
                } for row in region_stats
            ],
            'level_distribution': [
                {
                    'level': row.level or '未知',
                    'count': row.count
                } for row in level_stats
            ],
            'recent_activity': recent_activity,
            'last_update': datetime.now().isoformat()
        })

    except Exception as e:
        current_app.logger.error(f'获取综合统计数据失败: {str(e)}')
        return error_response('获取统计数据失败', 500)