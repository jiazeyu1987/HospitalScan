"""
医院搜索服务

提供多渠道医院官网搜索功能，包括：
- 搜索引擎API搜索
- 卫健委名录查询
- 手动导入管理
- 搜索结果验证和筛选

作者：MiniMax Agent
版本：v1.0
日期：2025-11-18
"""

import re
import json
import requests
import time
import random
from typing import List, Dict, Optional, Tuple, Any
from urllib.parse import urljoin, urlparse
from datetime import datetime
import logging

class HospitalSearchService:
    """医院搜索服务类"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
        # 配置信息
        self.config = {
            'max_results_per_query': 20,
            'request_timeout': 30,
            'max_retries': 3,
            'delay_range': (1, 5),
            'user_agents': [
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            ]
        }
        
        # 医院相关关键词
        self.hospital_keywords = [
            '医院', '医疗', '诊所', '卫生院', '卫生站', 
            'hospital', 'medical', 'clinic', 'healthcare'
        ]
        
        # 排除的域名模式（第三方网站）
        self.exclude_domains = [
            'sina.com', 'sohu.com', 'qq.com', '163.com', 'baidu.com',
            'google.com', 'bing.com', 'sogou.com', '360.cn',
            'github.com', 'csdn.net', 'cnblogs.com', 'segmentfault.com',
            'zhihu.com', 'douban.com', 'juejin.cn', 'jianshu.com'
        ]
        
        # 搜索引擎配置（模拟，实际需要真实API）
        self.search_engines = {
            'duckduckgo': {
                'enabled': True,
                'base_url': 'https://duckduckgo.com',
                'api_url': 'https://api.duckduckgo.com',
                'params': {
                    'q': '',
                    'format': 'json',
                    'no_html': '1',
                    'skip_disambig': '1'
                }
            }
        }
    
    def search_hospitals(self, hospital_name: str, region_name: str = None, max_results: int = None) -> List[Dict[str, Any]]:
        """
        多渠道搜索医院官网
        
        Args:
            hospital_name: 医院名称
            region_name: 地区名称
            max_results: 最大结果数
            
        Returns:
            搜索结果列表
        """
        if max_results is None:
            max_results = self.config['max_results_per_query']
        
        self.logger.info(f"开始搜索医院: {hospital_name} (地区: {region_name})")
        
        all_results = []
        
        # 搜索查询构建
        search_queries = self._build_search_queries(hospital_name, region_name)
        
        # 多渠道搜索
        for query in search_queries:
            # 搜索引擎搜索
            search_results = self._search_via_search_engine(query)
            all_results.extend(search_results)
            
            # 卫健委名录搜索
            health_results = self._search_health_commission(hospital_name, region_name)
            all_results.extend(health_results)
            
            # 添加延迟避免请求过于频繁
            time.sleep(random.uniform(*self.config['delay_range']))
        
        # 去重和排序
        unique_results = self._deduplicate_results(all_results)
        
        # 评分和排序
        scored_results = self._score_and_rank_results(unique_results, hospital_name, region_name)
        
        # 截取结果
        return scored_results[:max_results]
    
    def _build_search_queries(self, hospital_name: str, region_name: str = None) -> List[str]:
        """构建搜索查询"""
        queries = []
        
        # 基础查询
        base_queries = [
            f'"{hospital_name}" 医院 官网',
            f'{hospital_name} 官方网站',
            f'{hospital_name} hospital 官网',
        ]
        
        if region_name:
            # 添加地区信息的查询
            region_queries = [
                f'"{hospital_name}" {region_name} 医院',
                f'{hospital_name} {region_name} 官网',
                f'{region_name} {hospital_name} 医院',
            ]
            base_queries.extend(region_queries)
        
        queries.extend(base_queries)
        
        return queries
    
    def _search_via_search_engine(self, query: str) -> List[Dict[str, Any]]:
        """通过搜索引擎搜索"""
        results = []
        
        try:
            # 模拟DuckDuckGo搜索结果
            # 实际项目中应该使用真实的DuckDuckGo API或其他搜索引擎API
            mock_results = self._generate_mock_search_results(query)
            results.extend(mock_results)
            
            self.logger.debug(f"搜索引擎搜索完成: {query}")
            
        except Exception as e:
            self.logger.error(f"搜索引擎搜索失败 {query}: {str(e)}")
        
        return results
    
    def _search_health_commission(self, hospital_name: str, region_name: str = None) -> List[Dict[str, Any]]:
        """通过卫健委名录搜索"""
        results = []
        
        try:
            # 这里可以集成真实的卫健委API或数据源
            # 目前返回模拟数据
            mock_results = self._generate_mock_health_results(hospital_name, region_name)
            results.extend(mock_results)
            
            self.logger.debug(f"卫健委名录搜索完成: {hospital_name}")
            
        except Exception as e:
            self.logger.error(f"卫健委搜索失败 {hospital_name}: {str(e)}")
        
        return results
    
    def _generate_mock_search_results(self, query: str) -> List[Dict[str, Any]]:
        """生成模拟搜索结果"""
        # 这里生成一些模拟的搜索结果用于演示
        results = []
        
        # 模拟结果1
        if '北京' in query and '医院' in query:
            results.append({
                'title': '北京协和医院官网',
                'url': 'https://www.pumc.edu.cn',
                'description': '北京协和医院官方网站，提供医疗服务和医院信息',
                'domain': 'pumc.edu.cn',
                'source': 'search_engine',
                'confidence': 0.9
            })
            
            results.append({
                'title': '北京大学第一医院',
                'url': 'https://www.bddyyy.cn',
                'description': '北京大学第一医院官方网站',
                'domain': 'bddyyy.cn',
                'source': 'search_engine',
                'confidence': 0.8
            })
        
        # 模拟结果2
        if '上海' in query and '医院' in query:
            results.append({
                'title': '上海交通大学医学院附属瑞金医院',
                'url': 'https://www.rjh.com.cn',
                'description': '瑞金医院官方网站',
                'domain': 'rjh.com.cn',
                'source': 'search_engine',
                'confidence': 0.85
            })
        
        return results
    
    def _generate_mock_health_results(self, hospital_name: str, region_name: str = None) -> List[Dict[str, Any]]:
        """生成模拟卫健委搜索结果"""
        results = []
        
        # 模拟卫健委名录中的医院信息
        if '协和' in hospital_name:
            results.append({
                'title': '北京协和医院',
                'url': 'https://www.pumc.edu.cn',
                'description': '国家卫生健康委员会直属医院',
                'domain': 'pumc.edu.cn',
                'source': 'health_commission',
                'confidence': 0.95,
                'hospital_type': 'public',
                'level': 'level3',
                'verified': True
            })
        
        return results
    
    def _deduplicate_results(self, results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """去重搜索结果"""
        seen_domains = set()
        unique_results = []
        
        for result in results:
            domain = urlparse(result['url']).netloc.lower()
            
            if domain not in seen_domains:
                seen_domains.add(domain)
                unique_results.append(result)
        
        return unique_results
    
    def _score_and_rank_results(self, results: List[Dict[str, Any]], hospital_name: str, region_name: str = None) -> List[Dict[str, Any]]:
        """评分和排序搜索结果"""
        for result in results:
            score = 0.0
            
            # 标题匹配度评分 (0-40分)
            title = result.get('title', '')
            if hospital_name.lower() in title.lower():
                score += 20
            
            # 医院关键词评分 (0-20分)
            if any(keyword in title for keyword in self.hospital_keywords):
                score += 20
            
            # 域名可信度评分 (0-20分)
            domain = result.get('domain', '')
            if any(hospital_keyword in domain for hospital_keyword in ['hospital', 'medical', 'yy', 'cn']):
                score += 15
            
            # 描述质量评分 (0-10分)
            description = result.get('description', '')
            if any(keyword in description for keyword in self.hospital_keywords):
                score += 10
            
            # 来源可信度评分 (0-10分)
            source = result.get('source', '')
            if source == 'health_commission':
                score += 10
            elif source == 'search_engine':
                score += 5
            
            # 已有置信度
            if 'confidence' in result:
                score = score * 0.7 + result['confidence'] * 30
            
            result['final_score'] = score
        
        # 按分数降序排序
        results.sort(key=lambda x: x['final_score'], reverse=True)
        
        return results
    
    def validate_website_url(self, url: str, hospital_name: str = None) -> Dict[str, Any]:
        """
        验证网站URL是否可能为医院官网
        
        Args:
            url: 网站URL
            hospital_name: 医院名称
            
        Returns:
            验证结果
        """
        validation_result = {
            'is_valid': False,
            'url': url,
            'domain': urlparse(url).netloc.lower(),
            'score': 0.0,
            'issues': [],
            'recommendations': []
        }
        
        try:
            # 检查URL格式
            parsed_url = urlparse(url)
            if not parsed_url.scheme or not parsed_url.netloc:
                validation_result['issues'].append('URL格式无效')
                return validation_result
            
            # 检查域名是否在排除列表中
            domain = parsed_url.netloc.lower()
            if any(exclude_domain in domain for exclude_domain in self.exclude_domains):
                validation_result['issues'].append('域名可能是第三方网站')
                validation_result['recommendations'].append('建议使用医院官方域名')
            
            # 检查域名是否包含医院相关关键词
            hospital_indicators = []
            for keyword in self.hospital_keywords:
                if keyword in domain:
                    hospital_indicators.append(keyword)
            
            if hospital_indicators:
                validation_result['score'] += 20
                validation_result['recommendations'].append(f'域名包含医院相关关键词: {", ".join(hospital_indicators)}')
            
            # 检查是否使用HTTPS
            if parsed_url.scheme == 'https':
                validation_result['score'] += 10
                validation_result['recommendations'].append('网站使用HTTPS连接，更安全')
            elif parsed_url.scheme == 'http':
                validation_result['recommendations'].append('建议网站使用HTTPS协议')
            
            # 检查医院名称匹配
            if hospital_name and hospital_name.lower() in domain:
                validation_result['score'] += 30
                validation_result['recommendations'].append('域名包含医院名称')
            
            # 判断是否为有效医院网站
            validation_result['is_valid'] = validation_result['score'] >= 40
            
            # 如果分数很低，给出建议
            if validation_result['score'] < 30:
                validation_result['recommendations'].extend([
                    '建议进一步验证网站内容',
                    '查看网站是否包含医院相关信息',
                    '确认网站是否为官方网站'
                ])
            
        except Exception as e:
            validation_result['issues'].append(f'验证过程出错: {str(e)}')
        
        return validation_result
    
    def get_manual_hospital_websites(self) -> List[Dict[str, Any]]:
        """获取手动导入的医院网站列表"""
        # 这里可以从数据库中获取手动导入的医院网站
        # 目前返回模拟数据
        return [
            {
                'id': 1,
                'name': '北京协和医院',
                'url': 'https://www.pumc.edu.cn',
                'domain': 'pumc.edu.cn',
                'source': 'manual',
                'created_at': '2025-01-01T00:00:00Z',
                'verified': True
            }
        ]
    
    def add_manual_hospital_website(self, name: str, url: str, description: str = None) -> Dict[str, Any]:
        """手动添加医院网站"""
        result = {
            'success': False,
            'message': '',
            'website_id': None
        }
        
        try:
            # 验证URL
            validation = self.validate_website_url(url, name)
            
            # 这里可以将数据保存到数据库
            # 目前返回成功响应
            result.update({
                'success': True,
                'message': '医院网站添加成功',
                'website_id': f"manual_{int(time.time())}",
                'validation': validation
            })
            
            self.logger.info(f"手动添加医院网站: {name} - {url}")
            
        except Exception as e:
            result['message'] = f'添加失败: {str(e)}'
            self.logger.error(f'手动添加医院网站失败: {str(e)}')
        
        return result

# 创建全局医院搜索服务实例
hospital_search_service = HospitalSearchService()