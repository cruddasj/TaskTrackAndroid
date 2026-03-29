import re

with open("src/screens/TodaysTasksScreen.tsx", "r") as f:
    content = f.read()

# Remove the specific card
new_content = re.sub(
    r"<Card>\s*<CardContent>\s*<Stack[^>]*>\s*<Box>\s*<Typography[^>]*>Today&apos;s task list</Typography>.*?</Stack>\s*</CardContent>\s*</Card>",
    "",
    content,
    flags=re.DOTALL
)

# Remove unused variables if needed
new_content = re.sub(
    r"const remainingTodayTasks = useMemo.*?;\n\n",
    "",
    new_content,
    flags=re.DOTALL
)

with open("src/screens/TodaysTasksScreen.tsx", "w") as f:
    f.write(new_content)
