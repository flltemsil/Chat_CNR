async function run() {
  const res = await fetch("http://localhost:3000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      prompt: "Ucuncu mesaj", 
      history: [
        { role: "user", text: "Birinci mesaj" },
        { role: "model", text: "İkinci mesaj" }
      ]
    })
  });
  console.log("Status:", res.status);
  console.log("Body:", await res.text());
}
run();
