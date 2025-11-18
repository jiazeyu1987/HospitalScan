"""
简单的Flask应用测试

作者：MiniMax Agent
版本：v1.0
日期：2025-11-18
"""

import os
from flask import Flask, jsonify
from flask_cors import CORS

# 创建简单的Flask应用
app = Flask(__name__)
CORS(app)

@app.route('/')
def hello():
    return jsonify({
        'message': '医院监控系统API',
        'status': 'running',
        'timestamp': '2025-11-18T13:27:00Z'
    })

@app.route('/health')
def health():
    return jsonify({
        'status': 'healthy',
        'message': '系统运行正常'
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)