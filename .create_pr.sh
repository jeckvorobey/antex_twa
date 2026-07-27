#!/bin/bash
cd /root/develop/antex_twa

# Extract token from gh config
TOKEN=$(sed -n 's/.*oauth_token: *//p' /root/.config/gh/hosts.yml | head -1)

# Set token for gh CLI
export GH_TOKEN="$TOKEN"

# Create PR
gh pr create \
  --head dev \
  --base main \
  --title "fix(exchange): validation and UX improvements for exchange form" \
  --body-file .gh_pr_body.md

# Cleanup
rm -f .gh_pr_body.md
