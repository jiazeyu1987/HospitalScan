"""
内容去重服务

提供内容去重和相似度检测功能，包括：
- SHA256哈希去重
- 文本相似度计算
- 内容增量更新
- 重复内容管理

作者：MiniMax Agent
版本：v1.0
日期：2025-11-18
"""

import hashlib
import re
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
from difflib import SequenceMatcher
import jieba
import logging

class ContentDeduplicator:
    """内容去重服务"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
        # 去重配置
        self.config = {
            'hash_algorithm': 'sha256',
            'similarity_threshold': 0.8,  # 相似度阈值
            'min_content_length': 10,  # 最小内容长度
            'cleanup_expired_days': 30,  # 清理过期记录的天数
        }
        
        # 内容处理配置
        self.text_preprocessing = {
            'remove_html_tags': True,
            'remove_special_chars': True,
            'normalize_whitespace': True,
            'remove_stop_words': False,  # 是否去除停用词
            'min_word_length': 2,  # 最小词长度
        }
    
    def calculate_content_hash(self, content: str, title: str = None, date: str = None) -> str:
        """
        计算内容哈希值
        
        Args:
            content: 内容文本
            title: 标题
            date: 日期
            
        Returns:
            SHA256哈希值
        """
        # 预处理内容
        processed_content = self._preprocess_text(content)
        
        # 构建用于哈希的数据
        hash_data = {
            'content': processed_content,
            'title': title or '',
            'date': date or '',
        }
        
        # 创建哈希字符串
        hash_string = f"{hash_data['title']}|{hash_data['date']}|{hash_data['content']}"
        
        # 计算SHA256哈希
        content_hash = hashlib.sha256(hash_string.encode('utf-8')).hexdigest()
        
        return content_hash
    
    def is_duplicate_content(self, content_hash: str, existing_hashes: List[str]) -> bool:
        """
        检查内容是否重复
        
        Args:
            content_hash: 新内容的哈希值
            existing_hashes: 已存在的内容哈希列表
            
        Returns:
            是否为重复内容
        """
        return content_hash in existing_hashes
    
    def calculate_text_similarity(self, text1: str, text2: str) -> float:
        """
        计算两个文本的相似度
        
        Args:
            text1: 文本1
            text2: 文本2
            
        Returns:
            相似度分数 (0-1)
        """
        # 预处理文本
        processed_text1 = self._preprocess_text(text1)
        processed_text2 = self._preprocess_text(text2)
        
        if not processed_text1 or not processed_text2:
            return 0.0
        
        # 方法1: 基于序列匹配的相似度
        similarity1 = SequenceMatcher(None, processed_text1, processed_text2).ratio()
        
        # 方法2: 基于词汇匹配的相似度
        words1 = set(jieba.lcut(processed_text1))
        words2 = set(jieba.lcut(processed_text2))
        
        if not words1 or not words2:
            return 0.0
        
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        
        similarity2 = len(intersection) / len(union) if union else 0.0
        
        # 综合两种方法的相似度
        final_similarity = (similarity1 + similarity2) / 2
        
        return final_similarity
    
    def find_similar_contents(self, content: str, existing_contents: List[Dict[str, Any]], 
                            similarity_threshold: float = None) -> List[Dict[str, Any]]:
        """
        查找相似内容
        
        Args:
            content: 待比较的内容
            existing_contents: 已存在的内容列表
            similarity_threshold: 相似度阈值
            
        Returns:
            相似内容列表
        """
        if similarity_threshold is None:
            similarity_threshold = self.config['similarity_threshold']
        
        similar_contents = []
        
        for existing in existing_contents:
            # 获取现有内容
            existing_text = existing.get('content', '') or existing.get('title', '')
            
            if not existing_text:
                continue
            
            # 计算相似度
            similarity = self.calculate_text_similarity(content, existing_text)
            
            if similarity >= similarity_threshold:
                similar_contents.append({
                    'content': existing,
                    'similarity': similarity
                })
        
        # 按相似度排序
        similar_contents.sort(key=lambda x: x['similarity'], reverse=True)
        
        return similar_contents
    
    def deduplicate_tender_list(self, tenders: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
        """
        去重招投标列表
        
        Args:
            tenders: 招投标列表
            
        Returns:
            去重后的招投标列表和统计信息
        """
        deduplicated_tenders = []
        statistics = {
            'total_count': len(tenders),
            'duplicates_removed': 0,
            'similar_merged': 0,
            'unique_count': 0,
            'duplicate_groups': []
        }
        
        seen_hashes = set()
        similar_groups = []
        
        for tender in tenders:
            title = tender.get('title', '')
            content = tender.get('content', '') or title
            date = tender.get('publish_date', '')
            
            # 计算内容哈希
            content_hash = self.calculate_content_hash(content, title, date)
            
            # 检查是否重复
            if self.is_duplicate_content(content_hash, list(seen_hashes)):
                statistics['duplicates_removed'] += 1
                continue
            
            # 检查是否与已有内容相似
            existing_texts = [t.get('content', '') or t.get('title', '') for t in deduplicated_tenders]
            similar_contents = self.find_similar_contents(
                content, 
                [{'content': text} for text in existing_texts]
            )
            
            if similar_contents:
                # 找到相似内容，进行合并处理
                most_similar = similar_contents[0]
                similar_groups.append({
                    'new_tender': tender,
                    'similar_to': most_similar['content'],
                    'similarity': most_similar['similarity']
                })
                statistics['similar_merged'] += 1
                
                # 选择内容更丰富的版本
                if len(content) > len(most_similar['content']):
                    deduplicated_tenders.append(tender)
                # 否则跳过新内容，保留已有的
            else:
                # 不相似，添加到结果中
                deduplicated_tenders.append(tender)
                seen_hashes.add(content_hash)
        
        statistics['unique_count'] = len(deduplicated_tenders)
        statistics['duplicate_groups'] = similar_groups
        
        self.logger.info(f"去重完成: 总数={statistics['total_count']}, "
                        f"唯一={statistics['unique_count']}, "
                        f"去重={statistics['duplicates_removed']}, "
                        f"相似合并={statistics['similar_merged']}")
        
        return deduplicated_tenders, statistics
    
    def detect_content_changes(self, old_content: str, new_content: str) -> Dict[str, Any]:
        """
        检测内容变更
        
        Args:
            old_content: 旧内容
            new_content: 新内容
            
        Returns:
            变更检测结果
        """
        change_detection = {
            'has_changes': False,
            'similarity': 0.0,
            'change_ratio': 0.0,
            'added_content': '',
            'removed_content': '',
            'summary': ''
        }
        
        if not old_content or not new_content:
            return change_detection
        
        # 计算相似度
        similarity = self.calculate_text_similarity(old_content, new_content)
        change_detection['similarity'] = similarity
        
        # 判断是否有变更
        if similarity < 0.95:  # 相似度低于95%认为有变更
            change_detection['has_changes'] = True
            
            # 计算变更比例
            change_ratio = 1 - similarity
            change_detection['change_ratio'] = change_ratio
            
            # 简单分析变更类型
            old_words = set(jieba.lcut(old_content))
            new_words = set(jieba.lcut(new_content))
            
            added_words = new_words - old_words
            removed_words = old_words - new_words
            
            if added_words:
                change_detection['added_content'] = ', '.join(list(added_words)[:10])  # 只显示前10个词
            
            if removed_words:
                change_detection['removed_content'] = ', '.join(list(removed_words)[:10])
            
            # 生成变更摘要
            if len(added_words) > len(removed_words):
                change_detection['summary'] = '主要添加了新内容'
            elif len(removed_words) > len(added_words):
                change_detection['summary'] = '主要移除了旧内容'
            else:
                change_detection['summary'] = '内容有修改但变化不大'
        
        return change_detection
    
    def cleanup_expired_records(self, records: List[Dict[str, Any]], 
                              date_field: str = 'created_at') -> List[Dict[str, Any]]:
        """
        清理过期记录
        
        Args:
            records: 记录列表
            date_field: 日期字段名
            
        Returns:
            清理后的记录列表
        """
        cutoff_date = datetime.now() - timedelta(days=self.config['cleanup_expired_days'])
        cleaned_records = []
        removed_count = 0
        
        for record in records:
            record_date_str = record.get(date_field, '')
            
            try:
                if record_date_str:
                    # 解析日期
                    if isinstance(record_date_str, str):
                        if 'T' in record_date_str:
                            record_date = datetime.fromisoformat(record_date_str.replace('Z', '+00:00'))
                        else:
                            record_date = datetime.strptime(record_date_str, '%Y-%m-%d')
                    else:
                        record_date = record_date_str
                    
                    # 如果记录日期在截止日期之后，保留
                    if record_date >= cutoff_date:
                        cleaned_records.append(record)
                    else:
                        removed_count += 1
                else:
                    # 没有日期信息的记录保留
                    cleaned_records.append(record)
                    
            except (ValueError, TypeError) as e:
                self.logger.warning(f"无法解析日期 {record_date_str}: {str(e)}")
                # 无法解析日期的记录保留
                cleaned_records.append(record)
        
        self.logger.info(f"清理过期记录完成: 清理数量={removed_count}, 保留数量={len(cleaned_records)}")
        
        return cleaned_records
    
    def _preprocess_text(self, text: str) -> str:
        """
        预处理文本
        
        Args:
            text: 原始文本
            
        Returns:
            预处理后的文本
        """
        if not text:
            return ""
        
        processed = text
        
        # 移除HTML标签
        if self.text_preprocessing['remove_html_tags']:
            processed = re.sub(r'<[^>]+>', '', processed)
        
        # 移除特殊字符
        if self.text_preprocessing['remove_special_chars']:
            processed = re.sub(r'[^\w\s一-鿿]', '', processed)
        
        # 标准化空白字符
        if self.text_preprocessing['normalize_whitespace']:
            processed = re.sub(r'\s+', ' ', processed)
            processed = processed.strip()
        
        # 过滤短词
        if self.text_preprocessing['remove_stop_words']:
            words = processed.split()
            words = [word for word in words if len(word) >= self.text_preprocessing['min_word_length']]
            processed = ' '.join(words)
        
        # 限制最小长度
        if len(processed) < self.config['min_content_length']:
            return ""
        
        return processed.lower()
    
    def get_content_fingerprint(self, content: str) -> str:
        """
        生成内容指纹
        
        Args:
            content: 内容文本
            
        Returns:
            内容指纹字符串
        """
        # 预处理内容
        processed = self._preprocess_text(content)
        
        # 提取关键词作为指纹
        words = jieba.lcut(processed)
        
        # 过滤短词和停用词
        words = [word for word in words if len(word) >= 2]
        
        # 排序并连接
        words.sort()
        fingerprint = ''.join(words[:20])  # 取前20个词作为指纹
        
        return fingerprint

# 创建全局内容去重服务实例
content_deduplicator = ContentDeduplicator()