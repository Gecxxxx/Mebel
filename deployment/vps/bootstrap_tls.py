#!/usr/bin/env python3
"""Issue host certificates only after public DNS and HTTP point at this VPS."""
from pathlib import Path
import json
import subprocess
import time
import urllib.request
from configure_site import HOSTS, certificate_ready, apply

ADDRESS = '89.124.104.61'
STATE = Path('/var/lib/prioritet-site/tls-attempts.json')
PROBE = 'prioritet-site-on-' + ADDRESS

def resolves_here(host):
    answers = {}
    for kind in ('A', 'AAAA'):
        request = urllib.request.Request(f'https://dns.google/resolve?name={host}&type={kind}', headers={'User-Agent': 'Prioritet-TLS-Provisioner/1.0'})
        with urllib.request.urlopen(request, timeout=8) as response:
            result = json.load(response)
        if result.get('Status') != 0:
            return False
        answers[kind] = {a['data'] for a in result.get('Answer', []) if a['type'] == (1 if kind == 'A' else 28)}
    if answers['A'] != {ADDRESS} or answers['AAAA']:
        return False
    with urllib.request.urlopen(f'http://{host}/.well-known/acme-challenge/prioritet-ready', timeout=8) as response:
        return response.status == 200 and response.read(256).decode().strip() == PROBE

def main():
    attempts = json.loads(STATE.read_text()) if STATE.exists() else {}
    for host, name in HOSTS.items():
        if certificate_ready(name):
            continue
        try:
            if not resolves_here(host):
                print(f'{host}: waiting for direct DNS/HTTP routing to {ADDRESS}', flush=True)
                continue
            if time.time() - attempts.get(host, 0) < 900:
                print(f'{host}: certificate retry cooldown', flush=True)
                continue
            attempts[host] = time.time()
            STATE.write_text(json.dumps(attempts))
            result = subprocess.run([
                'certbot', 'certonly', '--non-interactive', '--agree-tos',
                '--register-unsafely-without-email', '--webroot', '-w', '/var/lib/prioritet-site/acme',
                '--cert-name', name, '-d', host,
                '--deploy-hook', '/usr/local/sbin/prioritet-site-certificate-deployed',
            ], timeout=150)
            print(f'{host}: certificate command exit {result.returncode}', flush=True)
        except Exception as error:
            print(f'{host}: waiting; {type(error).__name__}', flush=True)
    apply()
    if all(certificate_ready(name) for name in HOSTS.values()):
        subprocess.run(['systemctl', 'disable', '--now', 'prioritet-site-tls.timer'], check=True)
        print('Both domain certificates installed; normal certbot.timer handles renewal.', flush=True)

if __name__ == '__main__':
    main()
