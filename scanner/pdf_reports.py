from flask import send_file
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.pdfgen import canvas
import io
from datetime import datetime

def generate_pdf(scan_id, scan_data):
    try:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer, 
            pagesize=A4, 
            rightMargin=0.75*inch, 
            leftMargin=0.75*inch, 
            topMargin=1*inch, 
            bottomMargin=0.8*inch
        )

        styles = getSampleStyleSheet()
        
        # Create custom styles with unique names to avoid conflicts
        if 'CustomTitle' not in styles:
            styles.add(ParagraphStyle(
                name='CustomTitle', 
                parent=styles['Heading1'],
                fontSize=18, 
                alignment=1, 
                spaceAfter=20,
                textColor=colors.HexColor('#0f2027')
            ))
        
        if 'CustomHeading' not in styles:
            styles.add(ParagraphStyle(
                name='CustomHeading', 
                parent=styles['Heading2'],
                fontSize=14, 
                spaceAfter=10, 
                textColor=colors.HexColor('#2c5364')
            ))
        
        if 'CustomNormal' not in styles:
            styles.add(ParagraphStyle(
                name='CustomNormal', 
                parent=styles['Normal'],
                fontSize=10
            ))

        elements = []
        
        # Title
        title_text = f"Port Scan Report for {scan_data.get('target', 'Unknown')}"
        elements.append(Paragraph(title_text, styles['CustomTitle']))
        elements.append(Spacer(1, 12))

        # Scan Information Section
        elements.append(Paragraph("Scan Information", styles['CustomHeading']))
        elements.append(Spacer(1, 6))

        # Summary Table
        summary_data = [
            ["Property", "Value"],
            ["Target", scan_data.get('target', 'Unknown')],
            ["Mode", scan_data.get('mode', 'tcp').upper()],
            ["Port Range", scan_data.get('range', '1-1024')],
            ["Scan Date", datetime.now().strftime('%Y-%m-%d %H:%M:%S')],
            ["Total Open Ports", str(len(scan_data.get('open_ports', [])))]
        ]
        
        table = Table(summary_data, colWidths=[doc.width * 0.3, doc.width * 0.7])
        table.setStyle(TableStyle([
            # Header row styling
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f2027')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            
            # Data rows styling
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f8f9fa')),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8f9fa')]),
            
            # Grid styling
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#dee2e6')),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('LEFTPADDING', (0, 0), (-1, -1), 12),
            ('RIGHTPADDING', (0, 0), (-1, -1), 12),
        ]))
        elements.append(table)
        elements.append(Spacer(1, 20))

        # Open Ports Section
        open_ports = scan_data.get('open_ports', [])
        if open_ports:
            elements.append(Paragraph("Open Ports Detected", styles['CustomHeading']))
            elements.append(Spacer(1, 6))
            
            # Create open ports table
            port_headers = ["Port", "Protocol", "Status", "Service"]
            port_data = [port_headers]
            
            for port in open_ports:
                service_name = get_service_name(port)
                port_data.append([
                    str(port),
                    scan_data.get('mode', 'TCP').upper(),
                    "Open",
                    service_name
                ])
            
            port_table = Table(port_data, colWidths=[doc.width * 0.15, doc.width * 0.15, doc.width * 0.15, doc.width * 0.55])
            port_table.setStyle(TableStyle([
                # Header styling
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#28a745')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 11),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                
                # Data rows
                ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f8f9fa')),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 9),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8f9fa')]),
                
                # Grid and padding
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#dee2e6')),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('LEFTPADDING', (0, 0), (-1, -1), 8),
                ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ]))
            elements.append(port_table)
        else:
            elements.append(Paragraph("No Open Ports Detected", styles['CustomHeading']))
            elements.append(Paragraph("✅ All scanned ports appear to be closed or filtered. This is generally a good security posture.", styles['CustomNormal']))
        
        elements.append(Spacer(1, 20))

        # Security Assessment Section
        elements.append(Paragraph("Security Assessment", styles['CustomHeading']))
        elements.append(Spacer(1, 6))
        
        risk_level = determine_risk_level(open_ports)
        risk_color = get_risk_color(risk_level)
        
        risk_para = Paragraph(f"<b>Risk Level: <font color='{risk_color}'>{risk_level}</font></b>", styles['CustomNormal'])
        elements.append(risk_para)
        elements.append(Spacer(1, 6))
        
        # Add recommendations
        recommendations = get_security_recommendations(open_ports)
        if recommendations:
            elements.append(Paragraph("<b>Recommendations:</b>", styles['CustomNormal']))
            for rec in recommendations:
                elements.append(Paragraph(f"• {rec}", styles['CustomNormal']))

        # Build PDF
        doc.build(elements, onFirstPage=header, onLaterPages=header)
        buffer.seek(0)
        
        return send_file(
            buffer,
            as_attachment=True,
            download_name=f"scan_report_{scan_id}.pdf",
            mimetype='application/pdf'
        )
        
    except Exception as e:
        print(f"PDF generation error: {str(e)}")
        raise e

def header(canvas_obj, doc):
    """Create header for PDF pages"""
    try:
        canvas_obj.saveState()
        
        # Header background
        canvas_obj.setFillColor(colors.HexColor('#0f2027'))
        canvas_obj.rect(0, A4[1] - 0.6 * inch, A4[0], 0.6 * inch, fill=1)
        
        # Header text
        canvas_obj.setFillColor(colors.whitesmoke)
        canvas_obj.setFont('Helvetica-Bold', 12)
        canvas_obj.drawString(doc.leftMargin, A4[1] - 0.4 * inch, "SENA - Port Scan Report")
        
        # Date and time
        canvas_obj.setFont('Helvetica', 10)
        canvas_obj.drawRightString(
            A4[0] - doc.rightMargin, 
            A4[1] - 0.4 * inch, 
            f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}"
        )
        
        # Footer
        canvas_obj.setFont('Helvetica', 8)
        canvas_obj.setFillColor(colors.HexColor('#6c757d'))
        canvas_obj.drawCentredText(
            A4[0] / 2, 
            0.5 * inch, 
            f"Page {doc.page} | SENA Security Scanner"
        )
        
        canvas_obj.restoreState()
    except Exception as e:
        print(f"Header generation error: {str(e)}")

def get_service_name(port):
    """Get common service name for a port number"""
    services = {
        20: 'FTP Data',
        21: 'FTP Control',
        22: 'SSH',
        23: 'Telnet',
        25: 'SMTP',
        53: 'DNS',
        67: 'DHCP Server',
        68: 'DHCP Client',
        80: 'HTTP',
        110: 'POP3',
        119: 'NNTP',
        123: 'NTP',
        135: 'RPC Endpoint',
        137: 'NetBIOS Name',
        138: 'NetBIOS Datagram',
        139: 'NetBIOS Session',
        143: 'IMAP',
        161: 'SNMP',
        194: 'IRC',
        389: 'LDAP',
        443: 'HTTPS',
        445: 'SMB',
        465: 'SMTPS',
        514: 'Syslog',
        587: 'SMTP Submission',
        631: 'IPP',
        636: 'LDAPS',
        993: 'IMAPS',
        995: 'POP3S',
        1433: 'MS SQL Server',
        1521: 'Oracle DB',
        1723: 'PPTP',
        3306: 'MySQL',
        3389: 'RDP',
        5432: 'PostgreSQL',
        5900: 'VNC',
        5901: 'VNC',
        6379: 'Redis',
        8080: 'HTTP Proxy',
        8443: 'HTTPS Alt'
    }
    return services.get(port, 'Unknown Service')

def determine_risk_level(open_ports):
    """Determine risk level based on open ports"""
    if not open_ports:
        return "LOW"
    
    high_risk_ports = [21, 23, 135, 139, 445, 1433, 3389, 5432, 5900, 5901]
    medium_risk_ports = [22, 25, 53, 80, 110, 143, 443, 993, 995]
    
    high_risk_found = any(port in high_risk_ports for port in open_ports)
    medium_risk_found = any(port in medium_risk_ports for port in open_ports)
    
    if high_risk_found:
        return "HIGH"
    elif medium_risk_found:
        return "MEDIUM"
    elif len(open_ports) > 5:
        return "MEDIUM"
    else:
        return "LOW"

def get_risk_color(risk_level):
    """Get color code for risk level"""
    colors_map = {
        "LOW": "#28a745",
        "MEDIUM": "#ffc107", 
        "HIGH": "#dc3545"
    }
    return colors_map.get(risk_level, "#6c757d")

def get_security_recommendations(open_ports):
    """Generate security recommendations based on open ports"""
    if not open_ports:
        return ["✅ No open ports detected - maintain current security posture"]
    
    recommendations = []
    
    # Check for specific risky services
    if 21 in open_ports:
        recommendations.append("FTP (21) detected - Consider using SFTP instead")
    if 23 in open_ports:
        recommendations.append("Telnet (23) detected - Replace with SSH for secure remote access")
    if 135 in open_ports or 139 in open_ports or 445 in open_ports:
        recommendations.append("Windows networking ports detected - Restrict access to trusted networks only")
    if 3389 in open_ports:
        recommendations.append("RDP (3389) detected - Enable Network Level Authentication and use strong passwords")
    if any(port in [5900, 5901] for port in open_ports):
        recommendations.append("VNC detected - Use strong authentication and consider VPN access")
    
    # General recommendations
    recommendations.extend([
        "Regularly update and patch all services running on open ports",
        "Implement firewall rules to restrict access to necessary ports only",
        "Monitor network traffic for suspicious activity",
        "Consider using intrusion detection systems (IDS)"
    ])
    
    return recommendations[:6]  # Limit to top 6 recommendations
