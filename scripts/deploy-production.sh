#!/bin/bash

# WhatsApp API Bridge - Production Deployment Script
# ==================================================
# 
# This script manages deployment to production environment with Redis caching feature flag.
# Supports deployment, monitoring, rollback capabilities, and image tagging with git SHA.

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.prod.yml"
ENV_FILE="${ENV_FILE:-/opt/whatsapi-bridge/.env.production}"
DEPLOY_DIR="/opt/whatsapi-bridge"

# Default values
REDIS_ENABLED="${REDIS_ENABLED:-true}"
DEPLOYMENT_MODE="${DEPLOYMENT_MODE:-deploy}"
HEALTH_CHECK_TIMEOUT="${HEALTH_CHECK_TIMEOUT:-300}"

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
    cat <<EOF
WhatsApp API Bridge - Production Deployment Script

Usage: $0 [OPTIONS] COMMAND

Commands:
    deploy      Deploy to production with Redis enabled
    rollback    Rollback to previous version or disable Redis  
    status      Check current deployment status
    logs        Show application logs
    cleanup     Clean up production environment
    build       Build and tag image with git SHA

Options:
    --redis-enabled=BOOL    Enable/disable Redis (default: true)
    --git-sha=SHA          Use specific git SHA for tagging (default: current HEAD)
    --previous-tag=TAG     Rollback to specific image tag
    --help                 Show this help message

Examples:
    $0 build                              # Build and tag with current git SHA
    $0 deploy                             # Deploy with Redis enabled
    $0 deploy --redis-enabled=false       # Deploy with Redis disabled
    $0 rollback                           # Quick rollback (disables Redis)
    $0 rollback --previous-tag=abc123     # Rollback to specific version
    $0 status                             # Check deployment status

Environment Variables:
    REDIS_ENABLED           Enable/disable Redis caching (true/false)
    API_KEY                 API key for the application
    REDIS_PASSWORD          Redis password (required in production)
    POSTGRES_PASSWORD       PostgreSQL password (if using database)
    ENV_FILE               Path to environment file (default: /opt/whatsapi-bridge/.env.production)
EOF
}

# Function to get current git SHA
get_git_sha() {
    local git_sha="${GIT_SHA:-}"
    
    if [[ -z "$git_sha" ]]; then
        if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
            git_sha=$(git rev-parse --short HEAD)
        else
            log_error "Not in a git repository and GIT_SHA not provided"
            exit 1
        fi
    fi
    
    echo "$git_sha"
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
    
    # Create deploy directory if it doesn't exist
    if [[ ! -d "$DEPLOY_DIR" ]]; then
        log_info "Creating deployment directory: $DEPLOY_DIR"
        sudo mkdir -p "$DEPLOY_DIR"/{logs,config,data/{redis,postgres}}
        sudo chown -R $(whoami):$(whoami) "$DEPLOY_DIR"
    fi
    
    # Check if required environment variables are set
    if [[ -z "${API_KEY:-}" ]]; then
        log_error "API_KEY environment variable is required for production"
        exit 1
    fi
    
    if [[ -z "${REDIS_PASSWORD:-}" ]] && [[ "$REDIS_ENABLED" == "true" ]]; then
        log_error "REDIS_PASSWORD environment variable is required when Redis is enabled"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Function to build and tag Docker image
build_and_tag_image() {
    local git_sha="${1:-$(get_git_sha)}"
    local image_tag="whatsapi-bridge:$git_sha"
    
    log_info "Building Docker image with tag: $image_tag"
    
    cd "$PROJECT_ROOT"
    
    # Build with git SHA tag
    if docker build -t "$image_tag" -t "whatsapi-bridge:latest" .; then
        log_success "Docker image built and tagged: $image_tag"
        
        # Save current tag for rollback
        echo "$image_tag" > "$DEPLOY_DIR/current-image.txt"
        
        # Keep previous tag for rollback
        if [[ -f "$DEPLOY_DIR/current-image.txt" ]]; then
            local current_tag=$(cat "$DEPLOY_DIR/current-image.txt" 2>/dev/null || echo "")
            if [[ -n "$current_tag" && "$current_tag" != "$image_tag" ]]; then
                echo "$current_tag" > "$DEPLOY_DIR/previous-image.txt"
                log_info "Previous image tag saved: $current_tag"
            fi
        fi
        
        return 0
    else
        log_error "Failed to build Docker image"
        exit 1
    fi
}

# Function to deploy application
deploy() {
    local redis_enabled=$1
    local image_tag="${2:-whatsapi-bridge:latest}"
    
    log_info "Deploying to production environment..."
    log_info "Redis enabled: $redis_enabled"
    log_info "Image tag: $image_tag"
    
    # Set environment variables
    export REDIS_ENABLED=$redis_enabled
    export NODE_ENV=production
    
    # Update compose file with specific image tag
    if [[ "$image_tag" != "whatsapi-bridge:latest" ]]; then
        sed -i.bak "s|image: whatsapi-bridge:latest|image: $image_tag|" "$COMPOSE_FILE"
    fi
    
    # Stop existing containers gracefully
    log_info "Stopping existing containers..."
    docker-compose -f "$COMPOSE_FILE" down --timeout 30 || true
    
    # Start services
    log_info "Starting services..."
    if docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d; then
        log_success "Services started successfully"
        
        # Restore compose file if modified
        if [[ -f "$COMPOSE_FILE.bak" ]]; then
            mv "$COMPOSE_FILE.bak" "$COMPOSE_FILE"
        fi
    else
        log_error "Failed to start services"
        
        # Restore compose file if modified
        if [[ -f "$COMPOSE_FILE.bak" ]]; then
            mv "$COMPOSE_FILE.bak" "$COMPOSE_FILE"
        fi
        exit 1
    fi
    
    # Wait for services to be ready
    wait_for_services
    
    # Save deployment info
    cat > "$DEPLOY_DIR/deployment-info.txt" << EOF
Deployment Date: $(date)
Image Tag: $image_tag
Redis Enabled: $redis_enabled
Git SHA: $(get_git_sha 2>/dev/null || echo "unknown")
Node Environment: production
EOF
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
        sleep 10
        count=$((count + 10))
    done
    
    log_error "Application failed to become healthy within $timeout seconds"
    show_container_logs
    exit 1
}

# Function to check application health
check_application_health() {
    local api_url="http://localhost:3000"
    local api_key="${API_KEY}"
    
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
    docker-compose -f "$COMPOSE_FILE" logs --tail=20 redis-prod || true
}

# Function to check deployment status
check_status() {
    log_info "Checking deployment status..."
    
    # Check if containers are running
    echo "Container Status:"
    docker-compose -f "$COMPOSE_FILE" ps
    
    echo -e "\nContainer Health:"
    docker-compose -f "$COMPOSE_FILE" exec -T whatsapp-api curl -s -f -H "x-api-key: ${API_KEY}" http://localhost:3000/health || echo "Health check failed"
    
    if [[ "$REDIS_ENABLED" == "true" ]]; then
        echo -e "\nRedis Status:"
        docker-compose -f "$COMPOSE_FILE" exec -T redis-prod redis-cli ping || echo "Redis connection failed"
        
        echo -e "\nRedis Memory Usage:"
        docker-compose -f "$COMPOSE_FILE" exec -T redis-prod redis-cli info memory | grep -E "used_memory_human|used_memory_peak_human" || true
    fi
    
    # Show deployment info
    if [[ -f "$DEPLOY_DIR/deployment-info.txt" ]]; then
        echo -e "\nDeployment Information:"
        cat "$DEPLOY_DIR/deployment-info.txt"
    fi
}

# Function to perform rollback
rollback() {
    local previous_tag="${PREVIOUS_TAG:-}"
    
    if [[ -z "$previous_tag" ]]; then
        if [[ -f "$DEPLOY_DIR/previous-image.txt" ]]; then
            previous_tag=$(cat "$DEPLOY_DIR/previous-image.txt")
        fi
    fi
    
    if [[ -n "$previous_tag" ]]; then
        log_warning "Initiating rollback to previous version: $previous_tag"
        deploy "true" "$previous_tag"
        log_success "Rollback to $previous_tag completed"
    else
        log_warning "No previous version found. Initiating rollback - disabling Redis caching..."
        deploy "false"
        log_success "Rollback completed - Redis caching is now disabled"
        log_info "Application is running without Redis caching"
    fi
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

# Function to cleanup production environment
cleanup() {
    log_warning "This will stop and remove all production containers and volumes!"
    read -p "Are you sure you want to continue? (y/N): " confirm
    
    if [[ "$confirm" =~ ^[Yy]$ ]]; then
        log_warning "Cleaning up production environment..."
        
        # Stop and remove containers
        docker-compose -f "$COMPOSE_FILE" down --volumes --remove-orphans
        
        # Remove images
        docker rmi whatsapi-bridge:latest 2>/dev/null || true
        
        # Remove deployment info
        rm -f "$DEPLOY_DIR/deployment-info.txt"
        rm -f "$DEPLOY_DIR/current-image.txt"
        rm -f "$DEPLOY_DIR/previous-image.txt"
        
        log_success "Cleanup completed"
    else
        log_info "Cleanup cancelled"
    fi
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
            --git-sha=*)
                GIT_SHA="${1#*=}"
                shift
                ;;
            --previous-tag=*)
                PREVIOUS_TAG="${1#*=}"
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
    
    log_info "WhatsApp API Bridge - Production Deployment"
    log_info "============================================="
    log_info "Mode: $DEPLOYMENT_MODE"
    log_info "Redis Enabled: $REDIS_ENABLED"
    
    check_prerequisites
    
    case $DEPLOYMENT_MODE in
        "build")
            local git_sha="${GIT_SHA:-$(get_git_sha)}"
            build_and_tag_image "$git_sha"
            log_success "Build completed successfully"
            ;;
            
        "deploy")
            local git_sha="${GIT_SHA:-$(get_git_sha)}"
            build_and_tag_image "$git_sha"
            deploy "$REDIS_ENABLED" "whatsapi-bridge:$git_sha"
            log_success "Deployment completed successfully"
            ;;
            
        "rollback")
            rollback
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
