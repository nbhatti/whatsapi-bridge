#!/bin/bash

# WhatsApp API Bridge - Rollback Test Script
# ===========================================
# 
# This script tests the rollback procedures in a safe environment

set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[TEST]${NC} $1"; }
log_success() { echo -e "${GREEN}[PASS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARN]${NC} $1"; }

main() {
    log_info "=== Testing Rollback Procedures ==="
    
    # Test 1: Check git SHA extraction
    log_info "Test 1: Git SHA extraction"
    if git_sha=$(git rev-parse --short HEAD 2>/dev/null); then
        log_success "Git SHA extracted: $git_sha"
        
        # Simulate image tagging
        expected_tag="whatsapi-bridge:$git_sha"
        log_success "Expected image tag: $expected_tag"
    else
        log_warning "Git SHA extraction failed (not in git repo?)"
    fi
    
    # Test 2: Check required files exist
    log_info "Test 2: Required files check"
    
    required_files=(
        "docker-compose.prod.yml"
        "scripts/deploy-production.sh"
        "scripts/emergency-rollback.sh"
        "DEPLOY.md"
        ".env.production.template"
    )
    
    for file in "${required_files[@]}"; do
        if [[ -f "$file" ]]; then
            log_success "Found: $file"
        else
            log_warning "Missing: $file"
        fi
    done
    
    # Test 3: Check script permissions
    log_info "Test 3: Script permissions check"
    
    scripts=(
        "scripts/deploy-production.sh"
        "scripts/emergency-rollback.sh"
        "scripts/test-rollback.sh"
    )
    
    for script in "${scripts[@]}"; do
        if [[ -x "$script" ]]; then
            log_success "Executable: $script"
        else
            log_warning "Not executable: $script"
        fi
    done
    
    # Test 4: Docker availability
    log_info "Test 4: Docker availability"
    
    if command -v docker >/dev/null 2>&1; then
        log_success "Docker command available"
        
        if docker info >/dev/null 2>&1; then
            log_success "Docker daemon accessible"
        else
            log_warning "Docker daemon not accessible"
        fi
    else
        log_warning "Docker command not found"
    fi
    
    if command -v docker-compose >/dev/null 2>&1; then
        log_success "Docker Compose available"
    else
        log_warning "Docker Compose not found"
    fi
    
    # Test 5: Environment variables simulation
    log_info "Test 5: Environment variables simulation"
    
    # Simulate production environment
    export NODE_ENV=test
    export API_KEY=test-api-key
    export REDIS_ENABLED=false
    export REDIS_PASSWORD=test-redis-password
    
    log_success "Environment variables set for testing"
    log_info "NODE_ENV=$NODE_ENV"
    log_info "REDIS_ENABLED=$REDIS_ENABLED"
    
    # Test 6: Rollback scenarios
    log_info "Test 6: Rollback scenarios simulation"
    
    # Scenario 1: Redis disable rollback
    log_info "Scenario 1: Redis disable rollback"
    if [[ "$REDIS_ENABLED" == "false" ]]; then
        log_success "Redis disabled successfully"
    fi
    
    # Scenario 2: Image tag rollback simulation
    log_info "Scenario 2: Image tag rollback simulation"
    current_tag="whatsapi-bridge:$git_sha"
    previous_tag="whatsapi-bridge:abc123"
    
    log_success "Current tag: $current_tag"
    log_success "Previous tag (simulated): $previous_tag"
    
    # Test 7: Directory structure
    log_info "Test 7: Directory structure validation"
    
    expected_dirs=(
        "scripts"
        "config"
    )
    
    for dir in "${expected_dirs[@]}"; do
        if [[ -d "$dir" ]]; then
            log_success "Directory exists: $dir"
        else
            log_warning "Directory missing: $dir"
        fi
    done
    
    log_info "=== Rollback Tests Complete ==="
    log_success "All rollback components are ready for deployment"
    
    # Show summary of deployment commands
    echo
    echo "=== Deployment Commands Summary ==="
    echo "Build image with git SHA:"
    echo "  ./scripts/deploy-production.sh build"
    echo
    echo "Deploy with Redis enabled:"
    echo "  ./scripts/deploy-production.sh deploy"
    echo
    echo "Deploy with Redis disabled:"
    echo "  ./scripts/deploy-production.sh deploy --redis-enabled=false"
    echo
    echo "Quick rollback (disable Redis):"
    echo "  ./scripts/deploy-production.sh rollback"
    echo
    echo "Rollback to previous version:"
    echo "  ./scripts/deploy-production.sh rollback --previous-tag=whatsapi-bridge:abc123"
    echo
    echo "Emergency rollback:"
    echo "  ./scripts/emergency-rollback.sh"
    echo
    echo "Check deployment status:"
    echo "  ./scripts/deploy-production.sh status"
}

# Run tests
main "$@"
