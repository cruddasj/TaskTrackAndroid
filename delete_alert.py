import re

with open("src/components/AppShell.tsx", "r") as f:
    content = f.read()

# Remove the specific alert
new_content = re.sub(
    r"\s*\{alarmActive && \(\s*<Box px=\{\{ xs: 2, md: 4 \}\} pb=\{2\}>\s*<Alert severity=\"warning\" action=\{<Button onClick=\{dismissAlarm\}>Dismiss</Button>\}>\s*Pomodoro alarm is active\.\s*</Alert>\s*</Box>\s*\)\}",
    "",
    content,
    flags=re.DOTALL
)

# Remove alarmActive and dismissAlarm from destructuring
new_content = re.sub(
    r"const \{ state, alarmActive, dismissAlarm, successMessage, clearSuccessMessage \} = useAppState\(\);",
    "const { state, successMessage, clearSuccessMessage } = useAppState();",
    new_content,
)

# Remove Alert import if it's the only usage (it isn't used anywhere else in AppShell)
if "<Alert" not in new_content:
    new_content = re.sub(r"Alert, ", "", new_content)

with open("src/components/AppShell.tsx", "w") as f:
    f.write(new_content)
