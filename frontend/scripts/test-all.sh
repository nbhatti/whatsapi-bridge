#!/bin/bash

# Script to run all test suites
set -e

echo "🚀 Running complete test suite..."

echo ""
echo "📋 Step 1: Running ESLint..."
npm run lint

echo ""
echo "💅 Step 2: Checking Prettier formatting..."
npm run format:check

echo ""
echo "🧪 Step 3: Running unit tests..."
npm run test -- --passWithNoTests

echo ""
echo "🔌 Step 4: Running API tests..."
npm run test:api -- --passWithNoTests

echo ""
echo "🌐 Step 5: Building application..."
npm run build

echo ""
echo "🎭 Step 6: Starting E2E tests..."
echo "Note: Make sure your application is running on localhost:4000"
read -p "Press Enter to continue with E2E tests or Ctrl+C to skip..."

npm run cypress:run

echo ""
echo "✅ All tests completed successfully!"
echo ""
echo "📊 To view test coverage, run: npm run test:coverage"
echo "🐳 To run E2E tests in Docker: docker-compose -f docker-compose.cypress.yml up"
