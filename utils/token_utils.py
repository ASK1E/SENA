from itsdangerous import URLSafeTimedSerializer
from flask import current_app
from flask_jwt_extended import create_access_token
from datetime import timedelta

def generate_token(email):
    serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    return serializer.dumps(email, salt='email-confirmation')

def verify_token(token, age=900):
    serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    try:
        email = serializer.loads(token, salt='email-confirmation', max_age=age)
        return email
    except Exception:
        return None

def jwt_access_token(user_id, duration=3600):
    return create_access_token(identity=user_id, expires_delta=timedelta(seconds=duration))