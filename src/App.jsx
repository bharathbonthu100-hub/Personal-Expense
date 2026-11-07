import { useEffect, useState } from "react";
import { supabase, supabaseConfigured } from "./lib/supabase";

const periods = {
  week: ["₹0.00", "June 16–22", [0, 0, 0, 0, 0, 0, 0]],
  month: ["₹0.00", "June 1–22", [0, 0, 0, 0, 0, 0, 0]],
  year: ["₹0.00", "Jan–Jun 2024", [0, 0, 0, 0, 0, 0, 0]]
};

const formatRupees = (value) => `−₹${Number(value).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
const mapExpense = (row) => ({
  id: row.id,
  name: row.name,
  category: row.category,
  date: new Date(`${row.expense_date}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
  amount: formatRupees(row.amount),
  logoClass: "other",
  logo: "•",
  rawAmount: row.amount
});

function NavItem({ icon, children, active, count, onClick }) {
  return <a className={`nav-item${active ? " active" : ""}`} href={`#${String(children).toLowerCase().replaceAll(" ", "-")}`} onClick={onClick}><span className="nav-icon">{icon}</span>{children}{count && <span className="nav-count">{count}</span>}</a>;
}

function SummaryCard({ label, icon, iconClass, amount, change, changeClass, children }) {
  return <article className="summary-card">
    <div className="card-heading"><span className="card-label">{label}</span><span className={`card-icon ${iconClass}`}>{icon}</span></div>
    <div className="metric-amount">{amount}</div>
    <div className="balance-footer"><span className={changeClass}>{change}</span><span>vs. last month</span></div>
    {children}
  </article>;
}

function TransactionRow({ transaction }) {
  const { name, category, date, amount, logoClass, logo, onEdit, onDelete } = transaction;
  return <div className="transaction-row">
    <span className="transaction-detail"><i className={`merchant-logo ${logoClass}`}>{logo}</i><b>{name}</b></span>
    <span><i className={`dot ${category === "Salary" ? "income" : category === "Entertainment" ? "entertainment" : category === "Food & dining" ? "food" : category === "Transport" ? "transport" : "other"}`}></i>{category}</span>
    <span>{date}</span><strong>{amount}</strong>
    <span className="transaction-actions"><button onClick={onEdit} aria-label={`Edit ${name}`}>Edit</button><button onClick={onDelete} aria-label={`Delete ${name}`}>Delete</button></span>
  </div>;
}

function App() {
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [period, setPeriod] = useState("week");
  const [showModal, setShowModal] = useState(false);
  const [expenseRows, setExpenseRows] = useState([]);
  const [form, setForm] = useState({ name: "", amount: "", category: "Food & dining" });
  const [editingId, setEditingId] = useState(null);
  const [profile, setProfile] = useState({ name: "Manikanta", email: "manikanta@example.com" });
  const [showProfile, setShowProfile] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [backendError, setBackendError] = useState("");

  useEffect(() => {
    if (!supabaseConfigured) {
      const savedRows = JSON.parse(localStorage.getItem("clearpath-expenses") || "[]");
      setExpenseRows(savedRows);
      return;
    }
    supabase.from("expenses").select("*").order("created_at", { ascending: false }).then(({ data, error }) => {
      if (error) setBackendError(error.message);
      else setExpenseRows(data.map(mapExpense));
    });
  }, []);

  const addExpense = async (event) => {
    event.preventDefault();
    if (!form.name || !form.amount) return;
    const payload = { name: form.name.trim(), category: form.category, amount: Number(form.amount), expense_date: new Date().toISOString().slice(0, 10) };
    if (supabase) {
      const result = editingId
        ? await supabase.from("expenses").update(payload).eq("id", editingId).select().single()
        : await supabase.from("expenses").insert(payload).select().single();
      if (result.error) {
        setBackendError(result.error.message);
        return;
      }
      const row = mapExpense(result.data);
      setExpenseRows((rows) => editingId ? rows.map((item) => item.id === editingId ? row : item) : [row, ...rows]);
    } else {
      const row = { ...mapExpense({ ...payload, id: editingId || crypto.randomUUID() }), rawAmount: payload.amount };
      setExpenseRows((rows) => {
        const nextRows = editingId ? rows.map((item) => item.id === editingId ? row : item) : [row, ...rows];
        localStorage.setItem("clearpath-expenses", JSON.stringify(nextRows));
        return nextRows;
      });
    }
    setForm({ name: "", amount: "", category: "Food & dining" });
    setEditingId(null);
    setShowModal(false);
  };
  const editExpense = (row) => {
    setForm({ name: row.name, amount: row.rawAmount, category: row.category });
    setEditingId(row.id);
    setShowModal(true);
  };
  const deleteExpense = async (id) => {
    if (supabase) {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) {
        setBackendError(error.message);
        return;
      }
    }
    setExpenseRows((rows) => {
      const nextRows = rows.filter((row) => row.id !== id);
      if (!supabase) localStorage.setItem("clearpath-expenses", JSON.stringify(nextRows));
      return nextRows;
    });
  };
  const saveProfile = (event) => {
    event.preventDefault();
    setShowProfile(false);
  };
  const [total, range, bars] = periods[period];

  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#overview"><span className="brand-mark"><span></span><span></span><span></span></span><span>clearpath</span></a>
      <button className="workspace-switcher" onClick={() => setShowProfile(true)}><span className="workspace-avatar">{profile.name.charAt(0).toUpperCase()}</span><span className="workspace-copy"><strong>{profile.name}</strong><small>{profile.email}</small></span><span className="icon-button">⌄</span></button>
      <nav className="main-nav" aria-label="Main navigation">
        <p className="nav-label">Overview</p>
        <NavItem icon="⌂" active={activeNav === "Dashboard"} onClick={() => setActiveNav("Dashboard")}>Dashboard</NavItem>
        <NavItem icon="↔" active={activeNav === "Transactions"} onClick={() => setActiveNav("Transactions")}>Transactions</NavItem>
        <NavItem icon="◒" active={activeNav === "Budgets"} onClick={() => setActiveNav("Budgets")}>Budgets</NavItem>
        <NavItem icon="◎" active={activeNav === "Goals"} onClick={() => setActiveNav("Goals")}>Goals</NavItem>
        <p className="nav-label nav-label-spaced">Manage</p>
        <NavItem icon="⊞" active={activeNav === "Categories"} onClick={() => setActiveNav("Categories")}>Categories</NavItem>
        <NavItem icon="▥" active={activeNav === "Reports"} onClick={() => setActiveNav("Reports")}>Reports</NavItem>
      </nav>
      <div className="sidebar-bottom">
        <div className="tip-card"><div className="tip-spark">✦</div><strong>Small steps, big picture.</strong><p>You're 18% under your monthly budget. Keep it up!</p><div className="tip-progress"><span></span></div></div>
        <NavItem icon="⚙" active={false} onClick={() => setShowProfile(true)}>Settings</NavItem><NavItem icon="?" active={false}>Help center</NavItem>
      </div>
    </aside>

    <main className="main-content" id="overview">
      {!supabaseConfigured && <div className="backend-warning">Demo mode is active: expenses save in this browser. Add Supabase values from <code>.env.example</code> to share them with other people.</div>}
      {backendError && <div className="backend-error">{backendError}</div>}
      <header className="topbar"><div><p className="eyebrow">Saturday, June 22, 2024</p><h1>Good morning, {profile.name} <span className="wave">✦</span></h1></div><div className="topbar-actions"><button className="search-box" onClick={() => setSearchOpen((value) => !value)}><span>⌕</span><span>{searchOpen ? "Search enabled" : "Search anything"}</span><kbd>⌘ K</kbd></button><button className="notification-button">♢<i></i></button><button className="avatar-button" onClick={() => setShowProfile(true)}>{profile.name.charAt(0).toUpperCase()}</button></div></header>
      <section className="summary-grid">
        <article className="summary-card balance-card"><div className="card-heading"><span className="card-label">Total balance</span><span className="card-menu">•••</span></div><div className="balance-amount">₹0<span>.00</span></div><div className="balance-footer"><span className="neutral">— 0%</span><span>vs. last month</span></div><div className="mini-bars">{Array.from({ length: 19 }, (_, i) => <i key={i}></i>)}</div></article>
        <SummaryCard label="Monthly income" icon="↗" iconClass="income-icon" amount={< >₹0<span>.00</span></>} change="— 0%" changeClass="neutral"><div className="thin-progress income-progress"><span style={{ width: "0%" }}></span></div><div className="card-note"><span>Salary</span><strong>₹0.00</strong></div></SummaryCard>
        <SummaryCard label="Monthly spending" icon="↘" iconClass="spend-icon" amount={< >₹0<span>.00</span></>} change="— 0%" changeClass="neutral"><div className="thin-progress spend-progress"><span style={{ width: "0%" }}></span></div><div className="card-note"><span>Budget left</span><strong>₹0.00</strong></div></SummaryCard>
        <SummaryCard label="Savings rate" icon="✦" iconClass="savings-icon" amount={< >0<span>%</span></>} change="— 0%" changeClass="neutral"><div className="donut-wrap"><div className="donut zero-donut"><b>0%</b></div><span>Ready to<br /><strong>begin!</strong></span></div></SummaryCard>
      </section>

      <section className="dashboard-grid">
        <article className="panel spending-panel"><div className="panel-header"><div><p className="eyebrow">Spending overview</p><h2>Where your money goes</h2></div><div className="period-switch">{Object.keys(periods).map((key) => <button key={key} className={`period ${period === key ? "active" : ""}`} onClick={() => setPeriod(key)}>{key[0].toUpperCase() + key.slice(1)}</button>)}</div></div><div className="chart-summary"><strong>{total}</strong><span>total spent <b>•</b> <em>{range}</em></span></div><div className="chart-area"><div className="chart-y-axis"><span>₹1k</span><span>₹750</span><span>₹500</span><span>₹250</span><span>₹0</span></div><div className="chart-grid-lines"><i></i><i></i><i></i><i></i><i></i></div><div className="chart-bars">{bars.map((height, index) => <div className="chart-column" key={index}><span className={`bar ${index === 5 ? "highlight" : ""}`} style={{ height: `${height}%` }}>{index === 5 && <b>₹840</b>}</span><small>{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index]}</small></div>)}</div></div></article>
        <CategoryPanel />
        <article className="panel transactions-panel"><div className="panel-header"><div><p className="eyebrow">Latest activity</p><h2>Recent transactions</h2></div><button className="outline-button" onClick={() => { setEditingId(null); setForm({ name: "", amount: "", category: "Food & dining" }); setShowModal(true); }}>+ Add expense</button></div><div className="transaction-table"><div className="transaction-row transaction-head"><span>TRANSACTION</span><span>CATEGORY</span><span>DATE</span><span>AMOUNT</span></div>{expenseRows.length ? expenseRows.map((item) => <TransactionRow transaction={{ ...item, onEdit: () => editExpense(item), onDelete: () => deleteExpense(item.id) }} key={item.id} />) : <div className="empty-transactions"><span>✦</span><strong>No transactions yet</strong><small>Your expense history will appear here after you add your first expense.</small><button className="text-button" onClick={() => setShowModal(true)}>Add your first expense <span>→</span></button></div>}</div><button className="text-button table-button">View all transactions <span>→</span></button></article>
        <GoalsPanel />
      </section>
      <footer className="footer"><span>Clearpath finance workspace</span><span>Last synced just now <i></i></span></footer>
    </main>

    {showModal && <div className="modal-backdrop open" onClick={(event) => event.target === event.currentTarget && setShowModal(false)}><div className="modal" role="dialog" aria-modal="true"><button className="modal-close" onClick={() => setShowModal(false)}>×</button><p className="eyebrow">{editingId ? "Edit transaction" : "New transaction"}</p><h2>{editingId ? "Edit expense" : "Add an expense"}</h2><form onSubmit={addExpense}><label>What did you spend on?<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required placeholder="e.g. Coffee with friends" /></label><div className="form-row"><label>Amount<input value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} required type="number" min="0.01" step="0.01" placeholder="0.00" /></label><label>Category<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}><option>Food & dining</option><option>Transport</option><option>Entertainment</option><option>Housing</option><option>Other</option></select></label></div><button className="primary-button">{editingId ? "Update expense" : "Save expense"}</button></form></div></div>}
    {showProfile && <div className="modal-backdrop open" onClick={(event) => event.target === event.currentTarget && setShowProfile(false)}><div className="modal" role="dialog" aria-modal="true"><button className="modal-close" onClick={() => setShowProfile(false)}>×</button><p className="eyebrow">Account settings</p><h2>Edit profile</h2><form onSubmit={saveProfile}><label>Your name<input value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} required /></label><label>Login email<input type="email" value={profile.email} onChange={(event) => setProfile({ ...profile, email: event.target.value })} required /></label><button className="primary-button">Save profile</button></form></div></div>}
  </div>;
}

function CategoryPanel() {
  return <article className="panel category-panel"><div className="panel-header"><div><p className="eyebrow">This month</p><h2>Spending by category</h2></div><button className="more-button">•••</button></div><div className="category-content"><div className="category-donut zero-category-donut"><div><strong>₹0</strong><small>spent</small></div></div><div className="category-list">{[["Housing", "₹0", "0%", "housing"], ["Food & dining", "₹0", "0%", "food"], ["Transport", "₹0", "0%", "transport"], ["Lifestyle", "₹0", "0%", "lifestyle"], ["Other", "₹0", "0%", "other"]].map(([name, amount, percent, color]) => <div className="category-row" key={name}><span className="category-name"><i className={`dot ${color}`}></i>{name}</span><strong>{amount} <small>{percent}</small></strong></div>)}</div></div><button className="text-button">View detailed breakdown <span>→</span></button></article>;
}

function GoalsPanel() {
  return <article className="panel goals-panel"><div className="panel-header"><div><p className="eyebrow">Your progress</p><h2>Savings goals</h2></div><button className="more-button">•••</button></div>{[["⌂", "Dream home", "₹0", "of ₹0", "0%", "₹0 to go", "home-icon"], ["✈", "Japan trip", "₹0", "of ₹0", "0%", "₹0 to go", "travel-icon"]].map(([icon, name, amount, total, percent, left, iconClass]) => <div className="goal-card" key={name}><div className="goal-top"><span className={`goal-icon ${iconClass}`}>{icon}</span><span className="goal-status">Not started</span></div><strong>{name}</strong><div className="goal-amount">{amount} <small>{total}</small></div><div className={`goal-progress ${iconClass === "travel-icon" ? "travel-progress" : ""}`}><span style={{ width: percent }}></span></div><div className="goal-foot"><span>{percent} complete</span><span>{left}</span></div></div>)}<button className="text-button">Manage goals <span>→</span></button></article>;
}

export default App;
