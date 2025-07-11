# 🚀 CI/CD Setup Guide

## Overview
This project uses GitHub Actions to automatically build and deploy Docker images to Docker Hub when pull requests are made to the master branch.

## 🔧 Prerequisites

### 1. Docker Hub Account
- Create an account at [Docker Hub](https://hub.docker.com/)
- Note your Docker Hub username

### 2. Docker Hub Access Token
- Go to Docker Hub → Account Settings → Security
- Click "New Access Token"
- Give it a name (e.g., "GitHub Actions")
- Copy the generated token (you won't see it again!)

## 🔐 GitHub Secrets Setup

Add these secrets to your GitHub repository:

### Navigate to Repository Settings
1. Go to your GitHub repository
2. Click on "Settings" tab
3. In the left sidebar, click "Secrets and variables" → "Actions"
4. Click "New repository secret"

### Required Secrets

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `DOCKERHUB_USERNAME` | Your Docker Hub username | `myusername` |
| `DOCKERHUB_TOKEN` | Your Docker Hub access token | `dckr_pat_abc123...` |

## 📦 Docker Images

The CI/CD pipeline will create these Docker images:

| Service | Image Name | Description |
|---------|------------|-------------|
| Frontend | `{username}/devsecops-frontend` | Static HTML/CSS/JS application |
| API Gateway | `{username}/devsecops-api-gateway` | Node.js API gateway |
| Payment Service | `{username}/devsecops-payment-service` | Stripe payment integration |
| Admin Dashboard | `{username}/devsecops-admin-dashboard` | Vulnerable admin panel |

## 🔄 Workflow Triggers

### Pull Request to Master
- **Trigger**: When a PR is opened, synchronized, or reopened to `master`
- **Actions**:
  - Build all Docker images
  - Push images with PR-specific tags
  - Run security scans with Trivy
  - Upload scan results to GitHub Security tab

### Push to Master
- **Trigger**: When code is pushed directly to `master`
- **Actions**:
  - Build all Docker images
  - Push images with `latest` tag
  - Create production docker-compose file
  - Upload production artifacts

## 🏷️ Image Tags

The pipeline creates multiple tags for each image:

| Tag Type | Example | When Created |
|----------|---------|--------------|
| Latest | `latest` | Push to master |
| Branch | `master` | Push to master |
| PR | `pr-123` | Pull request #123 |
| SHA | `master-abc1234` | Commit SHA |

## 🛡️ Security Features

### Vulnerability Scanning
- **Tool**: Trivy scanner
- **Scope**: All Docker images
- **Trigger**: Pull requests
- **Output**: SARIF format uploaded to GitHub Security

### Multi-platform Builds
- **Platforms**: `linux/amd64`, `linux/arm64`
- **Benefit**: Compatible with different architectures

### Build Caching
- **Type**: GitHub Actions cache
- **Benefit**: Faster builds on subsequent runs

## 📁 Generated Files

### Production Docker Compose
- **File**: `docker-compose.prod.yml`
- **Purpose**: Use Docker Hub images instead of local builds
- **Availability**: Download from GitHub Actions artifacts

## 🚀 Usage Examples

### 1. Development Workflow
```bash
# Create feature branch
git checkout -b feature/payment-fix

# Make changes
git add .
git commit -m "Fix payment integration"
git push origin feature/payment-fix

# Create PR to master
# → GitHub Actions will build and scan images
```

### 2. Production Deployment
```bash
# After PR is merged to master
# → Images are automatically built and pushed with 'latest' tag

# Deploy using production compose file
wget https://github.com/yourusername/yourrepo/actions/artifacts/latest/docker-compose.prod.yml
docker-compose -f docker-compose.prod.yml up -d
```

### 3. Using Specific Image Versions
```bash
# Use a specific PR build
docker pull yourusername/devsecops-frontend:pr-123

# Use a specific commit
docker pull yourusername/devsecops-api-gateway:master-abc1234
```

## 🔍 Monitoring

### GitHub Actions Dashboard
- View build status in the "Actions" tab
- Check logs for each job
- Download artifacts

### Docker Hub
- View pushed images and tags
- Check download statistics
- Manage image retention

### Security Alerts
- Check the "Security" tab for vulnerability reports
- Review Trivy scan results
- Monitor for new security advisories

## 🛠️ Troubleshooting

### Common Issues

#### 1. Authentication Failed
```
Error: buildx failed with: ERROR: failed to solve: failed to push
```
**Solution**: Check `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` secrets

#### 2. Image Not Found
```
Error: pull access denied for username/image
```
**Solution**: Ensure image name matches your Docker Hub username

#### 3. Build Timeout
```
Error: The job running on runner has exceeded the maximum execution time
```
**Solution**: Optimize Dockerfile or increase timeout in workflow

### Debug Commands

```bash
# Test Docker Hub authentication locally
echo $DOCKERHUB_TOKEN | docker login -u $DOCKERHUB_USERNAME --password-stdin

# Check image exists
docker pull yourusername/devsecops-frontend:latest

# Verify multi-platform build
docker buildx imagetools inspect yourusername/devsecops-frontend:latest
```

## 📊 Performance Optimization

### Build Speed
- Use multi-stage builds
- Leverage build cache
- Optimize layer ordering

### Image Size
- Use Alpine base images
- Remove unnecessary packages
- Use `.dockerignore` files

### Security
- Regular base image updates
- Minimal runtime dependencies
- Non-root user execution

## 🔄 Maintenance

### Regular Tasks
- Update GitHub Actions versions
- Rotate Docker Hub tokens
- Review security scan results
- Clean up old images

### Monitoring
- Set up notifications for failed builds
- Monitor Docker Hub usage
- Track image pull statistics

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Hub Documentation](https://docs.docker.com/docker-hub/)
- [Trivy Security Scanner](https://github.com/aquasecurity/trivy)
- [Docker Buildx](https://docs.docker.com/buildx/)
