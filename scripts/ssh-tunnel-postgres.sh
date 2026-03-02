#!/bin/bash
# SSH Tunnel for PostgreSQL connection to remote server
# Run this in a separate terminal window before starting the app

echo "Creating SSH tunnel to PostgreSQL..."
ssh -L 5432:10.0.1.3:5432 root@152.53.142.222 -N

echo "SSH tunnel closed."
