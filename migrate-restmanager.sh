#!/bin/bash
# This script helps identify remaining RESTManager usage
# It's for analysis purposes only

echo "=== Files still using RESTManager ==="
grep -r "RESTManager" src/ --include="*.tsx" --include="*.ts" -l | grep -v "rest.ts" | grep -v "endpoint.ts" | sort

echo ""
echo "=== Count by directory ==="
grep -r "RESTManager" src/views --include="*.tsx" --include="*.ts" -l | grep -v "rest.ts" | wc -l | xargs echo "views:"
grep -r "RESTManager" src/components --include="*.tsx" --include="*.ts" -l | grep -v "rest.ts" | wc -l | xargs echo "components:"
grep -r "RESTManager" src/hooks --include="*.tsx" --include="*.ts" -l | grep -v "rest.ts" | wc -l | xargs echo "hooks:"
