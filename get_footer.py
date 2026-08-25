import re

with open("App.tsx", "r") as f:
    text = f.read()

start = text.find('<footer')
end = text.find('</footer>') + 9

print(text[start:start+1000])

