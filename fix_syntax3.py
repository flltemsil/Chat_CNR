import re

with open("App.tsx", "r") as f:
    text = f.read()

text = text.replace("Code,, Activity", "Code, Activity")

with open("App.tsx", "w") as f:
    f.write(text)

