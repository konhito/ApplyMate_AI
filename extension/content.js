// === Step 1: Select all visible clickable elements ===
const clickableElements = Array.from(
  document.querySelectorAll(
    'a, button, [onclick], input[type="submit"], input[type="button"], [role="button"], [tabindex]'
  )
).filter((el) => el.offsetParent !== null);

// === Step 2: Add class and data-id to each clickable element ===
clickableElements.forEach((el, i) => {
  el.classList.add("clickable-highlight");
  el.setAttribute("data-clickable-id", i + 1);
});

// === Step 3: Inject dynamic CSS styles ===
const style = document.createElement("style");
style.innerHTML = `
  .clickable-highlight {
    outline: 2px dashed red;
    position: relative;
    border-radius: 8px;
    transition: outline 0.3s;
  }

  .clickable-highlight::after {
    content: attr(data-clickable-id);
    position: absolute;
    top: -10px;
    left: -10px;
    background: red;
    color: white;
    font-size: 12px;
    font-weight: bold;
    padding: 3px 6px;
    border-radius: 50%;
    z-index: 10000;
    box-shadow: 0 0 4px rgba(0,0,0,0.3);
  }
`;
document.head.appendChild(style);
