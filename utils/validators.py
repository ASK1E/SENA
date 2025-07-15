from email_validator import validate_email, EmailNotValidError
import bleach
import re

def sanitize_input(input_string):
    if not input_string:
        return ""
    return bleach.clean(input_string.strip())

def is_valid_email(email):
    try:
        email = sanitize_input(email)
        if not email:
            return False, "Email tidak boleh kosong!"
        if len(email) > 254:
            return False, "Email terlalu panjang, maksimal 254 karakter!"
        validated_email = validate_email(email)
        return True, validated_email.email
    except EmailNotValidError as e:
        return False, f"Format email tidak valid!: {str(e)}"
    except Exception as e:
        return False, f"Terjadi kesalahan saat proses validasi email: {str(e)}"
    
def is_valid_username(username):
    username = sanitize_input(username)
    if not username:
        return False, "Username tidak boleh kosong!"
    if len(username) < 3 or len(username) > 25:
        return False, "Username harus terdiri dari 3-25 karakter!"
    blocked_patterns = ['admin', 'root', 'null', 'undefined']
    if username.lower() in blocked_patterns:
        return False, "Username diblokir! Silahkan username yang lain!"
    if not re.match(r"^[a-zA-Z0-9_]+$", username):
        return False, "Username hanya boleh terdiri dari huruf, angka, dan underscore (_)!"
    return True, username

def is_strong_password(password):
    if not password:
        return False, "Password tidak boleh kosong!"
    if len(password) < 8:
        return False, "Password minimal terdiri dari 8 karakter!"
    checks = {
        'uppercase': bool(re.search(r'[A-Z]', password)),
        'lowercase': bool(re.search(r'[a-z]', password)),
        'digit': bool(re.search(r'\d', password)),
        'special': bool(re.search(r'[!@#$%^&*(),.?":{}|<>]', password))
    }
    if not all(checks.values()):
        return False, "Password harus terdiri dari huruf besar, huruf kecil, angka dan karakter khusus!"
    return True, password

def validate_request_data(data, required_fields):
    if not data:
        return False, "Data tidak ditemukan!"
    
    for field in required_fields:
        if field not in data or not str(data[field]).strip():
            return False, f"{field} harus diisi"
        
    for key, value in data.items():
        if isinstance(value, str):
            data[key] = sanitize_input(value)
            
    return True, "Data berhasil tervalidasi!"