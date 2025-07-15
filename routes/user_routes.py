from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import User

user_bp = Blueprint('user', __name__)

@user_bp.route('/dashboard')
@jwt_required()
def dashboard():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'msg': 'User not found'}), 404
    
    return jsonify({"message": f"Welcome to Dashboard {user.username}", "username": user.username,"email": user.email, "verified": user.is_verified})