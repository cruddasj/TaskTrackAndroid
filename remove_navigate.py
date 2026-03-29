with open("src/screens/TodaysTasksScreen.tsx", "r") as f:
    content = f.read()

content = content.replace("import { useNavigate } from 'react-router-dom';\n", "")

with open("src/screens/TodaysTasksScreen.tsx", "w") as f:
    f.write(content)
