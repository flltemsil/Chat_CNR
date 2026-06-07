async function run() {
  const res = await fetch("http://localhost:3000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      prompt: "Ikinci mesaj", 
      history: [
        { role: "user", text: "Birinci mesaj" }
      ]
    })
  });
  console.log("Status:", res.status);
  console.log("Body:", await res.text());
}
run();
