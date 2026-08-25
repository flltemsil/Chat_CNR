import re

with open("App.tsx", "r") as f:
    text = f.read()

print("--- Sidebar ---")
match = re.search(r'<aside[^>]*>', text)
if match: print(match.group(0))

print("\n--- Main Container ---")
match = re.search(r'\{/\* Main Content Split Container \*/\}\s*<div[^>]*>', text)
if match: print(match.group(0))

print("\n--- Header ---")
match = re.search(r'<header[^>]*>', text)
if match: print(match.group(0))

print("\n--- Input Box ---")
match = re.search(r'<div className=\{`flex-1 rounded-\[32px\][^>]*>', text)
if match: print(match.group(0))

print("\n--- Footer ---")
match = re.search(r'<footer[^>]*>', text)
if match: print(match.group(0))

