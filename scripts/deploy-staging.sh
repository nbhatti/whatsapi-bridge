#!/bin/bash

# WhatsApp API Bridge - Staging Deployment Script
# ================================================
# 
# This script manages deployment to staging environment with Redis caching feature flag.
# Supports deployment, monitoring, and automated rollback capabilities.

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
STAGING_DIR="$PROJECT_ROOT/config/staging"
COMPOSE_FILE="$STAGING_DIR/docker-compose.staging.yml"
ENV_FILE="$STAGING_DIR/.env.staging"

# Default values
REDIS_ENABLED="${REDIS_ENABLED:-true}"
DEPLOYMENT_MODE="${DEPLOYMENT_MODE:-deploy}"
MONITOR_DURATION="${MONITOR_DURATION:-300}" # 5 minutes
HEALTH_CHECK_TIMEOUT="${HEALTH_CHECK_TIMEOUT:-120}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    cat << EOF
WhatsApp API Bridge - Staging Deployment Script

Usage: $0 [OPTIONS] COMMAND

Commands:
    deploy      Deploy to staging with Redis enabled
    rollback    Deploy to staging with Redis disabled  
    monitor     Start monitoring without deployment
    status      Check current deployment status
    logs        Show application logs
    cleanup     Clean up staging environment

Options:
    --redis-enabled=BOOL    Enable/disable Redis (default: true)
    --monitor-duration=SEC  Monitoring duration in seconds (default: 300)
    --help                  Show this help message

Examples:
    $0 deploy                           # Deploy with Redis enabled
    $0 deploy --redis-enabled=false     # Deploy with Redis disabled
    $0 rollback                         # Quick rollback (disables Redis)
    $0 monitor --monitor-duration=600   # Monitor for 10 minutes
    $0 status                           # Check deployment status

Environment Variables:
    REDIS_ENABLED           Enable/disable Redis caching (true/false)
    API_KEY                 API key for the application
    REDIS_PASSWORD          Redis password (optional)
    ALERT_WEBHOOK_URL       Webhook URL for alerts (optional)
    GRAFANA_PASSWORD        Grafana admin password
EOF
}

# Function to check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker is not running or not accessible"
        exit 1
    fi
    
    # Check if docker-compose is available
    if ! command -v docker-compose >/dev/null 2>&1; then
        log_error "docker-compose is not installed"
        exit 1
    fi
    
    # Check if required files exist
    if [[ ! -f "$COMPOSE_FILE" ]]; then
        log_error "Docker compose file not found: $COMPOSE_FILE"
        exit 1
    fi
    
    if [[ ! -f "$ENV_FILE" ]]; then
        log_error "Environment file not found: $ENV_FILE"
        exit 1
    fi
    
    # Check if required environment variables are set
    if [[ -z "${API_KEY:-}" ]]; then
        log_warning "API_KEY environment variable is not set"
    fi
    
    log_success "Prerequisites check passed"
}

# Function to build Docker image
build_image() {
    log_info "Building Docker image..."
    
    cd "$PROJECT_ROOT"
    
    # Build with staging tag
    if docker build -t whatsapi-bridge:staging .; then
        log_success "Docker image built successfully"
    else
        log_error "Failed to build Docker image"
        exit 1
    fi
}

# Function to deploy application
deploy() {
    local redis_enabled=$1
    
    log_info "Deploying to staging environment..."
    log_info "Redis enabled: $redis_enabled"
    
    # Set environment variables
    export REDIS_ENABLED=$redis_enabled
    export NODE_ENV=staging
    
    # Stop existing containers
    log_info "Stopping existing containers..."
    docker-compose -f "$COMPOSE_FILE" down --remove-orphans || true
    
    # Start services
    log_info "Starting services..."
    if docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d; then
        log_success "Services started successfully"
    else
        log_error "Failed to start services"
        exit 1
    fi
    
    # Wait for services to be ready
    wait_for_services
}

# Function to wait for services to be ready
wait_for_services() {
    log_info "Waiting for services to be ready..."
    
    local timeout=$HEALTH_CHECK_TIMEOUT
    local count=0
    
    while [ $count -lt $timeout ]; do
        if check_application_health; then
            log_success "Application is healthy"
            return 0
        fi
        
        log_info "Waiting for application to be ready... ($count/$timeout)"
        sleep 5
        count=$((count + 5))
    done
    
    log_error "Application failed to become healthy within $timeout seconds"
    show_container_logs
    exit 1
}

# Function to check application health
check_application_health() {
    local api_url="http://localhost:3001"
    local api_key="${API_KEY:-staging-api-key}"
    
    if curl -s -f -H "x-api-key: $api_key" "$api_url/health" >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to show container logs
show_container_logs() {
    log_info "Container logs:"
    docker-compose -f "$COMPOSE_FILE" logs --tail=50 whatsapp-api || true
    docker-compose -f "$COMPOSE_FILE" logs --tail=20 redis-staging || true
}

# Function to monitor deployment
start_monitoring() {
    local duration=$1
    
    log_info "Starting monitoring for $duration seconds..."
    
    # Set monitoring environment variables
    export REDIS_URL="redis://localhost:6380"
    export STAGING_API_URL="http://localhost:3001" 
    export MONITOR_INTERVAL_MS=30000
    
    # Start monitoring script in background
    cd "$PROJECT_ROOT"
    timeout $duration ts-node scripts/monitor-staging.ts || {
        local exit_code=$?
        if [ $exit_code -eq 124 ]; then
            log_info "Monitoring completed after $duration seconds"
        else
            log_error "Monitoring failed with exit code: $exit_code"
            return $exit_code
        fi
    }
}

# Function to check deployment status
check_status() {
    log_info "Checking deployment status..."
    
    # Check if containers are running
    echo "Container Status:"
    docker-compose -f "$COMPOSE_FILE" ps
    
    echo -e "\nContainer Health:"
    docker-compose -f "$COMPOSE_FILE" exec whatsapp-api curl -s http://localhost:3000/health || echo "Health check failed"
    
    echo -e "\nRedis Status:"
    docker-compose -f "$COMPOSE_FILE" exec redis-staging redis-cli ping || echo "Redis connection failed"
    
    # Check Redis memory usage
    echo -e "\nRedis Memory Usage:"
    docker-compose -f "$COMPOSE_FILE" exec redis-staging redis-cli info memory | grep -E "used_memory_human|used_memory_peak_human" || true
}

# Function to perform rollback
rollback() {
    log_warning "Initiating rollback - disabling Redis caching..."
    
    # Quick rollback by redeploying with Redis disabled
    deploy "false"
    
    log_success "Rollback completed - Redis caching is now disabled"
    log_info "Application is running without Redis caching"
}

# Function to show logs
show_logs() {
    local service="${1:-whatsapp-api}"
    local follow="${2:-}"
    
    log_info "Showing logs for service: $service"
    
    if [[ "$follow" == "--follow" ]]; then
        docker-compose -f "$COMPOSE_FILE" logs -f "$service"
    else
        docker-compose -f "$COMPOSE_FILE" logs --tail=100 "$service"
    fi
}

# Function to cleanup staging environment
cleanup() {
    log_warning "Cleaning up staging environment..."
    
    # Stop and remove containers
    docker-compose -f "$COMPOSE_FILE" down --volumes --remove-orphans
    
    # Remove staging image
    docker rmi whatsapi-bridge:staging 2>/dev/null || true
    
    # Remove unused volumes
    docker volume prune -f
    
    log_success "Cleanup completed"
}

# Function to validate Redis feature flag
validate_redis_flag() {
    local flag=$1
    
    if [[ "$flag" != "true" && "$flag" != "false" ]]; then
        log_error "Invalid Redis flag value: $flag. Must be 'true' or 'false'"
        exit 1
    fi
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --redis-enabled=*)
                REDIS_ENABLED="${1#*=}"
                validate_redis_flag "$REDIS_ENABLED"
                shift
                ;;
            --monitor-duration=*)
                MONITOR_DURATION="${1#*=}"
                if ! [[ "$MONITOR_DURATION" =~ ^[0-9]+$ ]]; then
                    log_error "Invalid monitor duration: $MONITOR_DURATION"
                    exit 1
                fi
                shift
                ;;
            --help)
                show_usage
                exit 0
                ;;
            -*)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
            *)
                DEPLOYMENT_MODE="$1"
                shift
                ;;
        esac
    done
}

# Main function
main() {
    parse_args "$@"
    
    log_info "WhatsApp API Bridge - Staging Deployment"
    log_info "========================================"
    log_info "Mode: $DEPLOYMENT_MODE"
    log_info "Redis Enabled: $REDIS_ENABLED"
    
    check_prerequisites
    
    case $DEPLOYMENT_MODE in
        "deploy")
            build_image
            deploy "$REDIS_ENABLED"
            log_success "Deployment completed successfully"
            
            # Start monitoring if requested
            if [[ "${MONITOR_AFTER_DEPLOY:-true}" == "true" ]]; then
                start_monitoring "$MONITOR_DURATION"
            fi
            ;;
            
        "rollback")
            rollback
            ;;
            
        "monitor")
            start_monitoring "$MONITOR_DURATION"
            ;;
            
        "status")
            check_status
            ;;
            
        "logs")
            show_logs "${2:-whatsapp-api}" "${3:-}"
            ;;
            
        "cleanup")
            cleanup
            ;;
            
        *)
            log_error "Unknown deployment mode: $DEPLOYMENT_MODE"
            show_usage
            exit 1
            ;;
    esac
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
