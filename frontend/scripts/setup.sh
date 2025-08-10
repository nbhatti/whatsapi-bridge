#!/bin/bash

# WhatsApp Frontend Development Setup Script
# This script helps new developers get started quickly

set -e  # Exit on any error

echo "🚀 WhatsApp Frontend Setup"
echo "=========================="

# Check Node.js version
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18.0.0 or higher."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'.' -f1 | sed 's/v//')
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please install Node.js 18.0.0 or higher."
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Setup environment file
if [ ! -f ".env.local" ]; then
    echo "⚙️  Creating .env.local from template..."
    cp .env.example .env.local
    echo "✅ .env.local created. Please update with your configuration."
else
    echo "✅ .env.local already exists"
fi

# Generate Prisma client
echo "🗃️  Setting up database..."
npx prisma generate
npx prisma db push

echo ""
echo "🎉 Setup Complete!"
echo "==================="
echo ""
echo "Next steps:"
echo "1. Update .env.local with your configuration"
echo "2. Run 'npm run dev' to start development server"
echo "3. Visit http://localhost:4000"
echo ""
echo "Useful commands:"
echo "- npm run dev          # Start development server"
echo "- npm run test         # Run tests"
echo "- npm run lint         # Check code quality"
echo "- npm run create-admin # Create admin user"
echo ""
