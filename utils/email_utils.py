from extension import mail
from flask_mail import Message
from flask import current_app, render_template_string

def load_template(template_name):
    try:
        template_file = f"templates/email/{template_name}"
        with open(template_file, 'r', encoding='utf-8') as file:
            return file.read()
    except Exception as e:
        print(f"Terjadi kesalahan: {e}")
        return None
    
def send_verification_email(to_email, token):
    verify_url = f"http://localhost:5000/verify?token={token}"
    html_template = load_template('verify_email.html')
    html_content = render_template_string(html_template, verify_url=verify_url)
    
    msg = Message("Verifikasi akun SENA anda", sender=current_app.config['MAIL_USERNAME'], recipients=[to_email])
    msg.html = html_content
    mail.send(msg)
    
def send_reset_pass_email(to_email, token):
    reset_url = f"http://localhost:5000/reset-password?token={token}"
    html_template = load_template('verify_reset_password.html')
    html_content = render_template_string(html_template, reset_url=reset_url)
    
    msg = Message("Reset password akun SENA anda", sender=current_app.config['MAIL_USERNAME'], recipients=[to_email])
    msg.html = html_content
    mail.send(msg)