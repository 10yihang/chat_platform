from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.profile import Profile
from models.user import User
from extensions import db
from config import Config
import os

profile_bp = Blueprint('profile', __name__)

@profile_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    user_id = get_jwt_identity()
    # user_id = 2
    # print(user_id)
    user = User.query.get_or_404(user_id)
    profile = Profile.query.filter_by(user_id=user_id).first()
    
    return jsonify({
        'username': user.username,
        'email': user.email,
        'avatar': profile.avatar if profile else None,
        'bio': profile.bio if profile else None,
        'location': profile.location if profile else None,
        'phone': profile.phone if profile else None
    })

@profile_bp.route('/profile/<int:user_id>', methods=['GET'])
def get_public_profile(user_id):
    user = User.query.get_or_404(user_id)
    profile = Profile.query.filter_by(user_id=user_id).first()
    
    return jsonify({
        'username': user.username,
        'avatar': profile.avatar if profile else None,
        'bio': profile.bio if profile else None,
        'location': profile.location if profile else None,
        'phone': profile.phone if profile else None
    })

@profile_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    profile = Profile.query.filter_by(user_id=user_id).first()
    
    if not profile:
        profile = Profile(user_id=user_id)
        db.session.add(profile)
    
    data = request.get_json()
    profile.bio = data.get('bio', profile.bio)
    profile.location = data.get('location', profile.location)
    profile.phone = data.get('phone', profile.phone)
    
    db.session.commit()
    return jsonify({'message': '个人资料更新成功'})

@profile_bp.route('/avatar', methods=['POST'])
@jwt_required()
def upload_avatar():
    user_id = get_jwt_identity()
    profile = Profile.query.filter_by(user_id=user_id).first()
    
    if not profile:
        profile = Profile(user_id=user_id)
        db.session.add(profile)
    
    try:
        file = request.files.get('avatar')
        if file:
            filename = f'avatar_{user_id}.jpg'
            storepath = os.path.join(Config.UPLOAD_FOLDER, 'avatar', filename)
            if not os.path.exists(os.path.join(Config.UPLOAD_FOLDER, 'avatar')):
                os.makedirs(os.path.join(Config.UPLOAD_FOLDER, 'avatar'))
            file.save(storepath)
            # print(f'Avatar saved to {storepath}')
            profile.avatar = f'{Config.BASE_URL}:{Config.PORT}/api/file/avatar/{filename}'
            user = User.query.get(user_id)
            user.avatar = profile.avatar
            db.session.commit()
        return jsonify({'message': '头像上传成功'}), 200
    except Exception as e:
        db.session.rollback()
        print(str(e))
        return jsonify({'message': f'头像上传失败: {str(e)}'}), 500