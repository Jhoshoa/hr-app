const names = {
  verdant: {
    label: "Concept 01",
    title: "Verdant Operations",
    subtitle: "A familiar HR profile-centered system with a fresh green identity, clear tabs, and low-friction administrative workflows.",
    palette: ["#2f8f4e", "#7cb518", "#173329", "#e3f3e8", "#ffffff"]
  },
  coastal: {
    label: "Concept 02",
    title: "Coastal Clarity",
    subtitle: "A calm teal workspace optimized for scanning lists, approvals, employee records, and operational dashboards.",
    palette: ["#007c89", "#4aa3a2", "#102d35", "#dff3f4", "#ffffff"]
  },
  warm: {
    label: "Concept 03",
    title: "Warm Executive",
    subtitle: "A refined warm-neutral direction for an elegant HR platform with friendly surfaces and confident data presentation.",
    palette: ["#9c5f20", "#b8792f", "#2e2a22", "#f4e8d6", "#ffffff"]
  }
};

const people = [
  ["MR", "Mariela Rojas", "HR Manager", "People Ops", "Active"],
  ["AC", "Andres Campos", "Engineering Lead", "Technology", "Active"],
  ["LC", "Lucia Choque", "Recruiter", "Talent", "Active"],
  ["DS", "Diego Suarez", "Finance Analyst", "Finance", "Active"]
];

function header(active = "People") {
  const items = ["Dashboard", "People", "Leave", "Documents", "Onboarding", "Recruiting", "Reports", "Settings"];
  return `
    <div class="topbar">
      <div class="brand"><span class="mark">HR</span><span>AndesHR</span></div>
      <div class="nav">${items.map((item) => `<span class="${item === active ? "active" : ""}">${item}</span>`).join("")}</div>
      <div class="search">Search employees, files...</div>
    </div>
  `;
}

function employeeHero(tab = "Personal") {
  const tabs = ["Personal", "Job", "Time Off", "Documents", "Training", "Notes"];
  return `
    <div class="hero">
      <div class="avatar">MR</div>
      <div>
        <h2>Mariela Rojas</h2>
        <p>HR Manager · Cochabamba · Full-time</p>
      </div>
      <div class="actions">
        <button>Request change</button>
        <button class="primary">Edit profile</button>
      </div>
    </div>
    <div class="tabs">${tabs.map((item) => `<span class="${item === tab ? "active" : ""}">${item}</span>`).join("")}</div>
  `;
}

function shell() {
  return `
    <article class="screen wide">
      ${header("Dashboard")}
      <div class="hero">
        <div class="avatar">AR</div>
        <div>
          <h2>Good morning, Ana</h2>
          <p>Globex Bolivia · 284 employees · Spanish default · BOB payroll exports</p>
        </div>
        <div class="actions"><button>Invite user</button><button class="primary">Add employee</button></div>
      </div>
      <div class="layout">
        <aside class="sidebar">
          <div class="side-block"><strong>Tenant</strong>Globex Bolivia</div>
          <div class="side-block"><strong>Role</strong>HR Admin</div>
          <div class="side-block"><strong>Shortcuts</strong>Approvals<br>Missing docs<br>Imports</div>
        </aside>
        <main class="content">
          <div class="section-head"><h2>Authenticated app shell</h2><span class="status">Permission aware</span></div>
          <div class="metric-row">
            <div class="metric"><span>Employees</span><strong>284</strong></div>
            <div class="metric"><span>Pending approvals</span><strong>18</strong></div>
            <div class="metric"><span>Open jobs</span><strong>7</strong></div>
            <div class="metric"><span>Missing docs</span><strong>31</strong></div>
          </div>
          <div class="panel-grid">
            <div class="panel"><h2>Navigation rules</h2><p>Sections are shown by permission, with tenant context attached to every API request.</p></div>
            <div class="panel"><h2>Notifications</h2><p>5 unread · 2 approvals due today</p></div>
          </div>
        </main>
      </div>
    </article>
  `;
}

function dashboard() {
  return `
    <article class="screen">
      ${header("Dashboard")}
      <div class="content">
        <div class="section-head"><h2>Dashboard</h2><button class="primary">Export summary</button></div>
        <div class="metric-row">
          <div class="metric"><span>Headcount</span><strong>284</strong></div>
          <div class="metric"><span>New hires</span><strong>12</strong></div>
          <div class="metric"><span>PTO this week</span><strong>23</strong></div>
          <div class="metric"><span>Onboarding</span><strong>9</strong></div>
        </div>
        <div class="panel-grid">
          <div class="panel"><h2>Headcount trend</h2><div class="chart"></div></div>
          <div class="panel"><h2>Needs attention</h2><div class="list"><div class="note">8 leave requests waiting for managers</div><div class="note">31 required documents missing</div></div></div>
        </div>
      </div>
    </article>
  `;
}

function employeeList() {
  return `
    <article class="screen">
      ${header("People")}
      <div class="content">
        <div class="section-head"><h2>Employee list</h2><div class="actions"><button>Import</button><button class="primary">New employee</button></div></div>
        <table>
          <thead><tr><th>Name</th><th>Department</th><th>Manager</th><th>Status</th></tr></thead>
          <tbody>${people.map((p) => `<tr><td>${p[1]}</td><td>${p[3]}</td><td>${p[0] === "MR" ? "COO" : "Mariela"}</td><td><span class="status">${p[4]}</span></td></tr>`).join("")}</tbody>
        </table>
      </div>
    </article>
  `;
}

function employeeProfile() {
  return `
    <article class="screen wide">
      ${header("People")}
      ${employeeHero("Job")}
      <div class="layout">
        <aside class="sidebar">
          <div class="side-block"><strong>Contact</strong>+591 7123 4567<br>mariela@globex.bo</div>
          <div class="side-block"><strong>Hire date</strong>Aug 8, 2021<br>4y · 9m</div>
          <div class="side-block"><strong>Manager</strong>Carlos Vega<br>Operations Director</div>
        </aside>
        <main class="content">
          <div class="section-head"><h2>Job information</h2><button>Update job</button></div>
          <table>
            <thead><tr><th>Effective</th><th>Location</th><th>Department</th><th>Job title</th><th>Reports to</th></tr></thead>
            <tbody>
              <tr><td>05/01/2024</td><td>Cochabamba</td><td>People Ops</td><td>HR Manager</td><td>Carlos Vega</td></tr>
              <tr><td>03/15/2022</td><td>Remote</td><td>People Ops</td><td>HR Generalist</td><td>Valeria Paz</td></tr>
            </tbody>
          </table>
        </main>
      </div>
    </article>
  `;
}

function employeeForm() {
  return `
    <article class="screen">
      ${header("People")}
      <div class="content">
        <div class="section-head"><h2>Employee create/edit</h2><button class="primary">Save employee</button></div>
        <div class="form-grid">
          ${["First name: Natalia", "Last name: Flores", "Work email: natalia@globex.bo", "Department: Engineering", "Job title: QA Analyst", "Location: Santa Cruz", "Manager: Andres Campos", "Start date: Jun 3, 2026"].map((f) => {
            const [label, value] = f.split(": ");
            return `<div class="field"><label>${label}</label><div>${value}</div></div>`;
          }).join("")}
        </div>
      </div>
    </article>
  `;
}

function directory() {
  return `
    <article class="screen">
      ${header("People")}
      <div class="content">
        <div class="section-head"><h2>Directory</h2><span class="status">Public fields only</span></div>
        <div class="list">${people.map((p) => `<div class="list-item"><span class="mini-avatar">${p[0]}</span><div><strong>${p[1]}</strong><p>${p[2]} · ${p[3]}</p></div><button>View</button></div>`).join("")}</div>
      </div>
    </article>
  `;
}

function leaveOverview() {
  return `
    <article class="screen">
      ${header("Leave")}
      <div class="content">
        <div class="section-head"><h2>Leave overview</h2><button class="primary">Request time off</button></div>
        <div class="metric-row">
          <div class="metric"><span>Vacation</span><strong>12.5</strong></div>
          <div class="metric"><span>Sick</span><strong>6</strong></div>
          <div class="metric"><span>Pending</span><strong>2</strong></div>
          <div class="metric"><span>Holidays</span><strong>4</strong></div>
        </div>
        <div class="panel"><h2>Upcoming team time off</h2><table><tbody><tr><td>Diego Suarez</td><td>May 20-22</td><td><span class="status">Approved</span></td></tr><tr><td>Lucia Choque</td><td>May 27</td><td><span class="status">Pending</span></td></tr></tbody></table></div>
      </div>
    </article>
  `;
}

function leaveForm() {
  return `
    <article class="screen">
      ${header("Leave")}
      <div class="content">
        <div class="section-head"><h2>Leave request form</h2><button class="primary">Submit request</button></div>
        <div class="form-grid">
          ${["Leave type: Vacation", "Start date: Jun 10, 2026", "End date: Jun 14, 2026", "Duration: 5 days", "Approver: Carlos Vega", "Balance after: 7.5 days"].map((f) => {
            const [label, value] = f.split(": ");
            return `<div class="field"><label>${label}</label><div>${value}</div></div>`;
          }).join("")}
        </div>
        <div class="panel" style="margin-top:12px"><h2>Reason</h2><p>Family trip. Coverage will be handled by Lucia.</p></div>
      </div>
    </article>
  `;
}

function documentsHome() {
  return `
    <article class="screen">
      ${header("Documents")}
      <div class="content">
        <div class="section-head"><h2>Documents home</h2><button class="primary">Upload</button></div>
        <div class="metric-row">
          <div class="metric"><span>Missing</span><strong>31</strong></div>
          <div class="metric"><span>Expiring</span><strong>9</strong></div>
          <div class="metric"><span>Policies</span><strong>14</strong></div>
          <div class="metric"><span>Ack due</span><strong>46</strong></div>
        </div>
        <table><thead><tr><th>Document</th><th>Owner</th><th>Status</th></tr></thead><tbody><tr><td>Contract addendum</td><td>Natalia Flores</td><td><span class="status">Missing</span></td></tr><tr><td>ID certificate</td><td>Diego Suarez</td><td><span class="status">Expiring</span></td></tr></tbody></table>
      </div>
    </article>
  `;
}

function onboarding() {
  return `
    <article class="screen">
      ${header("Onboarding")}
      <div class="content">
        <div class="section-head"><h2>Onboarding overview</h2><button class="primary">Start packet</button></div>
        <div class="panel-grid">
          <div class="panel"><h2>Active packets</h2><div class="chart"></div></div>
          <div class="panel"><h2>Overdue tasks</h2><strong style="font-size:42px">7</strong><p>IT equipment and policy acknowledgements need attention.</p></div>
        </div>
        <div class="list" style="margin-top:12px"><div class="list-item"><span class="mini-avatar">NF</span><div><strong>Natalia Flores</strong><p>QA Analyst · 68% complete</p></div><span class="status">In progress</span></div></div>
      </div>
    </article>
  `;
}

function recruiting() {
  return `
    <article class="screen wide">
      ${header("Recruiting")}
      <div class="content">
        <div class="section-head"><h2>Recruiting job pipeline</h2><button class="primary">Add candidate</button></div>
        <div class="kanban">
          ${["Applied", "Screen", "Interview", "Offer"].map((lane, index) => `<div class="lane"><h3>${lane}</h3><div class="list"><div class="mini-card"><strong>${["Paola", "Mario", "Elena", "Sofia"][index]} ${["R.", "V.", "Q.", "T."][index]}</strong><p>${["Frontend Engineer", "QA Analyst", "People Ops", "Backend Engineer"][index]}</p><span class="status">${index + 2} days</span></div><div class="mini-card"><strong>${["Jorge", "Camila", "Luis", "Ana"][index]}</strong><p>Source: Referral</p></div></div></div>`).join("")}
        </div>
      </div>
    </article>
  `;
}

function reports() {
  return `
    <article class="screen">
      ${header("Reports")}
      <div class="content">
        <div class="section-head"><h2>Reports home</h2><button class="primary">New saved report</button></div>
        <div class="list">
          ${["Headcount by department", "Leave balances", "Missing documents", "Onboarding progress", "Candidate pipeline"].map((report) => `<div class="list-item"><span class="mini-avatar">R</span><div><strong>${report}</strong><p>Filters, columns, CSV/XLSX export</p></div><button>Open</button></div>`).join("")}
        </div>
      </div>
    </article>
  `;
}

function settings() {
  return `
    <article class="screen">
      ${header("Settings")}
      <div class="content">
        <div class="section-head"><h2>Settings users and roles</h2><button class="primary">Invite user</button></div>
        <table>
          <thead><tr><th>User</th><th>Role</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td>Ana Salinas</td><td>Owner</td><td><span class="status">Active</span></td></tr>
            <tr><td>Mariela Rojas</td><td>HR Admin</td><td><span class="status">Active</span></td></tr>
            <tr><td>Lucia Choque</td><td>Recruiter</td><td><span class="status">Invited</span></td></tr>
          </tbody>
        </table>
        <div class="panel" style="margin-top:12px"><h2>Role permissions</h2><p>Manage access to compensation, documents, leave approvals, reports, and audit events.</p></div>
      </div>
    </article>
  `;
}

function render() {
  const design = document.body.dataset.design || "verdant";
  const data = names[design];
  document.body.classList.add(`theme-${design}`);
  document.querySelector("#app").innerHTML = `
    <main class="board">
      <section class="intro">
        <div>
          <p class="eyebrow">${data.label}</p>
          <h1>${data.title}</h1>
          <p>${data.subtitle}</p>
        </div>
        <div class="palette">${data.palette.map((color) => `<span class="swatch" style="background:${color}"></span>`).join("")}</div>
      </section>
      <section class="grid">
        ${shell()}
        ${dashboard()}
        ${employeeList()}
        ${employeeProfile()}
        ${employeeForm()}
        ${directory()}
        ${leaveOverview()}
        ${leaveForm()}
        ${documentsHome()}
        ${onboarding()}
        ${recruiting()}
        ${reports()}
        ${settings()}
      </section>
    </main>
  `;
}

render();
