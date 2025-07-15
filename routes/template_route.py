from flask import Blueprint, render_template

template_bp = Blueprint('template', __name__)

@template_bp.route('/')
def home():
    return render_template('index.html')

@template_bp.route('/register')
def register():
    return render_template('register.html')

@template_bp.route('/verify')
def verify():
    return render_template('verify.html')

@template_bp.route('/login')
def login():
    return render_template('login.html')

@template_bp.route('/forgot-password')
def forgot_password():
    return render_template('forgot_password.html')

@template_bp.route('/reset-password')
def reset_password():
    return render_template('reset_password.html')

@template_bp.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')