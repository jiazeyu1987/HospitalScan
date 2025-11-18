#!/usr/bin/env python3
"""
Flask应用启动脚本

作者：MiniMax Agent
版本：v1.0
日期：2025-11-18
"""

import os
import sys
from app import create_app, db
from app.models.initial_data import init_basic_data

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def init_database():
    """初始化数据库"""
    print("正在初始化数据库...")
    
    # 创建所有表
    db.create_all()
    
    # 初始化基础数据
    init_basic_data()
    
    print("数据库初始化完成!")

def main():
    """主函数"""
    # 获取配置
    config_name = os.environ.get('FLASK_CONFIG', 'development')
    
    # 创建应用
    app = create_app(config_name)
    
    # 在开发环境下自动初始化数据库
    if config_name == 'development' and not os.path.exists('hospital_monitor_dev.db'):
        print("开发环境检测到新项目，正在初始化数据库...")
        with app.app_context():
            init_database()
    
    # 启动应用
    if config_name == 'development':
        app.run(
            host='127.0.0.1',
            port=5000,
            debug=True,
            use_reloader=True
        )
    else:
        # 生产环境使用gunicorn
        from gunicorn.app.wsgiapp import WSGIApplication
        
        class GunicornApp(WSGIApplication):
            def __init__(self):
                super().__init__()
            
            def load(self):
                return app
        
        GunicornApp().run()

if __name__ == '__main__':
    # 检查是否是初始化模式
    if '--init-db' in sys.argv:
        config_name = os.environ.get('FLASK_CONFIG', 'development')
        app = create_app(config_name)
        
        with app.app_context():
            init_database()
        
        sys.exit(0)
    
    main()