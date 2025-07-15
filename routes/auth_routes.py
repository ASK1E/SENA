from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from models import db, User
from extension import limiter, jwt_blacklist
from utils.token_utils import generate_token, verify_token, jwt_access_token
from utils.email_utils import send_verification_email, send_reset_pass_email
from utils.validators import is_valid_email, is_valid_username, is_strong_password, validate_request_data

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
@limiter.limit("5 per minute")
def register():
    data = request.get_json()
    valid_data, msg = validate_request_data(data, ['email', 'username', 'password'])
    if not valid_data:
        return jsonify({'message': msg}), 400
    
    email = data.get('email')
    username = data.get('username')
    password = data.get('password')
    
    # Validasi email
    valid_email, email_result = is_valid_email(email)
    if not valid_email:
        return jsonify({'message': email_result}), 400

    # Validasi username
    valid_username, username_result = is_valid_username(username)
    if not valid_username:
        return jsonify({'message': username_result}), 400

    # Validasi password
    valid_pass, pass_msg = is_strong_password(password)
    if not valid_pass:
        return jsonify({'message': pass_msg}), 400
    
    if User.query.filter_by(email=email).first() or User.query.filter_by(username=username).first():
        return jsonify({'message': 'Email atau Username sudah digunakan'}), 400
    try:
        new_user = User(email=email, username=username)
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()
        
        token = generate_token(email)
        send_verification_email(email, token)
        return jsonify({"message": "Registrasi berhasil! Silahkan cek email untuk verifikasi akun SENA anda."}), 201
    except Exception as e:
        db.session.rollback()
        print(f"Terjadi kesalahan: {e}")
        return jsonify({"message": "Registrasi gagal! Silahkan coba lagi atau hubungi tim support kami."}), 500

@auth_bp.route('/verify')
@limiter.limit("3 per minute")
def verify():
    token = request.args.get('token')
    if not token:
        return jsonify({'message': 'Token tidak ditemukan'}), 400
    
    try:
        email = verify_token(token)
        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({'message': 'Akun tidak ditemukan'}), 400
        if user.is_verified:
            return jsonify({'message': 'Akun sudah terverifikasi'}), 400
        user.is_verified = True
        db.session.commit()
        return jsonify({'message': 'Akun berhasil diverifikasi'}), 200
    except Exception as e:
        db.session.rollback()
        print(f"Terjadi kesalahan: {e}")
        return jsonify({'message': 'Token tidak valid atau sudah kadaluarsa'}), 400

@auth_bp.route('/login', methods=['POST'])
@limiter.limit("5 per minute")
def login():
    data = request.get_json()
    valid_data, msg = validate_request_data(data, ['email', 'password'])
    if not valid_data:
        return jsonify({'message': msg}), 400
    
    email = data.get('email')
    password = data.get('password')
    
    # Validasi email
    valid_email, email_result = is_valid_email(email)
    if not valid_email:
        return jsonify({'message': email_result}), 400
    
    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({'message': 'Email atau Password salah'}), 400
    if not user.is_verified:
        return jsonify({'message': 'Akun SENA belum terverifikasi. Silahkan cek email untuk verifikasi'}), 400
    
    access_token = jwt_access_token(user.id)
    return jsonify({"message": f"Login Berhasil! Welcome to SENA {user.username}", "jwt_token": access_token, "email": user.email,"username": user.username})

@auth_bp.route('/forgot-password', methods=['POST'])
@limiter.limit("3 per minute")
def forgot_password():
    data = request.get_json()
    valid_data, msg = validate_request_data(data, ['email'])
    if not valid_data:
        return jsonify({'message': msg}), 400
    
    email = data.get('email')

    # Validasi email
    valid_email, email_result = is_valid_email(email)
    if not valid_email:
        return jsonify({'message': email_result}), 400
    
    user = User.query.filter_by(email=email).first()
    if user:
        try:
            token = generate_token(email)
            send_reset_pass_email(email, token)
        except Exception as e:
            db.session.rollback()
            print(f"Terjadi kesalahan: {e}")
            return jsonify({'message': 'Gagal mengirim email reset password! Silahkan coba lagi atau hubungi tim support kami'}), 400
    return jsonify({"message": "Jika email terdaftar. Silahkan cek email untuk reset password akun anda"}), 201

@auth_bp.route('/reset-password', methods=['POST'])
@limiter.limit("3 per minute")
def reset_password():
    token = request.args.get('token')
    data = request.get_json()
    valid_data, msg = validate_request_data(data, ['email', 'password'])
    if not valid_data:
        return jsonify({'message': msg}), 400
    if not token:
        return jsonify({'message': 'Token tidak ditemukan'}), 400
    
    new_password = data.get('password')
    
    valid_pass, pass_msg = is_strong_password(new_password)
    if not valid_pass:
        return jsonify({'message': pass_msg}), 400
    
    try:
        email = verify_token(token)
        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({'message': 'Akun tidak ditemukan'}), 400
        user.set_password(new_password)
        db.session.commit()
        return jsonify({"message": "Password akun SENA anda berhasil diubah"}), 200
    except Exception as e:
        db.session.rollback()
        print(f"Terjadi kesalahan: {e}")
        return jsonify({'message': 'Token tidak valid atau sudah kadaluarsa'}), 400

@auth_bp.route("/logout")
@jwt_required()
def logout():
    jti = get_jwt()["jti"]
    jwt_blacklist.add(jti)
    return jsonify({"message": "Logout berhasil!"}), 200