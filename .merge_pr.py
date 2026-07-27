import subprocess, re, os

# Read token from gh config
with open('/root/.config/gh/hosts.yml') as f:
    content = f.read()
token = re.search(r'oauth_token:\s*(\S+)', content).group(1)

env = os.environ.copy()
env['GH_TOKEN'] = token

# Merge PR #3
result = subprocess.run(
    ['gh', 'pr', 'merge', '3', '--merge', '--admin'],
    capture_output=True, text=True, env=env, cwd='/root/develop/antex_twa'
)
print("MERGE STDOUT:", result.stdout)
print("MERGE STDERR:", result.stderr)
print("MERGE EXIT:", result.returncode)

# Verify
result2 = subprocess.run(
    ['git', 'fetch', 'origin'],
    capture_output=True, text=True, cwd='/root/develop/antex_twa'
)

result3 = subprocess.run(
    ['git', 'log', '--oneline', 'origin/main', '-3'],
    capture_output=True, text=True, cwd='/root/develop/antex_twa'
)
print("\nMAIN LOG:")
print(result3.stdout)

result4 = subprocess.run(
    ['gh', 'pr', 'view', '3', '--json', 'state,mergedAt,mergeCommit,number,url'],
    capture_output=True, text=True, env=env, cwd='/root/develop/antex_twa'
)
print("\nPR STATUS:")
print(result4.stdout)
if result4.stderr:
    print(result4.stderr)
