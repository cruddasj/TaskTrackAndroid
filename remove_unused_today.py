import re

with open("src/screens/TodaysTasksScreen.tsx", "r") as f:
    content = f.read()

content = content.replace("import { useEffect, useMemo, useState } from 'react';", "import { useEffect, useState } from 'react';")
content = content.replace("  const navigate = useNavigate();\n", "")

with open("src/screens/TodaysTasksScreen.tsx", "w") as f:
    f.write(content)
