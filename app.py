from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from flask_limiter.errors import RateLimitExceeded
from config import Config
from routes.auth_routes import auth_bp
from routes.user_routes import user_bp
from routes.template_route import template_bp
from extension import db, bcrypt, mail, jwt, limiter, jwt_blacklist

app = Flask(__name__)
app.config.from_object(Config)

db.init_app(app)
bcrypt.init_app(app)
mail.init_app(app)
jwt.init_app(app)
limiter.init_app(app)
CORS(app)

app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(user_bp, url_prefix='/api/user')
app.register_blueprint(template_bp, url_prefix='/')

@app.errorhandler(RateLimitExceeded)
def handle_limit(e):
    ip = request.remote_addr
    endpoint = request.path
    print(f"[!] Terjadi limit pada endponit {endpoint} dari IP {ip} - More Info {e}")
    return jsonify({"message": "Terlalu banyak request, silahkan coba lagi nanti"}), 429

@jwt.token_in_blocklist_loader
def is_token_blacklisted(jwt_header, jwt_payload):
    return jwt_payload["jti"] in jwt_blacklist

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)