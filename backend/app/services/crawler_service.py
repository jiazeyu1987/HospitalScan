"""
爬虫服务

提供网站验证和爬取功能，包括：
- 网站URL验证
- 域名验证
- SSL证书检查
- robots.txt检查
- 网页内容分析
- 网站可信度评分

作者：MiniMax Agent
版本：v1.0
日期：2025-11-18
"""

import requests
import hashlib
import ssl
import socket
from urllib.parse import urlparse, urljoin
from urllib import robotparser
import re
from bs4 import BeautifulSoup
import logging
from datetime import datetime
import time
import random

class CrawlerService:
    """爬虫服务类"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.config = {
            'timeout': 30,
            'max_retries': 3,
            'delay_range': (1, 5),
            'user_agents': [
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            ]
        }
    
    def verify_website(self, url):
        """
        验证网站URL并返回详细的验证结果
        
        Args:
            url: 网站URL
        
        Returns:
            dict: 验证结果
        """
        result = {
            'is_valid': False,
            'url': url,
            'domain': None,
            'http_status': None,
            'response_time': None,
            'ssl_valid': False,
            'robots_txt_ok': False,
            'content_score': 0,
            'hospital_indicators': [],
            'verification_score': 0,
            'errors': []
        }
        
        try:
            start_time = time.time()
            
            # 1. URL解析和标准化
            parsed_url = self._parse_and_normalize_url(url)
            if not parsed_url:
                result['errors'].append('URL格式无效')
                return result
            
            result['domain'] = parsed_url['domain']
            result['url'] = parsed_url['url']
            
            # 2. HTTP请求
            response = self._make_request(parsed_url['url'])
            if not response:
                result['errors'].append('无法访问网站')
                return result
            
            result['http_status'] = response.status_code
            result['response_time'] = round((time.time() - start_time) * 1000, 2)
            
            # 3. SSL证书检查
            result['ssl_valid'] = self._check_ssl_certificate(parsed_url['domain'])
            
            # 4. robots.txt检查
            result['robots_txt_ok'] = self._check_robots_txt(parsed_url['url'])
            
            # 5. 内容分析
            content_analysis = self._analyze_content(response)
            result.update(content_analysis)
            
            # 6. 计算总体评分
            result['verification_score'] = self._calculate_verification_score(result)
            result['is_valid'] = result['verification_score'] >= 60
            
        except Exception as e:
            result['errors'].append(f'验证过程出错: {str(e)}')
            self.logger.error(f'网站验证出错 {url}: {str(e)}')
        
        return result
    
    def _parse_and_normalize_url(self, url):
        """解析和标准化URL"""
        try:
            # 添加http://如果缺失协议
            if not url.startswith(('http://', 'https://')):
                url = 'http://' + url
            
            parsed = urlparse(url)
            if not parsed.netloc:
                return None
            
            return {
                'url': url,
                'domain': parsed.netloc.lower(),
                'scheme': parsed.scheme,
                'path': parsed.path
            }
        except Exception as e:
            self.logger.error(f'URL解析失败: {str(e)}')
            return None
    
    def _make_request(self, url):
        """发起HTTP请求"""
        try:
            headers = {
                'User-Agent': random.choice(self.config['user_agents']),
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            }
            
            response = requests.get(
                url,
                headers=headers,
                timeout=self.config['timeout'],
                allow_redirects=True
            )
            
            # 添加随机延迟
            time.sleep(random.uniform(*self.config['delay_range']))
            
            return response
            
        except requests.RequestException as e:
            self.logger.error(f'HTTP请求失败: {str(e)}')
            return None
    
    def _check_ssl_certificate(self, domain):
        """检查SSL证书"""
        try:
            context = ssl.create_default_context()
            with socket.create_connection((domain, 443), timeout=10) as sock:
                with context.wrap_socket(sock, server_hostname=domain) as ssock:
                    cert = ssock.getpeercert()
                    # 简单的证书有效期检查
                    return True
        except Exception:
            return False
    
    def _check_robots_txt(self, url):
        """检查robots.txt"""
        try:
            parsed = urlparse(url)
            robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"
            
            rp = robotparser.RobotFileParser()
            rp.set_url(robots_url)
            rp.read()
            
            # 检查是否可以抓取当前页面
            return rp.can_fetch('*', url)
        except Exception:
            return False
    
    def _analyze_content(self, response):
        """分析网页内容"""
        result = {
            'content_score': 0,
            'hospital_indicators': [],
            'page_title': None,
            'page_description': None,
            'hospital_keywords': []
        }
        
        try:
            # 解析HTML
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # 提取页面标题
            title_tag = soup.find('title')
            if title_tag:
                result['page_title'] = title_tag.get_text().strip()
            
            # 提取页面描述
            desc_meta = soup.find('meta', attrs={'name': 'description'})
            if desc_meta:
                result['page_description'] = desc_meta.get('content', '').strip()
            
            # 医院相关关键词
            hospital_keywords = [
                '医院', '医疗', '医护', '门诊', '住院', '手术', '医生', '护士',
                '科室', '急诊', '体检', '挂号', '医保', '药品', '治疗',
                'hospital', 'medical', 'clinic', 'healthcare', 'doctor'
            ]
            
            # 获取页面文本内容
            page_text = soup.get_text().lower()
            
            # 检查关键词出现情况
            for keyword in hospital_keywords:
                count = page_text.count(keyword.lower())
                if count > 0:
                    result['hospital_keywords'].append({
                        'keyword': keyword,
                        'count': count
                    })
            
            # 计算内容得分
            content_score = 0
            
            # 标题中有医院相关关键词 (+20分)
            if result['page_title']:
                title_lower = result['page_title'].lower()
                if any(kw in title_lower for kw in ['医院', '医疗', 'hospital', 'medical']):
                    content_score += 20
            
            # 页面文本中医院关键词数量
            keyword_count = len(result['hospital_keywords'])
            content_score += min(keyword_count * 3, 30)
            
            # 页面结构良好 (+10分)
            if soup.find('nav') or soup.find('header') or soup.find('footer'):
                content_score += 10
            
            # 有联系方式信息 (+10分)
            contact_patterns = [
                r'电话[:：]\s*\d{3,4}[- ]?\d{7,8}',
                r'手机[:：]\s*1[3-9]\d{9}',
                r'邮箱[:：][\w\.-]+@[\w\.-]+\.\w+',
                r'地址[:：][^<\n\r]{10,100}'
            ]
            
            for pattern in contact_patterns:
                if re.search(pattern, page_text):
                    content_score += 10
                    break
            
            result['content_score'] = content_score
            
            # 医院标识符检查
            if '医院' in result['page_title'] or 'hospital' in result['page_title'].lower():
                result['hospital_indicators'].append('页面标题包含医院标识')
            
            if keyword_count >= 5:
                result['hospital_indicators'].append('页面内容包含丰富的医疗相关词汇')
            
            if soup.find('nav') and soup.find('footer'):
                result['hospital_indicators'].append('页面结构完整')
            
        except Exception as e:
            self.logger.error(f'内容分析失败: {str(e)}')
        
        return result
    
    def _calculate_verification_score(self, result):
        """计算验证得分"""
        score = 0
        
        # HTTP状态码得分 (20分)
        if result.get('http_status') == 200:
            score += 20
        elif result.get('http_status') == 301 or result.get('http_status') == 302:
            score += 15
        
        # 响应时间得分 (10分)
        if result.get('response_time'):
            if result['response_time'] < 1000:  # 小于1秒
                score += 10
            elif result['response_time'] < 3000:  # 小于3秒
                score += 5
        
        # SSL证书得分 (10分)
        if result.get('ssl_valid'):
            score += 10
        
        # robots.txt得分 (10分)
        if result.get('robots_txt_ok'):
            score += 10
        
        # 内容质量得分 (30分)
        score += min(result.get('content_score', 0), 30)
        
        # 医院标识符得分 (20分)
        score += min(len(result.get('hospital_indicators', [])) * 5, 20)
        
        return score

# 创建全局爬虫服务实例
crawler_service = CrawlerService()

def verify_website(url):
    """
    验证网站URL的快捷函数
    
    Args:
        url: 网站URL
    
    Returns:
        dict: 验证结果
    """
    return crawler_service.verify_website(url)

def search_hospitals_websites(hospital_name, region_name=None, max_results=10):
    """
    搜索医院官网的函数（需要集成搜索引擎API）
    
    Args:
        hospital_name: 医院名称
        region_name: 地区名称
        max_results: 最大结果数
    
    Returns:
        list: 搜索结果列表
    """
    # 这里应该集成搜索引擎API，如DuckDuckGo、Baidu等
    # 目前返回空列表，后续可以扩展
    return []

def extract_domain(url):
    """提取域名"""
    if not url:
        return None
    
    parsed = urlparse(url)
    return parsed.netloc.lower()

def is_valid_url(url):
    """检查URL是否有效"""
    try:
        result = urlparse(url)
        return all([result.scheme, result.netloc])
    except:
        return False