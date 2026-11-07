#!/usr/bin/env python3
"""Install a verified static release without touching other applications."""
from pathlib import Path
import datetime
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tarfile

OPERATIONS = Path(__file__).resolve().parent
WEBROOT = Path('/var/www/prioritet')
SITE = Path('/etc/nginx/sites-available/prioritet-site')
RELAY = Path('/etc/nginx/sites-available/prioritet-max-relay')
ORIGINS = 'https://gecxxxx.github.io,https://mebel-6c2.pages.dev,https://prioritetmebel48.ru,https://www.prioritetmebel48.ru,https://v763671.hosted-by-vdsina.com'

def run(*args):
    subprocess.run(args, check=True)

def validate_gateway_environment(file):
    value = file.read_text()
    entries = {}
    for line in value.splitlines():
        if not line.strip() or line.lstrip().startswith('#'):
            continue
        key, separator, item = line.partition('=')
        if not separator or key in entries:
            raise RuntimeError('Invalid gateway configuration; no services were restarted')
        entries[key] = item
    for key in ('MAX_WEBHOOK_SECRET', 'LEAD_PROXY_SECRET'):
        if not re.fullmatch(r'[a-zA-Z0-9_-]{32,256}', entries.get(key, '')):
            raise RuntimeError('Incomplete gateway configuration; no services were restarted')
    return value

def install(archive, checksum, commit):
    if os.geteuid() != 0 or not re.fullmatch(r'[a-f0-9]{64}', checksum) or not re.fullmatch(r'[a-f0-9]{40}', commit):
        raise RuntimeError('Expected root, SHA256 and full source commit')
    if hashlib.sha256(archive.read_bytes()).hexdigest() != checksum:
        raise RuntimeError('Archive checksum mismatch')
    # Check persistent credentials before touching nginx or restarting a live
    # service whose old process might still hold a valid in-memory environment.
    validate_gateway_environment(Path('/etc/prioritet-max.env'))
    with tarfile.open(archive) as package:
        members = package.getmembers()
        for member in members:
            name = Path(member.name)
            if name.is_absolute() or '..' in name.parts or not (member.isfile() or member.isdir()):
                raise RuntimeError('Archive contains an unsafe member')
        if shutil.disk_usage('/').free < sum(m.size for m in members) + 200 * 1024 * 1024:
            raise RuntimeError('Insufficient free disk space for safe deployment')
        release = WEBROOT / 'releases' / commit
        if release.exists():
            raise RuntimeError('Release already exists; inspect before replacing it')
        release.mkdir(parents=True, mode=0o755)
        # Paths and member types were checked above, including links.
        package.extractall(release)
    for file in release.rglob('*'):
        file.chmod(0o755 if file.is_dir() else 0o644)
    home = (release / 'index.html').read_text()
    if 'ym(114121807' not in home or 'https://prioritetmebel48.ru/' not in home or 'content="index,follow"' not in home:
        raise RuntimeError('Expected production-domain build and installed Metrika')
    if not (release / 'robots.txt').is_file() or not (release / 'request/index.html').is_file():
        raise RuntimeError('Incomplete static release')

    state = Path('/var/lib/prioritet-site')
    state.mkdir(parents=True, exist_ok=True)
    challenge = state / 'acme/.well-known/acme-challenge'
    challenge.mkdir(parents=True, exist_ok=True)
    (challenge / 'prioritet-ready').write_text('prioritet-site-on-89.124.104.61\n')
    (challenge / 'prioritet-ready').chmod(0o644)
    for folder in ('/var/lib/letsencrypt', '/var/log/letsencrypt', '/etc/letsencrypt'):
        Path(folder).mkdir(parents=True, exist_ok=True)

    stamp = datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    backup = Path('/opt/prioritet-site/backups') / stamp
    backup.mkdir(parents=True, mode=0o700)
    managed = [SITE, RELAY, Path('/etc/nginx/snippets/prioritet-site-static.conf'), Path('/etc/prioritet-max.env'), Path('/etc/systemd/system/prioritet-site-tls.service'), Path('/etc/systemd/system/prioritet-site-tls.timer'), Path('/usr/local/sbin/prioritet-site-certificate-deployed')]
    snapshots = {p: (p.read_bytes(), p.stat().st_mode & 0o777) if p.exists() else None for p in managed}
    for i, (file, snapshot) in enumerate(snapshots.items()):
        if snapshot:
            copy = backup / f'{i}-{file.name}'
            copy.write_bytes(snapshot[0])
            copy.chmod(0o600)
    current = WEBROOT / 'current'
    previous = os.readlink(current) if current.is_symlink() else None
    if current.exists() and previous is None:
        raise RuntimeError('Current deployment is not a managed symlink')
    enabled = Path('/etc/nginx/sites-enabled/prioritet-site')
    if enabled.exists() and (not enabled.is_symlink() or enabled.resolve() != SITE):
        raise RuntimeError('Refusing to replace another nginx site')
    had_enabled = enabled.is_symlink()
    gateway_changed = False
    try:
        old_relay = RELAY.read_text()
        if not old_relay.startswith('# Prioritet MAX webhook relay'):
            raise RuntimeError('Unexpected MAX host configuration')
        include = 'include /etc/nginx/snippets/prioritet-site-static.conf;'
        if include not in old_relay:
            if old_relay.count('location / { return 404; }') != 1:
                raise RuntimeError('Unexpected relay root; refusing unsafe modification')
            RELAY.write_text(old_relay.replace('location / { return 404; }', include))
        snippet = Path('/etc/nginx/snippets/prioritet-site-static.conf')
        shutil.copyfile(OPERATIONS / 'static.conf', snippet)
        snippet.chmod(0o644)
        staged = WEBROOT / '.current-next'
        if staged.is_symlink():
            staged.unlink()
        staged.symlink_to(release)
        staged.replace(current)
        if not had_enabled:
            enabled.symlink_to(SITE)
        import configure_site
        configure_site.apply()
        # apply may find an unchanged vhost during a later release, but new
        # relay/snippet changes must still pass validation before reloading.
        run('nginx', '-t')
        run('systemctl', 'reload', 'nginx')
        env = Path('/etc/prioritet-max.env')
        previous_env = validate_gateway_environment(env)
        value, count = re.subn(r'^ALLOWED_ORIGINS=.*$', 'ALLOWED_ORIGINS=' + ORIGINS, previous_env, flags=re.M)
        if count == 0:
            value = value.rstrip() + '\nALLOWED_ORIGINS=' + ORIGINS + '\n'
        if value != previous_env:
            env.write_text(value)
            env.chmod(0o600)
            gateway_changed = True
            run('systemctl', 'restart', 'prioritet-max')
        run('systemctl', 'is-active', '--quiet', 'prioritet-max')
        hook = Path('/usr/local/sbin/prioritet-site-certificate-deployed')
        hook.write_text('#!/bin/sh\nexec /usr/bin/python3 /opt/prioritet-site/operations/configure_site.py\n')
        hook.chmod(0o755)
        for name in ('prioritet-site-tls.service', 'prioritet-site-tls.timer'):
            shutil.copyfile(OPERATIONS / name, Path('/etc/systemd/system') / name)
        run('systemctl', 'daemon-reload')
        run('systemctl', 'enable', '--now', 'prioritet-site-tls.timer')
        (state / 'release.json').write_text(json.dumps({'commit': commit, 'archiveSha256': checksum, 'release': str(release), 'installedAt': stamp, 'previous': previous}, indent=2))
        print(json.dumps({'installed': str(release), 'sha256': checksum, 'backup': str(backup)}))
    except Exception:
        for file, snapshot in snapshots.items():
            if snapshot is None:
                file.unlink(missing_ok=True)
            else:
                file.write_bytes(snapshot[0])
                file.chmod(snapshot[1])
        if current.is_symlink():
            current.unlink()
        if previous:
            current.symlink_to(previous)
        if not had_enabled:
            enabled.unlink(missing_ok=True)
        subprocess.run(['nginx', '-t'], check=False)
        subprocess.run(['systemctl', 'reload', 'nginx'], check=False)
        if gateway_changed:
            subprocess.run(['systemctl', 'restart', 'prioritet-max'], check=False)
        subprocess.run(['systemctl', 'daemon-reload'], check=False)
        raise

if __name__ == '__main__':
    if len(sys.argv) != 4:
        raise SystemExit('Usage: install_site.py ARCHIVE SHA256 SOURCE_COMMIT')
    install(Path(sys.argv[1]).resolve(), sys.argv[2], sys.argv[3])
