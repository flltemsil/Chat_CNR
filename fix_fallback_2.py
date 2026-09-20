import re

with open("App.tsx", "r") as f:
    text = f.read()

pattern = """          if (newIsPro && newProExpiresAt) {
            const expireDate = newProExpiresAt.toDate ? newProExpiresAt.toDate() : new Date(newProExpiresAt);
            if (expireDate < new Date()) {
              newIsPro = false;
              setDoc(doc(db, "users", user.uid), { isPro: false, proExpiresAt: null }, { merge: true }).catch(console.error);
            }
          }"""

repl = """          if (newIsPro) {
            let isExpired = false;
            if (newProExpiresAt) {
              const expireDate = newProExpiresAt.toDate ? newProExpiresAt.toDate() : new Date(newProExpiresAt);
              if (expireDate < new Date()) {
                isExpired = true;
              }
            } else if (data.updatedAt) {
              const updateDate = data.updatedAt.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt);
              const oneMonthAgo = new Date();
              oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
              if (updateDate < oneMonthAgo) {
                isExpired = true;
              }
            }

            if (isExpired) {
              newIsPro = false;
              setDoc(doc(db, "users", user.uid), { isPro: false, proExpiresAt: null }, { merge: true }).catch(console.error);
            }
          }"""

text = text.replace(pattern, repl)

with open("App.tsx", "w") as f:
    f.write(text)
