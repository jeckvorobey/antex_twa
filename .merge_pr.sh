#!/bin/bash
cd /root/develop/antex_twa

# Extract token from gh config
TOKEN=$(grep 'oauth_token:' /root/.config/gh/hosts.yml | tail -1 | sed 's/.*oauth_token: //')

# Set token for gh CLI
export GH_TOKEN="$TOKEN"

# Merge PR #3
gh pr merge 3 --merge --admin

# Verify main updated
echo "---MAIN CHECK---"
git fetch origin
git log --oneline origin/main -3
