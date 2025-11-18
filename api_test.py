#!/usr/bin/env python3
"""
医院监控系统API测试脚本

用于验证前后端是否正常连接和数据是否真实

作者: MiniMax Agent
日期: 2025-11-18
"""

import requests
import json
from datetime import datetime

class HospitalMonitorAPITester:
    def __init__(self, base_url="http://localhost:5000/api/v1"):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
    
    def test_connection(self):
        """测试API连接"""
        try:
            response = self.session.get(f"{self.base_url}/health")
            if response.status_code == 200:
                print("✅ 后端API连接正常")
                return True
            else:
                print(f"❌ API连接失败: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ API连接异常: {str(e)}")
            return False
    
    def test_hospitals_api(self):
        """测试医院API"""
        try:
            print("\n📋 测试医院API...")
            response = self.session.get(f"{self.base_url}/hospitals")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ 医院API正常")
                print(f"   - 返回状态: {data.get('status', 'unknown')}")
                
                if 'data' in data:
                    hospitals = data['data'].get('items', [])
                    print(f"   - 医院数量: {len(hospitals)}")
                    
                    if hospitals:
                        print(f"   - 示例医院: {hospitals[0].get('name', 'N/A')}")
                        print(f"   - 地区: {hospitals[0].get('region_name', 'N/A')}")
                        
                        # 显示前3个医院的基本信息
                        for i, hospital in enumerate(hospitals[:3]):
                            print(f"   - 医院{i+1}: {hospital.get('name', 'N/A')} ({hospital.get('level', 'N/A')})")
                    else:
                        print("   - 暂无医院数据")
                        
                return True
            else:
                print(f"❌ 医院API失败: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ 医院API异常: {str(e)}")
            return False
    
    def test_regions_api(self):
        """测试地区API"""
        try:
            print("\n🗺️ 测试地区API...")
            response = self.session.get(f"{self.base_url}/regions")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ 地区API正常")
                
                if 'data' in data:
                    regions = data['data']
                    print(f"   - 地区数量: {len(regions)}")
                    
                    # 显示前5个地区
                    for i, region in enumerate(regions[:5]):
                        print(f"   - 地区{i+1}: {region.get('name', 'N/A')} (级别: {region.get('level', 'N/A')})")
                        
                return True
            else:
                print(f"❌ 地区API失败: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ 地区API异常: {str(e)}")
            return False
    
    def test_tenders_api(self):
        """测试招投标API"""
        try:
            print("\n📄 测试招投标API...")
            response = self.session.get(f"{self.base_url}/tenders")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ 招投标API正常")
                
                if 'data' in data:
                    tenders = data['data'].get('items', [])
                    print(f"   - 招投标数量: {len(tenders)}")
                    
                    if tenders:
                        print(f"   - 最新招投标: {tenders[0].get('title', 'N/A')[:50]}...")
                    else:
                        print("   - 暂无招投标数据")
                        
                return True
            else:
                print(f"❌ 招投标API失败: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ 招投标API异常: {str(e)}")
            return False
    
    def test_crawler_api(self):
        """测试爬虫API"""
        try:
            print("\n🕷️ 测试爬虫API...")
            response = self.session.get(f"{self.base_url}/crawler/status")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ 爬虫API正常")
                
                if 'data' in data:
                    status = data['data']
                    print(f"   - 爬虫状态: {status.get('status', 'unknown')}")
                    print(f"   - 运行时间: {status.get('uptime', 'unknown')}")
                    print(f"   - 已扫描医院: {status.get('scanned_hospitals', 0)}")
                    print(f"   - 发现招投标: {status.get('found_tenders', 0)}")
                    
                return True
            else:
                print(f"❌ 爬虫API失败: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ 爬虫API异常: {str(e)}")
            return False
    
    def test_settings_api(self):
        """测试设置API"""
        try:
            print("\n⚙️ 测试设置API...")
            response = self.session.get(f"{self.base_url}/settings")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ 设置API正常")
                
                if 'data' in data:
                    settings = data['data']
                    print(f"   - 扫描间隔: {settings.get('scan_interval', 'N/A')}小时")
                    print(f"   - 最大并发: {settings.get('max_concurrent', 'N/A')}")
                    print(f"   - 请求超时: {settings.get('timeout', 'N/A')}秒")
                    
                return True
            else:
                print(f"❌ 设置API失败: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ 设置API异常: {str(e)}")
            return False
    
    def run_all_tests(self):
        """运行所有测试"""
        print("=" * 60)
        print("🏥 医院监控系统API测试")
        print("=" * 60)
        print(f"测试时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"API地址: {self.base_url}")
        print("=" * 60)
        
        tests = [
            ("连接测试", self.test_connection),
            ("医院API", self.test_hospitals_api),
            ("地区API", self.test_regions_api),
            ("招投标API", self.test_tenders_api),
            ("爬虫API", self.test_crawler_api),
            ("设置API", self.test_settings_api)
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            print(f"\n🔍 {test_name}...")
            try:
                if test_func():
                    passed += 1
            except Exception as e:
                print(f"❌ {test_name}异常: {str(e)}")
        
        print("\n" + "=" * 60)
        print(f"📊 测试结果: {passed}/{total} 通过")
        
        if passed == total:
            print("🎉 所有测试通过！系统运行正常")
            print("💡 您可以访问 http://localhost:3000 查看前端界面")
            return True
        else:
            print("⚠️ 部分测试失败，请检查后端服务是否正常运行")
            return False

def main():
    """主函数"""
    print("医院监控系统API测试工具")
    print("-" * 40)
    
    # 询问API地址
    api_url = input("请输入API地址 (默认: http://localhost:5000/api/v1): ").strip()
    if not api_url:
        api_url = "http://localhost:5000/api/v1"
    
    # 创建测试器并运行测试
    tester = HospitalMonitorAPITester(api_url)
    success = tester.run_all_tests()
    
    # 保存测试报告
    report_file = "api_test_report.json"
    with open(report_file, 'w', encoding='utf-8') as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "api_url": api_url,
            "tests_passed": passed if 'passed' in locals() else 0,
            "tests_total": len(tester.run_all_tests.__code__.co_consts) if False else 6,
            "status": "success" if success else "failed"
        }, f, indent=2, ensure_ascii=False)
    
    print(f"\n📝 测试报告已保存到: {report_file}")
    print("💡 如果所有测试通过，请访问 http://localhost:3000 查看前端界面")

if __name__ == "__main__":
    main()
