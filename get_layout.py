import re

with open("App.tsx", "r") as f:
    text = f.read()

# Let's find the main content split container
start = text.find('{/* Main Content Split Container */}')
end = text.find('{/* Delete Confirmation Modal */}')

print(text[start:start+2000])

