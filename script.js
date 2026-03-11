// Phase 2: Global State [cite: 43]
let currentUser = null;

window.db = { accounts: [], departments: [], employees: [], requests: [] };
const STORAGE_KEY = 'ipt_demo_v1';  // Phase 4 [cite: 90]

let editingDeptIndex = null;
let editingAccountIndex = null;
// Phase 4: Persistence [cite: 91, 96]

function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(window.db));
}

function loadFromStorage() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
        window.db = JSON.parse(data);
        // CRITICAL: Ensure all arrays exist even in old data
        if (!window.db.requests) window.db.requests = [];
        if (!window.db.employees) window.db.employees = [];
        if (!window.db.departments) window.db.departments = [];
        if (!window.db.accounts) window.db.accounts = [];
    } else {
        // Seed initial data
        window.db = {
            accounts: [{
                first: "Admin", last: "User", email: "admin@example.com", 
                password: "Password123!", role: "admin", verified: true 
            }],
            departments: [{name: "Engineering", description: "Tech team"}, {name: "HR", description: "People ops"}],
            employees: [],
            requests: [] 
        };
        saveToStorage();
    }
}

// Phase 2: Routing Logic [cite: 45]
function handleRouting() {
    const hash = window.location.hash || '#/';
    const pages = document.querySelectorAll('.page');
    pages.forEach(p => p.classList.remove('active'));

    const routeMap = {
        '#/': 'home-page',
        '#/login': 'login-page',
        '#/register': 'register-page',
        '#/verify-email': 'verify-email-page',
        '#/profile': 'profile-page',
        '#/employees': 'employees-page',
        '#/accounts': 'accounts-page',
        '#/departments': 'departments-page',
        '#/requests': 'requests-page'
    };

    const targetId = routeMap[hash] || 'home-page';
    const targetElement = document.getElementById(targetId);
    
    if (targetElement) {
        targetElement.classList.add('active');
    }

    // --- Protected Route Logic ---
    if (['#/profile', '#/requests'].includes(hash) && !currentUser) {
        window.location.hash = '#/login';
        return;
    }
    
    // --- Admin Protection ---
    if (['#/employees', '#/accounts', '#/departments'].includes(hash) && (!currentUser || currentUser.role !== 'admin')) {
        window.location.hash = '#/';
        return;
    }

    // --- UPDATED: Trigger Rendering for Phase 6 & 7 ---
    if (hash === '#/profile') renderProfile();
    
    // Phase 6 Rendering
    if (hash === '#/employees') renderEmployeesTable();
    if (hash === '#/accounts') renderAccountsList();
    if (hash === '#/departments') renderDepartments();

    // Phase 7 Rendering
    if (hash === '#/requests') renderRequestsList();
}

// Phase 3A: Registration [cite: 56]
// Phase 3A: Registration
function register() {
    const email = document.getElementById('regEmail').value;
    const pass = document.getElementById('regPass').value;
    
    // FIX: Moved to multiple lines to avoid the syntax error
    if (pass.length < 6) {
        alert("Password too short!");
        return; 
    }

    if (window.db.accounts.find(a => a.email === email)) {
        alert("User exists!");
        return;
    }

    const newUser = {
        first: document.getElementById('regFirst').value,
        last: document.getElementById('regLast').value,
        email: email,
        password: pass,
        role: 'user',
        verified: false
    };

    window.db.accounts.push(newUser);
    localStorage.setItem('unverified_email', email);
    saveToStorage(); 
    window.location.hash = '#/verify-email'; 
}

// Phase 3B: Verification [cite: 63]
function simulateVerification() {
    const email = localStorage.getItem('unverified_email');
    const user = window.db.accounts.find(a => a.email === email);
    
    if (user) {
        user.verified = true;
        saveToStorage();
        
        // Show the message on the login page before switching
        const successBox = document.getElementById('loginSuccessMessage');
        if (successBox) {
            successBox.classList.remove('d-none');
        }

        // Redirect to Login page
        window.location.hash = '#/login';
    }
}

// Phase 3C: Login [cite: 70]
function login() {
    
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPassword').value;
    
    const user = window.db.accounts.find(a => a.email === email && a.password === pass && a.verified);
    
    if (user) {
        localStorage.setItem('auth_token', email); 
        setAuthState(true, user); 
        window.location.hash = '#/profile';
    } else {
        alert("Invalid credentials or unverified email!"); 
    }

    document.getElementById('loginSuccessMessage').classList.add('d-none');
}

// Phase 3D: Auth State [cite: 79]
function setAuthState(isAuth, user) {
    currentUser = isAuth ? user : null;
    const body = document.body;
    
    if (isAuth) {
        body.classList.replace('not-authenticated', 'authenticated');
        if (user.role === 'admin') body.classList.add('is-admin');
        document.getElementById('usernameDisplay').innerText = user.first;
    } else {
        body.classList.remove('authenticated', 'is-admin');
        body.classList.add('not-authenticated');
    }
}

// Phase 3E: Logout [cite: 84]
function logout() {
    localStorage.removeItem('auth_token');
    setAuthState(false);
    window.location.hash = '#/';
}

// Phase 5: Profile [cite: 99]
// Phase 5: Profile
function renderProfile() {
    if (!currentUser) return;
    
    document.getElementById('profileContent').innerHTML = `
        <div class="card p-4">
            <h4>${currentUser.first} ${currentUser.last}</h4>
            <p><strong>Email:</strong> ${currentUser.email}</p>
            <p><strong>Role:</strong> ${currentUser.role}</p>
            
            <div class="mt-3">
                <button class="btn btn-outline-primary" onclick="editProfile()">Edit Profile</button>
            </div>
        </div>
    `;
}

// Placeholder for the edit action
function editProfile() {
    // 1. Prompt for new Email
    const newEmail = prompt("Enter new email:", currentUser.email);
    if (!newEmail || newEmail.trim() === "") return;

    // 2. Prompt for new Role
    const newRole = prompt("Enter new role (admin/user):", currentUser.role);
    if (!newRole || newRole.trim() === "") return;

    // 3. Update the data in the Database
    // We find the user in the accounts array to ensure the change is permanent
    const userIndex = window.db.accounts.findIndex(a => a.email === currentUser.email);
    
    if (userIndex !== -1) {
        window.db.accounts[userIndex].email = newEmail;
        window.db.accounts[userIndex].role = newRole.toLowerCase();
        
        // Update the current session state
        currentUser = window.db.accounts[userIndex];
        
        // Update the auth token if the email changed
        localStorage.setItem('auth_token', newEmail);
        
        // Save to storage and refresh the UI
        saveToStorage();
        renderProfile();
        
        // Update the visual state (like the Admin badge in the navbar)
        setAuthState(true, currentUser);
        
        alert("Profile updated successfully!");
    }
}

// Initialization [cite: 52, 97]
window.addEventListener('hashchange', handleRouting);
window.onload = () => {
    loadFromStorage();
    // Check for existing session [cite: 75]
    const token = localStorage.getItem('auth_token');
    if (token) {
        const user = window.db.accounts.find(a => a.email === token);
        if (user) setAuthState(true, user);
    }
    handleRouting();
};

// Toggle form visibility and load departments
function toggleEmployeeForm() {
    const container = document.getElementById('employeeFormContainer');
    container.classList.toggle('d-none');
    
    // Fill the dropdown whenever the form is shown
    if (!container.classList.contains('d-none')) {
        populateDeptDropdown();
    }
}
// Phase 6: Create Employee
function addEmployee() {
    const name = document.getElementById('empName').value;
    const position = document.getElementById('empPos').value;
    const dept = document.getElementById('empDept').value;
    const hireDate = document.getElementById('empHireDate').value;

    if (!name || !position || !dept || !hireDate) {
        return alert("Please fill all fields, including the hire date.");
    }

    const newEmp = {
        id: "EMP-" + (window.db.employees.length + 101),
        name: name,
        position: position,
        dept: dept,
        hireDate: hireDate // Save the date
    };

    window.db.employees.push(newEmp);
    saveToStorage(); 
    renderEmployeesTable(); // Refresh the list
    
    // Clear fields and hide form
    document.getElementById('empName').value = '';
    document.getElementById('empPos').value = '';
    document.getElementById('empDept').value = '';
    document.getElementById('empHireDate').value = '';
    toggleEmployeeForm();
}

// Render the Table
function renderEmployeesTable() {
    const list = document.getElementById('employeesList');
    if (!list) return;

    list.innerHTML = window.db.employees.map((emp, index) => `
        <tr>
            <td>${emp.id}</td>
            <td>${emp.name}</td>
            <td>${emp.position}</td>
            <td><span class="badge bg-secondary">${emp.dept}</span></td>
            <td>${emp.hireDate}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="deleteEmployee(${index})">Delete</button>
            </td>
        </tr>
    `).join('');
}

// Delete Employee
function deleteEmployee(index) {
    if(confirm("Are you sure?")) {
        window.db.employees.splice(index, 1);
        saveToStorage();
        renderEmployeesTable();
    }
}

function renderAccountsList() {
    const list = document.getElementById('accountsList');
    if (!list) return;
    list.innerHTML = window.db.accounts.map((acc, index) => `
        <tr>
            <td>${acc.first} ${acc.last}</td>
            <td>${acc.email}</td>
            <td>${acc.role}</td>
            <td>${acc.verified ? '✅' : '❌'}</td>
            <td>
                <button class="btn btn-sm btn-info" onclick="resetPassword('${acc.email}')">Reset PW</button>
                <button class="btn btn-sm btn-danger" onclick="deleteAccount(${index})">Delete</button>
            </td>
        </tr>
    `).join('');
}

function resetPassword(email) {
    const newPass = prompt("Enter new password for " + email + " (min 6 chars):");
    if (newPass && newPass.length >= 6) {
        const user = window.db.accounts.find(a => a.email === email);
        user.password = newPass;
        saveToStorage();
        alert("Password reset successful!");
    } else if (newPass) {
        alert("Password must be at least 6 characters.");
    }
}

function deleteAccount(index) {
    const acc = window.db.accounts[index];
    // Requirement: Prevent self-deletion
    if (acc.email === currentUser.email) return alert("Security Error: You cannot delete your own admin account!");
    
    if (confirm(`Are you sure you want to delete ${acc.first}?`)) {
        window.db.accounts.splice(index, 1);
        saveToStorage();
        renderAccountsList();
    }
}

function renderDepartments() {
    const list = document.getElementById('departmentsList');
    if (!list) return;

    list.innerHTML = window.db.departments.map((dept, index) => `
        <tr>
            <td><strong>${dept.name}</strong></td>
            <td>${dept.description || 'General Department'}</td>
            <td>
                <button class="btn btn-sm btn-info" onclick="editDept(${index})">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteDept(${index})">Delete</button>
            </td>
        </tr>
    `).join('');
}
// Edit Logic
function editDept(index) {
    const dept = window.db.departments[index];
    editingDeptIndex = index;
    
    // Show form and fill data
    document.getElementById('deptFormContainer').classList.remove('d-none');
    document.getElementById('deptFormTitle').innerText = "Edit Department";
    document.getElementById('deptName').value = dept.name;
    document.getElementById('deptDesc').value = dept.description || '';
}

// Delete Logic
function deleteDept(index) {
    if (confirm("Are you sure you want to delete this department?")) {
        window.db.departments.splice(index, 1);
        saveToStorage();
        renderDepartments();
    }
}

function addEmployee() {
    const id = document.getElementById('empId').value;
    const email = document.getElementById('empEmail').value;
    const pos = document.getElementById('empPos').value;
    const dept = document.getElementById('empDept').value;
    const date = document.getElementById('empHireDate').value;

    // Validation: Email must match an existing account
    const accountExists = window.db.accounts.find(a => a.email === email);
    if (!accountExists) return alert("Error: No account found with that email!");

    if (!id || !pos || !dept || !date) return alert("Fill all fields!");

    window.db.employees.push({ id, email, position: pos, dept, hireDate: date });
    saveToStorage();
    renderEmployeesTable();
    toggleEmployeeForm();
}

let requestItems = [{ name: '', qty: 1 }];

function addNewItemField() {
    const container = document.getElementById('dynamicItemsContainer');
    const newRow = document.createElement('div');
    newRow.className = 'input-group mb-2';
    newRow.innerHTML = `
        <input type="text" class="form-control" placeholder="Item name">
        <input type="number" class="form-control" value="1" style="max-width: 80px;">
        <button class="btn btn-outline-danger" onclick="this.parentElement.remove()">×</button>
    `;
    container.appendChild(newRow);
}

function removeItemField(index) {
    if (requestItems.length > 1) {
        requestItems.splice(index, 1);
        renderModalItems();
    }
}

function renderModalItems() {
    const container = document.getElementById('dynamicItemsContainer');
    container.innerHTML = requestItems.map((item, i) => `
        <div class="input-group mb-2">
            <input type="text" class="form-control" placeholder="Item name" 
                value="${item.name}" onchange="requestItems[${i}].name = this.value">
            <input type="number" class="form-control" value="${item.qty}" style="max-width:80px;"
                onchange="requestItems[${i}].qty = this.value">
            <button class="btn btn-outline-danger" onclick="removeItemField(${i})">×</button>
        </div>
    `).join('') + `<button class="btn btn-sm btn-secondary mt-2" onclick="addNewItemField()">+ Add Item</button>`;
}

function submitRequest() {
    // Safety check: initialize array if it went missing
    if (!window.db.requests) window.db.requests = [];

    const type = document.getElementById('reqType').value;
    const rows = document.querySelectorAll('#dynamicItemsContainer .input-group');
    let items = [];

    rows.forEach(row => {
        const nameInput = row.querySelector('input[type="text"]');
        const qtyInput = row.querySelector('input[type="number"]');
        if (nameInput && nameInput.value.trim() !== "") {
            items.push({ name: nameInput.value, qty: qtyInput.value });
        }
    });

    if (items.length === 0) return alert("Please add at least one item.");

    const newRequest = {
        type: type,
        items: items,
        status: "Pending",
        date: new Date().toLocaleDateString(),
        employeeEmail: currentUser.email 
    };

    window.db.requests.push(newRequest);
    saveToStorage(); 
    
    // UI Cleanup
    const modalElement = document.getElementById('requestModal');
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) modalInstance.hide();
    
    renderRequestsList();
    
    // Reset the modal fields to 1 empty row
    document.getElementById('dynamicItemsContainer').innerHTML = `
        <div class="input-group mb-2">
            <input type="text" class="form-control" placeholder="Item name">
            <input type="number" class="form-control" value="1" style="max-width: 80px;">
            <button class="btn btn-outline-secondary" onclick="addNewItemField()">+</button>
        </div>
    `;
}
function renderRequestsList() {
    const list = document.getElementById('requestsList');
    const table = document.getElementById('requestsTable');
    const emptyMsg = document.getElementById('emptyRequests');
    
    if (!list || !currentUser) return;

    const isAdmin = currentUser.role === 'admin';
    const displayData = isAdmin ? window.db.requests : window.db.requests.filter(r => r.employeeEmail === currentUser.email);

    if (displayData.length > 0) {
        table.classList.remove('d-none');
        emptyMsg.classList.add('d-none');
        
        list.innerHTML = displayData.map((req, index) => {
            // Logic for status badge color
            let statusClass = "bg-warning text-dark"; 
            if (req.status === "Approved") statusClass = "bg-success";
            if (req.status === "Rejected") statusClass = "bg-danger";

            // Only show buttons if user is Admin and status is Pending
            let actionButtons = '';
            if (isAdmin && req.status === "Pending") {
                actionButtons = `
                    <button class="btn btn-sm btn-success" onclick="updateRequestStatus(${index}, 'Approved')">Approve</button>
                    <button class="btn btn-sm btn-danger" onclick="updateRequestStatus(${index}, 'Rejected')">Reject</button>
                `;
            }

            return `
                <tr>
                    <td>${req.type}</td>
                    <td>${req.items.map(i => `${i.name} (${i.qty})`).join(', ')}</td>
                    <td>${req.date}</td>
                    <td><span class="badge ${statusClass}">${req.status}</span></td>
                    <td>${actionButtons}</td>
                </tr>
            `;
        }).join('');
    } else {
        table.classList.add('d-none');
        emptyMsg.classList.remove('d-none');
    }
}

function updateRequestStatus(index, newStatus) {
    // Update the specific request in the database
    window.db.requests[index].status = newStatus;
    
    // Persist changes to localStorage
    saveToStorage();
    
    // Re-render the table to show updated badges
    renderRequestsList();
}

function toggleDeptForm() {
    const container = document.getElementById('deptFormContainer');
    container.classList.toggle('d-none');
    // Reset form if opening for "Add"
    if (container.classList.contains('d-none')) {
        editingDeptIndex = null;
        document.getElementById('deptName').value = '';
        document.getElementById('deptDesc').value = '';
        document.getElementById('deptFormTitle').innerText = "Add New Department";
    }
}

function saveDepartment() {
    const name = document.getElementById('deptName').value;
    const desc = document.getElementById('deptDesc').value;

    if (!name) return alert("Department name is required!");

    const deptData = { name, description: desc || "No description" };

    if (editingDeptIndex !== null) {
        // Edit existing
        window.db.departments[editingDeptIndex] = deptData;
        editingDeptIndex = null;
    } else {
        // Add new
        window.db.departments.push(deptData);
    }

    saveToStorage(); // Phase 4 Persistence
    renderDepartments(); // Refresh UI
    toggleDeptForm(); // Hide form
}   

function toggleAccountForm() {
    const container = document.getElementById('accountFormContainer');
    container.classList.toggle('d-none');
    
    if (container.classList.contains('d-none')) {
        editingAccountIndex = null;
        document.getElementById('accFormTitle').innerText = "Add New Account";
        clearAccountInputs();
    }
}
function clearAccountInputs() {
    document.getElementById('accFirst').value = '';
    document.getElementById('accLast').value = '';
    document.getElementById('accEmail').value = '';
    document.getElementById('accPass').value = '';
    document.getElementById('accRole').value = 'user';
    document.getElementById('accVerified').checked = false;
}

function saveAccount() {
    const email = document.getElementById('accEmail').value;
    const first = document.getElementById('accFirst').value;
    
    if (!email || !first) return alert("First Name and Email are required.");

    const accountData = {
        first: first,
        last: document.getElementById('accLast').value,
        email: email,
        password: document.getElementById('accPass').value || "Password123!",
        role: document.getElementById('accRole').value,
        verified: document.getElementById('accVerified').checked
    };

    if (editingAccountIndex !== null) {
        // Update existing
        window.db.accounts[editingAccountIndex] = accountData;
    } else {
        // Create new
        window.db.accounts.push(accountData);
    }

    saveToStorage();
    renderAccountsList();
    toggleAccountForm();
}

function renderAccountsList() {
    const list = document.getElementById('accountsList');
    if (!list) return;

    list.innerHTML = window.db.accounts.map((acc, index) => `
        <tr>
            <td>${acc.first} ${acc.last}</td>
            <td>${acc.email}</td>
            <td><span class="badge ${acc.role === 'admin' ? 'bg-danger' : 'bg-secondary'}">${acc.role}</span></td>
            <td>${acc.verified ? '✅' : '❌'}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="editAccount(${index})">Edit</button>
                <button class="btn btn-sm btn-outline-warning" onclick="resetPassword('${acc.email}')">PW</button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteAccount(${index})">Delete</button>
            </td>
        </tr>
    `).join('');
}

function editAccount(index) {
    const acc = window.db.accounts[index];
    editingAccountIndex = index;

    document.getElementById('accountFormContainer').classList.remove('d-none');
    document.getElementById('accFormTitle').innerText = "Edit Account: " + acc.email;

    document.getElementById('accFirst').value = acc.first;
    document.getElementById('accLast').value = acc.last;
    document.getElementById('accEmail').value = acc.email;
    document.getElementById('accRole').value = acc.role;
    document.getElementById('accVerified').checked = acc.verified;
}
function populateDeptDropdown() {
    const dropdown = document.getElementById('empDept');
    if (!dropdown) return;

    // Preserve the first placeholder option
    dropdown.innerHTML = '<option value="">Select Dept</option>';

    // Loop through departments from window.db
    window.db.departments.forEach(dept => {
        const option = document.createElement('option');
        option.value = dept.name;
        option.textContent = dept.name;
        dropdown.appendChild(option);
    });
}