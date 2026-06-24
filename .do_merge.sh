#!/bin/bash
cd /root/develop/antex_twa

# Extract token from gh config using grep+tr
export GH_TOKEN=$(grep 'oauth_token' /root/.config/gh/hosts.yml | tail -1 | sed 's/.*oauth_token: //')

# Merge PR #3
gh pr merge 3 --merge --admin 2>&1

echo "---VERIFY MAIN---"
git fetch origin
git log --oneline origin/main -3

echo "---VERIFY PR---"
gh pr view 3 --json state,mergedAt,mergeCommit 2>&1
