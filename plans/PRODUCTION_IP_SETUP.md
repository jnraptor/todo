# Production IP Address Configuration Guide

## Problem
In production, audit logs show IP addresses as `::1` (IPv6 loopback) instead of real client IP addresses.

## Root Cause
- **Client-side limitation**: React apps run in browsers and cannot access real client IPs
- **Docker networking**: Containers see internal network traffic as localhost
- **Proxy/Load balancer**: Real IPs get lost without proper header forwarding

## Solutions Implemented

### 1. Cloudflare-Optimized Nginx Configuration (`nginx.conf`)
- Added all current Cloudflare IP ranges to `set_real_ip_from` directives
- Uses `CF-Connecting-IP` header (most reliable for Cloudflare)
- Configured proper IP forwarding headers including Cloudflare-specific ones
- Added logging with real IP information

### 2. Docker Configuration
- Updated `Dockerfile` to use custom nginx configuration
- Ensures proper header forwarding in containerized environment

### 3. Supabase Client Configuration
- Removed ineffective client-side IP headers (client apps cannot access real IPs)
- Real IP detection now handled entirely at the nginx/Cloudflare infrastructure level

## Additional Production Setup Required

### For Load Balancers (AWS ALB, Cloudflare, etc.)

#### AWS Application Load Balancer
```yaml
# In your ALB configuration
X-Forwarded-For: enabled
X-Forwarded-Proto: enabled
X-Forwarded-Port: enabled
```

#### Cloudflare (Your Current Setup)
```
# Cloudflare automatically adds these headers:
CF-Connecting-IP: <real-client-ip>  # Most reliable - used by nginx config
X-Forwarded-For: <real-client-ip>
CF-Ray: <request-id>
CF-Visitor: {"scheme":"https"}

# Your nginx.conf is already configured for Cloudflare with:
# - All current Cloudflare IP ranges
# - CF-Connecting-IP as the primary real IP source
# - Proper header forwarding
```

#### NGINX Reverse Proxy
```nginx
location / {
    proxy_pass http://your-app:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### For Docker Compose in Production

Update your `docker-compose.yml` for production:

```yaml
version: '3.8'
services:
  todo-app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:80"
    environment:
      - NODE_ENV=production
    # Add network configuration for proper IP handling
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

### For Kubernetes

```yaml
apiVersion: v1
kind: Service
metadata:
  name: todo-app-service
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-proxy-protocol: "*"
spec:
  type: LoadBalancer
  externalTrafficPolicy: Local  # Preserves source IP
  ports:
  - port: 80
    targetPort: 80
  selector:
    app: todo-app
```

## Verification Steps

### 1. Check Nginx Logs
```bash
# In production container
docker exec -it todo-app tail -f /var/log/nginx/access.log
```

### 2. Test IP Headers
```bash
# Test with curl
curl -H "X-Forwarded-For: 203.0.113.1" http://your-domain.com
```

### 3. Monitor Supabase Audit Logs
- Check if IP addresses in audit logs change from `::1` to real IPs
- May take some time to propagate

## Important Notes

1. **Supabase Backend Control**: IP logging happens at Supabase's backend level, not in your React app
2. **Header Limitations**: Client-side headers have limited effectiveness for IP detection
3. **Infrastructure Dependency**: Real IP detection depends heavily on your deployment infrastructure
4. **Security Consideration**: Ensure `set_real_ip_from` only includes trusted proxy networks

## Troubleshooting

### Still Seeing `::1`?
1. Verify your load balancer/proxy is forwarding IP headers
2. Check if Supabase project settings have IP logging enabled
3. Ensure your infrastructure supports real IP forwarding
4. Contact Supabase support for backend-specific IP detection issues

### Testing Locally
```bash
# Build and test the Docker image locally
docker build -t todo-app .
docker run -p 3000:80 todo-app

# Check nginx configuration
docker exec -it <container-id> nginx -t
```

## Alternative: Server-Side Logging

If client IP detection remains problematic, consider implementing server-side audit logging:

1. Add a backend API (Node.js/Express, Python/FastAPI, etc.)
2. Proxy Supabase calls through your backend
3. Log IPs server-side before forwarding to Supabase
4. This gives you full control over IP detection and logging