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
      func: () => {
        const elements = Array.from(document.querySelectorAll("*"));
        const clickable = elements.filter((el) => {
          const tag = el.tagName.toLowerCase();
          const role = el.getAttribute("role");
          const onclick = el.getAttribute("onclick");
          const style = window.getComputedStyle(el);

          return (
            ["a", "button", "input"].includes(tag) ||
            onclick ||
            role === "button" ||
            style.cursor === "pointer"
          );
        });

        return clickable.map((el) => {
          return {
            tag: el.tagName,
            text: el.innerText?.trim().slice(0, 100),
            id: el.id,
            class: el.className,
          };
        });
      },
    },
    (results) => {
      if (chrome.runtime.lastError) {
        document.getElementById("output").textContent =
          "Error: " + chrome.runtime.lastError.message;
      } else {
        const elements = results[0].result;
        if (!elements.length) {
          document.getElementById("output").textContent =
            "No clickable elements found.";
          return;
        }

        document.getElementById("output").textContent = elements
          .map(
            (e) =>
              `<${e.tag.toLowerCase()} id="${e.id}" class="${e.class}"> ${
                e.text
              }`
          )
          .join("\n\n");
      }
    }
  );
});

document.getElementById("visualize").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content.js"],
  });

  setTimeout(() => {
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

        await chrome.tabs.setZoom(tab.id, 1);

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
  }, 2000);
});

async function takeScreenshot() {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content.js"],
  });

  setTimeout(() => {
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

        await chrome.tabs.setZoom(tab.id, 1);

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
              console.log("Upload success: " + json.message);
            } catch (e) {
              console.log("Upload failed: " + e.message);
            }
          }
        );
      }
    );
  }, 2000);
}

async function checkBackendForScreenshot() {
  try {
    const res = await fetch("http://localhost:3000/shouldtakess");
    const { shouldCapture } = await res.json();

    if (shouldCapture) {
      await takeScreenshot();

      // Notify backend that screenshot was taken
      await fetch("http://localhost:3000/screenshotTaken", {
        method: "POST",
      });
    }
  } catch (e) {
    console.error("Error checking screenshot trigger:", e);
  }
}

// Check every 3 seconds
setInterval(checkBackendForScreenshot, 3000);
