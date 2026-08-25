import re

with open("App.tsx", "r") as f:
    text = f.read()

text = text.replace('chatCNRService.sendMessageStream(\n        prompt,', 'chatCNRService.sendMessageStream(\n        userMsg.text,')

with open("App.tsx", "w") as f:
    f.write(text)

