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
  const dateInput = bookingForm.querySelector("#bookingDate");
  const timeInput = bookingForm.querySelector("#bookingTime");
  const bookingGrid = bookingForm.querySelector("#bookingGrid");
  const bookingMonth = bookingForm.querySelector("#bookingMonth");
  const bookingTimes = bookingForm.querySelector("#bookingTimes");
  const bookingTaken = bookingForm.querySelector("#bookingTaken");
  const bookingSelected = bookingForm.querySelector("#bookingSelected");
  const bookingTakenWrap = bookingForm.querySelector("#bookingTakenWrap");

  const today = new Date();
  const availability = new Map();
  const baseSlots = ["09:00", "10:30", "12:00", "13:30", "15:00", "16:30"];

  function toKey(date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  function formatDisplayDate(date) {
    return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  }

  function formatTimeLabel(time) {
    const [hour, minute] = time.split(":").map(Number);
    const temp = new Date();
    temp.setHours(hour, minute, 0, 0);
    return temp.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }

  function buildAvailability(days = 28) {
    for (let i = 0; i < days; i += 1) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const day = date.getDay();
      const key = toKey(date);

      if (day === 0) {
        availability.set(key, { available: [], booked: [] });
        continue;
      }

      const booked = [];
      if (date.getDate() % 3 === 0) booked.push("12:00");
      if (date.getDate() % 5 === 0) booked.push("15:00");

      const available = baseSlots.filter(slot => !booked.includes(slot));
      availability.set(key, { available, booked });
    }
  }

  function renderCalendar() {
    if (!bookingGrid || !bookingMonth) return;

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    bookingMonth.textContent = monthStart.toLocaleDateString(undefined, { month: "long", year: "numeric" });

    bookingGrid.innerHTML = "";
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    weekdays.forEach(day => {
      const label = document.createElement("div");
      label.className = "calendar__weekday";
      label.textContent = day;
      bookingGrid.appendChild(label);
    });

    const startOffset = monthStart.getDay();
    for (let i = 0; i < startOffset; i += 1) {
      const empty = document.createElement("div");
      empty.className = "calendar__cell calendar__cell--empty";
      bookingGrid.appendChild(empty);
    }

    for (let day = 1; day <= monthEnd.getDate(); day += 1) {
      const date = new Date(today.getFullYear(), today.getMonth(), day);
      const key = toKey(date);
      const info = availability.get(key);
      const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const hasAvailability = info && info.available.length > 0;

      const button = document.createElement("button");
      button.type = "button";
      button.className = "calendar__day";
      if (hasAvailability) button.classList.add("calendar__day--available");
      if (!hasAvailability) button.classList.add("calendar__day--unavailable");
      if (isPast || !hasAvailability) button.disabled = true;
      button.textContent = day.toString();
      button.setAttribute("data-date", key);
      button.setAttribute("aria-pressed", "false");
      button.addEventListener("click", () => selectDate(date, info));
      bookingGrid.appendChild(button);
    }
  }

  function clearSelectedDay() {
    if (!bookingGrid) return;
    bookingGrid.querySelectorAll(".calendar__day").forEach(day => {
      day.classList.remove("is-selected");
      day.setAttribute("aria-pressed", "false");
    });
  }

  function renderTimes(date, info) {
    if (!bookingTimes || !bookingTaken || !bookingSelected || !bookingTakenWrap) return;
    bookingTimes.innerHTML = "";
    bookingTaken.innerHTML = "";

    if (!info || info.available.length === 0) {
      bookingSelected.textContent = "No available booking times for this date.";
      bookingTakenWrap.style.display = "none";
      return;
    }

    bookingSelected.textContent = `${formatDisplayDate(date)} — choose a time.`;
    bookingTakenWrap.style.display = info.booked.length ? "block" : "none";

    info.available.forEach(slot => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "times__slot";
      button.textContent = formatTimeLabel(slot);
      button.setAttribute("data-time", slot);
      button.addEventListener("click", () => {
        bookingTimes.querySelectorAll(".times__slot").forEach(slotButton => {
          slotButton.classList.remove("is-selected");
        });
        button.classList.add("is-selected");
        if (timeInput) timeInput.value = slot;
      });
      bookingTimes.appendChild(button);
    });

    info.booked.forEach(slot => {
      const item = document.createElement("li");
      item.textContent = formatTimeLabel(slot);
      bookingTaken.appendChild(item);
    });
  }

  function selectDate(date, info) {
    if (!dateInput) return;
    clearSelectedDay();
    const key = toKey(date);
    const selected = bookingGrid?.querySelector(`[data-date="${key}"]`);
    if (selected) {
      selected.classList.add("is-selected");
      selected.setAttribute("aria-pressed", "true");
    }
    dateInput.value = key;
    if (timeInput) timeInput.value = "";
    renderTimes(date, info);
  }

  buildAvailability();
  renderCalendar();
  if (bookingTakenWrap) bookingTakenWrap.style.display = "none";

  bookingForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (dateInput && !dateInput.value) {
      dateInput.setCustomValidity("Please select a date.");
      dateInput.reportValidity();
      return;
    }
    if (timeInput && !timeInput.value) {
      timeInput.setCustomValidity("Please select a time.");
      timeInput.reportValidity();
      return;
    }
    if (dateInput) dateInput.setCustomValidity("");
    if (timeInput) timeInput.setCustomValidity("");

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

    const targetPhone = bookingForm.getAttribute("data-phone") || "+17542452950";
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
