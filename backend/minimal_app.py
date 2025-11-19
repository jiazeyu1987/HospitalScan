#!/usr/bin/env python3
"""
Minimal Flask app for testing
"""

from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173", "http://127.0.0.1:5173"])

@app.route('/api/v1/health')
def health_check():
    return jsonify({'status': 'success', 'data': {'status': 'healthy', 'message': '系统运行正常'}})

@app.route('/api/v1/statistics')
def general_statistics():
    return jsonify({
        'status': 'success',
        'data': {
            'hospitals': {'total': 0, 'verified': 0},
            'tenders': {'total': 0, 'recent': 0},
            'scans': {'today': 0, 'total': 0, 'success_rate': 0},
            'last_update': '2025-11-19T10:00:00'
        }
    })

@app.route('/api/v1/statistics/dashboard')
def dashboard_statistics():
    return jsonify({
        'status': 'success',
        'data': {
            'hospitals': {'total': 0, 'verified': 0, 'unverified': 0},
            'tenders': {'total': 0, 'recent': 0},
            'scans': {'today': 0, 'total': 0, 'success_rate': 0},
            'last_update': '2025-11-19T10:00:00'
        }
    })

@app.route('/api/v1/statistics/trend')
def trend_statistics():
    return jsonify({
        'status': 'success',
        'data': {
            'granularity': 'daily',
            'period': {'start': '2025-10-19', 'end': '2025-11-19'},
            'tender_trend': {},
            'scan_trend': {},
            'last_update': '2025-11-19T10:00:00'
        }
    })

@app.route('/api/v1/crawler/status')
def crawler_status():
    return jsonify({
        'status': 'success',
        'data': {
            'status': 'stopped',
            'uptime': '0:00:00',
            'scanned_hospitals': 0,
            'found_tenders': 0
        }
    })

@app.route('/api/v1/regions')
def get_regions():
    return jsonify({
        'status': 'success',
        'data': [
            {'id': 1, 'name': '北京市', 'level': 'province', 'parent_id': None, 'children': [
                {'id': 2, 'name': '北京市', 'level': 'city', 'parent_id': 1, 'children': []}
            ]},
            {'id': 3, 'name': '上海市', 'level': 'province', 'parent_id': None, 'children': [
                {'id': 4, 'name': '上海市', 'level': 'city', 'parent_id': 3, 'children': []}
            ]},
            {'id': 5, 'name': '天津市', 'level': 'province', 'parent_id': None, 'children': [
                {'id': 6, 'name': '天津市', 'level': 'city', 'parent_id': 5, 'children': []}
            ]},
            {'id': 7, 'name': '重庆市', 'level': 'province', 'parent_id': None, 'children': [
                {'id': 8, 'name': '重庆市', 'level': 'city', 'parent_id': 7, 'children': []}
            ]},
            {'id': 9, 'name': '广东省', 'level': 'province', 'parent_id': None, 'children': [
                {'id': 10, 'name': '广州市', 'level': 'city', 'parent_id': 9, 'children': []},
                {'id': 11, 'name': '深圳市', 'level': 'city', 'parent_id': 9, 'children': []},
                {'id': 12, 'name': '珠海市', 'level': 'city', 'parent_id': 9, 'children': []}
            ]}
        ]
    })

@app.route('/api/v1/hospitals')
def get_hospitals():
    return jsonify({
        'success': True,
        'data': [
            {
                'id': 1,
                'name': '北京协和医院',
                'level': 'level3',
                'type': 'public',
                'region_id': 1,
                'region_name': '北京市',
                'address': '北京市东城区东单帅府园1号',
                'website': 'http://www.pumch.cn',
                'phone': '010-69156699',
                'verified': True,
                'score': 95.5,
                'created_at': '2025-01-01T00:00:00',
                'updated_at': '2025-11-19T00:00:00'
            },
            {
                'id': 2,
                'name': '上海瑞金医院',
                'level': 'level3',
                'type': 'public',
                'region_id': 3,
                'region_name': '上海市',
                'address': '上海市黄浦区瑞金二路197号',
                'website': 'http://www.rjh.com.cn',
                'phone': '021-64370045',
                'verified': True,
                'score': 92.3,
                'created_at': '2025-01-01T00:00:00',
                'updated_at': '2025-11-19T00:00:00'
            },
            {
                'id': 3,
                'name': '广州中山大学附属第一医院',
                'level': 'level3',
                'type': 'public',
                'region_id': 9,
                'region_name': '广东省',
                'address': '广州市越秀区中山二路58号',
                'website': 'http://www.zs-hospital.sh.cn',
                'phone': '020-87755766',
                'verified': True,
                'score': 88.7,
                'created_at': '2025-01-01T00:00:00',
                'updated_at': '2025-11-19T00:00:00'
            }
        ],
        'pagination': {
            'page': 1,
            'per_page': 20,
            'total': 3,
            'pages': 1
        }
    })

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)