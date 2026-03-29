import re

with open("src/screens/RoundsScreen.tsx", "r") as f:
    content = f.read()

# Replace the condition for the "Enter Focus Mode" button
content = content.replace(
    "{round.status === 'active' && (",
    "{round.status === 'active' && round.taskIds.length > 0 && ("
)

with open("src/screens/RoundsScreen.tsx", "w") as f:
    f.write(content)
