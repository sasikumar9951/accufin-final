## Accufin Nginx setup (no www, no root redirect)

Goal:

- Force www → non-www
- Force HTTP → HTTPS
- Serve Next.js on `https://accufinservices.ca/dashboard/*` and `https://accufinservices.ca/api/*`
- Do NOT redirect `/` to `/dashboard`

### One-time prerequisites

- Next.js app running on the server at `http://127.0.0.1:3000`
- Certbot certs exist at `/etc/letsencrypt/live/accufinservices.ca/`

### Create fresh config (end-to-end)

Run on server (copy/paste as-is):

```bash
set -e

# Stop Nginx to replace config cleanly (optional but requested)
sudo systemctl stop nginx || true

# Backup and remove old config if present
if [ -f /etc/nginx/conf.d/accufin.conf ]; then sudo cp /etc/nginx/conf.d/accufin.conf /etc/nginx/conf.d/accufin.conf.bak.$(date +%s); fi
sudo rm -f /etc/nginx/conf.d/accufin.conf

# Write new config
sudo tee /etc/nginx/conf.d/accufin.conf > /dev/null <<'NGINXCONF'
# Redirect all HTTP to HTTPS on apex (no www exposed)
server {
    listen 80;
    server_name accufinservices.ca www.accufinservices.ca;
    return 301 https://accufinservices.ca$request_uri;
}

# Redirect HTTPS www → apex
server {
    listen 443 ssl http2;
    server_name www.accufinservices.ca;

    ssl_certificate /etc/letsencrypt/live/accufinservices.ca/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/accufinservices.ca/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    return 301 https://accufinservices.ca$request_uri;
}

# Main HTTPS server for apex
server {
    listen 443 ssl http2;
    server_name accufinservices.ca;

    ssl_certificate /etc/letsencrypt/live/accufinservices.ca/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/accufinservices.ca/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Proxy Next.js under /dashboard
    location ^~ /dashboard {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }

    # Proxy API to Next.js
    location ^~ /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }

    # Next.js assets
    location ^~ /_next {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location ^~ /static {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # Optional: pass these through
    location = /favicon.ico { proxy_pass http://127.0.0.1:3000; }
    location = /robots.txt  { proxy_pass http://127.0.0.1:3000; }
}
NGINXCONF

# Validate and start
sudo nginx -t
sudo systemctl start nginx
sudo systemctl enable nginx >/dev/null 2>&1 || true

echo "Done."
```

### Quick verification

```bash
curl -i "https://accufinservices.ca/dashboard" | head -n 15
curl -i "https://accufinservices.ca/api/register-admin?ping=hi" | head -n 20
```

Expected: JSON from the Next.js API for the second command, no WordPress HTML, no `x-redirect-by: WordPress`.

### Rollback (if needed)

```bash
sudo mv /etc/nginx/conf.d/accufin.conf.bak.* /etc/nginx/conf.d/accufin.conf 2>/dev/null || true
sudo nginx -t && sudo systemctl reload nginx
```
