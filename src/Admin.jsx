
import React, {
    useState,
    useEffect
} from "react";

// ADMIN NAVIGATION

const adminPages = [
    ["Dashboard", "▦"],
    ["Students", "♙"],
    ["Faculty", "♟"],
    ["All Users", "☷"],
    ["Reports", "↗"],
    ["Profile", "●"]
];

// BACKEND CONNECTION

async function adminApi(endpoint, body) {

    const options = {
        credentials: "same-origin",

        headers: {
            "Content-Type": "application/json",
            "X-EduSphere": "1"
        }
    };

    if (body !== undefined) {

        options.method = "POST";

        options.body = JSON.stringify(body);
    }

    const response = await fetch(
        "/api/" + endpoint,
        options
    );

    const result = await response.json().catch(
        () => ({
            error: "Backend connection failed"
        })
    );

    if (!response.ok) {

        throw new Error(
            result.error || "Request failed"
        );
    }

    return result;
}

// ADMIN STATISTICS COMPONENT

function StatCard({
    title,
    value,
    icon,
    color
}) {

    return (

        <article
            className="admin-stat"
            style={{ borderLeftColor: color }}
        >

            <div
                className="admin-stat-icon"
                style={{ background: color }}
            >
                {icon}
            </div>

            <small>{title}</small>

            <h2>{value}</h2>

        </article>
    );
}

// USER TABLE COMPONENT

function UserTable({ users }) {

    return (

        <div className="panel">

            <div className="tablewrap">

                <table>

                    <thead>

                        <tr>

                            <th>S.No</th>

                            <th>Name</th>

                            <th>Email</th>

                            <th>Role</th>

                        </tr>

                    </thead>

                    <tbody>

                        {users.map((u, i) => (

                            <tr key={u.email}>

                                <td>{i + 1}</td>

                                <td>

                                    <div className="admin-user">

                                        <div className="avatar">

                                            {u.name[0]?.toUpperCase()}

                                        </div>

                                        <strong>{u.name}</strong>

                                    </div>

                                </td>

                                <td>{u.email}</td>

                                <td>

                                    <span className={
                                        "admin-role " +
                                        u.role.toLowerCase()
                                    }>

                                        {u.role}

                                    </span>

                                </td>

                            </tr>

                        ))}

                    </tbody>

                </table>

            </div>

            {!users.length && (

                <p className="empty">

                    No users found.

                </p>

            )}

        </div>
    );
}

// CREATE FACULTY FORM

function FacultyForm({ onCreated, notify }) {

    const [busy, setBusy] = useState(false);

    async function createFaculty(e) {

        e.preventDefault();

        const form = e.currentTarget;

        const values = Object.fromEntries(
            new FormData(form)
        );

        setBusy(true);

        try {

            const result = await adminApi(
                "admin/faculty",
                values
            );

            form.reset();

            await onCreated();

            notify(result.message);

        } catch (error) {

            notify(error.message);

        } finally {

            setBusy(false);

        }
    }

    return (

        <article className="panel">

            <h2>Create Faculty Account</h2>

            <p>
                Add a new faculty member
                to the EduSphere campus.
            </p>

            <form
                className="fields"
                onSubmit={createFaculty}
            >

                <label>

                    Faculty Name

                    <input
                        type="text"
                        name="name"
                        placeholder="Enter faculty name"
                        maxLength={100}
                        required
                    />

                </label>

                <label>

                    Email Address

                    <input
                        type="email"
                        name="email"
                        placeholder="faculty@example.com"
                        required
                    />

                </label>

                <label>

                    Password

                    <input
                        type="password"
                        name="password"
                        placeholder="Minimum 8 characters"
                        minLength={8}
                        maxLength={128}
                        autoComplete="new-password"
                        required
                    />

                </label>

                <button
                    type="submit"
                    disabled={busy}
                >

                    {busy
                        ? "Creating Account..."
                        : "+ Create Faculty Account"}

                </button>

            </form>

        </article>
    );
}

// MAIN ADMIN DASHBOARD

export default function Admin({
    user,
    darkMode,
    toggleTheme,
    logout
}) {

    const [page, setPage] = useState(
        "Dashboard"
    );

    const [data, setData] = useState(null);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [notice, setNotice] = useState("");

    const [search, setSearch] = useState("");

    const [roleFilter, setRoleFilter] =
        useState("All");

    const [menu, setMenu] = useState(false);

    const [adminName, setAdminName] =
        useState(user.name);

    // FETCH ADMIN DASHBOARD DATA

    async function refresh() {

        try {

            setError("");

            const result = await adminApi(
                "admin/dashboard"
            );

            setData(result);

        } catch (e) {

            setError(e.message);

        } finally {

            setLoading(false);

        }
    }

    useEffect(() => {

        refresh();

    }, []);

    // NOTIFICATIONS

    useEffect(() => {

        if (!notice) return;

        const timer = setTimeout(

            () => setNotice(""),

            4000

        );

        return () => clearTimeout(timer);

    }, [notice]);

    // NAVIGATION

    function navigate(nextPage) {

        setPage(nextPage);

        setSearch("");

        setRoleFilter("All");

        setMenu(false);

    }

    // UPDATE ADMIN PROFILE

    async function updateProfile(e) {

        e.preventDefault();

        const form = new FormData(
            e.currentTarget
        );

        try {

            const name = form.get("name").trim();

            const result = await adminApi(
                "action",
                {
                    action: "profile",
                    name
                }
            );

            setAdminName(name);

            await refresh();

            setNotice(result.message);

        } catch (e) {

            setNotice(e.message);

        }
    }

    const users = data?.users || [];

    // SEARCH AND FILTER USERS

    const filteredUsers = users.filter(u => {

        const query = search
            .trim()
            .toLowerCase();

        const matchesSearch =

            u.name.toLowerCase().includes(query) ||

            u.email.toLowerCase().includes(query);

        let matchesRole = true;

        if (page === "Students") {

            matchesRole = u.role === "Student";

        } else if (page === "Faculty") {

            matchesRole = u.role === "Faculty";

        } else if (roleFilter !== "All") {

            matchesRole = u.role === roleFilter;
        }

        return matchesSearch && matchesRole;
    });

    if (user.role !== "Admin") {

        return (

            <div className="panel empty">

                Administrator access required.

            </div>
        );
    }

    // ADMIN PAGE LAYOUT

    return (

        <div className="shell admin-shell">

            {/* ADMIN SIDEBAR */}

            <aside className={
                menu ? "sidebar open" : "sidebar"
            }>

                <div className="brand">

                    ◈ EduSphere

                    <small>
                        ADMINISTRATION PORTAL
                    </small>

                </div>

                <div className="role">

                    Administrator

                </div>

                <nav>

                    {adminPages.map(([p, icon]) => (

                        <button

                            key={p}

                            className={
                                page === p ? "active" : ""
                            }

                            onClick={() => navigate(p)}

                        >

                            <span>{icon}</span>

                            {p}

                        </button>

                    ))}

                </nav>

                <button
                    className="logout"
                    onClick={logout}
                >

                    ↪ Sign Out

                </button>

            </aside>

            <main>

                {/* HEADER */}

                <header>

                    <div className="header-title">

                        <button
                            className="mobile"
                            onClick={() => setMenu(!menu)}
                            aria-label="Toggle navigation"
                        >

                            ☰

                        </button>

                        Admin / {page}

                    </div>

                    <div className="header-actions">

                        <button

                            type="button"

                            className="theme-toggle"

                            onClick={toggleTheme}

                            aria-pressed={darkMode}

                        >

                            {darkMode

                                ? "☀ Light Mode"

                                : "☾ Dark Mode"}

                        </button>

                        <div className="avatar">

                            {adminName[0]?.toUpperCase()}

                        </div>

                    </div>

                </header>

                {/* MAIN CONTENT */}

                <section className="content">

                    <div className="eyebrow">

                        EDUSPHERE / ADMINISTRATION

                    </div>

                    <h1>

                        {page === "Dashboard"
                            ? "Admin Dashboard"
                            : page}

                    </h1>

                    {loading && (

                        <div className="panel empty">

                            Loading Admin Dashboard...

                        </div>

                    )}

                    {error && (

                        <div className="panel">

                            <p>{error}</p>

                            <button onClick={refresh}>

                                Try Again

                            </button>

                        </div>

                    )}

                    {!loading && !error && data && (

                        <>

                            {/* DASHBOARD */}

                            {page === "Dashboard" && (

                                <>

                                    <div className="hero admin-hero">

                                        <div>

                                            <div className="eyebrow">

                                                CAMPUS MANAGEMENT

                                            </div>

                                            <h2>

                                                Welcome, {adminName}!

                                            </h2>

                                            <p>

                                                Manage users, faculty
                                                and academic activities.

                                            </p>

                                            <button onClick={() =>
                                                navigate("All Users")
                                            }>

                                                Manage Users →

                                            </button>

                                        </div>

                                        <div className="hero-icon">

                                            ◈

                                        </div>

                                    </div>

                                    <div className="admin-grid">

                                        <StatCard
                                            title="Total Users"
                                            value={data.totalUsers}
                                            icon="☷"
                                            color="#6366f1"
                                        />

                                        <StatCard
                                            title="Students"
                                            value={data.students}
                                            icon="♙"
                                            color="#10b981"
                                        />

                                        <StatCard
                                            title="Faculty"
                                            value={data.faculty}
                                            icon="♟"
                                            color="#f59e0b"
                                        />

                                        <StatCard
                                            title="Courses"
                                            value={data.courses}
                                            icon="▤"
                                            color="#ec4899"
                                        />

                                    </div>

                                    <div className="admin-actions">

                                        <article className="panel">

                                            <h2>Student Management</h2>

                                            <p>
                                                View registered students
                                                and account information.
                                            </p>

                                            <button onClick={() =>
                                                navigate("Students")
                                            }>

                                                View Students

                                            </button>

                                        </article>

                                        <article className="panel">

                                            <h2>Faculty Management</h2>

                                            <p>
                                                Create faculty accounts
                                                and view faculty members.
                                            </p>

                                            <button onClick={() =>
                                                navigate("Faculty")
                                            }>

                                                Manage Faculty

                                            </button>

                                        </article>

                                    </div>

                                    <h2>Registered Users</h2>

                                    <UserTable users={users.slice(0, 5)} />

                                </>

                            )}

                            {/* STUDENTS / FACULTY / USERS */}

                            {["Students", "Faculty", "All Users"]
                                .includes(page) && (

                                <>

                                    {page === "Faculty" && (

                                        <FacultyForm

                                            onCreated={refresh}

                                            notify={setNotice}

                                        />

                                    )}

                                    <article className="panel">

                                        <div className="admin-toolbar">

                                            <div>

                                                <h2>

                                                    {page === "Students"

                                                        ? "Registered Students"

                                                        : page === "Faculty"

                                                            ? "Faculty Members"

                                                            : "User Management"}

                                                </h2>

                                                <small>

                                                    {filteredUsers.length}
                                                    {" users found"}

                                                </small>

                                            </div>

                                            <div className="admin-filters">

                                                <input

                                                    type="search"

                                                    placeholder="Search name or email..."

                                                    value={search}

                                                    onChange={e =>
                                                        setSearch(e.target.value)
                                                    }

                                                />

                                                {page === "All Users" && (

                                                    <select

                                                        value={roleFilter}

                                                        onChange={e =>
                                                            setRoleFilter(
                                                                e.target.value
                                                            )
                                                        }

                                                    >

                                                        <option value="All">
                                                            All Roles
                                                        </option>

                                                        <option value="Student">
                                                            Student
                                                        </option>

                                                        <option value="Faculty">
                                                            Faculty
                                                        </option>

                                                        <option value="Admin">
                                                            Admin
                                                        </option>

                                                    </select>

                                                )}

                                            </div>

                                        </div>

                                    </article>

                                    <UserTable users={filteredUsers} />

                                </>

                            )}

                            {/* REPORTS */}

                            {page === "Reports" && (

                                <>

                                    <div className="admin-grid">

                                        <StatCard
                                            title="Total Courses"
                                            value={data.courses}
                                            icon="▤"
                                            color="#6366f1"
                                        />

                                        <StatCard
                                            title="Assignments"
                                            value={data.assignments}
                                            icon="▧"
                                            color="#10b981"
                                        />

                                        <StatCard
                                            title="Quizzes"
                                            value={data.quizzes}
                                            icon="?"
                                            color="#f59e0b"
                                        />

                                        <StatCard
                                            title="Submissions"
                                            value={data.submissions}
                                            icon="✓"
                                            color="#ec4899"
                                        />

                                    </div>

                                    <article className="panel">

                                        <h2>User Distribution</h2>

                                        {[

                                            ["Students", data.students],

                                            ["Faculty", data.faculty],

                                            ["Administrators", data.admins]

                                        ].map(([label, count]) => (

                                            <div
                                                className="admin-report"
                                                key={label}
                                            >

                                                <div className="admin-report-title">

                                                    <strong>{label}</strong>

                                                    <span>{count}</span>

                                                </div>

                                                <div className="progress">

                                                    <div style={{

                                                        width:

                                                            (data.totalUsers

                                                                ? count /
                                                                  data.totalUsers *
                                                                  100

                                                                : 0) + "%"

                                                    }} />

                                                </div>

                                            </div>

                                        ))}

                                    </article>

                                    <button onClick={refresh}>

                                        Refresh Reports

                                    </button>

                                </>

                            )}

                            {/* ADMIN PROFILE */}

                            {page === "Profile" && (

                                <article className="panel">

                                    <div className="profile-avatar">

                                        {adminName[0]?.toUpperCase()}

                                    </div>

                                    <h2>Administrator Profile</h2>

                                    <form

                                        className="fields"

                                        onSubmit={updateProfile}

                                    >

                                        <label>

                                            Full Name

                                            <input

                                                name="name"

                                                defaultValue={adminName}

                                                maxLength={100}

                                                required

                                            />

                                        </label>

                                        <label>

                                            Email Address

                                            <input

                                                value={user.email}

                                                readOnly

                                            />

                                        </label>

                                        <label>

                                            Role

                                            <input

                                                value="Administrator"

                                                readOnly

                                            />

                                        </label>

                                        <button type="submit">

                                            Save Profile

                                        </button>

                                    </form>

                                </article>

                            )}

                        </>

                    )}

                    <footer>

                        © EduSphere | Administration Portal

                    </footer>

                </section>

            </main>

            {notice && (

                <div className="toast" role="status">

                    {notice}

                </div>

            )}

        </div>
    );
}
