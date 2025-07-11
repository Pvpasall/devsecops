#!/bin/bash

# DevSecOps Platform Deployment Script
# ESTIAM E5 - Projet DevSecOps

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_success "Docker and Docker Compose are installed"
}

# Function to check if ports are available
check_ports() {
    print_status "Checking if required ports are available..."
    
    if lsof -Pi :80 -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_warning "Port 80 is already in use. Please stop the service using this port."
        lsof -Pi :80 -sTCP:LISTEN
        exit 1
    fi
    
    if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_warning "Port 8080 is already in use. Please stop the service using this port."
        lsof -Pi :8080 -sTCP:LISTEN
        exit 1
    fi
    
    print_success "Required ports (80, 8080) are available"
}

# Function to setup environment file
setup_env() {
    print_status "Setting up environment configuration..."
    
    if [ ! -f .env ]; then
        if [ -f env.example ]; then
            cp env.example .env
            print_success "Environment file created from template"
            print_warning "Please edit .env file with your Stripe API keys before proceeding"
            print_warning "You can get your Stripe keys from: https://dashboard.stripe.com/apikeys"
            echo ""
            echo "Required environment variables:"
            echo "- STRIPE_SECRET_KEY=sk_test_..."
            echo "- STRIPE_PUBLISHABLE_KEY=pk_test_..."
            echo ""
            read -p "Press Enter after updating the .env file..."
        else
            print_error "env.example file not found"
            exit 1
        fi
    else
        print_success "Environment file already exists"
    fi
}

# Function to build and start services
deploy_services() {
    print_status "Building and starting services..."
    
    # Build images
    print_status "Building Docker images..."
    docker-compose build --no-cache
    
    # Start services
    print_status "Starting services..."
    docker-compose up -d
    
    print_success "Services started successfully"
}

# Function to wait for services to be ready
wait_for_services() {
    print_status "Waiting for services to be ready..."
    
    # Wait for services to start
    sleep 10
    
    # Check health endpoints
    services=("http://localhost/health" "http://localhost:8080/health")
    
    for service in "${services[@]}"; do
        print_status "Checking $service..."
        
        # Wait up to 60 seconds for service to be ready
        for i in {1..12}; do
            if curl -s "$service" > /dev/null 2>&1; then
                print_success "$service is ready"
                break
            fi
            
            if [ $i -eq 12 ]; then
                print_error "$service is not responding"
                exit 1
            fi
            
            sleep 5
        done
    done
}

# Function to display access information
show_access_info() {
    echo ""
    echo "======================================"
    echo "🛡️  DevSecOps Platform Deployed"
    echo "======================================"
    echo ""
    echo "📱 Frontend Application:"
    echo "   http://localhost"
    echo ""
    echo "🔗 API Gateway:"
    echo "   http://api.localhost"
    echo ""
    echo "💳 Payment Service:"
    echo "   http://payment.localhost"
    echo ""
    echo "🛡️  Admin Dashboard (Pentest Target):"
    echo "   http://localhost:8080"
    echo "   Credentials: admin/admin123 or user/user123"
    echo ""
    echo "⚠️  WARNING: Admin Dashboard contains intentional vulnerabilities!"
    echo ""
    echo "📊 Health Checks:"
    echo "   - Frontend: http://localhost/health"
    echo "   - Admin: http://localhost:8080/health"
    echo ""
    echo "🔧 Management Commands:"
    echo "   - View logs: docker-compose logs -f"
    echo "   - Stop services: docker-compose down"
    echo "   - Restart: docker-compose restart"
    echo ""
    echo "🧪 Penetration Testing:"
    echo "   - Target: http://localhost:8080"
    echo "   - See README.md for test scenarios"
    echo ""
}

# Function to run security audit
security_audit() {
    print_status "Running security audit..."
    
    # Check for vulnerabilities in Node.js dependencies
    print_status "Checking Node.js dependencies..."
    docker-compose exec -T api-gateway npm audit --audit-level=high || true
    docker-compose exec -T payment-service npm audit --audit-level=high || true
    
    print_success "Security audit completed"
}

# Function to show logs
show_logs() {
    print_status "Showing application logs..."
    docker-compose logs -f
}

# Function to stop services
stop_services() {
    print_status "Stopping services..."
    docker-compose down -v
    print_success "Services stopped"
}

# Function to cleanup
cleanup() {
    print_status "Cleaning up..."
    docker-compose down -v
    docker system prune -f
    print_success "Cleanup completed"
}

# Function to show help
show_help() {
    echo "DevSecOps Platform Deployment Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  deploy    - Deploy the complete platform (default)"
    echo "  stop      - Stop all services"
    echo "  restart   - Restart all services"
    echo "  logs      - Show application logs"
    echo "  audit     - Run security audit"
    echo "  cleanup   - Stop services and cleanup Docker resources"
    echo "  help      - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                # Deploy the platform"
    echo "  $0 deploy         # Deploy the platform"
    echo "  $0 logs           # Show logs"
    echo "  $0 stop           # Stop services"
    echo ""
}

# Main deployment function
main_deploy() {
    echo "🛡️  DevSecOps Platform Deployment"
    echo "=================================="
    echo ""
    
    check_docker
    check_ports
    setup_env
    deploy_services
    wait_for_services
    show_access_info
    
    print_success "Deployment completed successfully!"
    print_warning "Remember: This platform contains intentional vulnerabilities for educational purposes"
}

# Handle command line arguments
case "${1:-deploy}" in
    "deploy")
        main_deploy
        ;;
    "stop")
        stop_services
        ;;
    "restart")
        stop_services
        sleep 2
        main_deploy
        ;;
    "logs")
        show_logs
        ;;
    "audit")
        security_audit
        ;;
    "cleanup")
        cleanup
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac 