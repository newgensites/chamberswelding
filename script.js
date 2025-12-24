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

const bookingUI = {
  renderCalendar: null,
  renderTimes: null,
  selectedKey: null
};

function toKey(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function fromKey(key) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
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

function loadStoredJSON(key, fallback) {
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

const bookingControls = {
  today: new Date(),
  baseSlots: ["09:00", "10:30", "12:00", "13:30", "15:00", "16:30"],
  availability: new Map(),
  overrides: loadStoredJSON("cw_booking_overrides", {})
};

function saveOverrides() {
  window.localStorage.setItem("cw_booking_overrides", JSON.stringify(bookingControls.overrides));
}

function buildAvailability(days = 28) {
  bookingControls.availability.clear();
  for (let i = 0; i < days; i += 1) {
    const date = new Date(bookingControls.today);
    date.setDate(bookingControls.today.getDate() + i);
    const day = date.getDay();
    const key = toKey(date);

    if (day === 0) {
      bookingControls.availability.set(key, { available: [], booked: bookingControls.baseSlots, closed: true });
      continue;
    }

    const override = bookingControls.overrides[key] || {};
    const closed = Boolean(override.closed);
    const booked = Array.isArray(override.booked) ? override.booked : [];
    const available = closed ? [] : bookingControls.baseSlots.filter(slot => !booked.includes(slot));

    bookingControls.availability.set(key, { available, booked, closed });
  }
}

function refreshBookingUI() {
  if (bookingUI.renderCalendar) bookingUI.renderCalendar();
  if (bookingUI.selectedKey && bookingUI.renderTimes) {
    const selectedDate = fromKey(bookingUI.selectedKey);
    const info = bookingControls.availability.get(bookingUI.selectedKey);
    bookingUI.renderTimes(selectedDate, info);
  }
}

function setOverride(key, override) {
  if (!override || (!override.closed && (!override.booked || override.booked.length === 0))) {
    delete bookingControls.overrides[key];
  } else {
    bookingControls.overrides[key] = override;
  }
  saveOverrides();
  buildAvailability();
  refreshBookingUI();
}

function addBookedSlot(key, time) {
  if (!key || !time) return;
  const current = bookingControls.overrides[key] || {};
  const booked = new Set(current.booked || []);
  booked.add(time);
  setOverride(key, { ...current, booked: Array.from(booked) });
}

function removeBookedSlot(key, time) {
  if (!key || !time) return;
  const current = bookingControls.overrides[key];
  if (!current || !Array.isArray(current.booked)) return;
  const booked = current.booked.filter(slot => slot !== time);
  setOverride(key, { ...current, booked });
}

buildAvailability();

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

  function renderCalendar() {
    if (!bookingGrid || !bookingMonth) return;

    const monthStart = new Date(bookingControls.today.getFullYear(), bookingControls.today.getMonth(), 1);
    const monthEnd = new Date(bookingControls.today.getFullYear(), bookingControls.today.getMonth() + 1, 0);
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
      const date = new Date(bookingControls.today.getFullYear(), bookingControls.today.getMonth(), day);
      const key = toKey(date);
      const info = bookingControls.availability.get(key);
      const isPast = date < new Date(bookingControls.today.getFullYear(), bookingControls.today.getMonth(), bookingControls.today.getDate());
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
      button.addEventListener("click", () => selectDate(date));
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

  function selectDate(date) {
    if (!dateInput) return;
    clearSelectedDay();
    const key = toKey(date);
    const info = bookingControls.availability.get(key);
    const selected = bookingGrid?.querySelector(`[data-date="${key}"]`);
    if (selected) {
      selected.classList.add("is-selected");
      selected.setAttribute("aria-pressed", "true");
    }
    bookingUI.selectedKey = key;
    dateInput.value = key;
    if (timeInput) timeInput.value = "";
    renderTimes(date, info);
  }

  renderCalendar();
  bookingUI.renderCalendar = renderCalendar;
  bookingUI.renderTimes = renderTimes;
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

    const combinedNotes = [
      location ? `Location: ${location}` : "",
      details ? `Details: ${details}` : ""
    ].filter(Boolean).join(" • ");

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

    addRequestToQueue({
      name,
      phone,
      service,
      date,
      time,
      notes: combinedNotes,
      status: "pending"
    });
    window.location.href = smsLink;
  });
}

const adminRequestForm = document.getElementById("adminRequestForm");
const adminRequestTable = document.getElementById("adminRequestTable");
const adminDateInput = document.getElementById("adminDate");
const adminSlots = document.getElementById("adminSlots");
const adminClosed = document.getElementById("adminClosed");
const adminSave = document.getElementById("adminSave");
const adminClear = document.getElementById("adminClear");
const adminGateForm = document.getElementById("adminGateForm");
const adminPinInput = document.getElementById("adminPin");
const adminGateMessage = document.getElementById("adminGateMessage");
const adminPanel = document.getElementById("adminPanel");
const adminLockPanel = document.getElementById("adminLockPanel");
const adminLockButton = document.getElementById("adminLockButton");

const ADMIN_PIN = "4821";
const ADMIN_UNLOCK_KEY = "cw_admin_unlocked";

const requestStoreKey = "cw_booking_requests";
let bookingRequests = loadStoredJSON(requestStoreKey, []);

function setAdminAccess(unlocked) {
  if (adminPanel) {
    adminPanel.classList.toggle("admin--unlocked", unlocked);
    adminPanel.classList.toggle("admin--locked", !unlocked);
    adminPanel.setAttribute("aria-hidden", unlocked ? "false" : "true");
  }
  if (adminLockPanel) {
    adminLockPanel.classList.toggle("is-hidden", unlocked);
  }
  if (adminLockButton) {
    adminLockButton.classList.toggle("is-visible", unlocked);
  }
  if (unlocked) {
    window.localStorage.setItem(ADMIN_UNLOCK_KEY, "true");
  } else {
    window.localStorage.removeItem(ADMIN_UNLOCK_KEY);
  }
}

if (adminGateForm) {
  adminGateForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!adminPinInput) return;
    const entered = adminPinInput.value.trim();
    if (entered === ADMIN_PIN) {
      setAdminAccess(true);
      if (adminGateMessage) adminGateMessage.textContent = "Access granted.";
      adminGateForm.reset();
    } else {
      setAdminAccess(false);
      if (adminGateMessage) adminGateMessage.textContent = "Incorrect PIN. Try again.";
      adminPinInput.value = "";
      adminPinInput.focus();
    }
  });
}

if (adminLockButton) {
  adminLockButton.addEventListener("click", () => {
    setAdminAccess(false);
    if (adminGateMessage) adminGateMessage.textContent = "Admin desk locked.";
  });
}

const wasUnlocked = window.localStorage.getItem(ADMIN_UNLOCK_KEY) === "true";
setAdminAccess(wasUnlocked);

function saveRequests() {
  window.localStorage.setItem(requestStoreKey, JSON.stringify(bookingRequests));
}

function addRequestToQueue(request) {
  const normalized = {
    id: request.id || `req-${Date.now()}`,
    name: (request.name || "").trim(),
    phone: (request.phone || "").trim(),
    service: request.service || "Welding",
    date: request.date || "",
    time: request.time || "",
    notes: (request.notes || "").trim(),
    status: request.status || "pending"
  };

  bookingRequests = [normalized, ...bookingRequests];
  saveRequests();
  renderRequestTable();
  return normalized;
}

function buildTimeOptions(select, selectedValue) {
  select.innerHTML = "";
  bookingControls.baseSlots.forEach(slot => {
    const option = document.createElement("option");
    option.value = slot;
    option.textContent = formatTimeLabel(slot);
    if (slot === selectedValue) option.selected = true;
    select.appendChild(option);
  });
}

function updateRequest(id, updates) {
  bookingRequests = bookingRequests.map(request => {
    if (request.id !== id) return request;
    return { ...request, ...updates };
  });
  saveRequests();
}

function renderRequestTable() {
  if (!adminRequestTable) return;
  const tbody = adminRequestTable.querySelector("tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  bookingRequests.forEach(request => {
    const row = document.createElement("tr");
    row.dataset.requestId = request.id;

    const nameCell = document.createElement("td");
    nameCell.innerHTML = `
      <div class="admin__name">${request.name || "Unknown"}</div>
      <div class="admin__meta">${request.phone || "No phone"} • ${request.service || "Service"}</div>
      ${request.notes ? `<div class="admin__notes">${request.notes}</div>` : ""}
    `;

    const dateCell = document.createElement("td");
    const dateInput = document.createElement("input");
    dateInput.type = "date";
    dateInput.value = request.date || "";
    dateInput.className = "admin__input";
    dateInput.addEventListener("change", () => {
      const previousDate = request.date;
      request.date = dateInput.value;
      updateRequest(request.id, { date: request.date });
      if (request.status === "confirmed") {
        removeBookedSlot(previousDate, request.time);
        addBookedSlot(request.date, request.time);
      }
    });

    const timeSelect = document.createElement("select");
    timeSelect.className = "admin__input";
    buildTimeOptions(timeSelect, request.time);
    timeSelect.addEventListener("change", () => {
      const previousTime = request.time;
      request.time = timeSelect.value;
      updateRequest(request.id, { time: request.time });
      if (request.status === "confirmed") {
        removeBookedSlot(request.date, previousTime);
        addBookedSlot(request.date, request.time);
      }
    });

    const dateWrap = document.createElement("div");
    dateWrap.className = "admin__datetime";
    dateWrap.appendChild(dateInput);
    dateWrap.appendChild(timeSelect);
    dateCell.appendChild(dateWrap);

    const statusCell = document.createElement("td");
    const status = document.createElement("span");
    status.className = `admin__status admin__status--${request.status || "pending"}`;
    status.textContent = request.status || "pending";
    statusCell.appendChild(status);

    const actionsCell = document.createElement("td");
    actionsCell.className = "admin__actions";

    const confirmButton = document.createElement("button");
    confirmButton.type = "button";
    confirmButton.className = "btn btn--sm";
    confirmButton.textContent = "Confirm";
    confirmButton.addEventListener("click", () => {
      const previousStatus = request.status;
      request.status = "confirmed";
      updateRequest(request.id, { status: "confirmed" });
      if (previousStatus !== "confirmed") addBookedSlot(request.date, request.time);
      renderRequestTable();
    });

    const declineButton = document.createElement("button");
    declineButton.type = "button";
    declineButton.className = "btn btn--sm btn--ghost";
    declineButton.textContent = "Decline";
    declineButton.addEventListener("click", () => {
      const previousStatus = request.status;
      request.status = "declined";
      updateRequest(request.id, { status: "declined" });
      if (previousStatus === "confirmed") removeBookedSlot(request.date, request.time);
      renderRequestTable();
    });

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "btn btn--sm btn--ghost";
    removeButton.textContent = "Remove";
    removeButton.addEventListener("click", () => {
      if (request.status === "confirmed") removeBookedSlot(request.date, request.time);
      bookingRequests = bookingRequests.filter(item => item.id !== request.id);
      saveRequests();
      renderRequestTable();
    });

    actionsCell.appendChild(confirmButton);
    actionsCell.appendChild(declineButton);
    actionsCell.appendChild(removeButton);

    row.appendChild(nameCell);
    row.appendChild(dateCell);
    row.appendChild(statusCell);
    row.appendChild(actionsCell);
    tbody.appendChild(row);
  });
}

if (adminRequestForm) {
  const adminName = adminRequestForm.querySelector("#adminName");
  const adminPhone = adminRequestForm.querySelector("#adminPhone");
  const adminService = adminRequestForm.querySelector("#adminService");
  const adminDate = adminRequestForm.querySelector("#adminRequestDate");
  const adminTime = adminRequestForm.querySelector("#adminRequestTime");
  const adminNotes = adminRequestForm.querySelector("#adminNotes");

  if (adminTime) buildTimeOptions(adminTime, bookingControls.baseSlots[0]);

  adminRequestForm.addEventListener("submit", (event) => {
    event.preventDefault();
    addRequestToQueue({
      id: `req-${Date.now()}`,
      name: adminName?.value.trim(),
      phone: adminPhone?.value.trim(),
      service: adminService?.value,
      date: adminDate?.value,
      time: adminTime?.value,
      notes: adminNotes?.value.trim(),
      status: "pending"
    });
    adminRequestForm.reset();
    if (adminTime) buildTimeOptions(adminTime, bookingControls.baseSlots[0]);
  });
}

function renderAdminAvailability() {
  if (!adminDateInput || !adminSlots || !adminClosed) return;
  const key = adminDateInput.value;
  if (!key) return;
  const override = bookingControls.overrides[key] || {};
  adminClosed.checked = Boolean(override.closed);
  adminSlots.innerHTML = "";

  bookingControls.baseSlots.forEach(slot => {
    const label = document.createElement("label");
    label.className = "admin__slot";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = slot;
    checkbox.checked = (override.booked || []).includes(slot) || Boolean(override.closed);
    checkbox.disabled = adminClosed.checked;

    const text = document.createElement("span");
    text.textContent = formatTimeLabel(slot);

    label.appendChild(checkbox);
    label.appendChild(text);
    adminSlots.appendChild(label);
  });
}

if (adminDateInput) {
  adminDateInput.value = toKey(bookingControls.today);
  adminDateInput.addEventListener("change", renderAdminAvailability);
  renderAdminAvailability();
}

if (adminClosed) {
  adminClosed.addEventListener("change", () => {
    renderAdminAvailability();
  });
}

if (adminSave) {
  adminSave.addEventListener("click", () => {
    if (!adminDateInput || !adminSlots) return;
    const key = adminDateInput.value;
    const checked = Array.from(adminSlots.querySelectorAll("input[type=\"checkbox\"]"))
      .filter(input => input.checked)
      .map(input => input.value);
    const closed = adminClosed ? adminClosed.checked : false;
    const booked = closed ? [...bookingControls.baseSlots] : checked;
    setOverride(key, { booked, closed });
    renderAdminAvailability();
  });
}

if (adminClear) {
  adminClear.addEventListener("click", () => {
    if (!adminDateInput) return;
    const key = adminDateInput.value;
    setOverride(key, null);
    renderAdminAvailability();
  });
}

renderRequestTable();
