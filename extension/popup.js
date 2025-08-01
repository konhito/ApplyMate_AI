document.getElementById("capture").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript(
    {
      target: { tabId: tab.id },
      func: () => {
        return {
          height: document.body.scrollHeight,
          width: document.body.scrollWidth,
        };
      },
    },
    async (results) => {
      const { height, width } = results[0].result;

      await chrome.tabs.setZoom(tab.id, 1); // reset zoom to avoid scaling issues

      chrome.tabs.captureVisibleTab(
        null,
        { format: "jpeg", quality: 100 },
        async (dataUrl) => {
          if (!dataUrl) {
            alert("Failed to capture screenshot");
            return;
          }

          try {
            const res = await fetch("http://localhost:3000/upload", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ screenshot: dataUrl }),
            });

            const json = await res.json();
            alert("Upload success: " + json.message);
          } catch (e) {
            alert("Upload failed: " + e.message);
          }
        }
      );
    }
  );
});
document.getElementById("fetchHtml").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript(
    {
      target: { tabId: tab.id },
      func: () => document.documentElement.outerHTML,
    },
    (results) => {
      if (chrome.runtime.lastError) {
        document.getElementById("output").textContent =
          "Error: " + chrome.runtime.lastError.message;
      } else {
        const html = results[0].result;
        document.getElementById("output").textContent = html;
      }
    }
  );
});
