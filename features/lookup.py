import socket
import whois
import requests

def get_domain_ip_info(input_value):
    info = {}
    try:
        # Domain → IP
        ip = socket.gethostbyname(input_value)
        info["domain"] = input_value
        info["ip"] = ip
    except socket.gaierror:
        try:
            # IP → Domain
            domain = socket.gethostbyaddr(input_value)[0]
            info["domain"] = domain
            info["ip"] = input_value
        except socket.herror:
            info["error"] = "Invalid input"
            return info

    # WHOIS
    try:
        w = whois.whois(info["domain"])
        info["whois"] = {
            "registrar": w.registrar,
            "creation_date": str(w.creation_date),
            "expiration_date": str(w.expiration_date),
            "name_servers": w.name_servers,
            "emails": w.emails,
        }
    except:
        info["whois"] = "WHOIS lookup failed"

    # IP Geolocation
    try:
        geo = requests.get(f"http://ip-api.com/json/{info['ip']}").json()
        info["geolocation"] = {
            "country": geo.get("country"),
            "region": geo.get("regionName"),
            "city": geo.get("city"),
            "lat": geo.get("lat"),
            "lon": geo.get("lon"),
            "isp": geo.get("isp")
        }
    except:
        info["geolocation"] = "Geolocation lookup failed"

    return info
