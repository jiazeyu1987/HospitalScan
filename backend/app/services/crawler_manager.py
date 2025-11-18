"""
爬虫服务管理器

管理爬虫任务的状态、启动、停止等操作。

作者：MiniMax Agent
版本：v1.0
日期：2025-11-18
"""

import threading
import time
import uuid
from datetime import datetime
from typing import Dict, Optional, Any
from enum import Enum

class CrawlerStatus(Enum):
    """爬虫状态枚举"""
    STOPPED = "stopped"
    RUNNING = "running"
    PAUSED = "paused"
    ERROR = "error"

class CrawlerTask:
    """爬虫任务类"""
    
    def __init__(self, task_id: str, task_type: str, config: Dict[str, Any] = None):
        self.task_id = task_id
        self.task_type = task_type
        self.status = CrawlerStatus.STOPPED
        self.config = config or {}
        self.start_time = None
        self.end_time = None
        self.progress = 0.0
        self.message = "任务已创建"
        self.result = {}
        self.error_message = None
        self.thread = None
        
    def start(self):
        """启动任务"""
        if self.status == CrawlerStatus.RUNNING:
            return False
        
        self.status = CrawlerStatus.RUNNING
        self.start_time = datetime.utcnow()
        self.progress = 0.0
        self.message = "任务正在执行..."
        self.error_message = None
        
        # 启动工作线程
        self.thread = threading.Thread(target=self._run_task)
        self.thread.start()
        return True
    
    def stop(self):
        """停止任务"""
        if self.status == CrawlerStatus.RUNNING:
            self.status = CrawlerStatus.STOPPED
            self.end_time = datetime.utcnow()
            self.message = "任务已停止"
            return True
        return False
    
    def pause(self):
        """暂停任务"""
        if self.status == CrawlerStatus.RUNNING:
            self.status = CrawlerStatus.PAUSED
            self.message = "任务已暂停"
            return True
        return False
    
    def resume(self):
        """恢复任务"""
        if self.status == CrawlerStatus.PAUSED:
            self.status = CrawlerStatus.RUNNING
            self.message = "任务已恢复"
            return True
        return False
    
    def _run_task(self):
        """执行任务的内部方法"""
        try:
            if self.task_type == "hospital_discovery":
                self._run_hospital_discovery()
            elif self.task_type == "tender_monitor":
                self._run_tender_monitor()
            elif self.task_type == "hospital_scan":
                self._run_hospital_scan()
            else:
                raise ValueError(f"不支持的任务类型: {self.task_type}")
            
            self.status = CrawlerStatus.STOPPED
            self.end_time = datetime.utcnow()
            self.progress = 100.0
            self.message = "任务执行完成"
            
        except Exception as e:
            self.status = CrawlerStatus.ERROR
            self.end_time = datetime.utcnow()
            self.error_message = str(e)
            self.message = f"任务执行失败: {str(e)}"
    
    def _run_hospital_discovery(self):
        """执行医院发现任务"""
        # 模拟医院发现过程
        total_steps = 10
        for i in range(total_steps):
            if self.status != CrawlerStatus.RUNNING:
                break
            
            time.sleep(0.5)  # 模拟工作
            
            self.progress = (i + 1) / total_steps * 100
            self.message = f"正在搜索医院信息... ({i + 1}/{total_steps})"
            
            # 模拟找到医院
            if i == total_steps - 1:
                self.result['hospitals_found'] = 150
                self.result['websites_found'] = 120
                self.result['verified_websites'] = 80
    
    def _run_tender_monitor(self):
        """执行招投标监控任务"""
        # 模拟招投标监控过程
        total_steps = 8
        for i in range(total_steps):
            if self.status != CrawlerStatus.RUNNING:
                break
            
            time.sleep(0.3)  # 模拟工作
            
            self.progress = (i + 1) / total_steps * 100
            self.message = f"正在监控招投标信息... ({i + 1}/{total_steps})"
            
            # 模拟找到招投标
            if i == total_steps - 1:
                self.result['tenders_found'] = 45
                self.result['new_tenders'] = 12
                self.result['important_tenders'] = 3
    
    def _run_hospital_scan(self):
        """执行医院扫描任务"""
        # 模拟医院网站扫描
        total_steps = 15
        for i in range(total_steps):
            if self.status != CrawlerStatus.RUNNING:
                break
            
            time.sleep(0.2)  # 模拟工作
            
            self.progress = (i + 1) / total_steps * 100
            self.message = f"正在扫描医院网站... ({i + 1}/{total_steps})"
            
            # 模拟扫描结果
            if i == total_steps - 1:
                self.result['websites_scanned'] = 15
                self.result['successful_scans'] = 12
                self.result['tender_columns_found'] = 8

class CrawlerManager:
    """爬虫任务管理器"""
    
    def __init__(self):
        self.tasks: Dict[str, CrawlerTask] = {}
        self._lock = threading.Lock()
    
    def create_task(self, task_type: str, config: Dict[str, Any] = None) -> str:
        """创建新的爬虫任务"""
        task_id = str(uuid.uuid4())[:8]
        
        with self._lock:
            task = CrawlerTask(task_id, task_type, config)
            self.tasks[task_id] = task
        
        return task_id
    
    def get_task(self, task_id: str) -> Optional[CrawlerTask]:
        """获取任务信息"""
        with self._lock:
            return self.tasks.get(task_id)
    
    def start_task(self, task_id: str) -> bool:
        """启动任务"""
        with self._lock:
            task = self.tasks.get(task_id)
            if task:
                return task.start()
            return False
    
    def stop_task(self, task_id: str) -> bool:
        """停止任务"""
        with self._lock:
            task = self.tasks.get(task_id)
            if task:
                return task.stop()
            return False
    
    def pause_task(self, task_id: str) -> bool:
        """暂停任务"""
        with self._lock:
            task = self.tasks.get(task_id)
            if task:
                return task.pause()
            return False
    
    def resume_task(self, task_id: str) -> bool:
        """恢复任务"""
        with self._lock:
            task = self.tasks.get(task_id)
            if task:
                return task.resume()
            return False
    
    def delete_task(self, task_id: str) -> bool:
        """删除任务"""
        with self._lock:
            if task_id in self.tasks:
                task = self.tasks[task_id]
                # 如果任务正在运行，先停止
                if task.status == CrawlerStatus.RUNNING:
                    task.stop()
                del self.tasks[task_id]
                return True
            return False
    
    def get_all_tasks(self) -> Dict[str, Dict[str, Any]]:
        """获取所有任务状态"""
        with self._lock:
            return {
                task_id: {
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
                for task_id, task in self.tasks.items()
            }
    
    def get_running_tasks(self) -> Dict[str, Dict[str, Any]]:
        """获取正在运行的任务"""
        with self._lock:
            return {
                task_id: {
                    'task_id': task.task_id,
                    'task_type': task.task_type,
                    'status': task.status.value,
                    'progress': task.progress,
                    'message': task.message,
                    'start_time': task.start_time.isoformat() if task.start_time else None
                }
                for task_id, task in self.tasks.items()
                if task.status == CrawlerStatus.RUNNING
            }
    
    def cleanup_completed_tasks(self, max_age_hours: int = 24):
        """清理已完成的任务"""
        cutoff_time = datetime.utcnow() - timedelta(hours=max_age_hours)
        
        with self._lock:
            completed_tasks = []
            for task_id, task in self.tasks.items():
                if (task.status in [CrawlerStatus.STOPPED, CrawlerStatus.ERROR] and 
                    task.end_time and task.end_time < cutoff_time):
                    completed_tasks.append(task_id)
            
            for task_id in completed_tasks:
                del self.tasks[task_id]
        
        return len(completed_tasks)

# 创建全局爬虫管理器实例
crawler_manager = CrawlerManager()