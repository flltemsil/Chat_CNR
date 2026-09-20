import re

# 1. Update types.ts
with open("types.ts", "r") as f:
    types = f.read()
if "proExpiresAt?:" not in types:
    types = types.replace("isPro?: boolean;", "isPro?: boolean;\n  proExpiresAt?: any;")
    with open("types.ts", "w") as f:
        f.write(types)

# 2. Update profileService.ts
with open("services/profileService.ts", "r") as f:
    profile = f.read()
if "proExpiresAt:" not in profile:
    profile = profile.replace("isPro: data.isPro || false,", "isPro: data.isPro || false,\n          proExpiresAt: data.proExpiresAt ? (data.proExpiresAt.toDate ? data.proExpiresAt.toDate() : new Date(data.proExpiresAt)) : null,")
    with open("services/profileService.ts", "w") as f:
        f.write(profile)

# 3. Update App.tsx
with open("App.tsx", "r") as f:
    app_text = f.read()

# 3a. Remove Model Selector Dropdown
model_dropdown_pattern = r'<div className="flex items-center gap-2">\s*<div className="relative">\s*<div\s+onClick=\{\(\) => setIsModelDropdownOpen\(!isModelDropdownOpen\)\}[\s\S]*?\{isModelDropdownOpen && \([\s\S]*?<\/div>\s*<\/div>\s*\)\}\s*<\/div>\s*<button'
app_text = re.sub(model_dropdown_pattern, '<div className="flex items-center gap-2">\n                      <button', app_text)

# 3b. Fix the realtime listener for Pro expiration
listener_pattern = r'const newIsPro = data\.isPro \|\| false;\s*// If something changed, return new object\s*if \(prev\.isPro !== newIsPro \|\| prev\.role !== data\.role\) \{'
listener_repl = """let newIsPro = data.isPro || false;
          let newProExpiresAt = data.proExpiresAt;
          
          if (newIsPro && newProExpiresAt) {
            const expireDate = newProExpiresAt.toDate ? newProExpiresAt.toDate() : new Date(newProExpiresAt);
            if (expireDate < new Date()) {
              newIsPro = false;
              setDoc(doc(db, "users", user.uid), { isPro: false, proExpiresAt: null }, { merge: true }).catch(console.error);
            }
          }

          // If something changed, return new object
          if (prev.isPro !== newIsPro || prev.role !== data.role) {"""
app_text = re.sub(listener_pattern, listener_repl, app_text)

# 3c. Fix the "PRO YAP" admin button
admin_pro_pattern = r'await setDoc\(doc\(db, "users", u\.uid\), \{ isPro: true \}, \{ merge: true \}\);'
admin_pro_repl = """const expiryDate = new Date();
                                expiryDate.setMonth(expiryDate.getMonth() + 1);
                                await setDoc(doc(db, "users", u.uid), { isPro: true, proExpiresAt: expiryDate }, { merge: true });"""
app_text = re.sub(admin_pro_pattern, admin_pro_repl, app_text)

with open("App.tsx", "w") as f:
    f.write(app_text)

print("Fixes applied.")
