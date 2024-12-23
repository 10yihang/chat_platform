from flask import Blueprint, request, jsonify
from models.user_groups import Group
from extensions import db
group_bp = Blueprint('group', __name__)

@group_bp.route('/create', methods=['POST'])
def create_group():
    return jsonify({'message': 'writing'}), 201

@group_bp.route('/join', methods=['POST'])
def join_group():
    return jsonify({'message': 'writing'}), 201

@group_bp.route('/<group_id>', methods=['GET'])
def get_group(group_id):
    group = db.session.query(Group).filter(Group.id == group_id).first()
    return jsonify({'name': group.name}), 200

