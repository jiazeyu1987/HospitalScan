"""
数据库模型定义

包含系统中所有核心数据表的数据模型，使用SQLAlchemy ORM实现。
模型设计遵循数据库设计文档的规范，支持完整的数据关系和约束。

作者：MiniMax Agent
版本：v1.0
日期：2025-11-18
"""

from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, Boolean, Enum, 
    Numeric, ForeignKey, Index, UniqueConstraint, TIMESTAMP
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from app import db

# 枚举类型定义
RegionLevel = Enum('country', 'province', 'city', 'county', name='region_level')
HospitalType = Enum('public', 'private', 'community', 'specialized', 'traditional', name='hospital_type')
HospitalLevel = Enum('unknown', 'level1', 'level2', 'level3', 'level3a', name='hospital_level')
HospitalOwnership = Enum('government', 'private', 'collective', 'foreign', 'mixed', name='hospital_ownership')
HospitalStatus = Enum('active', 'inactive', 'closed', 'relocated', name='hospital_status')

TenderType = Enum('procurement', 'construction', 'service', 'medical', 'equipment', 'other', name='tender_type')
TenderCategory = Enum('construction', 'medical_equipment', 'drugs', 'service', 'it', 'other', name='tender_category')
TenderStatus = Enum('published', 'in_progress', 'closed', 'cancelled', 'awarded', name='tender_status')

AliasType = Enum('abbreviation', 'former_name', 'nickname', 'common_name', name='alias_type')

ScanType = Enum('hospital_discovery', 'hospital_scan', 'tender_monitor', 'full_scan', name='scan_type')
TargetType = Enum('region', 'hospital', name='target_type')
ScanStatus = Enum('pending', 'running', 'success', 'failed', 'partial', 'cancelled', name='scan_status')

class Region(db.Model):
    """行政区划表"""
    
    __tablename__ = 'regions'
    
    # 主键字段
    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # 基本信息
    name = Column(String(100), nullable=False, comment='地区名称')
    code = Column(String(20), unique=True, nullable=False, comment='行政区划代码')
    level = Column(RegionLevel, nullable=False, comment='层级')
    
    # 层级关系
    parent_id = Column(Integer, ForeignKey('regions.id'), comment='父级地区ID')
    sort_order = Column(Integer, default=0, comment='排序顺序')
    
    # 地理信息
    longitude = Column(Numeric(10, 7), comment='经度')
    latitude = Column(Numeric(10, 7), comment='纬度')
    area_code = Column(String(10), comment='电话区号')
    postal_code = Column(String(10), comment='邮政编码')
    
    # 统计信息
    hospital_count = Column(Integer, default=0, comment='医院数量')
    
    # 时间戳
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关系
    parent = relationship('Region', remote_side=[id], backref='children')
    hospitals = relationship('Hospital', backref='region', lazy='dynamic')
    
    def __repr__(self):
        return f'<Region {self.name}({self.code})>'
    
    def to_dict(self):
        """转换为字典格式"""
        return {
            'id': self.id,
            'name': self.name,
            'code': self.code,
            'level': self.level,
            'parent_id': self.parent_id,
            'sort_order': self.sort_order,
            'longitude': float(self.longitude) if self.longitude else None,
            'latitude': float(self.latitude) if self.latitude else None,
            'area_code': self.area_code,
            'postal_code': self.postal_code,
            'hospital_count': self.hospital_count,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'children': [child.to_dict() for child in self.children] if hasattr(self, 'children') else []
        }

class Hospital(db.Model):
    """医院信息表"""
    
    __tablename__ = 'hospitals'
    
    # 主键字段
    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # 基本信息
    name = Column(String(200), nullable=False, comment='医院名称')
    official_name = Column(String(200), comment='医院全称')
    short_name = Column(String(100), comment='医院简称')
    english_name = Column(String(200), comment='英文名称')
    
    # 网址信息
    website_url = Column(String(500), comment='官网地址', unique=True)
    domain_name = Column(String(100), comment='域名')
    is_https = Column(Boolean, default=False, comment='是否使用HTTPS')
    
    # 分类信息
    hospital_type = Column(HospitalType, default='public', comment='医院类型')
    hospital_level = Column(HospitalLevel, default='unknown', comment='医院等级')
    ownership = Column(HospitalOwnership, default='government', comment='所有制性质')
    
    # 地理信息
    region_id = Column(Integer, ForeignKey('regions.id'), nullable=False, comment='所属行政区')
    address = Column(Text, comment='医院地址')
    longitude = Column(Numeric(10, 7), comment='经度')
    latitude = Column(Numeric(10, 7), comment='纬度')
    
    # 联系信息
    phone = Column(String(50), comment='联系电话')
    email = Column(String(100), comment='电子邮箱')
    fax = Column(String(50), comment='传真')
    
    # 状态信息
    status = Column(HospitalStatus, default='active', comment='医院状态')
    verified = Column(Boolean, default=False, comment='是否已验证')
    verification_date = Column(TIMESTAMP, comment='验证时间')
    last_scan_time = Column(TIMESTAMP, comment='最后扫描时间')
    last_success_scan_time = Column(TIMESTAMP, comment='最后成功扫描时间')
    
    # 统计信息
    tender_count = Column(Integer, default=0, comment='招投标记录数')
    scan_success_count = Column(Integer, default=0, comment='扫描成功次数')
    scan_failed_count = Column(Integer, default=0, comment='扫描失败次数')
    
    # 扩展信息
    description = Column(Text, comment='医院描述')
    specialties = Column(Text, comment='特色科室')
    bed_count = Column(Integer, comment='床位数')
    staff_count = Column(Integer, comment='员工数量')
    
    # 时间戳
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关系
    aliases = relationship('HospitalAlias', backref='hospital', lazy='dynamic', cascade='all, delete-orphan')
    tender_records = relationship('TenderRecord', backref='hospital', lazy='dynamic', cascade='all, delete-orphan')
    
    # 索引
    __table_args__ = (
        Index('idx_hospitals_region_verified', 'region_id', 'verified'),
        Index('idx_hospitals_type', 'hospital_type'),
        Index('idx_hospitals_status', 'status'),
        Index('idx_hospitals_scan_time', 'last_scan_time'),
        Index('idx_hospitals_search', 'name', 'official_name', 'address'),
    )
    
    def __repr__(self):
        return f'<Hospital {self.name}>'
    
    def to_dict(self, include_aliases=True, include_tenders=False):
        """转换为字典格式"""
        data = {
            'id': self.id,
            'name': self.name,
            'official_name': self.official_name,
            'short_name': self.short_name,
            'english_name': self.english_name,
            'website_url': self.website_url,
            'domain_name': self.domain_name,
            'is_https': self.is_https,
            'hospital_type': self.hospital_type,
            'hospital_level': self.hospital_level,
            'ownership': self.ownership,
            'region_id': self.region_id,
            'region_name': self.region.name if self.region else None,
            'address': self.address,
            'longitude': float(self.longitude) if self.longitude else None,
            'latitude': float(self.latitude) if self.latitude else None,
            'phone': self.phone,
            'email': self.email,
            'fax': self.fax,
            'status': self.status,
            'verified': self.verified,
            'verification_date': self.verification_date.isoformat() if self.verification_date else None,
            'last_scan_time': self.last_scan_time.isoformat() if self.last_scan_time else None,
            'last_success_scan_time': self.last_success_scan_time.isoformat() if self.last_success_scan_time else None,
            'tender_count': self.tender_count,
            'scan_success_count': self.scan_success_count,
            'scan_failed_count': self.scan_failed_count,
            'description': self.description,
            'specialties': self.specialties,
            'bed_count': self.bed_count,
            'staff_count': self.staff_count,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
        
        if include_aliases:
            data['aliases'] = [alias.to_dict() for alias in self.aliases]
        
        if include_tenders:
            # 只返回最近50条招投标记录，避免数据过大
            data['recent_tenders'] = [tender.to_dict() for tender in self.tender_records.order_by(TenderRecord.publish_date.desc()).limit(50)]
        
        return data

class HospitalAlias(db.Model):
    """医院别名表"""
    
    __tablename__ = 'hospital_alias'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    hospital_id = Column(Integer, ForeignKey('hospitals.id'), nullable=False, comment='医院ID')
    alias_name = Column(String(200), nullable=False, comment='别名')
    alias_type = Column(AliasType, default='abbreviation', comment='别名类型')
    is_official = Column(Boolean, default=False, comment='是否官方别名')
    confidence_score = Column(Numeric(3, 2), default=0.00, comment='可信度分数')
    source = Column(String(100), comment='来源')
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    
    # 索引
    __table_args__ = (
        UniqueConstraint('hospital_id', 'alias_name', name='uq_hospital_alias'),
        Index('idx_alias_name', 'alias_name'),
        Index('idx_alias_hospital', 'hospital_id'),
    )
    
    def __repr__(self):
        return f'<HospitalAlias {self.alias_name}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'hospital_id': self.hospital_id,
            'alias_name': self.alias_name,
            'alias_type': self.alias_type,
            'is_official': self.is_official,
            'confidence_score': float(self.confidence_score) if self.confidence_score else 0.0,
            'source': self.source,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class TenderRecord(db.Model):
    """招投标记录表"""
    
    __tablename__ = 'tender_records'
    
    # 主键字段
    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # 基本信息
    hospital_id = Column(Integer, ForeignKey('hospitals.id'), nullable=False, comment='医院ID')
    title = Column(String(500), nullable=False, comment='招标标题')
    content = Column(Text, comment='招标内容摘要')
    
    # 详细信息
    tender_type = Column(TenderType, default='other', comment='招标类型')
    tender_category = Column(TenderCategory, default='other', comment='招标分类')
    budget_amount = Column(Numeric(15, 2), comment='预算金额')
    budget_currency = Column(String(3), default='CNY', comment='预算币种')
    
    # 时间信息
    publish_date = Column(DateTime, comment='发布日期')
    deadline_date = Column(DateTime, comment='截止日期')
    start_date = Column(DateTime, comment='开始日期')
    end_date = Column(DateTime, comment='结束日期')
    
    # 网址信息
    source_url = Column(String(500), comment='原始链接')
    detail_url = Column(String(500), comment='详情链接')
    
    # 内容标识
    content_hash = Column(String(64), unique=True, nullable=False, comment='内容哈希')
    html_hash = Column(String(64), comment='HTML内容哈希')
    
    # 状态信息
    status = Column(TenderStatus, default='published', comment='招标状态')
    is_important = Column(Boolean, default=False, comment='是否重要')
    importance_reason = Column(Text, comment='重要原因')
    
    # 数据来源
    source_page_title = Column(String(500), comment='来源页面标题')
    source_section = Column(String(100), comment='来源栏目')
    crawl_method = Column(String(10), default='auto', comment='采集方式')
    verified = Column(Boolean, default=False, comment='是否已验证')
    
    # 统计分析
    view_count = Column(Integer, default=0, comment='查看次数')
    download_count = Column(Integer, default=0, comment='下载次数')
    
    # 时间戳
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 索引
    __table_args__ = (
        Index('idx_tenders_hospital_date', 'hospital_id', 'publish_date'),
        Index('idx_tenders_date', 'publish_date'),
        Index('idx_tenders_type', 'tender_type'),
        Index('idx_tenders_status', 'status'),
        Index('idx_tenders_hash', 'content_hash'),
        Index('idx_tenders_important', 'is_important', 'publish_date'),
        Index('idx_tenders_search', 'title', 'content'),
    )
    
    def __repr__(self):
        return f'<TenderRecord {self.title[:50]}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'hospital_id': self.hospital_id,
            'hospital_name': self.hospital.name if self.hospital else None,
            'title': self.title,
            'content': self.content,
            'tender_type': self.tender_type,
            'tender_category': self.tender_category,
            'budget_amount': float(self.budget_amount) if self.budget_amount else None,
            'budget_currency': self.budget_currency,
            'publish_date': self.publish_date.isoformat() if self.publish_date else None,
            'deadline_date': self.deadline_date.isoformat() if self.deadline_date else None,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'source_url': self.source_url,
            'detail_url': self.detail_url,
            'content_hash': self.content_hash,
            'html_hash': self.html_hash,
            'status': self.status,
            'is_important': self.is_important,
            'importance_reason': self.importance_reason,
            'source_page_title': self.source_page_title,
            'source_section': self.source_section,
            'crawl_method': self.crawl_method,
            'verified': self.verified,
            'view_count': self.view_count,
            'download_count': self.download_count,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class ScanHistory(db.Model):
    """扫描历史表"""
    
    __tablename__ = 'scan_history'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # 任务基本信息
    task_id = Column(String(50), unique=True, nullable=False, comment='任务ID')
    task_name = Column(String(200), nullable=False, comment='任务名称')
    scan_type = Column(ScanType, nullable=False, comment='扫描类型')
    
    # 目标信息
    target_type = Column(TargetType, nullable=False, comment='目标类型')
    target_id = Column(Integer, comment='目标ID')
    target_description = Column(Text, comment='目标描述')
    
    # 执行信息
    start_time = Column(TIMESTAMP, nullable=False, comment='开始时间')
    end_time = Column(TIMESTAMP, comment='结束时间')
    duration_seconds = Column(Integer, comment='执行时长(秒)')
    status = Column(ScanStatus, default='pending', comment='执行状态')
    
    # 统计信息
    total_count = Column(Integer, default=0, comment='总数量')
    success_count = Column(Integer, default=0, comment='成功数量')
    failed_count = Column(Integer, default=0, comment='失败数量')
    new_records = Column(Integer, default=0, comment='新记录数')
    
    # 结果信息
    records_found = Column(Integer, default=0, comment='发现的记录数')
    hospitals_discovered = Column(Integer, default=0, comment='发现的新医院数')
    tenders_found = Column(Integer, default=0, comment='发现的招投标数')
    
    # 错误信息
    error_message = Column(Text, comment='错误信息')
    retry_count = Column(Integer, default=0, comment='重试次数')
    
    # 时间戳
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    
    # 索引
    __table_args__ = (
        Index('idx_scan_history_task_id', 'task_id'),
        Index('idx_scan_history_scan_type', 'scan_type'),
        Index('idx_scan_history_status', 'status'),
        Index('idx_scan_history_start_time', 'start_time'),
        Index('idx_scan_history_target', 'target_type', 'target_id'),
    )
    
    def __repr__(self):
        return f'<ScanHistory {self.task_name}({self.status})>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'task_id': self.task_id,
            'task_name': self.task_name,
            'scan_type': self.scan_type,
            'target_type': self.target_type,
            'target_id': self.target_id,
            'target_description': self.target_description,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'duration_seconds': self.duration_seconds,
            'status': self.status,
            'total_count': self.total_count,
            'success_count': self.success_count,
            'failed_count': self.failed_count,
            'new_records': self.new_records,
            'records_found': self.records_found,
            'hospitals_discovered': self.hospitals_discovered,
            'tenders_found': self.tenders_found,
            'error_message': self.error_message,
            'retry_count': self.retry_count,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Settings(db.Model):
    """系统设置表"""
    
    __tablename__ = 'settings'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    key = Column(String(100), unique=True, nullable=False, comment='设置键')
    value = Column(Text, comment='设置值')
    description = Column(Text, comment='设置描述')
    data_type = Column(String(20), default='string', comment='数据类型')
    category = Column(String(50), default='general', comment='设置分类')
    is_encrypted = Column(Boolean, default=False, comment='是否加密')
    
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 索引
    __table_args__ = (
        Index('idx_settings_key', 'key'),
        Index('idx_settings_category', 'category'),
    )
    
    def __repr__(self):
        return f'<Settings {self.key}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'key': self.key,
            'value': self.value,
            'description': self.description,
            'data_type': self.data_type,
            'category': self.category,
            'is_encrypted': self.is_encrypted,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }