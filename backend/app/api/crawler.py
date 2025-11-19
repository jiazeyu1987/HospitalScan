"""
爬虫控制API

提供爬虫任务的启动、停止、状态查询等功能。

作者：MiniMax Agent
版本：v1.0
日期：2025-11-18
"""

from flask import request, current_app
from datetime import datetime
from app.api import bp
from app.services.crawler_manager import crawler_manager
from app.utils.response import success_response, error_response

@bp.route('/crawler/tasks', methods=['GET'])
def get_crawler_tasks():
    """获取所有爬虫任务状态"""
    
    try:
        all_tasks = crawler_manager.get_all_tasks()
        running_tasks = crawler_manager.get_running_tasks()
        
        return success_response({
            'all_tasks': all_tasks,
            'running_tasks': running_tasks,
            'total_count': len(all_tasks),
            'running_count': len(running_tasks)
        })
        
    except Exception as e:
        current_app.logger.error(f'获取爬虫任务状态失败: {str(e)}')
        return error_response('获取任务状态失败', 500)

@bp.route('/crawler/tasks/<task_id>', methods=['GET'])
def get_crawler_task(task_id):
    """获取指定爬虫任务状态"""
    
    try:
        task = crawler_manager.get_task(task_id)
        if not task:
            return error_response('任务不存在', 404)
        
        return success_response({
            'task': {
                'task_id': task.task_id,
                'task_type': task.task_type,
                'status': task.status.value,
                'progress': task.progress,
                'message': task.message,
                'start_time': task.start_time.isoformat() if task.start_time else None,
                'end_time': task.end_time.isoformat() if task.end_time else None,
                'result': task.result,
                'error_message': task.error_message
            }
        })
        
    except Exception as e:
        current_app.logger.error(f'获取任务详情失败: {str(e)}')
        return error_response('获取任务详情失败', 500)

@bp.route('/crawler/tasks', methods=['POST'])
def create_crawler_task():
    """创建新的爬虫任务"""
    
    data = request.get_json() or {}
    task_type = data.get('task_type')
    
    if not task_type:
        return error_response('任务类型不能为空', 400)
    
    # 验证任务类型
    valid_types = ['hospital_discovery', 'tender_monitor', 'hospital_scan']
    if task_type not in valid_types:
        return error_response(f'不支持的任务类型，支持的类型: {", ".join(valid_types)}', 400)
    
    try:
        task_id = crawler_manager.create_task(task_type, data.get('config', {}))
        
        return success_response({
            'task_id': task_id,
            'task_type': task_type,
            'message': '任务创建成功'
        }, 201)
        
    except Exception as e:
        current_app.logger.error(f'创建爬虫任务失败: {str(e)}')
        return error_response('创建任务失败', 500)

@bp.route('/crawler/tasks/<task_id>/start', methods=['POST'])
def start_crawler_task(task_id):
    """启动指定的爬虫任务"""
    
    try:
        success = crawler_manager.start_task(task_id)
        
        if not success:
            return error_response('任务不存在或已在运行', 400)
        
        return success_response({
            'task_id': task_id,
            'message': '任务启动成功'
        })
        
    except Exception as e:
        current_app.logger.error(f'启动爬虫任务失败: {str(e)}')
        return error_response('启动任务失败', 500)

@bp.route('/crawler/tasks/<task_id>/stop', methods=['POST'])
def stop_crawler_task(task_id):
    """停止指定的爬虫任务"""
    
    try:
        success = crawler_manager.stop_task(task_id)
        
        if not success:
            return error_response('任务不存在或未在运行', 400)
        
        return success_response({
            'task_id': task_id,
            'message': '任务停止成功'
        })
        
    except Exception as e:
        current_app.logger.error(f'停止爬虫任务失败: {str(e)}')
        return error_response('停止任务失败', 500)

@bp.route('/crawler/status', methods=['GET'])
def crawler_status():
    """获取爬虫系统状态"""

    try:
        all_tasks = crawler_manager.get_all_tasks()
        running_tasks = crawler_manager.get_running_tasks()

        # 计算状态统计
        status_counts = {}
        for task in all_tasks:
            status = task.status.value
            status_counts[status] = status_counts.get(status, 0) + 1

        return success_response({
            'system_status': 'running' if running_tasks else 'idle',
            'total_tasks': len(all_tasks),
            'running_tasks': len(running_tasks),
            'completed_tasks': status_counts.get('completed', 0),
            'failed_tasks': status_counts.get('failed', 0),
            'pending_tasks': status_counts.get('pending', 0),
            'status_breakdown': status_counts,
            'last_update': datetime.now().isoformat()
        })

    except Exception as e:
        current_app.logger.error(f'获取爬虫状态失败: {str(e)}')
        return error_response('获取爬虫状态失败', 500)

@bp.route('/crawler/health', methods=['GET'])
def crawler_health():
    """爬虫系统健康检查"""

    try:
        running_tasks = crawler_manager.get_running_tasks()

        return success_response({
            'status': 'healthy',
            'message': '爬虫系统运行正常',
            'running_tasks_count': len(running_tasks)
        })

    except Exception as e:
        current_app.logger.error(f'爬虫健康检查失败: {str(e)}')
        return error_response('爬虫系统异常', 500)