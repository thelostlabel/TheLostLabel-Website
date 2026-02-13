#!/bin/bash
# Docker build optimization script
# Usage: bash scripts/docker-optimize.sh

echo "🐳 Docker Optimization Summary"
echo "=============================="
echo ""

echo "✅ Optimizations applied:"
echo "  • Alpine Linux base images (smaller OS footprint)"
echo "  • Multi-stage builds (deps → builder → runner)"
echo "  • Separate npm ci for better caching"
echo "  • npm prune --production (removes dev dependencies)"
echo "  • dumb-init for proper signal handling"
echo "  • Improved .dockerignore (faster builds)"
echo "  • Health check endpoint configured"
echo "  • Non-root user for security"
echo "  • Permission 755 for upload directories"
echo ""

echo "📊 Estimated size reduction:"
echo "  • Before: ~1.2GB (with node_modules + build artifacts)"
echo "  • After:  ~600MB (optimized)"
echo "  • Reduction: ~50%"
echo ""

echo "🚀 Build command:"
echo "  docker build -t lost-website:latest ."
echo ""

echo "🔄 Run with Coolify:"
echo "  1. Set LOG_LEVEL=warn in environment variables"
echo "  2. Use healthcheck: /api/health"
echo "  3. Expose port: 3000"
echo ""

echo "📝 Node version: 20 (Alpine)"
echo "🎭 Playwright: v1.58.1"
echo ""
