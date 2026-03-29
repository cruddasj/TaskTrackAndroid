import re

with open("src/screens/TodaysTasksScreen.tsx", "r") as f:
    content = f.read()

# I accidentally left an open <Card>, <CardContent>, <Stack> and <Box> block
content = content.replace("""      <Card>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1.5}>
            <Box>

      {state.tasks.map((task) => (""", """      {state.tasks.map((task) => (""")

with open("src/screens/TodaysTasksScreen.tsx", "w") as f:
    f.write(content)
