document.getElementById("summarize").addEventListener("click", () => {
  //   console.log("summarizer cliked");

  const result = document.getElementById("result");
  const summaryType = document.getElementById("summary-type").value;

  result.innerHTML = '<div class="loader"></div>';

  // get the users API KEY

  chrome.storage.sync.get(["geminiApiKey"], ({ geminiApiKey }) => {
    if (!geminiApiKey) {
      //Ask content.js for the page text

      result.textContent = "No API keyset click the gear icon to add one.";
      return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      chrome.tabs.sendMessage(
        tab.id,
        { type: "GET_ARTICLE_TEXT" },
        async ({ text }) => {
          if (!text) {
            result.textContent = "could not extract text from this page";
            return;
          }

          //send text to gemini
          try {
            const summary = await getGemminiSummary(
              text,
              summaryType,
              geminiApiKey
            );
            result.textContent = summary;
          } catch (err) {
            result.textContent = "gemini error" + err.message;
          }
        }
      );
    });
  });
});

async function getGemminiSummary(rawText, type, apiKey) {
  const max = 20000;
  const text = rawText.length > max ? rawText.slice(0, max) + "..." : rawText;

  const promptMap = {
    breif: `summerize in 2-3 sentences:\n\n${text}`,
    detailed: `give a detailed summary:\n\n${text}`,
    bullets: `summerize in 6-7 bullet points (start each line with '- ') sentences:\n\n${text}`,
  };

  const prompt = promptMap[type] || promptMap.breif;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2 },
      }),
    }
  );

  if (!res.ok) {
    const { error } = await res.json();
    throw new Error(error?.message || "request failed");
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "No summary.";
}

document.getElementById("copy-btn").addEventListener("click", () => {
  const text = document.getElementById("result").innerText;
  if (!text) return;

  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById("copy-btn");
    const old = btn.textContent;
    btn.textContent = "copied!";
    setTimeout(() => {
      btn.textContent = old;
    }, 2000);
  });
});
