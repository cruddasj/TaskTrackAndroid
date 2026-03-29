import re

with open("src/screens/RoundsScreen.tsx", "r") as f:
    content = f.read()

# Instead of injecting a self-executing function, let's just create a variable outside the dialog content mapping
# Let's find the start of the return statement
return_start = content.find("  return (")

available_tasks_code = """  const availableTasks = useMemo(() => {
    return state.tasks.filter((task) => !task.roundId || task.roundId === editingRound?.id);
  }, [state.tasks, editingRound]);

"""

content = content[:return_start] + available_tasks_code + content[return_start:]

# Now replace state.tasks.map with availableTasks.map inside the dialog
dialog_tasks_start = content.find("            {state.tasks.map((task) => (")
dialog_tasks_end = dialog_tasks_start + len("            {state.tasks.map((task) => (")

replacement_map = """            {availableTasks.length === 0 && state.tasks.length > 0 && (
              <Typography color="text.secondary">All tasks are currently assigned to other rounds.</Typography>
            )}
            {availableTasks.map((task) => ("""

content = content[:dialog_tasks_start] + replacement_map + content[dialog_tasks_end:]

with open("src/screens/RoundsScreen.tsx", "w") as f:
    f.write(content)
