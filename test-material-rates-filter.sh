#!/bin/bash

# Test the material-rates API with EntryType filter

BASE_URL="http://localhost:3000/api"

echo "=== MATERIAL RATES API WITH ENTRY TYPE FILTER TESTS ==="
echo

# First, let's login to get an auth token
echo "1. Logging in as admin to get auth token..."
LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "suresh_owner", "password": "password123"}')

echo "Login response: $LOGIN_RESPONSE"
echo

# Extract token from response (assuming JSON format with "token" field)
TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    if 'data' in data and 'token' in data['data']:
        print(data['data']['token'])
    else:
        print('NO_TOKEN')
except:
    print('NO_TOKEN')
")

if [ "$TOKEN" = "NO_TOKEN" ]; then
    echo "❌ Failed to get authentication token"
    exit 1
fi

echo "✅ Got auth token: ${TOKEN:0:20}..."
echo

# Test 2: Get ALL material rates (no filter)
echo "2. Testing GET /material-rates (no filter - should return all)"
curl -s "${BASE_URL}/material-rates" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | \
  python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    if data.get('success'):
        rates = data.get('data', [])
        print(f'✅ Found {len(rates)} total material rates')
        for i, rate in enumerate(rates[:3]):  # Show first 3
            print(f'   {i+1}. {rate.get(\"materialType\")} - ₹{rate.get(\"ratePerUnit\")}/unit')
        if len(rates) > 3:
            print(f'   ... and {len(rates) - 3} more')
    else:
        print(f'❌ Error: {data.get(\"message\", \"Unknown error\")}')
except Exception as e:
    print(f'❌ Failed to parse response: {e}')
"
echo
echo "---"

# Test 3: Get material rates for Sales entry type
echo "3. Testing GET /material-rates?entryType=Sales"
curl -s "${BASE_URL}/material-rates?entryType=Sales" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | \
  python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    if data.get('success'):
        rates = data.get('data', [])
        print(f'✅ Found {len(rates)} Sales material rates')
        for i, rate in enumerate(rates):
            print(f'   {i+1}. {rate.get(\"materialType\")} - ₹{rate.get(\"ratePerUnit\")}/unit')
    else:
        print(f'❌ Error: {data.get(\"message\", \"Unknown error\")}')
except Exception as e:
    print(f'❌ Failed to parse response: {e}')
"
echo
echo "---"

# Test 4: Get material rates for RawStone entry type
echo "4. Testing GET /material-rates?entryType=RawStone"
curl -s "${BASE_URL}/material-rates?entryType=RawStone" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | \
  python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    if data.get('success'):
        rates = data.get('data', [])
        print(f'✅ Found {len(rates)} RawStone material rates')
        for i, rate in enumerate(rates):
            print(f'   {i+1}. {rate.get(\"materialType\")} - ₹{rate.get(\"ratePerUnit\")}/unit')
    else:
        print(f'❌ Error: {data.get(\"message\", \"Unknown error\")}')
except Exception as e:
    print(f'❌ Failed to parse response: {e}')
"
echo
echo "---"

# Test 5: Test with invalid entry type
echo "5. Testing GET /material-rates?entryType=InvalidType (should fail)"
curl -s "${BASE_URL}/material-rates?entryType=InvalidType" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | \
  python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    if not data.get('success'):
        print(f'✅ Correctly rejected invalid entry type: {data.get(\"message\")}')
    else:
        print('❌ Should have rejected invalid entry type')
except Exception as e:
    print(f'❌ Failed to parse response: {e}')
"

echo
echo "=== TESTS COMPLETED ==="
echo "Expected behavior:"
echo "- No filter: Returns all material rates (9 total)"
echo "- entryType=Sales: Returns only Sales materials (8 items)"  
echo "- entryType=RawStone: Returns only RawStone materials (1 item)"
echo "- Invalid entryType: Returns error message"
