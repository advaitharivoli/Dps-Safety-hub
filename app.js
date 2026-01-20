// Authentication Data - Updated with actual staff
const credentials = {
    'teacher': {
        'lakshmi': { pass: '123', name: 'Lakshmi', section: '4K', isFirstReport: true },
        'mahaalakshmi': { pass: '123', name: 'Mahaakshmi', section: '7P', isFirstReport: true },
        'sony': { pass: '123', name: 'Sony', section: '5I', isFirstReport: true },
        'padhmini': { pass: '123', name: 'Padhmini', section: '6D', isFirstReport: true },
        'pallavi': { pass: '123', name: 'Pallavi', role: 'Coordinator', section: '4K', isFirstReport: true },
        'shailaja': { pass: '123', name: 'Shailaja', role: 'Coordinator', section: '7P', isFirstReport: true },
        'meghna': { pass: '123', name: 'Meghna', role: 'Coordinator', section: '5I', isFirstReport: true },
        'samreen': { pass: '123', name: 'Samreen', role: 'Coordinator', section: '6D', isFirstReport: true }
    },
    'senior-mistress': {
        'suparna': { pass: '123', name: 'Suparna', handles: ['4K', '5I'] },
        'ranjana': { pass: '123', name: 'Ranjana', handles: ['7P', '6D'] }
    },
    'head-mistress': {
        'taj': { pass: '123', name: 'Taj', handles: ['7P', '6D'] }
    },
    'vice-principal': {
        'priya': { pass: '123', name: 'Priya', handles: ['4K', '5I'] }
    },
    'principal': {
        'anitha': { pass: '123', name: 'Anitha' }
    }
};

let currentUser = null;
let incidents = {}; // Store incidents by ID
let nextIncidentId = 47;
// Global flag to ensure notifications are shown only once per session
let notificationsAlreadyShown = false;

// Student Database - Updated
const studentDatabase = {
    "B/19912": { name: "A.Avyukth", class: "4K", teacher: "Lakshmi", coordinator: "Pallavi", sm: "Suparna", vp: "Priya" },
    "B/11676": { name: "A.Advaith", class: "7P", teacher: "Mahaakshmi", coordinator: "Shailaja", sm: "Ranjana", hm: "Taj" },
    "B/13561": { name: "Isha", class: "5I", teacher: "Sony", coordinator: "Meghna", sm: "Suparna", vp: "Priya" },
    "B/12415": { name: "Ishan Karthik", class: "6D", teacher: "Padhmini", coordinator: "Samreen", sm: "Ranjana", hm: "Taj" }
};

// Role switching logic
function switchRole(roleTarget, bypassAuth = false) {
    if (roleTarget === 'student') {
        performSwitch(roleTarget);
        currentUser = null;
        return;
    }

    if (bypassAuth) {
        const categoryDetails = credentials[roleTarget];
        // Reset notification flag and dashboard for the new session
        notificationsAlreadyShown = false;
        currentUser = { role: roleTarget, name: defaultUser.name, ...defaultUser };
        performSwitch(roleTarget);
        showNotifications();
        updateDashboard();
        return;
    }

    const userId = prompt(`Enter Login ID for ${roleTarget.replace('-', ' ').toUpperCase()}:`);
    if (!userId) return;

    const categoryDetails = credentials[roleTarget];
    if (categoryDetails && categoryDetails[userId.toLowerCase()]) {
        const password = prompt("Enter Password:");
        if (password === categoryDetails[userId.toLowerCase()].pass) {
            // Reset notification flag and dashboard for the new session
            notificationsAlreadyShown = false;
            currentUser = {
                role: roleTarget,
                ...categoryDetails[userId.toLowerCase()]
            };
            alert(`Welcome, ${currentUser.name}`);
            performSwitch(roleTarget);
            showNotifications();
            updateDashboard();
        } else {
            alert("Incorrect Password!");
        }
    } else {
        alert("Invalid Login ID for this role.");
    }
}

function performSwitch(role) {
    document.querySelectorAll('.role-btn').forEach(btn => {
        btn.classList.remove('active');
        const btnText = btn.innerText.toLowerCase().replace(/\s/g, '-');
        if (btnText.includes(role) || (role === 'vice-principal' && btnText.includes('principal') && !btnText.includes('head'))) {
            btn.classList.add('active');
        }
    });

    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });

    const targetView = document.getElementById(`${role}-view`);
    if (targetView) {
        targetView.classList.add('active');
        // Ensure dashboard updates when view changes
        setTimeout(updateDashboard, 50);
    }
}

function showNotifications() {
    if (!currentUser || notificationsAlreadyShown) return;

    let pendingCount = 0;
    let escalatedCount = 0;

    Object.values(incidents).forEach(inc => {
        if (inc.status === 'solved') return;

        if (currentUser.isFirstReport) {
            const student = studentDatabase[inc.admNo];
            if (student && (student.teacher === currentUser.name || student.coordinator === currentUser.name)) {
                if (!inc.takenOver) pendingCount++;
            }
        } else {
            if (inc.escalatedTo === currentUser.role && !inc.viewedBy?.includes(currentUser.name)) {
                escalatedCount++;
            }
        }
    });

    if (pendingCount > 0) {
        alert(`🔔 You have ${pendingCount} new incident(s) to review!`);
    }
    if (escalatedCount > 0) {
        alert(`🔴 You have ${escalatedCount} escalated case(s) requiring your attention!`);
    }

    notificationsAlreadyShown = true;
}

function handleAdmLookup(val) {
    const studentNameInput = document.getElementById('student-name');
    const studentClassInput = document.getElementById('student-class');
    const key = val.toUpperCase().trim();

    if (studentDatabase[key]) {
        studentNameInput.value = studentDatabase[key].name;
        studentClassInput.value = studentDatabase[key].class;
        studentNameInput.style.borderColor = "var(--success)";
        studentClassInput.style.borderColor = "var(--success)";
    } else {
        studentNameInput.value = "";
        studentClassInput.value = "";
        studentNameInput.style.borderColor = "var(--border)";
        studentClassInput.style.borderColor = "var(--border)";
    }
}

function handleSubmit() {
    const admNo = document.getElementById('adm-number').value.trim();
    const name = document.getElementById('student-name').value;
    const desc = document.getElementById('student-desc').value;

    if (!name || !studentDatabase[admNo]) {
        alert("Please enter a valid Admission Number first.");
        return;
    }

    const incidentId = nextIncidentId++;
    incidents[incidentId] = {
        id: incidentId,
        admNo: admNo,
        studentName: name,
        studentClass: studentDatabase[admNo].class,
        description: desc || "No description provided.",
        status: 'pending',
        takenOver: false,
        handler: null,
        escalatedTo: null,
        escalatedBy: null,
        viewedBy: [],
        timestamp: new Date().toLocaleString()
    };

    alert(`Success! Report #${incidentId} submitted for ${name}.`);
    alert("The Class Teacher and Coordinator have been notified.");
    // Refresh dashboard to show the new incident in the list
    updateDashboard();

    document.getElementById('incident-form').reset();
    document.getElementById('adm-number').value = 'B/';
}

function updateDashboard() {
    if (!currentUser) return;

    // Find incidents relevant to current user (including solved)
    let relevantIncidents = Object.values(incidents).filter(inc => {
        const student = studentDatabase[inc.admNo];
        if (!student) return false;

        if (currentUser.isFirstReport) {
            return student.teacher === currentUser.name || student.coordinator === currentUser.name;
        } else if (currentUser.role === 'senior-mistress') {
            return student.sm === currentUser.name && (!inc.escalatedTo || inc.escalatedTo === 'senior-mistress');
        } else if (currentUser.role === 'head-mistress') {
            return student.hm === currentUser.name && (!inc.escalatedTo || inc.escalatedTo === 'head-mistress');
        } else if (currentUser.role === 'vice-principal') {
            return student.vp === currentUser.name && (!inc.escalatedTo || inc.escalatedTo === 'vice-principal');
        } else if (currentUser.role === 'principal') {
            return inc.escalatedTo === 'principal' || inc.status === 'solved'; // Principal sees all solved too
        }
        return false;
    });

    updatePrincipalStats();

    // Render the list of incidents for WHATEVER view is active
    const activeView = document.querySelector('.view.active');
    if (activeView) {
        const listEl = activeView.querySelector('.incident-list');
        if (listEl) {
            listEl.innerHTML = relevantIncidents.length > 0 ? relevantIncidents.map(inc => {
                const statusTag = inc.status === 'solved' ? 'tag-solved' : inc.takenOver ? 'tag-review' : 'tag-pending';
                const statusText = inc.status === 'solved' ? 'SOLVED' : inc.takenOver ? 'UNDER REVIEW' : 'PENDING';
                return `
                    <li class="incident-item" onclick="displayIncident(incidents[${inc.id}])" style="cursor:pointer; border-left: 4px solid var(--info); display: block; margin-bottom: 0.5rem; transition: transform 0.2s;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.2rem;">
                            <h4 style="margin: 0; font-size: 0.95rem;">Case #${inc.id} - ${inc.studentName}</h4>
                            <span class="status-tag ${statusTag}" style="font-size: 0.7rem;">${statusText}</span>
                        </div>
                        <small style="color: var(--text-muted); font-size: 0.75rem;">${inc.timestamp}</small>
                    </li>`;
            }).reverse().join('') : '<p style="text-align:center; padding: 1rem; color: var(--text-muted);">No incidents found.</p>';
        }
    }

    if (relevantIncidents.length > 0) {
        displayIncident(relevantIncidents[relevantIncidents.length - 1]);
    }
}

function updatePrincipalStats() {
    const allIncidents = Object.values(incidents);
    const total = allIncidents.length;
    const solved = allIncidents.filter(inc => inc.status === 'solved').length;
    const escalated = allIncidents.filter(inc => inc.status !== 'solved' && inc.escalatedTo).length;
    const pending = allIncidents.filter(inc => inc.status !== 'solved' && !inc.escalatedTo).length;

    const elements = {
        'total-cases-count': total,
        'pending-cases-count': pending,
        'escalated-cases-count': escalated,
        'solved-cases-count': solved
    };

    for (const [id, count] of Object.entries(elements)) {
        const el = document.getElementById(id);
        if (el) el.innerText = count;
    }
}

function displayIncident(incident) {
    if (!incident) return;

    const student = studentDatabase[incident.admNo];
    if (!student) return;

    // Mark as viewed
    if (!incident.viewedBy.includes(currentUser.name)) {
        incident.viewedBy.push(currentUser.name);
    }

    // Update bio screen based on role
    // Update bio screen with full student data for all roles
    updateBioScreen(
        student.name,
        incident.admNo,
        student.class,
        student.teacher,
        student.coordinator,
        student.sm || student.vp,
        student.hm || 'N/A'
    );

    // Show description only if taken over OR user is handler OR first report
    const canSeeDescription = incident.takenOver || currentUser.isFirstReport || incident.handler === currentUser.name;

    const descElements = ['teacher-desc-preview', 'senior-mistress-desc', 'head-mistress-desc', 'principal-desc'];
    descElements.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.innerText = canSeeDescription ? incident.description : "Take over this case to view the full description.";
        }
    });

    // Update handler UI
    updateHandlerUI(incident);

    // Update escalation info if exists
    if (incident.escalatedBy) {
        const escalationInfo = document.querySelectorAll('.escalation-info');
        escalationInfo.forEach(el => {
            el.style.display = 'block';
            el.innerText = `Escalated by: ${incident.escalatedBy}`;
        });
    }
}

function updateBioScreen(name, admNo, classSection, teacher, coordinator, sm, hm) {
    let bioHTML = '';

    if (currentUser.isFirstReport) {
        // Specialized formatting for Teachers/Coordinators
        bioHTML = `
            <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 1.25rem; border-radius: var(--radius-md); color: white; margin-bottom: 1.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border-left: 5px solid #60a5fa;">
                <div style="display: flex; align-items: center; gap: 1.25rem;">
                    <div style="width: 55px; height: 55px; background: rgba(255,255,255,0.15); border: 2px solid rgba(255,255,255,0.4); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; font-weight: 800; backdrop-filter: blur(4px);">
                        ${name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div style="flex: 1;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div>
                                <h3 style="margin: 0; font-size: 1.25rem; letter-spacing: -0.025em;">${name}</h3>
                                <p style="margin: 2px 0 0 0; opacity: 0.85; font-size: 0.85rem; display: flex; align-items: center; gap: 0.5rem;">
                                    <span style="background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 4px; font-weight: 600;">CLASS ${classSection}</span>
                                    <span>•</span>
                                    <span>ID: ${admNo}</span>
                                </p>
                            </div>
                            <div style="text-align: right;">
                                <span style="font-size: 0.7rem; text-transform: uppercase; opacity: 0.7; font-weight: 700; display: block; margin-bottom: 2px;">Authority Chain</span>
                                <div style="font-size: 0.9rem; font-weight: 600;">T: ${teacher} | C: ${coordinator}</div>
                                <div style="font-size: 0.8rem; font-weight: 500; opacity: 0.9; margin-top: 2px;">SM: ${sm} | HM: ${hm}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="escalation-info" style="display: none; background: #fffbeb; padding: 0.75rem; border-radius: var(--radius-sm); color: #92400e; font-size: 0.9rem; margin-bottom: 1rem; border: 1px solid #fcd34d;"></div>
        `;
    } else {
        // Standard full formatting for higher authorities
        bioHTML = `
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 1.5rem; border-radius: var(--radius-md); color: white; margin-bottom: 1.5rem;">
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div style="width: 60px; height: 60px; background: white; color: #667eea; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 800;">
                        ${name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div style="flex: 1;">
                        <h3 style="margin: 0 0 0.25rem 0; font-size: 1.3rem;">Student Information</h3>
                        <p style="margin: 0; opacity: 0.9; font-size: 0.9rem;">Reported Incident Case</p>
                    </div>
                </div>
                <div style="margin-top: 1rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 0.75rem;">
                    <div><span style="opacity: 0.8; font-size: 0.75rem; text-transform: uppercase;">Name</span><br><strong>${name}</strong></div>
                    ${admNo ? `<div><span style="opacity: 0.8; font-size: 0.75rem; text-transform: uppercase;">Adm No</span><br><strong>${admNo}</strong></div>` : ''}
                    <div><span style="opacity: 0.8; font-size: 0.75rem; text-transform: uppercase;">Class</span><br><strong>${classSection}</strong></div>
                    ${teacher ? `<div><span style="opacity: 0.8; font-size: 0.75rem; text-transform: uppercase;">Teacher</span><br><strong>${teacher}</strong></div>` : ''}
                    ${coordinator ? `<div><span style="opacity: 0.8; font-size: 0.75rem; text-transform: uppercase;">Coordinator</span><br><strong>${coordinator}</strong></div>` : ''}
                    ${sm ? `<div><span style="opacity: 0.8; font-size: 0.75rem; text-transform: uppercase;">Senior Mistress</span><br><strong>${sm}</strong></div>` : ''}
                    ${hm && hm !== 'N/A' ? `<div><span style="opacity: 0.8; font-size: 0.75rem; text-transform: uppercase;">Head Mistress</span><br><strong>${hm}</strong></div>` : ''}
                </div>
            </div>
            <div class="escalation-info" style="display: none; background: #fef3c7; padding: 0.75rem; border-radius: var(--radius-sm); color: #92400e; font-size: 0.9rem; margin-bottom: 1rem; border: 1px solid #fcd34d;"></div>
        `;
    }

    const bioContainers = document.querySelectorAll('.bio-container');
    bioContainers.forEach(container => {
        container.innerHTML = bioHTML;
    });
}

function handleEscalate() {
    // Check all possible escalation dropdowns
    const level = document.getElementById('escalation-level')?.value ||
        document.getElementById('escalation-level-sm')?.value ||
        document.getElementById('escalation-level-hm')?.value ||
        document.getElementById('escalation-level-vp')?.value || '';
    if (!level) {
        alert("Please select an authority to escalate to.");
        return;
    }

    // Find current incident
    const currentIncident = Object.values(incidents).find(inc => {
        const student = studentDatabase[inc.admNo];
        if (!student) return false;
        if (currentUser.isFirstReport) {
            return (student.teacher === currentUser.name || student.coordinator === currentUser.name) && inc.status !== 'solved';
        }
        return inc.handler === currentUser.name && inc.status !== 'solved';
    });

    if (!currentIncident) {
        alert("No active case found to escalate.");
        return;
    }

    if (!currentIncident.takenOver || currentIncident.handler !== currentUser.name) {
        alert("You must take over this case before escalating it.");
        return;
    }

    const authorityName = {
        'senior-mistress': 'Senior Mistress',
        'head-mistress': 'Head Mistress',
        'vice-principal': 'Vice Principal',
        'principal': 'Principal'
    }[level];

    currentIncident.escalatedTo = level;
    currentIncident.escalatedBy = currentUser.name;
    currentIncident.takenOver = false;
    currentIncident.handler = null;

    alert(`Escalation Successful!\n\nCase #${currentIncident.id} has been escalated to ${authorityName}.\nAction performed by: ${currentUser.name}`);

    updateHandlerUI(currentIncident);
}

function handleTakeOver() {
    if (!currentUser) {
        alert("Error: No user logged in.");
        return;
    }

    const currentIncident = Object.values(incidents).find(inc => {
        const student = studentDatabase[inc.admNo];
        if (!student) return false;

        if (currentUser.isFirstReport) {
            return (student.teacher === currentUser.name || student.coordinator === currentUser.name) && inc.status !== 'solved';
        } else if (currentUser.role === 'senior-mistress') {
            return student.sm === currentUser.name && inc.status !== 'solved' && (!inc.escalatedTo || inc.escalatedTo === 'senior-mistress');
        } else if (currentUser.role === 'head-mistress') {
            return student.hm === currentUser.name && inc.status !== 'solved' && (!inc.escalatedTo || inc.escalatedTo === 'head-mistress');
        } else if (currentUser.role === 'vice-principal') {
            return student.vp === currentUser.name && inc.status !== 'solved' && (!inc.escalatedTo || inc.escalatedTo === 'vice-principal');
        } else if (currentUser.role === 'principal') {
            return inc.status !== 'solved' && inc.escalatedTo === 'principal';
        }
        return false;
    });

    if (!currentIncident) {
        alert("No active case found.");
        return;
    }

    if (currentIncident.status === 'solved') return;

    if (currentIncident.takenOver && currentIncident.handler !== currentUser.name) {
        alert(`This case is already being handled by ${currentIncident.handler}.`);
        return;
    }

    if (confirm(`Do you want to take over this case as ${currentUser.name}?`)) {
        currentIncident.takenOver = true;
        currentIncident.handler = currentUser.name;
        updateHandlerUI(currentIncident);
        displayIncident(currentIncident);
        alert(`You have successfully taken over this case.`);
    }
}

function handleSolve() {
    if (!currentUser) return;

    const currentIncident = Object.values(incidents).find(inc => inc.handler === currentUser.name && inc.status !== 'solved');

    if (!currentIncident) {
        alert("No active case found that you're handling.");
        return;
    }

    if (confirm("Are you sure you want to mark this case as SOLVED?")) {
        currentIncident.status = 'solved';
        currentIncident.solvedBy = currentUser.name;

        const tag = document.getElementById('incident-status-badget');
        if (tag) {
            tag.innerText = "SOLVED";
            tag.className = "status-tag tag-solved";
        }

        alert(`Case #${currentIncident.id} has been closed and archived.`);
        updateHandlerUI(currentIncident);
    }
}

function updateHandlerUI(incident) {
    if (!incident) return;

    const handlerDisplays = document.querySelectorAll('.handler-display');
    const btnTakeOvers = document.querySelectorAll('.btn-takeover');
    const btnSolveds = document.querySelectorAll('.btn-solved');

    if (incident.status === 'solved') {
        handlerDisplays.forEach(el => {
            el.style.display = 'block';
            el.innerHTML = `<strong>Case Solved By:</strong> ${incident.solvedBy}`;
            el.style.background = '#dcfce7';
            el.style.color = '#166534';
            el.style.borderColor = '#86efac';
        });
        btnTakeOvers.forEach(btn => btn.style.display = 'none');
        btnSolveds.forEach(btn => btn.style.display = 'none');
    } else if (incident.takenOver) {
        handlerDisplays.forEach(el => {
            el.style.display = 'block';
            el.innerHTML = `<strong>Taken Over By:</strong> ${incident.handler}`;
            el.style.background = '#fffbeb';
            el.style.color = '#92400e';
            el.style.borderColor = '#fcd34d';
        });
        btnTakeOvers.forEach(btn => btn.style.display = 'none');

        if (incident.handler === currentUser.name) {
            btnSolveds.forEach(btn => btn.style.display = 'block');
        } else {
            btnSolveds.forEach(btn => btn.style.display = 'none');
        }
    } else {
        handlerDisplays.forEach(el => el.style.display = 'none');
        btnTakeOvers.forEach(btn => btn.style.display = 'block');
        btnSolveds.forEach(btn => btn.style.display = 'none');
    }
}

function clearPastData() {
    if (confirm("Are you sure you want to clear all past incident data? This action cannot be undone.")) {
        incidents = {};
        nextIncidentId = 47;
        alert("All data has been cleared successfully.");
        location.reload();
    }
}

// Admission number input protection
function seatCaret(input, pos) {
    if (input.setSelectionRange) {
        input.focus();
        input.setSelectionRange(pos, pos);
    }
}

function handleAdmInput(input) {
    if (!input.value.startsWith('B/')) {
        input.value = 'B/';
    }
    handleAdmLookup(input.value);
}

function protectPrefix(e, input) {
    const pos = input.selectionStart;
    if ((e.key === 'Backspace' || e.key === 'Delete') && pos <= 2) {
        e.preventDefault();
    }
    if (pos < 2 && e.key.length === 1) {
        e.preventDefault();
    }
}

function handlePaste(e, input) {
    e.preventDefault();
    const paste = (e.clipboardData || window.clipboardData).getData('text');
    const currentValue = input.value;
    const result = currentValue.substring(0, 2) + paste;
    input.value = result;
    handleAdmLookup(result);
}

window.onload = () => {
    console.log("School Safety Hub Initialized");
};