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

// Booking form -> opens SMS app with filled details
const bookingForm = document.getElementById("bookingForm");
if (bookingForm) {
  const dateInput = bookingForm.querySelector('input[name="date"]');
  if (dateInput) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    dateInput.min = `${yyyy}-${mm}-${dd}`;
  }

  bookingForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(bookingForm);

    const name = (data.get("name") || "").toString().trim();
    const phone = (data.get("phone") || "").toString().trim();
    const date = (data.get("date") || "").toString().trim();
    const time = (data.get("time") || "").toString().trim();
    const service = (data.get("service") || "Welding").toString().trim();
    const location = (data.get("location") || "").toString().trim();
    const details = (data.get("details") || "").toString().trim();

    const bodyLines = [
      "Booking Request - Chambers Welding | VASEAN",
      "",
      `Name: ${name || "N/A"}`,
      `Phone: ${phone || "N/A"}`,
      `Service: ${service || "N/A"}`,
      `Date: ${date || "N/A"}`,
      `Time: ${time || "N/A"}`,
      `Location: ${location || "N/A"}`,
      "",
      "Details:",
      details || "N/A"
    ];

    const targetPhone = bookingForm.getAttribute("data-phone") || "+19542249454";
    const smsLink = `sms:${targetPhone}?body=${encodeURIComponent(bodyLines.join("\n"))}`;
    window.location.href = smsLink;
  });
}

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
