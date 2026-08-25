import re

with open("App.tsx", "r") as f:
    text = f.read()

text = text.replace(",, Activity", ", Activity")

with open("App.tsx", "w") as f:
    f.write(text)

