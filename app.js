// Role switching logic
function switchRole(role) {
    // Update buttons
    document.querySelectorAll('.role-btn').forEach(btn => {
        btn.classList.remove('active');
        // Handle names that are longer/shorter or have spaces
        const btnText = btn.innerText.toLowerCase().replace(/\s/g, '-');
        if (btnText.includes(role)) {
            btn.classList.add('active');
        }
    });

    // Update views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });

    const targetView = document.getElementById(`${role}-view`);
    if (targetView) targetView.classList.add('active');
}

// Student View Logic: Admission Number Lookup Mock
const studentDatabase = {
    "B/6353": { name: "Alex Johnson", class: "7B" },
    "B/1001": { name: "Sarah Lee", class: "8A" },
    "B/1002": { name: "John Doe", class: "9C" },
    "B/11676": { name: "Advaith", class: "7P" }
};

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
    const name = document.getElementById('student-name').value;
    const desc = document.getElementById('student-desc').value;

    if (!name) {
        alert("Please enter a valid Admission Number first.");
        return;
    }

    // Sync description to all authority previews
    const previews = ['teacher-desc-preview', 'senior-mistress-desc', 'head-mistress-desc', 'principal-desc'];
    previews.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerText = desc || "No description provided.";
    });

    alert(`Success! Report submitted for ${name}.`);
    switchRole('teacher');
}

function handleEscalate() {
    const level = document.getElementById('escalation-level').value;
    if (!level) {
        alert("Please select an authority to escalate to.");
        return;
    }

    const authorityName = {
        'senior-mistress': 'Senior Mistress',
        'head-mistress': 'Head Mistress',
        'principal': 'Principal'
    }[level];

    alert(`Case #46 has been officially ESCALATED to the ${authorityName}.`);
    switchRole(level);
}

// Initialize
window.onload = () => {
    console.log("School Safety Hub Initialized");
};
