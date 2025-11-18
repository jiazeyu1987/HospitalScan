"""
定时任务调度器

使用APScheduler实现定时任务管理，包括：
- 招投标信息定期监控
- 医院信息定期扫描
- 每日报告生成
- 任务状态监控

作者：MiniMax Agent
版本：v1.0
日期：2025-11-18
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.executors.pool import ThreadPoolExecutor
from apscheduler.jobstores.memory import MemoryJobStore
import atexit
import threading
from flask import current_app

class TaskScheduler:
    """任务调度器"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
        # 配置调度器
        jobstores = {
            'default': MemoryJobStore()
        }
        
        executors = {
            'default': ThreadPoolExecutor(20),
        }
        
        job_defaults = {
            'coalesce': False,
            'max_instances': 3
        }
        
        # 创建调度器
        self.scheduler = BackgroundScheduler(
            jobstores=jobstores,
            executors=executors,
            job_defaults=job_defaults,
            timezone='Asia/Shanghai'
        )
        
        # 任务状态跟踪
        self.task_status = {}
        self.task_lock = threading.Lock()
        
        # 任务类型
        self.TASK_TYPES = {
            'TENDER_MONITOR': 'tender_monitor',
            'HOSPITAL_SCAN': 'hospital_scan', 
            'DAILY_REPORT': 'daily_report',
            'WEEKLY_REPORT': 'weekly_report'
        }
    
    def start(self):
        """启动调度器"""
        try:
            if not self.scheduler.running:
                self.scheduler.start()
                self.logger.info("任务调度器启动成功")
                
                # 注册关闭钩子
                atexit.register(self.shutdown)
                
                # 添加默认任务
                self._add_default_jobs()
                
        except Exception as e:
            self.logger.error(f"启动任务调度器失败: {str(e)}")
            raise
    
    def shutdown(self):
        """关闭调度器"""
        try:
            if self.scheduler.running:
                self.scheduler.shutdown(wait=False)
                self.logger.info("任务调度器已关闭")
        except Exception as e:
            self.logger.error(f"关闭任务调度器失败: {str(e)}")
    
    def _add_default_jobs(self):
        """添加默认的定时任务"""
        try:
            # 招投标监控任务 - 每6小时执行一次
            self.add_recurring_job(
                job_id='tender_monitor',
                func=self._execute_tender_monitor,
                trigger=IntervalTrigger(hours=6),
                args=[self.TASK_TYPES['TENDER_MONITOR']],
                max_instances=2,
                replace_existing=True
            )
            
            # 医院扫描任务 - 每24小时执行一次
            self.add_recurring_job(
                job_id='hospital_scan',
                func=self._execute_hospital_scan,
                trigger=IntervalTrigger(hours=24),
                args=[self.TASK_TYPES['HOSPITAL_SCAN']],
                max_instances=1,
                replace_existing=True
            )
            
            # 每日报告 - 每天凌晨2点执行
            self.add_recurring_job(
                job_id='daily_report',
                func=self._execute_daily_report,
                trigger=CronTrigger(hour=2, minute=0),
                args=[self.TASK_TYPES['DAILY_REPORT']],
                max_instances=1,
                replace_existing=True
            )
            
            # 每周报告 - 每周一凌晨3点执行
            self.add_recurring_job(
                job_id='weekly_report',
                func=self._execute_weekly_report,
                trigger=CronTrigger(day_of_week='mon', hour=3, minute=0),
                args=[self.TASK_TYPES['WEEKLY_REPORT']],
                max_instances=1,
                replace_existing=True
            )
            
            self.logger.info("默认定时任务添加完成")
            
        except Exception as e:
            self.logger.error(f"添加默认任务失败: {str(e)}")
    
    def add_recurring_job(self, job_id: str, func, trigger, args=None, kwargs=None, 
                         max_instances=1, replace_existing=True) -> bool:
        """
        添加重复任务
        
        Args:
            job_id: 任务ID
            func: 执行函数
            trigger: 触发器
            args: 位置参数
            kwargs: 关键字参数
            max_instances: 最大实例数
            replace_existing: 是否替换现有任务
            
        Returns:
            是否成功
        """
        try:
            with self.task_lock:
                # 如果任务已存在，先移除
                if replace_existing and self.scheduler.get_job(job_id):
                    self.scheduler.remove_job(job_id)
                
                # 添加新任务
                self.scheduler.add_job(
                    func=func,
                    trigger=trigger,
                    id=job_id,
                    args=args or [],
                    kwargs=kwargs or {},
                    max_instances=max_instances,
                    replace_existing=replace_existing
                )
                
                self.logger.info(f"添加重复任务成功: {job_id}")
                return True
                
        except Exception as e:
            self.logger.error(f"添加重复任务失败 {job_id}: {str(e)}")
            return False
    
    def add_one_time_job(self, job_id: str, func, run_date: datetime, args=None, 
                        kwargs=None, replace_existing=True) -> bool:
        """
        添加一次性任务
        
        Args:
            job_id: 任务ID
            func: 执行函数
            run_date: 运行时间
            args: 位置参数
            kwargs: 关键字参数
            replace_existing: 是否替换现有任务
            
        Returns:
            是否成功
        """
        try:
            with self.task_lock:
                # 如果任务已存在，先移除
                if replace_existing and self.scheduler.get_job(job_id):
                    self.scheduler.remove_job(job_id)
                
                # 添加新任务
                self.scheduler.add_job(
                    func=func,
                    trigger='date',
                    run_date=run_date,
                    id=job_id,
                    args=args or [],
                    kwargs=kwargs or {},
                    replace_existing=replace_existing
                )
                
                self.logger.info(f"添加一次性任务成功: {job_id}, 运行时间: {run_date}")
                return True
                
        except Exception as e:
            self.logger.error(f"添加一次性任务失败 {job_id}: {str(e)}")
            return False
    
    def remove_job(self, job_id: str) -> bool:
        """
        移除任务
        
        Args:
            job_id: 任务ID
            
        Returns:
            是否成功
        """
        try:
            with self.task_lock:
                job = self.scheduler.get_job(job_id)
                if job:
                    self.scheduler.remove_job(job_id)
                    self.logger.info(f"移除任务成功: {job_id}")
                    return True
                else:
                    self.logger.warning(f"任务不存在: {job_id}")
                    return False
                    
        except Exception as e:
            self.logger.error(f"移除任务失败 {job_id}: {str(e)}")
            return False
    
    def pause_job(self, job_id: str) -> bool:
        """暂停任务"""
        try:
            with self.task_lock:
                self.scheduler.pause_job(job_id)
                self.logger.info(f"暂停任务成功: {job_id}")
                return True
        except Exception as e:
            self.logger.error(f"暂停任务失败 {job_id}: {str(e)}")
            return False
    
    def resume_job(self, job_id: str) -> bool:
        """恢复任务"""
        try:
            with self.task_lock:
                self.scheduler.resume_job(job_id)
                self.logger.info(f"恢复任务成功: {job_id}")
                return True
        except Exception as e:
            self.logger.error(f"恢复任务失败 {job_id}: {str(e)}")
            return False
    
    def get_job_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        """获取任务状态"""
        try:
            job = self.scheduler.get_job(job_id)
            if job:
                return {
                    'job_id': job.id,
                    'name': job.name,
                    'next_run_time': job.next_run_time.isoformat() if job.next_run_time else None,
                    'trigger': str(job.trigger),
                    'args': job.args,
                    'kwargs': job.kwargs,
                    'max_instances': job.max_instances,
                    'coalesce': job.coalesce,
                    'misfire_grace_time': job.misfire_grace_time
                }
            return None
        except Exception as e:
            self.logger.error(f"获取任务状态失败 {job_id}: {str(e)}")
            return None
    
    def get_all_jobs(self) -> List[Dict[str, Any]]:
        """获取所有任务状态"""
        try:
            jobs = self.scheduler.get_jobs()
            job_list = []
            
            for job in jobs:
                job_info = {
                    'job_id': job.id,
                    'name': job.name,
                    'next_run_time': job.next_run_time.isoformat() if job.next_run_time else None,
                    'trigger': str(job.trigger),
                    'max_instances': job.max_instances
                }
                job_list.append(job_info)
            
            return job_list
        except Exception as e:
            self.logger.error(f"获取所有任务状态失败: {str(e)}")
            return []
    
    def update_job_schedule(self, job_id: str, **kwargs) -> bool:
        """更新任务调度"""
        try:
            with self.task_lock:
                job = self.scheduler.get_job(job_id)
                if job:
                    self.scheduler.modify_job(job_id, **kwargs)
                    self.logger.info(f"更新任务调度成功: {job_id}")
                    return True
                else:
                    self.logger.warning(f"任务不存在: {job_id}")
                    return False
        except Exception as e:
            self.logger.error(f"更新任务调度失败 {job_id}: {str(e)}")
            return False
    
    # 任务执行方法
    def _execute_tender_monitor(self, task_type: str):
        """执行招投标监控任务"""
        try:
            self.logger.info("开始执行招投标监控任务")
            
            # 更新任务状态
            self._update_task_status(task_type, 'running', '开始执行招投标监控')
            
            # 这里调用实际的招投标监控逻辑
            # 例如：扫描所有医院的招投标栏目
            result = self._perform_tender_monitoring()
            
            # 更新任务状态
            self._update_task_status(task_type, 'success', '招投标监控完成', result)
            
            self.logger.info("招投标监控任务执行完成")
            
        except Exception as e:
            self.logger.error(f"招投标监控任务执行失败: {str(e)}")
            self._update_task_status(task_type, 'error', f'执行失败: {str(e)}')
    
    def _execute_hospital_scan(self, task_type: str):
        """执行医院扫描任务"""
        try:
            self.logger.info("开始执行医院扫描任务")
            
            # 更新任务状态
            self._update_task_status(task_type, 'running', '开始执行医院扫描')
            
            # 这里调用实际的医院扫描逻辑
            # 例如：验证医院网站、更新医院信息
            result = self._perform_hospital_scanning()
            
            # 更新任务状态
            self._update_task_status(task_type, 'success', '医院扫描完成', result)
            
            self.logger.info("医院扫描任务执行完成")
            
        except Exception as e:
            self.logger.error(f"医院扫描任务执行失败: {str(e)}")
            self._update_task_status(task_type, 'error', f'执行失败: {str(e)}')
    
    def _execute_daily_report(self, task_type: str):
        """执行每日报告任务"""
        try:
            self.logger.info("开始执行每日报告任务")
            
            # 更新任务状态
            self._update_task_status(task_type, 'running', '开始生成每日报告')
            
            # 这里调用实际的报告生成逻辑
            result = self._generate_daily_report()
            
            # 更新任务状态
            self._update_task_status(task_type, 'success', '每日报告生成完成', result)
            
            self.logger.info("每日报告任务执行完成")
            
        except Exception as e:
            self.logger.error(f"每日报告任务执行失败: {str(e)}")
            self._update_task_status(task_type, 'error', f'执行失败: {str(e)}')
    
    def _execute_weekly_report(self, task_type: str):
        """执行每周报告任务"""
        try:
            self.logger.info("开始执行每周报告任务")
            
            # 更新任务状态
            self._update_task_status(task_type, 'running', '开始生成每周报告')
            
            # 这里调用实际的报告生成逻辑
            result = self._generate_weekly_report()
            
            # 更新任务状态
            self._update_task_status(task_type, 'success', '每周报告生成完成', result)
            
            self.logger.info("每周报告任务执行完成")
            
        except Exception as e:
            self.logger.error(f"每周报告任务执行失败: {str(e)}")
            self._update_task_status(task_type, 'error', f'执行失败: {str(e)}')
    
    def _perform_tender_monitoring(self) -> Dict[str, Any]:
        """执行实际的招投标监控逻辑"""
        # 模拟执行结果
        return {
            'hospitals_scanned': 150,
            'tenders_found': 25,
            'new_tenders': 8,
            'important_tenders': 2,
            'execution_time': '00:05:30'
        }
    
    def _perform_hospital_scanning(self) -> Dict[str, Any]:
        """执行实际的医院扫描逻辑"""
        # 模拟执行结果
        return {
            'websites_checked': 150,
            'verified_websites': 120,
            'failed_websites': 30,
            'new_websites_found': 5,
            'execution_time': '00:15:45'
        }
    
    def _generate_daily_report(self) -> Dict[str, Any]:
        """生成每日报告"""
        # 模拟报告生成结果
        return {
            'report_date': datetime.now().strftime('%Y-%m-%d'),
            'tenders_count': 45,
            'hospitals_count': 150,
            'verification_rate': 85.5,
            'report_file': f'daily_report_{datetime.now().strftime("%Y%m%d")}.pdf'
        }
    
    def _generate_weekly_report(self) -> Dict[str, Any]:
        """生成每周报告"""
        # 模拟报告生成结果
        return {
            'report_week': f"{datetime.now().strftime('%Y-W%U')}",
            'tenders_count': 285,
            'hospitals_count': 150,
            'new_hospitals': 5,
            'trend_analysis': '稳步增长',
            'report_file': f'weekly_report_{datetime.now().strftime("%Y%U")}.pdf'
        }
    
    def _update_task_status(self, task_type: str, status: str, message: str, result: Dict[str, Any] = None):
        """更新任务状态"""
        with self.task_lock:
            self.task_status[task_type] = {
                'task_type': task_type,
                'status': status,
                'message': message,
                'result': result,
                'updated_at': datetime.now().isoformat()
            }
    
    def get_task_status(self, task_type: str) -> Optional[Dict[str, Any]]:
        """获取任务状态"""
        with self.task_lock:
            return self.task_status.get(task_type)
    
    def get_all_task_status(self) -> Dict[str, Any]:
        """获取所有任务状态"""
        with self.task_lock:
            return self.task_status.copy()

# 创建全局任务调度器实例
task_scheduler = TaskScheduler()

def start_scheduler():
    """启动调度器"""
    task_scheduler.start()

def stop_scheduler():
    """停止调度器"""
    task_scheduler.shutdown()