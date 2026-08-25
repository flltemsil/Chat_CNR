import re

with open("App.tsx", "r") as f:
    text = f.read()

text = text.replace("user?.photoURL", "user?.photoUrl")
text = text.replace("user.photoURL", "user.photoUrl")

with open("App.tsx", "w") as f:
    f.write(text)

