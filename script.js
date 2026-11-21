// ===== HELPER (not from class: protects against XSS) =====
function escapeHTML(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const validStatuses = ["Open", "Investigating", "Resolved"];

// null = adding a new incident, a number = editing that incident
let editId = null;

// ===== LOAD DATA (week6 localStorage + week7 try/catch) =====
let incidents = [];

try {
  let saved = JSON.parse(localStorage.getItem("incidents"));
  incidents = Array.isArray(saved) ? saved : [];
} catch (error) {
  console.log(error);
  incidents = [];
}

incidents = incidents
  .filter((item) => item && typeof item === "object")
  .map((item) => ({
    ...item,
    status: validStatuses.includes(item.status) ? item.status : "Open",
  }));

function saveToStorage() {
  try {
    localStorage.setItem("incidents", JSON.stringify(incidents));
  } catch (error) {
    console.log(error);
    alert("Could not save. Your browser storage may be full or blocked.");
  }
}

// ===== ADD / UPDATE INCIDENT =====
function saveIncident() {
  let title = document.getElementById("title").value.trim();
  let type = document.getElementById("type").value;
  let date = document.getElementById("date").value;
  let severity = document.getElementById("severity").value;
  let description = document.getElementById("description").value.trim();
  let errorMessage = document.getElementById("error");

  if (!title || !type || !date || !severity || !description) {
    errorMessage.innerText = "Please fill in all fields";
    return;
  }

  errorMessage.innerText = "";

  if (editId === null) {
    // CREATE
    let incident = {
      id: Date.now(),
      title,
      type,
      date,
      severity,
      description,
      status: "Open",
    };

    incidents.push(incident);
  } else {
    // UPDATE (keeps the same id and status)
    let index = incidents.findIndex((items) => items.id === editId);

    if (index !== -1) {
      incidents[index].title = title;
      incidents[index].type = type;
      incidents[index].date = date;
      incidents[index].severity = severity;
      incidents[index].description = description;
    }
  }

  saveToStorage();
  cancelEdit();
  updateTable();
}

// ===== EDIT =====
function editIncident(id) {
  let incident = incidents.find((items) => items.id === id);

  if (!incident) {
    return;
  }

  editId = id;

  document.getElementById("title").value = incident.title;
  document.getElementById("type").value = incident.type;
  document.getElementById("date").value = incident.date;
  document.getElementById("severity").value = incident.severity;
  document.getElementById("description").value = incident.description;

  document.getElementById("formTitle").innerText = "Edit Incident";
  document.getElementById("submitBtn").innerText = "Update Incident";
  document.getElementById("cancelBtn").style.display = "inline-block";
  document.getElementById("error").innerText = "";

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function cancelEdit() {
  editId = null;

  clearForm();

  document.getElementById("formTitle").innerText = "New Incident Report";
  document.getElementById("submitBtn").innerText = "+ Log Incident";
  document.getElementById("cancelBtn").style.display = "none";
}

// ===== SEARCH & FILTER =====
function getFilteredIncidents() {
  let search = document.getElementById("searchInput").value.trim().toLowerCase();
  let severity = document.getElementById("filterSeverity").value;
  let status = document.getElementById("filterStatus").value;
  let type = document.getElementById("filterType").value;

  return incidents.filter((items) => {
    let matchSearch = items.title.toLowerCase().includes(search);
    let matchSeverity = severity === "All" || items.severity === severity;
    let matchStatus = status === "All" || items.status === status;
    let matchType = type === "All" || items.type === type;

    return matchSearch && matchSeverity && matchStatus && matchType;
  });
}

function resetFilters() {
  document.getElementById("searchInput").value = "";
  document.getElementById("filterSeverity").value = "All";
  document.getElementById("filterStatus").value = "All";
  document.getElementById("filterType").value = "All";

  updateTable();
}

function updateStats() {
  document.getElementById("statTotal").innerText = incidents.length;

  document.getElementById("statOpen").innerText = incidents.filter(
    (items) => items.status === "Open",
  ).length;

  document.getElementById("statInvestigating").innerText = incidents.filter(
    (items) => items.status === "Investigating",
  ).length;

  document.getElementById("statResolved").innerText = incidents.filter(
    (items) => items.status === "Resolved",
  ).length;

  document.getElementById("statCritical").innerText = incidents.filter(
    (items) => items.severity === "Critical" || items.severity === "High",
  ).length;
}


function updateTable() {
  let tableBody = document.getElementById("tableBody");
  let emptyMessage = document.getElementById("emptyMessage");
  let list = getFilteredIncidents();

  tableBody.innerHTML = "";

  list.forEach((items, index) => {
    const { id, title, type, date, severity, description, status } = items;

    tableBody.innerHTML += `
      <tr>
        <td>${index + 1}</td>
        <td class="title-cell">${escapeHTML(title)}</td>
        <td>${escapeHTML(type)}</td>
        <td>${escapeHTML(date)}</td>
        <td><span class="badge sev-${escapeHTML(severity)}">${escapeHTML(severity)}</span></td>
        <td class="desc-cell">${escapeHTML(description)}</td>
        <td>
          <select class="status-select st-${status}" onchange="changeStatus(${Number(id)}, this.value)">
            <option ${status === "Open" ? "selected" : ""}>Open</option>
            <option ${status === "Investigating" ? "selected" : ""}>Investigating</option>
            <option ${status === "Resolved" ? "selected" : ""}>Resolved</option>
          </select>
        </td>
        <td class="action-cell">
          <button class="edit-btn" onclick="editIncident(${Number(id)})">Edit</button>
          <button class="delete-btn" onclick="deleteIncident(${Number(id)})">Delete</button>
        </td>
      </tr>
    `;
  });

  emptyMessage.style.display = list.length === 0 ? "block" : "none";

  updateStats();
}

function clearForm() {
  document.getElementById("title").value = "";
  document.getElementById("type").value = "";
  document.getElementById("date").value = "";
  document.getElementById("severity").value = "";
  document.getElementById("description").value = "";
}

function deleteIncident(id) {
  let confirmDelete = confirm("Are you sure you want to delete this incident?");

  if (!confirmDelete) {
    return;
  }

  let index = incidents.findIndex((items) => items.id === id);

  if (index === -1) {
    return;
  }

  incidents.splice(index, 1);

  if (editId === id) {
    cancelEdit();
  }

  saveToStorage();
  updateTable();
}

function changeStatus(id, newStatus) {
  let check = incidents.findIndex((items) => items.id === id);

  if (check !== -1 && validStatuses.includes(newStatus)) {
    incidents[check].status = newStatus;
    saveToStorage();
    updateTable();
  }
}

document.getElementById("title").addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    saveIncident();
  }
});


updateTable();
