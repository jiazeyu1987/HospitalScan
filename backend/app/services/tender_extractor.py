"""
招投标信息提取模块

负责从医院网站中自动识别和提取招投标信息，包括：
- 招投标栏目自动识别
- HTML内容解析和结构化提取
- 招投标信息字段抽取
- 内容去重和增量更新

作者：MiniMax Agent
版本：v1.0
日期：2025-11-18
"""

import re
import hashlib
import json
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple, Any
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup, Tag
import requests
import logging

class TenderExtractor:
    """招投标信息提取器"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
        # 招投标栏目识别关键词
        self.tender_keywords = [
            '招标', '采购', '中标', '投标', '竞标', '项目招标', '设备采购',
            'tender', 'bid', 'procurement', 'purchase', 'auction'
        ]
        
        # 招投标链接识别模式
        self.tender_url_patterns = [
            r'.*?(招标|采购|中标).*?',
            r'.*?(tender|bid|procurement).*?',
            r'.*?/(招标|采购|bid|tender).*?',
            r'.*?(招标|采购).*?\.html?$',
            r'.*?(项目|采购).*?/.*?',
        ]
        
        # 内容提取正则表达式
        self.content_patterns = {
            'title': [
                r'招标项目[:：]?\s*(.+?)(?:\r?\n|$)',
                r'采购项目[:：]?\s*(.+?)(?:\r?\n|$)',
                r'项目名称[:：]?\s*(.+?)(?:\r?\n|$)',
                r'<h[1-6][^>]*>([^<]*(?:招标|采购|项目)[^<]*)</h[1-6]>',
            ],
            'date': [
                r'(\d{4}[-年]\d{1,2}[-月]\d{1,2}[日]?)',
                r'(\d{4}/\d{1,2}/\d{1,2})',
                r'(\d{1,2}[-/\.]\d{1,2}[-/\.]\d{4})',
                r'发布时间[:：]?\s*(\d{4}[-年]\d{1,2}[-月]\d{1,2}[日]?)',
            ],
            'budget': [
                r'(\d+(?:\.\d+)?)\s*万元',
                r'(\d+(?:\.\d+)?)\s*元',
                r'预算[:：]?\s*(\d+(?:\.\d+)?)\s*(万元|元)',
                r'(\d+(?:\.\d+)?)\s*万元\s*[及和至~～]\s*(\d+(?:\.\d+)?)\s*万元',
            ],
            'deadline': [
                r'截止.*?[:：]?\s*(\d{4}[-年]\d{1,2}[-月]\d{1,2}[日]?)',
                r'投标.*?[:：]?\s*(\d{4}[-年]\d{1,2}[-月]\d{1,2}[日]?)',
                r'投标截止.*?[:：]?\s*(\d{4}[-年]\d{1,2}[-月]\d{1,2}[日]?)',
            ]
        }
        
        # 内容分类关键词
        self.category_keywords = {
            'construction': ['建设', '工程', '装修', '基建', '施工'],
            'medical_equipment': ['设备', '器械', '仪器', '医疗设备'],
            'drugs': ['药品', '药物', '药材'],
            'service': ['服务', '维护', '保洁', '保安'],
            'it': ['信息化', '软件', '系统', '网络', 'IT'],
            'other': []
        }
        
        # 内容类型关键词
        self.type_keywords = {
            'procurement': ['采购', '购买', '采购'],
            'construction': ['建设', '工程', '装修'],
            'service': ['服务', '维护', '保洁'],
            'medical': ['医疗', '医院', '临床'],
            'equipment': ['设备', '器械', '仪器'],
            'other': []
        }
    
    def find_tender_columns(self, soup: BeautifulSoup, base_url: str) -> List[Dict[str, Any]]:
        """
        查找招投标栏目
        
        Args:
            soup: BeautifulSoup解析的HTML对象
            base_url: 基础URL
            
        Returns:
            招投标栏目列表
        """
        tender_columns = []
        
        # 查找导航菜单中的招投标链接
        nav_elements = soup.find_all(['nav', 'div', 'ul', 'ol'], class_=re.compile(r'nav|menu|header'))
        for nav in nav_elements:
            links = nav.find_all('a', href=True)
            for link in links:
                href = link.get('href', '')
                text = link.get_text(strip=True)
                
                # 检查链接文本和URL是否包含招投标关键词
                if any(keyword in text or keyword in href.lower() 
                      for keyword in self.tender_keywords):
                    
                    # 构建完整URL
                    full_url = urljoin(base_url, href)
                    
                    tender_columns.append({
                        'title': text,
                        'url': full_url,
                        'section': self._identify_section_type(text, href),
                        'source': 'navigation'
                    })
        
        # 查找页面中的招投标相关内容
        content_elements = soup.find_all(['div', 'section', 'article'])
        for element in content_elements:
            # 检查元素是否包含招投标关键词
            text = element.get_text(strip=True)
            if any(keyword in text for keyword in self.tender_keywords):
                
                # 查找该元素内的链接
                links = element.find_all('a', href=True)
                for link in links:
                    href = link.get('href', '')
                    link_text = link.get_text(strip=True)
                    
                    if any(keyword in link_text or keyword in href.lower() 
                          for keyword in self.tender_keywords):
                        
                        full_url = urljoin(base_url, href)
                        
                        tender_columns.append({
                            'title': link_text,
                            'url': full_url,
                            'section': self._identify_section_type(link_text, href),
                            'source': 'content'
                        })
        
        # 去重并返回
        unique_columns = []
        seen_urls = set()
        for column in tender_columns:
            if column['url'] not in seen_urls:
                seen_urls.add(column['url'])
                unique_columns.append(column)
        
        self.logger.info(f"找到 {len(unique_columns)} 个招投标栏目")
        return unique_columns
    
    def extract_tender_info(self, html_content: str, url: str) -> List[Dict[str, Any]]:
        """
        从HTML内容中提取招投标信息
        
        Args:
            html_content: HTML内容
            url: 来源URL
            
        Returns:
            提取的招投标信息列表
        """
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # 移除脚本和样式元素
        for script in soup(["script", "style"]):
            script.decompose()
        
        tenders = []
        
        # 方法1: 查找列表形式的招投标信息
        list_tenders = self._extract_from_lists(soup, url)
        tenders.extend(list_tenders)
        
        # 方法2: 查找表格形式的招投标信息
        table_tenders = self._extract_from_tables(soup, url)
        tenders.extend(table_tenders)
        
        # 方法3: 查找页面正文中的招投标信息
        content_tenders = self._extract_from_content(soup, url)
        tenders.extend(content_tenders)
        
        # 去重和过滤
        unique_tenders = self._filter_and_deduplicate(tenders)
        
        self.logger.info(f"从 {url} 提取到 {len(unique_tenders)} 条招投标信息")
        return unique_tenders
    
    def _extract_from_lists(self, soup: BeautifulSoup, url: str) -> List[Dict[str, Any]]:
        """从列表中提取招投标信息"""
        tenders = []
        
        # 查找可能的招投标列表
        list_containers = soup.find_all(['ul', 'ol', 'div'], class_=re.compile(r'list|item|news|tender|bid'))
        
        for container in list_containers:
            items = container.find_all(['li', 'div', 'a'])
            
            for item in items:
                text = item.get_text(strip=True)
                
                # 检查是否包含招投标关键词
                if any(keyword in text for keyword in self.tender_keywords):
                    tender_info = self._parse_tender_text(text, url)
                    if tender_info:
                        tender_info['source_section'] = 'list'
                        tenders.append(tender_info)
        
        return tenders
    
    def _extract_from_tables(self, soup: BeautifulSoup, url: str) -> List[Dict[str, Any]]:
        """从表格中提取招投标信息"""
        tenders = []
        
        tables = soup.find_all('table')
        
        for table in tables:
            rows = table.find_all('tr')
            
            for row in rows:
                cells = row.find_all(['td', 'th'])
                if len(cells) >= 2:
                    # 提取第一列的标题和可能的链接
                    first_cell = cells[0]
                    title_text = first_cell.get_text(strip=True)
                    
                    # 检查是否包含招投标关键词
                    if any(keyword in title_text for keyword in self.tender_keywords):
                        tender_info = self._parse_tender_text(title_text, url)
                        if tender_info:
                            tender_info['source_section'] = 'table'
                            
                            # 尝试提取其他字段
                            for i, cell in enumerate(cells[1:], 1):
                                cell_text = cell.get_text(strip=True)
                                
                                # 提取日期
                                if re.search(r'\d{4}[-年]\d{1,2}[-月]\d{1,2}', cell_text):
                                    tender_info['publish_date'] = self._extract_date(cell_text)
                                
                                # 提取预算
                                if re.search(r'\d+(?:\.\d+)?\s*万元', cell_text):
                                    budget_match = re.search(r'(\d+(?:\.\d+)?)\s*万元', cell_text)
                                    if budget_match:
                                        tender_info['budget_amount'] = float(budget_match.group(1))
                                        tender_info['budget_currency'] = 'CNY'
                            
                            tenders.append(tender_info)
        
        return tenders
    
    def _extract_from_content(self, soup: BeautifulSoup, url: str) -> List[Dict[str, Any]]:
        """从页面正文中提取招投标信息"""
        tenders = []
        
        # 查找可能包含招投标信息的段落
        content_divs = soup.find_all(['div', 'p', 'span'], class_=re.compile(r'content|article|news|item'))
        
        for div in content_divs:
            text = div.get_text(strip=True)
            
            # 检查是否包含招投标关键词
            if any(keyword in text for keyword in self.tender_keywords):
                # 尝试提取多个招投标信息
                sentences = re.split(r'[。！？\n]', text)
                
                for sentence in sentences:
                    if any(keyword in sentence for keyword in self.tender_keywords):
                        tender_info = self._parse_tender_text(sentence, url)
                        if tender_info:
                            tender_info['source_section'] = 'content'
                            tenders.append(tender_info)
        
        return tenders
    
    def _parse_tender_text(self, text: str, url: str) -> Optional[Dict[str, Any]]:
        """
        解析招投标文本信息
        
        Args:
            text: 文本内容
            url: 来源URL
            
        Returns:
            解析后的招投标信息字典
        """
        tender_info = {
            'title': '',
            'content': text[:200],  # 简化的内容摘要
            'source_url': url,
            'publish_date': None,
            'deadline_date': None,
            'budget_amount': None,
            'budget_currency': 'CNY',
            'tender_type': 'other',
            'tender_category': 'other',
            'content_hash': '',
            'html_hash': '',
            'crawl_method': 'auto'
        }
        
        # 提取标题
        for pattern in self.content_patterns['title']:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                tender_info['title'] = match.group(1).strip()
                break
        
        # 如果没有提取到标题，使用前50个字符作为标题
        if not tender_info['title']:
            tender_info['title'] = text[:50].strip()
        
        # 提取发布日期
        for pattern in self.content_patterns['date']:
            match = re.search(pattern, text)
            if match:
                tender_info['publish_date'] = self._extract_date(match.group(1))
                break
        
        # 提取截止日期
        for pattern in self.content_patterns['deadline']:
            match = re.search(pattern, text)
            if match:
                tender_info['deadline_date'] = self._extract_date(match.group(1))
                break
        
        # 提取预算信息
        for pattern in self.content_patterns['budget']:
            match = re.search(pattern, text)
            if match:
                try:
                    amount = float(match.group(1))
                    tender_info['budget_amount'] = amount
                    tender_info['budget_currency'] = 'CNY'
                    break
                except ValueError:
                    continue
        
        # 确定招标类型
        tender_info['tender_type'] = self._determine_tender_type(text)
        
        # 确定招标分类
        tender_info['tender_category'] = self._determine_tender_category(text)
        
        # 生成内容哈希
        content_data = f"{tender_info['title']}|{tender_info['publish_date']}|{text[:500]}"
        tender_info['content_hash'] = hashlib.sha256(content_data.encode()).hexdigest()
        
        return tender_info if tender_info['title'] else None
    
    def _extract_date(self, date_str: str) -> Optional[str]:
        """提取并标准化日期"""
        try:
            # 匹配各种日期格式
            date_patterns = [
                r'(\d{4})[-年](\d{1,2})[-月](\d{1,2})[日]?',
                r'(\d{4})/(\d{1,2})/(\d{1,2})',
                r'(\d{1,2})[-/\.](\d{1,2})[-/\.](\d{4})',
            ]
            
            for pattern in date_patterns:
                match = re.search(pattern, date_str)
                if match:
                    if len(match.groups()) == 3:
                        year, month, day = match.groups()
                        if len(year) == 4:  # YYYY-MM-DD 格式
                            date_obj = datetime(int(year), int(month), int(day))
                        else:  # MM-DD-YYYY 格式
                            date_obj = datetime(int(year), int(month), int(day))
                        
                        return date_obj.strftime('%Y-%m-%d')
            
            return None
            
        except (ValueError, TypeError):
            return None
    
    def _determine_tender_type(self, text: str) -> str:
        """确定招投标类型"""
        text_lower = text.lower()
        
        for tender_type, keywords in self.type_keywords.items():
            if any(keyword in text or keyword in text_lower for keyword in keywords):
                return tender_type
        
        return 'other'
    
    def _determine_tender_category(self, text: str) -> str:
        """确定招投标分类"""
        text_lower = text.lower()
        
        for category, keywords in self.category_keywords.items():
            if any(keyword in text or keyword in text_lower for keyword in keywords):
                return category
        
        return 'other'
    
    def _identify_section_type(self, title: str, url: str) -> str:
        """识别栏目类型"""
        title_lower = title.lower()
        
        if any(keyword in title_lower for keyword in ['招标', '投标']):
            return '招标公告'
        elif any(keyword in title_lower for keyword in ['采购']):
            return '采购公告'
        elif any(keyword in title_lower for keyword in ['中标', '结果']):
            return '中标公示'
        elif any(keyword in title_lower for keyword in ['更正', '修改']):
            return '更正公告'
        else:
            return '其他'
    
    def _filter_and_deduplicate(self, tenders: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """过滤和去重招投标信息"""
        unique_tenders = []
        seen_hashes = set()
        
        for tender in tenders:
            content_hash = tender.get('content_hash', '')
            
            if content_hash and content_hash not in seen_hashes:
                seen_hashes.add(content_hash)
                unique_tenders.append(tender)
        
        # 按发布日期排序（最新的在前）
        unique_tenders.sort(
            key=lambda x: x.get('publish_date', '') or '',
            reverse=True
        )
        
        return unique_tenders
    
    def calculate_content_similarity(self, content1: str, content2: str) -> float:
        """
        计算两个内容之间的相似度
        
        Args:
            content1: 内容1
            content2: 内容2
            
        Returns:
            相似度分数 (0-1)
        """
        # 简单的相似度计算：基于关键词重合度
        words1 = set(re.findall(r'\w+', content1.lower()))
        words2 = set(re.findall(r'\w+', content2.lower()))
        
        if not words1 or not words2:
            return 0.0
        
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        
        return len(intersection) / len(union) if union else 0.0

# 创建全局招投标提取器实例
tender_extractor = TenderExtractor()