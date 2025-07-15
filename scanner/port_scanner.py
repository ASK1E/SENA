from flask import Blueprint, render_template, request, jsonify
from concurrent.futures import ThreadPoolExecutor
import socket
import random
import uuid
from datetime import datetime
from .pdf_reports import generate_pdf
from collections import deque
import threading
import time

# Import blueprint dari __init__.py
from . import scanner_bp

# In-memory storage untuk scan histories dengan struktur yang lebih lengkap
scan_histories = {}
scan_stats = {
    "total_scans": 0,
    "total_threats": 0,
    "total_open_ports": 0,
    "last_scan": None
}

# Service fingerprinting database
SERVICE_FINGERPRINTS = {
    # HTTP services
    b'HTTP/1.': 'HTTP',
    b'Server: Apache': 'Apache HTTP Server',
    b'Server: nginx': 'Nginx HTTP Server',
    b'Server: Microsoft-IIS': 'Microsoft IIS',
    b'Server: lighttpd': 'Lighttpd HTTP Server',
    
    # SSH
    b'SSH-2.0': 'SSH-2.0',
    b'SSH-1.99': 'SSH-1.99',
    
    # FTP
    b'220 ': 'FTP',
    b'220-FileZilla': 'FileZilla FTP Server',
    b'220 Microsoft FTP': 'Microsoft FTP Server',
    b'220-ProFTPD': 'ProFTPD Server',
    
    # SMTP
    b'220 ': 'SMTP (if port 25/587/465)',
    b'220-Welcome': 'SMTP Server',
    
    # POP3
    b'+OK': 'POP3 (if port 110/995)',
    
    # IMAP
    b'* OK': 'IMAP (if port 143/993)',
    
    # Telnet
    b'Telnet': 'Telnet',
    
    # DNS
    b'DNS': 'DNS Server',
    
    # MySQL
    b'mysql_native_password': 'MySQL Server',
    
    # PostgreSQL
    b'FATAL': 'PostgreSQL (if port 5432)',
    
    # Redis
    b'-ERR': 'Redis (if port 6379)',
    
    # MongoDB
    b'MongoDB': 'MongoDB Server',
    
    # RDP
    b'RDP': 'Remote Desktop Protocol',
    
    # SNMP
    b'SNMP': 'SNMP',
    
    # LDAP
    b'LDAP': 'LDAP Server',
}

# Common service ports
COMMON_SERVICES = {
    21: 'FTP',
    22: 'SSH',
    23: 'Telnet',
    25: 'SMTP',
    53: 'DNS',
    80: 'HTTP',
    110: 'POP3',
    143: 'IMAP',
    443: 'HTTPS',
    993: 'IMAPS',
    995: 'POP3S',
    3389: 'RDP',
    5432: 'PostgreSQL',
    3306: 'MySQL',
    6379: 'Redis',
    27017: 'MongoDB',
    161: 'SNMP',
    389: 'LDAP',
    636: 'LDAPS',
    1433: 'MSSQL',
    5984: 'CouchDB',
    8080: 'HTTP-Alt',
    8443: 'HTTPS-Alt',
    9200: 'Elasticsearch',
    5601: 'Kibana',
    6666: 'IRC',
    6667: 'IRC',
    119: 'NNTP',
    2049: 'NFS',
    111: 'RPC',
    135: 'RPC',
    139: 'NetBIOS',
    445: 'SMB',
    1521: 'Oracle',
    1526: 'Oracle',
    2181: 'ZooKeeper',
    9092: 'Kafka',
    11211: 'Memcached',
    2375: 'Docker',
    2376: 'Docker TLS',
    4369: 'Erlang',
    5672: 'RabbitMQ',
    15672: 'RabbitMQ Management',
    9090: 'Prometheus',
    3000: 'Grafana',
    8086: 'InfluxDB',
    9000: 'SonarQube',
    8081: 'Nexus',
    50070: 'Hadoop NameNode',
    9999: 'Hadoop Secondary NameNode',
    8088: 'Hadoop Resource Manager',
    19888: 'Hadoop History Server',
    2888: 'Zookeeper',
    3888: 'Zookeeper',
    7077: 'Spark Master',
    4040: 'Spark UI',
    18080: 'Spark History',
    8020: 'Hadoop HDFS',
    9083: 'Hive Metastore',
    10000: 'Hive Server2',
    10002: 'Hive WebHCat',
    50075: 'Hadoop DataNode',
    8042: 'Hadoop NodeManager',
    8188: 'Hadoop Timeline Service',
    19890: 'Hadoop MapReduce History',
    8032: 'Hadoop ResourceManager',
    8030: 'Hadoop ResourceManager Scheduler',
    8031: 'Hadoop ResourceManager Tracker',
    8033: 'Hadoop ResourceManager Admin',
    10020: 'Hadoop MapReduce Job History',
    13562: 'Hadoop Shuffle'
}

# HTTP probes for better detection
HTTP_PROBES = [
    b'GET / HTTP/1.1\r\nHost: {host}\r\n\r\n',
    b'HEAD / HTTP/1.1\r\nHost: {host}\r\n\r\n',
    b'OPTIONS / HTTP/1.1\r\nHost: {host}\r\n\r\n'
]

# Port range groups for intelligent traversal
PORT_GROUPS = {
    'critical': [21, 22, 23, 25, 53, 80, 110, 143, 443, 993, 995, 3389],
    'database': [3306, 5432, 1433, 1521, 6379, 27017, 5984, 9200],
    'web': [80, 443, 8080, 8443, 8000, 3000, 9000, 8081],
    'messaging': [25, 587, 465, 110, 143, 993, 995, 5672, 15672],
    'admin': [22, 23, 3389, 5985, 5986, 135, 139, 445],
    'monitoring': [161, 9090, 3000, 5601, 8086, 9000],
    'development': [8080, 8443, 3000, 4000, 5000, 8000, 9000, 8081]
}

class PortTraversal:
    def __init__(self, start_port=1, end_port=1024):
        self.start_port = start_port
        self.end_port = end_port
        self.visited = set()
        self.discovered_services = {}
        
    def get_priority_score(self, port):
        """Calculate priority score for a port based on service importance"""
        if port in PORT_GROUPS['critical']:
            return 10
        elif port in PORT_GROUPS['database']:
            return 9
        elif port in PORT_GROUPS['web']:
            return 8
        elif port in PORT_GROUPS['admin']:
            return 7
        elif port in PORT_GROUPS['messaging']:
            return 6
        elif port in PORT_GROUPS['monitoring']:
            return 5
        elif port in PORT_GROUPS['development']:
            return 4
        elif port in COMMON_SERVICES:
            return 3
        else:
            return 1
    
    def bfs_traversal(self):
        """Breadth-First Search traversal for port scanning"""
        queue = deque()
        traversal_order = []
        
        # Group ports by priority levels
        priority_groups = {}
        for port in range(self.start_port, self.end_port + 1):
            priority = self.get_priority_score(port)
            if priority not in priority_groups:
                priority_groups[priority] = []
            priority_groups[priority].append(port)
        
        # Add ports to queue in priority order (highest first)
        for priority in sorted(priority_groups.keys(), reverse=True):
            ports = priority_groups[priority]
            random.shuffle(ports)
            for port in ports:
                queue.append(port)
        
        # BFS traversal
        while queue:
            current_port = queue.popleft()
            if current_port not in self.visited:
                self.visited.add(current_port)
                traversal_order.append(current_port)
        
        return traversal_order
    
    def dfs_traversal(self):
        """Depth-First Search traversal for port scanning"""
        stack = []
        traversal_order = []
        
        # Start with critical services and explore related ports deeply
        service_clusters = [
            PORT_GROUPS['critical'],
            PORT_GROUPS['web'],
            PORT_GROUPS['database'],
            PORT_GROUPS['admin'],
            PORT_GROUPS['messaging'],
            PORT_GROUPS['monitoring'],
            PORT_GROUPS['development']
        ]
        
        # Add remaining ports
        all_clustered = set()
        for cluster in service_clusters:
            all_clustered.update(cluster)
        
        remaining_ports = []
        for port in range(self.start_port, self.end_port + 1):
            if port not in all_clustered:
                remaining_ports.append(port)
        
        # Build DFS stack (reverse order since stack is LIFO)
        for cluster in reversed(service_clusters):
            cluster_ports = [p for p in cluster if self.start_port <= p <= self.end_port]
            for port in reversed(sorted(cluster_ports)):
                stack.append(port)
        
        # Add remaining ports
        for port in reversed(remaining_ports):
            stack.append(port)
        
        # DFS traversal
        while stack:
            current_port = stack.pop()
            if current_port not in self.visited:
                self.visited.add(current_port)
                traversal_order.append(current_port)
                self._add_related_ports(current_port, stack)
        
        return traversal_order
    
    def _add_related_ports(self, port, stack):
        """Add ports related to the current service to the stack"""
        # For web services, add common alternative ports
        if port in [80, 443]:
            related = [8080, 8443, 8000, 3000] if port == 80 else [8443, 8080]
            for related_port in related:
                if (self.start_port <= related_port <= self.end_port and 
                    related_port not in self.visited):
                    stack.append(related_port)
        
        # For database services, add related ports
        elif port == 3306:  # MySQL
            related = [3307, 33060]
            for related_port in related:
                if (self.start_port <= related_port <= self.end_port and 
                    related_port not in self.visited):
                    stack.append(related_port)
        
        # For SSH, add alternative ports
        elif port == 22:
            related = [2222, 22222]
            for related_port in related:
                if (self.start_port <= related_port <= self.end_port and 
                    related_port not in self.visited):
                    stack.append(related_port)
    
    def adaptive_traversal(self):
        """Adaptive traversal that switches between BFS and DFS based on discoveries"""
        traversal_order = []
        
        # Start with BFS for quick discovery of critical services
        critical_ports = [p for p in PORT_GROUPS['critical'] 
                         if self.start_port <= p <= self.end_port]
        
        # BFS phase for critical services
        bfs_queue = deque(critical_ports)
        while bfs_queue:
            port = bfs_queue.popleft()
            if port not in self.visited:
                self.visited.add(port)
                traversal_order.append(port)
        
        # If we found open ports, switch to DFS for deep exploration
        if self.discovered_services:
            dfs_remaining = [p for p in range(self.start_port, self.end_port + 1) 
                           if p not in self.visited]
            
            # Group remaining ports by service type for DFS
            for group_name, group_ports in PORT_GROUPS.items():
                if group_name == 'critical':
                    continue
                    
                group_remaining = [p for p in group_ports 
                                 if p in dfs_remaining and p not in self.visited]
                
                # DFS within each group
                stack = list(reversed(group_remaining))
                while stack:
                    port = stack.pop()
                    if port not in self.visited:
                        self.visited.add(port)
                        traversal_order.append(port)
        
        # Add any remaining ports
        for port in range(self.start_port, self.end_port + 1):
            if port not in self.visited:
                traversal_order.append(port)
        
        return traversal_order

# --- Port Scanning Functions ---
def grab_banner(target_ip, port):
    """Attempt to grab banner from a service"""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(2)
        s.connect((target_ip, port))
        
        # Try to receive banner first (for services that send greeting)
        banner = s.recv(1024)
        
        # If no banner received, try HTTP probes for web services
        if not banner and port in [80, 443, 8080, 8443, 8000, 3000, 9000]:
            try:
                probe = HTTP_PROBES[0].replace(b'{host}', target_ip.encode())
                s.send(probe)
                banner = s.recv(1024)
            except:
                pass
        
        # If still no banner, try generic probes
        if not banner:
            try:
                s.send(b'\r\n\r\n')
                banner = s.recv(1024)
            except:
                pass
        
        s.close()
        return banner
    except:
        return None

def identify_service(banner, port):
    """Identify service based on banner and port"""
    if not banner:
        return COMMON_SERVICES.get(port, 'Unknown')
    
    banner_lower = banner.lower()
    
    # Check fingerprint database
    for fingerprint, service in SERVICE_FINGERPRINTS.items():
        if fingerprint.lower() in banner_lower:
            return service
    
    # Special cases based on port and banner content
    if port == 25 and b'220' in banner:
        return 'SMTP'
    elif port == 110 and b'+OK' in banner:
        return 'POP3'
    elif port == 143 and b'* OK' in banner:
        return 'IMAP'
    elif port in [80, 8080, 3000, 8000] and b'http' in banner_lower:
        return 'HTTP'
    elif port in [443, 8443] and (b'http' in banner_lower or b'ssl' in banner_lower):
        return 'HTTPS'
    elif port == 22 and b'ssh' in banner_lower:
        return 'SSH'
    elif port == 21 and b'ftp' in banner_lower:
        return 'FTP'
    elif port == 23 and (b'telnet' in banner_lower or b'login:' in banner_lower):
        return 'Telnet'
    
    # Fallback to common services
    return COMMON_SERVICES.get(port, 'Unknown')

def resolve_target(target):
    """Resolve target hostname to IP address"""
    try:
        return socket.gethostbyname(target)
    except socket.gaierror:
        return None

def scan_tcp(ip, port, fingerprint_enabled=False):
    """Enhanced TCP scan with optional fingerprinting"""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(0.5)
            result = s.connect_ex((ip, port))
            if result == 0:
                port_info = {
                    "port": port,
                    "status": "open",
                    "service": COMMON_SERVICES.get(port, 'Unknown'),
                    "banner": None
                }
                
                # Perform banner grabbing if fingerprinting is enabled
                if fingerprint_enabled:
                    banner = grab_banner(ip, port)
                    if banner:
                        service = identify_service(banner, port)
                        port_info["service"] = service
                        port_info["banner"] = banner[:100].decode('utf-8', errors='ignore').strip()
                    else:
                        port_info["banner"] = "No banner"
                
                return port_info
    except:
        pass
    return None

def scan_syn(ip, port, fingerprint_enabled=False):
    """Simplified SYN scan without scapy dependency"""
    # Fallback to TCP scan if scapy is not available
    return scan_tcp(ip, port, fingerprint_enabled)

def assess_risk_level(open_ports):
    """Assess risk level based on open ports"""
    high_risk_ports = [21, 23, 135, 139, 445, 1433, 3389]
    medium_risk_ports = [25, 53, 110, 143, 993, 995]
    
    high_risk = any(port in high_risk_ports for port in open_ports)
    medium_risk = any(port in medium_risk_ports for port in open_ports)
    
    if high_risk:
        return "High"
    elif medium_risk:
        return "Medium"
    elif open_ports:
        return "Low"
    else:
        return "Safe"

# --- Enhanced Routes ---
@scanner_bp.route("/scan", methods=["POST"])
def scan():
    try:
        data = request.json
        ip = data.get("ip")
        start_port = int(data.get("start_port", 1))
        end_port = int(data.get("end_port", 100))
        mode = data.get("mode", "tcp")
        traversal = data.get("traversal", "bfs")
        threads = int(data.get("threads", 50))
        fingerprint_enabled = data.get("fingerprint", True)

        if not ip:
            return jsonify({"error": "Target IP address is required"}), 400

        # Validate IP format and resolve hostname if needed
        target_ip = resolve_target(ip)
        if not target_ip:
            return jsonify({"error": f"Cannot resolve hostname '{ip}'"}), 400

        # Generate unique scan ID
        scan_id = str(uuid.uuid4())[:8]
        scan_start_time = datetime.now()

        # Initialize traversal
        traversal_obj = PortTraversal(start_port, end_port)
        
        # Generate scan order based on traversal method
        if traversal == "bfs":
            scan_order = traversal_obj.bfs_traversal()
        elif traversal == "dfs":
            scan_order = traversal_obj.dfs_traversal()
        elif traversal == "adaptive":
            scan_order = traversal_obj.adaptive_traversal()
        else:  # sequential
            scan_order = list(range(start_port, end_port + 1))

        # Select scan function
        scan_func = scan_tcp
        if mode == "syn":
            scan_func = scan_syn

        open_ports = []
        port_details = []
        
        with ThreadPoolExecutor(max_workers=min(threads, 100)) as executor:
            if fingerprint_enabled:
                results = executor.map(lambda p: scan_func(target_ip, p, True), scan_order)
            else:
                results = executor.map(lambda p: scan_func(target_ip, p, False), scan_order)
            
            for result in results:
                if result:
                    open_ports.append(result["port"])
                    port_details.append(result)

        scan_end_time = datetime.now()
        scan_duration = (scan_end_time - scan_start_time).total_seconds()

        # Assess risk level
        risk_level = assess_risk_level(open_ports)

        # Calculate traversal statistics
        traversal_stats = {
            "total_ports_scanned": len(scan_order),
            "success_rate": round((len(open_ports) / len(scan_order)) * 100, 2) if scan_order else 0,
            "method_used": traversal,
            "scan_order_preview": scan_order[:10] if len(scan_order) > 10 else scan_order
        }

        scan_result = {
            "scan_id": scan_id,
            "target": ip,
            "resolved_ip": target_ip,
            "mode": mode,
            "traversal": traversal,
            "threads": threads,
            "fingerprint_enabled": fingerprint_enabled,
            "port_range": f"{start_port}-{end_port}",
            "start_port": start_port,
            "end_port": end_port,
            "open_ports": sorted(open_ports),
            "port_details": sorted(port_details, key=lambda x: x["port"]),
            "total_ports_scanned": len(scan_order),
            "open_ports_count": len(open_ports),
            "closed_ports_count": len(scan_order) - len(open_ports),
            "risk_level": risk_level,
            "scan_duration": round(scan_duration, 2),
            "timestamp": scan_start_time.isoformat(),
            "date": scan_start_time.strftime("%Y-%m-%d"),
            "time": scan_start_time.strftime("%H:%M:%S"),
            "status": "completed",
            "traversal_stats": traversal_stats
        }

        # Save to history
        user_id = "default_user"
        if user_id not in scan_histories:
            scan_histories[user_id] = []
        
        scan_histories[user_id].append(scan_result)
        
        # Update global stats
        scan_stats["total_scans"] += 1
        scan_stats["total_open_ports"] += len(open_ports)
        scan_stats["last_scan"] = scan_start_time.isoformat()
        
        # Count threats (high risk ports)
        if risk_level in ["High", "Medium"]:
            scan_stats["total_threats"] += 1

        return jsonify(scan_result)
    
    except Exception as e:
        return jsonify({"error": f"Scan failed: {str(e)}"}), 500

@scanner_bp.route("/history", methods=["GET"])
def get_history():
    """Get scan history with pagination and filtering"""
    try:
        user_id = "default_user"
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        filter_by = request.args.get('filter', 'all')
        sort_by = request.args.get('sort', 'date_desc')
        
        history = scan_histories.get(user_id, [])
        
        # Apply filters
        if filter_by != 'all':
            if filter_by == 'high_risk':
                history = [scan for scan in history if scan['risk_level'] == 'High']
            elif filter_by == 'medium_risk':
                history = [scan for scan in history if scan['risk_level'] == 'Medium']
            elif filter_by == 'low_risk':
                history = [scan for scan in history if scan['risk_level'] in ['Low', 'Safe']]
        
        # Apply sorting
        if sort_by == 'date_desc':
            history = sorted(history, key=lambda x: x['timestamp'], reverse=True)
        elif sort_by == 'date_asc':
            history = sorted(history, key=lambda x: x['timestamp'])
        elif sort_by == 'risk_desc':
            risk_order = {'High': 3, 'Medium': 2, 'Low': 1, 'Safe': 0}
            history = sorted(history, key=lambda x: risk_order.get(x['risk_level'], 0), reverse=True)
        
        # Pagination
        total_items = len(history)
        start_idx = (page - 1) * per_page
        end_idx = start_idx + per_page
        paginated_history = history[start_idx:end_idx]
        
        # Calculate summary statistics
        if history:
            total_scans = len(history)
            total_open_ports = sum(scan['open_ports_count'] for scan in history)
            high_risk_scans = len([scan for scan in history if scan['risk_level'] == 'High'])
            medium_risk_scans = len([scan for scan in history if scan['risk_level'] == 'Medium'])
            avg_scan_duration = sum(scan['scan_duration'] for scan in history) / len(history)
            
            # Most common open ports
            all_open_ports = []
            for scan in history:
                all_open_ports.extend(scan['open_ports'])
            
            port_frequency = {}
            for port in all_open_ports:
                port_frequency[port] = port_frequency.get(port, 0) + 1
            
            common_ports = sorted(port_frequency.items(), key=lambda x: x[1], reverse=True)[:5]
            
            # Most common services
            all_services = []
            for scan in history:
                for port_detail in scan.get('port_details', []):
                    all_services.append(port_detail.get('service', 'Unknown'))
            
            service_frequency = {}
            for service in all_services:
                service_frequency[service] = service_frequency.get(service, 0) + 1
            
            common_services = sorted(service_frequency.items(), key=lambda x: x[1], reverse=True)[:5]
            
            summary = {
                "total_scans": total_scans,
                "total_open_ports": total_open_ports,
                "high_risk_scans": high_risk_scans,
                "medium_risk_scans": medium_risk_scans,
                "average_scan_duration": round(avg_scan_duration, 2),
                "most_common_ports": [{"port": port, "count": count, "service": COMMON_SERVICES.get(port, 'Unknown')} 
                                    for port, count in common_ports],
                "most_common_services": [{"service": service, "count": count} 
                                       for service, count in common_services]
            }
        else:
            summary = {
                "total_scans": 0,
                "total_open_ports": 0,
                "high_risk_scans": 0,
                "medium_risk_scans": 0,
                "average_scan_duration": 0,
                "most_common_ports": [],
                "most_common_services": []
            }
        
        return jsonify({
            "user": user_id,
            "history": paginated_history,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total_items": total_items,
                "total_pages": (total_items + per_page - 1) // per_page,
                "has_next": end_idx < total_items,
                "has_prev": page > 1
            },
            "summary": summary,
            "filters": {
                "current_filter": filter_by,
                "current_sort": sort_by
            }
        })
    
    except Exception as e:
        return jsonify({"error": f"Failed to get history: {str(e)}"}), 500

@scanner_bp.route("/history/<scan_id>", methods=["GET"])
def get_scan_detail(scan_id):
    """Get detailed information for a specific scan"""
    try:
        user_id = "default_user"
        history = scan_histories.get(user_id, [])
        
        scan = next((scan for scan in history if scan['scan_id'] == scan_id), None)
        if not scan:
            return jsonify({"error": "Scan not found"}), 404
        
        return jsonify(scan)
    
    except Exception as e:
        return jsonify({"error": f"Failed to get scan detail: {str(e)}"}), 500

@scanner_bp.route("/history/<scan_id>", methods=["DELETE"])
def delete_scan(scan_id):
    """Delete a specific scan from history"""
    try:
        user_id = "default_user"
        history = scan_histories.get(user_id, [])
        
        # Find and remove scan
        scan_histories[user_id] = [scan for scan in history if scan['scan_id'] != scan_id]
        
        if len(scan_histories[user_id]) == len(history):
            return jsonify({"error": "Scan not found"}), 404
        
        return jsonify({"message": "Scan deleted successfully"})
    
    except Exception as e:
        return jsonify({"error": f"Failed to delete scan: {str(e)}"}), 500

@scanner_bp.route("/history/clear", methods=["DELETE"])
def clear_history():
    """Clear all scan history"""
    try:
        user_id = "default_user"
        scan_histories[user_id] = []
        
        return jsonify({"message": "History cleared successfully"})
    
    except Exception as e:
        return jsonify({"error": f"Failed to clear history: {str(e)}"}), 500

@scanner_bp.route("/stats", methods=["GET"])
def get_stats():
    """Get dashboard statistics"""
    try:
        user_id = "default_user"
        history = scan_histories.get(user_id, [])
        
        # Calculate real-time stats
        today_scans = len([scan for scan in history if scan['date'] == datetime.now().strftime("%Y-%m-%d")])
        total_scans = len(history)
        total_threats = len([scan for scan in history if scan['risk_level'] in ['High', 'Medium']])
        
        # Calculate security score (simplified)
        if total_scans > 0:
            safe_scans = len([scan for scan in history if scan['risk_level'] == 'Safe'])
            security_score = int((safe_scans / total_scans) * 100)
        else:
            security_score = 100
        
        # Get last scan info
        last_scan = None
        if history:
            last_scan = max(history, key=lambda x: x['timestamp'])['timestamp']
        
        stats = {
            "scans_today": today_scans,
            "total_scans": total_scans,
            "threats_found": total_threats,
            "security_score": security_score,
            "last_scan": last_scan
        }
        
        return jsonify(stats)
    
    except Exception as e:
        return jsonify({"error": f"Failed to get stats: {str(e)}"}), 500

@scanner_bp.route("/scan/export/pdf", methods=["POST"])
def export_pdf():
    try:
        data = request.json
        scan_id = data.get("scan_id", f"scan_{len(scan_histories.get('default_user', []))}")
        return generate_pdf(scan_id, data)
    except Exception as e:
        return jsonify({"error": f"PDF export failed: {str(e)}"}), 500

@scanner_bp.route("/test", methods=["GET"])
def test():
    return jsonify({
        "status": "Scanner blueprint is working!", 
        "routes": [
            "scan", "history", "history/<scan_id>", 
            "history/clear", "stats", "export/pdf"
        ]
    })

@scanner_bp.route("/validate", methods=["POST"])
def validate_target():
    """Validate target before scanning"""
    try:
        data = request.json
        target = data.get("target", "").strip()
        
        if not target:
            return jsonify({"valid": False, "error": "Target is required"}), 400
        
        # Try to resolve target
        ip = resolve_target(target)
        if not ip:
            return jsonify({"valid": False, "error": "Cannot resolve target"}), 400
        
        return jsonify({
            "valid": True,
            "target": target,
            "resolved_ip": ip,
            "message": f"Target resolved to {ip}" if target != ip else "Target is valid"
        })
    
    except Exception as e:
        return jsonify({"valid": False, "error": f"Validation failed: {str(e)}"}), 500