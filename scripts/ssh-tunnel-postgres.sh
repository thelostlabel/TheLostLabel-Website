#!/bin/bash
# SSH Tunnel for PostgreSQL connection to remote server
# Run this in a separate terminal window before starting the app
#
# Environment variables:
#   SSH_HOST - SSH connection string (default: root@152.53.142.222)
#   DB_HOST  - Database host IP (default: 10.0.1.3)

# Set default values
SSH_HOST="${SSH_HOST:-root@152.53.142.222}"
DB_HOST="${DB_HOST:-10.0.1.3}"

echo "Creating SSH tunnel to PostgreSQL..."
ssh -L 5432:${DB_HOST}:5432 ${SSH_HOST} -N

echo "SSH tunnel closed."
