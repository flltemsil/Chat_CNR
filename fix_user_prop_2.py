import re

with open("App.tsx", "r") as f:
    text = f.read()

text = text.replace("user?.photoUrl", "user?.photo")
text = text.replace("user.photoUrl", "user.photo")

with open("App.tsx", "w") as f:
    f.write(text)

