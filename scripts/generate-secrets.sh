#!/bin/bash
# Generate strong random secrets for BarbellBeats server.
# Usage: ./scripts/generate-secrets.sh >> server/.env.local
# Never commit the output file to version control.

echo "JWT_SECRET=$(openssl rand -hex 32)"
echo "JWT_REFRESH_SECRET=$(openssl rand -hex 32)"
echo "SESSION_SECRET=$(openssl rand -hex 32)"
