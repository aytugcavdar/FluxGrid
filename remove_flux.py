import re

# Read the file
with open('src/features/game/constants/index.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove all fluxReward properties using regex
content = re.sub(r', fluxReward: \d+', '', content)

# Write back
with open('src/features/game/constants/index.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Removed all fluxReward properties")
