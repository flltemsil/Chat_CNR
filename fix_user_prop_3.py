import re

with open("types.ts", "r") as f:
    types_content = f.read()

if "export interface UserProfile" in types_content:
    types_content = types_content.replace(
        "export interface UserProfile {",
        "export interface UserProfile {\n  photoUrl?: string;"
    )

with open("types.ts", "w") as f:
    f.write(types_content)

with open("App.tsx", "r") as f:
    text = f.read()

text = text.replace("user?.photo", "user?.photoUrl")
text = text.replace("user.photo", "user.photoUrl")

with open("App.tsx", "w") as f:
    f.write(text)

