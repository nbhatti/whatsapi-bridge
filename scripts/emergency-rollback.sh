#!/bin/bash

# WhatsApp API Bridge - Emergency Rollback Script
# ===============================================
# 
# Quick rollback script for emergency situations
# Disables Redis and rolls back to previous image or stable version

set -euo pipefail

# Configuration
COMPOSE_FILE="docker-compose.prod.yml"
DEPLOY_DIR="/opt/whatsapi-bridge"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${YELLOW}[EMERGENCY]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Show usage
if [[ "${1:-}" == "--help" ]] || [[ "${1:-}" == "-h" ]]; then
    cat <<EOF
Emergency Rollback Script

Usage: $0 [OPTIONS]

Options:
    --disable-redis-only    Only disable Redis, don't change image
    --previous-image       Use previous image tag
    --help, -h             Show this help

This script performs emergency rollback procedures:
1. Stops current containers
2. Disables Redis caching (--redis-enabled=false)
3. Optionally rolls back to previous image
4. Starts services with stable configuration

EOF
    exit 0
fi

main() {
    log_info "=== EMERGENCY ROLLBACK INITIATED ==="
    
    # Determine rollback strategy
    local disable_redis_only="${1:-false}"
    local use_previous_image="${2:-true}"
    
    # Parse arguments
    case "${1:-}" in
        --disable-redis-only)
            disable_redis_only="true"
            use_previous_image="false"
            ;;
        --previous-image)
            disable_redis_only="false"
            use_previous_image="true"
            ;;
    esac
    
    log_info "Strategy: disable_redis_only=$disable_redis_only, use_previous_image=$use_previous_image"
    
    # Stop current deployment
    log_info "Stopping current deployment..."
    docker-compose -f "$COMPOSE_FILE" down --timeout 10 || true
    
    # Set safe environment
    export REDIS_ENABLED=false
    export NODE_ENV=production
    
    # Determine image to use
    local image_to_use="whatsapi-bridge:latest"
    
    if [[ "$use_previous_image" == "true" ]] && [[ -f "$DEPLOY_DIR/previous-image.txt" ]]; then
        local previous_image=$(cat "$DEPLOY_DIR/previous-image.txt" 2>/dev/null || echo "")
        if [[ -n "$previous_image" ]]; then
            image_to_use="$previous_image"
            log_info "Using previous image: $image_to_use"
        else
            log_info "No previous image found, using latest"
        fi
    fi
    
    # Update compose file temporarily if needed
    local compose_backup=""
    if [[ "$image_to_use" != "whatsapi-bridge:latest" ]]; then
        compose_backup="$COMPOSE_FILE.emergency.bak"
        cp "$COMPOSE_FILE" "$compose_backup"
        sed -i "s|image: whatsapi-bridge:latest|image: $image_to_use|" "$COMPOSE_FILE"
        log_info "Updated compose file to use: $image_to_use"
    fi
    
    # Start with safe configuration
    log_info "Starting services with Redis disabled..."
    
    if docker-compose -f "$COMPOSE_FILE" up -d whatsapp-api; then
        log_success "Application started successfully with Redis disabled"
        
        # Wait a moment and check health
        sleep 10
        
        if curl -s -f -H "x-api-key: ${API_KEY:-emergency-key}" http://localhost:3000/health >/dev/null 2>&1; then
            log_success "Application health check passed"
        else
            log_error "Application health check failed - check logs"
        fi
        
    else
        log_error "Failed to start application"
        
        # Restore compose file if modified
        if [[ -n "$compose_backup" && -f "$compose_backup" ]]; then
            mv "$compose_backup" "$COMPOSE_FILE"
        fi
        exit 1
    fi
    
    # Restore compose file if modified
    if [[ -n "$compose_backup" && -f "$compose_backup" ]]; then
        mv "$compose_backup" "$COMPOSE_FILE"
        log_info "Compose file restored"
    fi
    
    # Log the emergency rollback
    local rollback_info="$DEPLOY_DIR/emergency-rollback.log"
    cat >> "$rollback_info" <<EOF
=== EMERGENCY ROLLBACK ===
Timestamp: $(date)
Image Used: $image_to_use
Redis Disabled: true
Reason: Emergency rollback procedure
Status: Success
========================

EOF
    
    log_success "=== EMERGENCY ROLLBACK COMPLETED ==="
    log_info "Application is running in safe mode (Redis disabled)"
    log_info "Check logs: docker-compose -f $COMPOSE_FILE logs whatsapp-api"
    log_info "Rollback logged to: $rollback_info"
}

# Run main function
main "$@"
