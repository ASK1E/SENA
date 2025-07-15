from extension import db, bcrypt
import datetime

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(15), unique=True, nullable=False)
    email = db.Column(db.String(175), unique=True, nullable=False)
    password = db.Column(db.String(225), nullable=False)
    is_verified = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    def set_password(self, raw_password, rounds=12):
        self.password = bcrypt.generate_password_hash(raw_password, rounds=rounds).decode('utf-8')
        
    def check_password(self, raw_password):
        return bcrypt.check_password_hash(self.password, raw_password)
    
    def __repr__(self):
        return f"<User {self.username}>"