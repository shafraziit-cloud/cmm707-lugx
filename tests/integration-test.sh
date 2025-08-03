#!/bin/bash
set -e

echo "=== Running Integration Tests ==="

# 1. Test Game Service
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/games || true)
if [ "$STATUS" -eq 200 ]; then
    echo "Game Service endpoint OK"
else
    echo "Game Service endpoint FAILED (status: $STATUS)"
    exit 1
fi

# 2. Test Order Service
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/orders || true)
if [ "$STATUS" -eq 200 ]; then
    echo "Order Service endpoint OK"
else
    echo "Order Service endpoint FAILED (status: $STATUS)"
    exit 1
fi

# 3. Test Analytics Service
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/analytics || true)
if [ "$STATUS" -eq 200 ]; then
    echo "Analytics Service endpoint OK"
else
    echo "Analytics Service endpoint FAILED (status: $STATUS)"
    exit 1
fi

echo "=== All Integration Tests Passed Successfully ==="
