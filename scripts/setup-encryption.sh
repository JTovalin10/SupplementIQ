#!/bin/bash

# =================================================================
# Encryption Setup Script
# =================================================================
# This script helps you set up user data encryption for SupplementIQ
#
# Usage: bash scripts/setup-encryption.sh
# =================================================================

set -e  # Exit on error

echo ""
echo "======================================================================"
echo "🔐  SUPPLEMENTIQ ENCRYPTION SETUP"
echo "======================================================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}⚠️  .env.local not found${NC}"

    if [ -f .env.example ]; then
        echo -e "   Creating .env.local from .env.example..."
        cp .env.example .env.local
        echo -e "${GREEN}   ✅ Created .env.local${NC}"
    else
        echo -e "${RED}   ❌ .env.example not found. Cannot create .env.local${NC}"
        exit 1
    fi
    echo ""
fi

# Check if key already exists
if grep -q "USER_DATA_ENCRYPTION_KEY=" .env.local; then
    echo -e "${YELLOW}⚠️  USER_DATA_ENCRYPTION_KEY already exists in .env.local${NC}"
    echo ""
    read -p "Do you want to generate a NEW key? This will make old encrypted data unreadable! (y/N): " -n 1 -r
    echo ""

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${GREEN}✅ Keeping existing key${NC}"
        SKIP_KEY_GEN=true
    fi
    echo ""
fi

# Generate encryption key if needed
if [ "$SKIP_KEY_GEN" != "true" ]; then
    echo "🔑 Generating encryption key..."

    # Try to use OpenSSL
    if command -v openssl &> /dev/null; then
        ENCRYPTION_KEY=$(openssl rand -hex 32)
        echo -e "${GREEN}✅ Generated key using OpenSSL${NC}"
    # Try Node.js as fallback
    elif command -v node &> /dev/null; then
        ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
        echo -e "${GREEN}✅ Generated key using Node.js${NC}"
    else
        echo -e "${RED}❌ Neither OpenSSL nor Node.js found${NC}"
        echo "   Please install one of them to generate a secure key"
        exit 1
    fi

    echo ""
    echo "Generated key: $ENCRYPTION_KEY"
    echo ""

    # Add or update the key in .env.local
    if grep -q "USER_DATA_ENCRYPTION_KEY=" .env.local; then
        # Replace existing key
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s/USER_DATA_ENCRYPTION_KEY=.*/USER_DATA_ENCRYPTION_KEY=$ENCRYPTION_KEY/" .env.local
        else
            # Linux
            sed -i "s/USER_DATA_ENCRYPTION_KEY=.*/USER_DATA_ENCRYPTION_KEY=$ENCRYPTION_KEY/" .env.local
        fi
        echo -e "${GREEN}✅ Updated USER_DATA_ENCRYPTION_KEY in .env.local${NC}"
    else
        # Add new key
        echo "" >> .env.local
        echo "# User data encryption key (generated $(date -u +"%Y-%m-%d %H:%M:%S UTC"))" >> .env.local
        echo "USER_DATA_ENCRYPTION_KEY=$ENCRYPTION_KEY" >> .env.local
        echo -e "${GREEN}✅ Added USER_DATA_ENCRYPTION_KEY to .env.local${NC}"
    fi
    echo ""
fi

# Check if Node.js is available for testing
if command -v node &> /dev/null; then
    echo "🧪 Running encryption tests..."
    echo ""

    if node scripts/test-encryption.js; then
        echo ""
        echo -e "${GREEN}✅ All encryption tests passed!${NC}"
    else
        echo ""
        echo -e "${RED}❌ Some tests failed. Check the output above.${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  Node.js not found. Skipping tests.${NC}"
fi

echo ""
echo "======================================================================"
echo "📝 NEXT STEPS"
echo "======================================================================"
echo ""
echo "1. Your encryption is now set up! ✅"
echo ""
echo "2. Run the database migration to add salts to existing users:"
echo "   ${YELLOW}psql -h your-db -f Database/supabase/migrations/add_encryption_salt_to_existing_users.sql${NC}"
echo ""
echo "3. Or run via Supabase dashboard:"
echo "   - Go to SQL Editor"
echo "   - Paste contents of the migration file"
echo "   - Execute"
echo ""
echo "4. Use encryption in your app:"
echo "   ${YELLOW}import { encryptUserData, decryptUserData } from '@/lib/utils/userEncryption';${NC}"
echo ""
echo "5. See examples in:"
echo "   - DATABASE_SECURITY_IMPLEMENTATION.md"
echo "   - SECURITY.md"
echo ""
echo "======================================================================"
echo ""
echo -e "${GREEN}🎉 Setup complete!${NC}"
echo ""
