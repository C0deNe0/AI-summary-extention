function getArticleText() {
  const article = document.querySelector("article");
  if (article) return article.innerText;

  const paragraph = Array.from(document.querySelector("p"));
  return paragraph.map((p) => p.innerText).join("\n");
}

chrome.runtime.onMessage.addListener((req, sender, sendRes) => {
  if (req.type == "GET_ARTICLE_TEXT") {
    const text = getArticleText();
    sendRes({ text });
  }
});
