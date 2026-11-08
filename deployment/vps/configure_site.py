#!/usr/bin/env python3
"""Render only the Prioritet vhost, enabling TLS when its certificate exists."""
from pathlib import Path
import subprocess

HOSTS = {'prioritetmebel48.ru': 'prioritet-site-apex', 'www.prioritetmebel48.ru': 'prioritet-site-www'}
CONFIG = Path('/etc/nginx/sites-available/prioritet-site')
MARKER = '# Prioritet website vhost\n'
ACME = '''    location ^~ /.well-known/acme-challenge/ {
        root /var/lib/prioritet-site/acme;
        default_type text/plain;
        try_files $uri =404;
    }
'''
API = '''    client_max_body_size 16k;
    client_body_timeout 10s;
    location = /api/leads {
        proxy_pass http://127.0.0.1:8789/api/leads;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header Connection "";
        proxy_connect_timeout 3s;
        proxy_read_timeout 25s;
        proxy_send_timeout 10s;
    }
'''

def certificate_ready(name):
    folder = Path('/etc/letsencrypt/live') / name
    if not (folder / 'fullchain.pem').is_file() or not (folder / 'privkey.pem').is_file():
        return False
    return subprocess.run(['openssl', 'x509', '-checkend', '0', '-noout', '-in', str(folder / 'fullchain.pem')], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL).returncode == 0

def render(ready=None):
    ready = ready if ready is not None else {host: certificate_ready(name) for host, name in HOSTS.items()}
    canonical_tls = ready['prioritetmebel48.ru']
    result = MARKER
    for host, name in HOSTS.items():
        result += f'server {{\n    listen 80;\n    listen [::]:80;\n    server_name {host};\n' + ACME
        result += '    location / { return 301 https://prioritetmebel48.ru$request_uri; }\n' if canonical_tls else API + '    include /etc/nginx/snippets/prioritet-site-static.conf;\n'
        result += '}\n'
        if ready[host]:
            result += f'''server {{
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name {host};
    ssl_certificate /etc/letsencrypt/live/{name}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/{name}/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
'''
            result += '    return 301 https://prioritetmebel48.ru$request_uri;\n' if host.startswith('www.') and canonical_tls else API + '    include /etc/nginx/snippets/prioritet-site-static.conf;\n'
            result += '}\n'
    return result

def apply():
    previous = CONFIG.read_text() if CONFIG.exists() else None
    if previous is not None and not previous.startswith(MARKER):
        raise RuntimeError('Refusing to replace an unrelated nginx host')
    value = render()
    if previous == value:
        return
    staged = CONFIG.with_suffix('.pending')
    staged.write_text(value)
    staged.replace(CONFIG)
    try:
        subprocess.run(['nginx', '-t'], check=True)
        subprocess.run(['systemctl', 'reload', 'nginx'], check=True)
    except Exception:
        if previous is None:
            CONFIG.unlink(missing_ok=True)
        else:
            CONFIG.write_text(previous)
        raise

if __name__ == '__main__':
    apply()
