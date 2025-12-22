// Mobile nav
const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");

function setNav(open) {
  if (!navLinks) return;
  navLinks.classList.toggle("is-open", open);
  if (navToggle) navToggle.setAttribute("aria-expanded", open ? "true" : "false");
}

if (navToggle) {
  navToggle.addEventListener("click", () => {
    const open = !navLinks.classList.contains("is-open");
    setNav(open);
  });
}

// Close menu when clicking a link (mobile)
if (navLinks) {
  navLinks.querySelectorAll("a").forEach(a => {
    a.addEventListener("click", () => setNav(false));
  });
}

// Close menu when clicking outside
document.addEventListener("click", (e) => {
  if (!navLinks || !navToggle) return;
  const isClickInside = navLinks.contains(e.target) || navToggle.contains(e.target);
  if (!isClickInside) setNav(false);
});

// Footer year
const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();

// Quote form -> opens email app with filled details
const form = document.getElementById("quoteForm");
if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(form);

    const name = (data.get("name") || "").toString().trim();
    const phone = (data.get("phone") || "").toString().trim();
    const service = (data.get("service") || "Welding").toString().trim();
    const details = (data.get("details") || "").toString().trim();

    const subject = `Quote Request - ${service}${name ? " - " + name : ""}`;
    const bodyLines = [
      "Hi Chambers Welding | VASEAN,",
      "",
      "I’d like a quote for:",
      `Service: ${service}`,
      `Name: ${name || "N/A"}`,
      `Phone: ${phone || "N/A"}`,
      "",
      "Details:",
      details || "N/A",
      "",
      "Thank you!"
    ];

    const mailto = `mailto:soliv3@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join("\n"))}`;
    window.location.href = mailto;
  });
}
