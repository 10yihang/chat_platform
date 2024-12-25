from flask import Blueprint, request, jsonify
from models.user_groups import Group
from extensions import db
group_bp = Blueprint('group', __name__)

@group_bp.route('/create', methods=['POST'])
def create_group():
    data = request.get_json()
    group_name = data.get('name')
    owner_id = data.get('owner_id')
    
    if not group_name or not owner_id:
        return jsonify({'error': '缺少必要参数'}), 400
    
    try:
        new_group = Group(
            name=group_name,
            owner_id=owner_id
        )
        db.session.add(new_group)
        db.session.commit()
        return jsonify({
            'message': '群组创建成功',
            'group_id': new_group.id,
            'name': new_group.name
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@group_bp.route('/join', methods=['POST'])
def join_group():
    return jsonify({'message': 'writing'}), 201

@group_bp.route('/<group_id>', methods=['GET'])
def get_group(group_id):
    group = db.session.query(Group).filter(Group.id == group_id).first()
    return jsonify({'name': group.name}), 200

