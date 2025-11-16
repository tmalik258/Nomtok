import os
import sys
import smtplib
from email.mime.text import MIMEText

status = sys.argv[1] if len(sys.argv) > 1 else ""
message = sys.argv[2] if len(sys.argv) > 2 else ""

host = os.getenv("SMTP_HOST", "")
port = int(os.getenv("SMTP_PORT", "587") or "587")
user = os.getenv("SMTP_USER", "")
password = os.getenv("SMTP_PASS", "")
sender = os.getenv("SMTP_FROM", "")
recipients = [r.strip() for r in os.getenv("NOTIFY_EMAILS", "").split(",") if r.strip()]

if not host or not sender or not recipients:
    sys.exit(0)

subject = f"yt-dlp update {status}"
body = message
msg = MIMEText(body)
msg["Subject"] = subject
msg["From"] = sender
msg["To"] = ", ".join(recipients)

try:
    with smtplib.SMTP(host, port, timeout=10) as smtp:
        try:
            smtp.starttls()
        except Exception:
            pass
        if user and password:
            try:
                smtp.login(user, password)
            except Exception:
                pass
        smtp.sendmail(sender, recipients, msg.as_string())
except Exception:
    pass