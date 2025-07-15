from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_mail import Mail
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

db = SQLAlchemy()
bcrypt = Bcrypt()
mail = Mail()
jwt = JWTManager()
limiter = Limiter(key_func=get_remote_address, default_limits=["124 per day", "30 per hour"])

jwt_blacklist = set()