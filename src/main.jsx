
import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";

import { load, save } from "./data.js";
import Admin from "./Admin.jsx";

import "./style.css";
import "./admin.css";

// =====================================
// NAVIGATION PAGES
// =====================================

const pages = [
    ["Dashboard", "▦"],
    ["Courses", "▤"],
    ["Assignments", "▧"],
    ["Quizzes", "?"],
    ["Progress", "↗"],
    ["Grades", "✓"],
    ["Certificates", "☆"],
    ["Discussion Forum", "☏"],
    ["Profile", "●"]
];

// =====================================
// BACKEND API CONNECTION
// =====================================

async function api(endpoint, body) {

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

    let result;

    try {
        result = await response.json();
    } catch {
        throw new Error(
            "Backend connection failed. Start the server."
        );
    }

    if (!response.ok) {
        throw Object.assign(
            new Error(result.error || "Request failed"),
            { status: response.status }
        );
    }

    return result;
}

// =====================================
// DARK MODE BUTTON
// =====================================

function ThemeButton({ dark, toggle }) {

    return (
        <button
            type="button"
            className="theme-toggle"
            onClick={toggle}
            aria-pressed={dark}
        >
            {dark ? "☀ Light Mode" : "☾ Dark Mode"}
        </button>
    );
}

// =====================================
// REUSABLE FORM
// =====================================

function Form({
    children,
    submit,
    label,
    reset = true
}) {

    const [busy, setBusy] = useState(false);

    async function handleSubmit(e) {

        e.preventDefault();

        const form = e.currentTarget;

        const values = Object.fromEntries(
            new FormData(form)
        );

        setBusy(true);

        try {

            const success = await submit(values);

            if (success && reset) {
                form.reset();
            }

        } finally {

            setBusy(false);

        }
    }

    return (
        <form
            className="fields"
            onSubmit={handleSubmit}
        >
            {children}

            <button type="submit" disabled={busy}>
                {busy ? "Processing..." : label}
            </button>

        </form>
    );
}

// =====================================
// LOGIN AND REGISTRATION
// =====================================

function Login({ authenticate, dark, toggle }) {

    const [register, setRegister] = useState(false);

    return (
        <div className="login">

            <section className="welcome">

                <div className="brand">
                    ◈ EduSphere
                </div>

                <div>

                    <div className="eyebrow">
                        SMART LEARNING MANAGEMENT SYSTEM
                    </div>

                    <h1>
                        Learn.<br />
                        Connect.<br />
                        Grow.
                    </h1>

                    <p>
                        Your digital campus for learning,
                        academic progress and collaboration.
                    </p>

                    <div className="feature">
                        ✓ Courses and Assignments<br />
                        ✓ Quizzes and Grades<br />
                        ✓ Progress and Certificates<br />
                        ✓ Campus Discussion Forum
                    </div>

                </div>

                <small>
                    EduSphere · Campus Workspace
                </small>

            </section>

            <section className="loginform">

                <div className="auth-card">

                    <div className="auth-top">

                        <div className="courseicon">◈</div>

                        <ThemeButton
                            dark={dark}
                            toggle={toggle}
                        />

                    </div>

                    <div className="eyebrow">
                        WELCOME TO EDUSPHERE
                    </div>

                    <h1>
                        {register
                            ? "Create Account"
                            : "Welcome Back"}
                    </h1>

                    <p>
                        {register
                            ? "Register as a student."
                            : "Sign in to your learning workspace."}
                    </p>

                    <Form
                        key={String(register)}
                        submit={v => authenticate(
                            register ? "register" : "login",
                            v
                        )}
                        label={
                            register
                                ? "Create Account"
                                : "Sign In"
                        }
                        reset={false}
                    >

                        {register && (
                            <label>

                                Full Name

                                <input
                                    name="name"
                                    placeholder="Enter your name"
                                    maxLength={100}
                                    required
                                />

                            </label>
                        )}

                        <label>

                            Email Address

                            <input
                                type="email"
                                name="email"
                                placeholder="Enter your email"
                                autoComplete="username"
                                required
                            />

                        </label>

                        <label>

                            Password

                            <input
                                type="password"
                                name="password"
                                minLength={register ? 8 : 1}
                                maxLength={128}
                                autoComplete={
                                    register
                                        ? "new-password"
                                        : "current-password"
                                }
                                placeholder="Enter password"
                                required
                            />

                        </label>

                    </Form>

                    <div style={{ marginTop: 20 }}>

                        <button
                            type="button"
                            className="theme-toggle"
                            onClick={() => setRegister(!register)}
                        >

                            {register
                                ? "Already registered? Sign In"
                                : "New Student? Register"}

                        </button>

                    </div>

                    <small className="demo-note">

                        Students can register themselves.
                        Faculty and Admin use assigned accounts.

                    </small>

                </div>

            </section>

        </div>
    );
}

// =====================================
// COURSE CARD
// =====================================

function Course({ c, children }) {

    return (
        <article className="panel course">

            <div className="courseicon">▤</div>

            <span className="tag">
                {c.category}
            </span>

            <h2>{c.title}</h2>

            <p>{c.description}</p>

            <small>{c.instructor}</small>

            {children}

        </article>
    );
}

// =====================================
// PROGRESS BAR
// =====================================

function Progress({ value = 0 }) {

    return (
        <div>

            <div
                className="progress"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={value}
            >

                <div style={{
                    width: value + "%"
                }} />

            </div>

            <small>
                {value}% Completed
            </small>

        </div>
    );
}

// =====================================
// EMPTY MESSAGE
// =====================================

function Empty({ text }) {

    return (
        <div className="panel empty">
            {text}
        </div>
    );
}

// =====================================
// CERTIFICATE PRINTING
// =====================================

function printCertificate(name, course) {

    const w = window.open(
        "",
        "_blank",
        "width=850,height=650"
    );

    if (!w) {
        alert("Please allow popups.");
        return;
    }

    const doc = w.document;

    doc.title = "EduSphere Certificate";

    const certificate = doc.createElement("main");

    certificate.style.cssText = `
        font-family: Georgia, serif;
        text-align: center;
        color: #172033;
        border: 8px double #b49a53;
        margin: 30px;
        padding: 60px;
    `;

    [
        ["h2", "EDUSPHERE"],
        ["h1", "Certificate of Completion"],
        ["p", "This certifies that"],
        ["h2", name],
        ["p", "has successfully completed"],
        ["h2", course],
        ["p", "EduSphere Learning Management System"]

    ].forEach(([tag, value]) => {

        const element = doc.createElement(tag);

        element.textContent = value;

        certificate.appendChild(element);

    });

    doc.body.appendChild(certificate);

    w.focus();
    w.print();
}

// =====================================
// MAIN APPLICATION
// =====================================

function App() {

    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState("Dashboard");
    const [menu, setMenu] = useState(false);
    const [notice, setNotice] = useState("");

    // DARK MODE

    const [darkMode, setDarkMode] = useState(
        () => load("edu-dark-mode", false) === true
    );

    useEffect(() => {

        const theme = darkMode
            ? "dark"
            : "light";

        document.documentElement.dataset.theme =
            theme;

        document.body.classList.toggle(
            "dark-mode",
            darkMode
        );

        save("edu-dark-mode", darkMode);

        try {
            localStorage.setItem("theme", theme);
        } catch {
            // Storage unavailable
        }

    }, [darkMode]);

    function toggleTheme() {

        setDarkMode(previous => !previous);
    }

    // FETCH SERVER DATA

    async function refresh() {

        try {

            const result = await api("state");

            setSession(result);

            return true;

        } catch (e) {

            if (e.status === 401) {

                setSession(null);

                return false;
            }

            throw e;
        }
    }

    useEffect(() => {

        refresh()
            .catch(e => setNotice(e.message))
            .finally(() => setLoading(false));

    }, []);

    // NOTIFICATION

    useEffect(() => {

        if (!notice) return;

        const timer = setTimeout(
            () => setNotice(""),
            4000
        );

        return () => clearTimeout(timer);

    }, [notice]);

    // LOGIN AND REGISTRATION

    async function authenticate(endpoint, values) {

        try {

            await api(endpoint, values);

            if (!await refresh()) {

                throw new Error(
                    "Unable to start session"
                );
            }

            setPage("Dashboard");
            setNotice("Welcome to EduSphere!");

            return true;

        } catch (e) {

            setNotice(e.message);

            return false;
        }
    }

    // LOGOUT

    async function logout() {

        try {

            await api("logout", {});

            setSession(null);
            setPage("Dashboard");
            setMenu(false);

            setNotice("Signed out successfully");

        } catch (e) {

            setNotice(e.message);
        }
    }

    // LMS BACKEND OPERATIONS

    async function run(action, values = {}) {

        try {

            const result = await api("action", {
                ...values,
                action
            });

            if (!await refresh()) {

                setNotice(
                    "Session expired. Sign in again."
                );

                return false;
            }

            setNotice(result.message);

            return true;

        } catch (e) {

            if (e.status === 401) {

                setSession(null);
            }

            setNotice(e.message);

            return false;
        }
    }

    function navigate(p) {

        setPage(p);
        setMenu(false);
    }

    const toast = notice && (

        <div className="toast" role="status">

            {notice}

        </div>
    );

    // LOADING SCREEN

    if (loading) {

        return (
            <div className="panel empty">

                Loading EduSphere...

            </div>
        );
    }

    // LOGIN PAGE

    if (!session) {

        return (
            <>

                <Login
                    authenticate={authenticate}
                    dark={darkMode}
                    toggle={toggleTheme}
                />

                {toast}

            </>
        );
    }

    const user = session.user;

    // =====================================
    // NEW SEPARATE ADMIN DASHBOARD
    // =====================================

    if (user.role === "Admin") {

        return (
            <>

                <Admin
                    user={user}
                    darkMode={darkMode}
                    toggleTheme={toggleTheme}
                    logout={logout}
                />

                {toast}

            </>
        );
    }

    // =====================================
    // STUDENT AND FACULTY DASHBOARD
    // =====================================

    const db = session.data;

    const student = user.role === "Student";

    const key = user.email;

    const name = user.name;

    const enrolled = db.enrolled[key] || [];

    const myCourses = db.courses.filter(
        c => enrolled.includes(c.id)
    );

    const progress = c =>
        db.completed[key]?.[c.id] || 0;

    const finished = myCourses.filter(
        c => progress(c) === 100
    );

    const courseName = id =>

        db.courses.find(
            c => String(c.id) === String(id)
        )?.title || "Course";

    const courseSelect = (

        <select name="course" required>

            <option value="">
                Select Course
            </option>

            {db.courses.map(c => (

                <option
                    value={c.id}
                    key={c.id}
                >

                    {c.title}

                </option>
            ))}

        </select>
    );

    return (
        <div className="shell">

            {/* SIDEBAR */}

            <aside className={
                menu ? "sidebar open" : "sidebar"
            }>

                <div className="brand">

                    ◈ EduSphere

                    <small>
                        LEARN · CONNECT · GROW
                    </small>

                </div>

                <div className="role">

                    {user.role} Portal

                </div>

                <nav>

                    {pages.map(([p, icon]) => (

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

                        Campus / {page}

                    </div>

                    <div className="header-actions">

                        <ThemeButton
                            dark={darkMode}
                            toggle={toggleTheme}
                        />

                        <div className="avatar">

                            {name[0]?.toUpperCase()}

                        </div>

                    </div>

                </header>

                <section className="content">

                    <div className="eyebrow">

                        EDUSPHERE / {user.role.toUpperCase()}

                    </div>

                    <h1>{page}</h1>

                    {/* DASHBOARD */}

                    {page === "Dashboard" && (

                        <>

                            <div className="hero">

                                <div>

                                    <div className="eyebrow">

                                        YOUR LEARNING SPACE

                                    </div>

                                    <h2>Welcome, {name}!</h2>

                                    <p>

                                        {student
                                            ? "Continue your learning journey."
                                            : "Manage your academic workspace."}

                                    </p>

                                    <button onClick={() =>
                                        navigate("Courses")
                                    }>

                                        Explore Courses →

                                    </button>

                                </div>

                                <div className="hero-icon">

                                    ◈

                                </div>

                            </div>

                            <div className="stats">

                                {(student ? [

                                    ["Enrolled Courses", myCourses.length],
                                    ["Assignments Submitted", db.submissions.length],
                                    ["Quizzes Attempted", db.attempts.length],
                                    ["Certificates", finished.length]

                                ] : [

                                    ["Total Courses", db.courses.length],
                                    ["Assignments", db.assignments.length],
                                    ["Quizzes", db.quizzes.length],
                                    ["Submissions", db.submissions.length]

                                ]).map(([label, value], i) => (

                                    <article
                                        className="panel"
                                        key={label}
                                    >

                                        <div className="stat-icon">

                                            {["▤", "▧", "✓", "☆"][i]}

                                        </div>

                                        <small>{label}</small>

                                        <h2>{value}</h2>

                                    </article>

                                ))}

                            </div>

                            <h2>Available Courses</h2>

                            <div className="cards">

                                {db.courses.map(c => (

                                    <Course key={c.id} c={c}>

                                        <button onClick={() =>
                                            navigate("Courses")
                                        }>

                                            View Course

                                        </button>

                                    </Course>

                                ))}

                            </div>

                        </>

                    )}

                    {/* COURSES */}

                    {page === "Courses" && (

                        <>

                            {!student && (

                                <article className="panel">

                                    <h2>Create Course</h2>

                                    <Form
                                        submit={v => run("course", v)}
                                        label="Publish Course"
                                    >

                                        <input
                                            name="title"
                                            placeholder="Course title"
                                            required
                                        />

                                        <input
                                            name="category"
                                            placeholder="Category"
                                            required
                                        />

                                        <textarea
                                            name="description"
                                            placeholder="Description"
                                            required
                                        />

                                    </Form>

                                </article>

                            )}

                            <div className="cards">

                                {db.courses.map(c => (

                                    <Course key={c.id} c={c}>

                                        {student &&
                                         enrolled.includes(c.id) && (

                                            <Progress value={progress(c)} />

                                        )}

                                        {student && (

                                            <button

                                                disabled={
                                                    enrolled.includes(c.id) &&
                                                    progress(c) === 100
                                                }

                                                onClick={() => run(

                                                    enrolled.includes(c.id)
                                                        ? "learn"
                                                        : "enroll",

                                                    { id: c.id }

                                                )}

                                            >

                                                {!enrolled.includes(c.id)
                                                    ? "Enroll Now"
                                                    : progress(c) === 100
                                                        ? "Completed ✓"
                                                        : "Complete Lesson"}

                                            </button>

                                        )}

                                    </Course>

                                ))}

                            </div>

                        </>

                    )}

                    {/* ASSIGNMENTS */}

                    {page === "Assignments" && (

                        <>

                            {!student && (

                                <article className="panel">

                                    <h2>Create Assignment</h2>

                                    <Form
                                        submit={v => run("assignment", v)}
                                        label="Publish Assignment"
                                    >

                                        {courseSelect}

                                        <input
                                            name="title"
                                            placeholder="Assignment title"
                                            required
                                        />

                                        <label>

                                            Due Date

                                            <input
                                                name="due"
                                                type="date"
                                                required
                                            />

                                        </label>

                                    </Form>

                                </article>

                            )}

                            {!db.assignments.length && (

                                <Empty text="No assignments available." />

                            )}

                            {db.assignments.map(a => (

                                <article
                                    className="panel"
                                    key={a.id}
                                >

                                    <small>

                                        {courseName(a.course)}
                                        {" · Due "}
                                        {a.due}

                                    </small>

                                    <h2>{a.title}</h2>

                                    {student ? (

                                        <Form

                                            submit={v => run("submit", {
                                                ...v,
                                                id: a.id
                                            })}

                                            label={
                                                db.submissions.some(
                                                    s => s.id === a.id
                                                )
                                                    ? "Resubmit Assignment"
                                                    : "Submit Assignment"
                                            }

                                            reset={false}

                                        >

                                            <textarea

                                                name="answer"

                                                placeholder="Write your assignment"

                                                defaultValue={
                                                    db.submissions.find(
                                                        s => s.id === a.id
                                                    )?.content || ""
                                                }

                                                required

                                            />

                                        </Form>

                                    ) : (

                                        db.submissions

                                            .filter(s => s.id === a.id)

                                            .map(s => (

                                                <div
                                                    className="submission"
                                                    key={s.email}
                                                >

                                                    <strong>{s.email}</strong>

                                                    <p>{s.content}</p>

                                                    <Form

                                                        submit={v => run("grade", {
                                                            ...v,
                                                            id: s.id,
                                                            email: s.email
                                                        })}

                                                        label="Save Grade"

                                                        reset={false}

                                                    >

                                                        <input
                                                            type="number"
                                                            name="grade"
                                                            min="0"
                                                            max="100"
                                                            defaultValue={s.grade ?? ""}
                                                            placeholder="Marks out of 100"
                                                            required
                                                        />

                                                    </Form>

                                                </div>

                                            ))

                                    )}

                                </article>

                            ))}

                        </>

                    )}

                    {/* QUIZZES */}

                    {page === "Quizzes" && (

                        <>

                            {!student && (

                                <article className="panel">

                                    <h2>Create Quiz</h2>

                                    <Form
                                        submit={v => run("quiz", v)}
                                        label="Publish Quiz"
                                    >

                                        {courseSelect}

                                        <input
                                            name="question"
                                            placeholder="Question"
                                            required
                                        />

                                        {["a", "b", "c", "d"].map(x => (

                                            <input
                                                key={x}
                                                name={x}
                                                placeholder={
                                                    "Option " + x.toUpperCase()
                                                }
                                                required
                                            />

                                        ))}

                                        <label>

                                            Correct Answer

                                            <select name="correct">

                                                <option value="0">A</option>
                                                <option value="1">B</option>
                                                <option value="2">C</option>
                                                <option value="3">D</option>

                                            </select>

                                        </label>

                                    </Form>

                                </article>

                            )}

                            {!db.quizzes.length && (

                                <Empty text="No quizzes available." />

                            )}

                            {db.quizzes.map(q => (

                                <article
                                    className="panel"
                                    key={q.id}
                                >

                                    <small>

                                        {courseName(q.course)}

                                    </small>

                                    <h2>{q.question}</h2>

                                    {student ? (

                                        <Form

                                            submit={v => run("attempt", {
                                                ...v,
                                                id: q.id
                                            })}

                                            label="Submit Answer"

                                        >

                                            {q.options.map((o, i) => (

                                                <label
                                                    className="option"
                                                    key={i}
                                                >

                                                    <input
                                                        type="radio"
                                                        name="option"
                                                        value={i}
                                                        required
                                                    />

                                                    {o}

                                                </label>

                                            ))}

                                            {db.attempts.some(
                                                a => a.id === q.id
                                            ) && (

                                                <p>

                                                    Score: {
                                                        db.attempts.find(
                                                            a => a.id === q.id
                                                        ).score
                                                    }%

                                                </p>

                                            )}

                                        </Form>

                                    ) : (

                                        <p>

                                            Correct Answer:
                                            {" "}
                                            {q.options[q.answer]}

                                        </p>

                                    )}

                                </article>

                            ))}

                        </>

                    )}

                    {/* PROGRESS */}

                    {page === "Progress" && (

                        student ? (

                            myCourses.length ? (

                                myCourses.map(c => (

                                    <article
                                        className="panel"
                                        key={c.id}
                                    >

                                        <h2>{c.title}</h2>

                                        <Progress value={progress(c)} />

                                    </article>

                                ))

                            ) : (

                                <Empty text="Enroll in a course to track progress." />

                            )

                        ) : (

                            <article className="panel">

                                <h2>Student Progress</h2>

                                {Object.entries(db.enrolled).map(
                                    ([email, ids]) => (

                                        <div
                                            className="submission"
                                            key={email}
                                        >

                                            <strong>{email}</strong>

                                            {ids.map(id => (

                                                <div key={id}>

                                                    <p>{courseName(id)}</p>

                                                    <Progress
                                                        value={
                                                            db.completed[email]?.[id] || 0
                                                        }
                                                    />

                                                </div>

                                            ))}

                                        </div>

                                    )
                                )}

                            </article>

                        )

                    )}

                    {/* GRADES */}

                    {page === "Grades" && (

                        <article className="panel">

                            <h2>Assessment Results</h2>

                            <div className="tablewrap">

                                <table>

                                    <thead>

                                        <tr>

                                            <th>Assessment</th>

                                            {!student && <th>Student</th>}

                                            <th>Score</th>

                                        </tr>

                                    </thead>

                                    <tbody>

                                        {db.submissions.map(s => (

                                            <tr key={"a" + s.id + s.email}>

                                                <td>

                                                    {db.assignments.find(
                                                        a => a.id === s.id
                                                    )?.title}

                                                </td>

                                                {!student && <td>{s.email}</td>}

                                                <td>

                                                    {s.grade === null
                                                        ? "Pending"
                                                        : s.grade + "/100"}

                                                </td>

                                            </tr>

                                        ))}

                                        {db.attempts.map(a => (

                                            <tr key={"q" + a.id + a.email}>

                                                <td>

                                                    {db.quizzes.find(
                                                        q => q.id === a.id
                                                    )?.question}

                                                </td>

                                                {!student && <td>{a.email}</td>}

                                                <td>{a.score}%</td>

                                            </tr>

                                        ))}

                                    </tbody>

                                </table>

                            </div>

                            {!db.submissions.length &&
                             !db.attempts.length && (

                                <p>No assessment results yet.</p>

                            )}

                        </article>

                    )}

                    {/* CERTIFICATES */}

                    {page === "Certificates" && (

                        student ? (

                            finished.length ? (

                                finished.map(c => (

                                    <article
                                        className="panel certificate"
                                        key={c.id}
                                    >

                                        <div className="award">☆</div>

                                        <small>EDUSPHERE</small>

                                        <h2>Certificate of Completion</h2>

                                        <p>This certifies that</p>

                                        <h2>{name}</h2>

                                        <p>has successfully completed</p>

                                        <h2>{c.title}</h2>

                                        <button onClick={() =>
                                            printCertificate(name, c.title)
                                        }>

                                            Print / Save as PDF

                                        </button>

                                    </article>

                                ))

                            ) : (

                                <Empty text="Complete a course to unlock certificates." />

                            )

                        ) : (

                            <article className="panel">

                                <h2>Completed Courses</h2>

                                {Object.entries(db.completed).flatMap(

                                    ([email, items]) =>

                                        Object.entries(items)

                                            .filter(([, p]) => p === 100)

                                            .map(([id]) => (

                                                <p key={email + id}>

                                                    {email}
                                                    {" — "}
                                                    {courseName(id)}

                                                </p>

                                            ))

                                )}

                            </article>

                        )

                    )}

                    {/* DISCUSSION FORUM */}

                    {page === "Discussion Forum" && (

                        <>

                            <article className="panel">

                                <h2>Start Discussion</h2>

                                <Form

                                    submit={v => run("post", v)}

                                    label="Post Message"

                                >

                                    <textarea
                                        name="message"
                                        placeholder="Share your thoughts..."
                                        required
                                    />

                                </Form>

                            </article>

                            {[...db.posts].reverse().map(p => (

                                <article
                                    className="panel"
                                    key={p.id}
                                >

                                    <div className="post-author">

                                        <div className="avatar">

                                            {p.author[0]?.toUpperCase()}

                                        </div>

                                        <strong>{p.author}</strong>

                                    </div>

                                    <p className="post">{p.text}</p>

                                </article>

                            ))}

                        </>

                    )}

                    {/* PROFILE */}

                    {page === "Profile" && (

                        <article className="panel">

                            <div className="profile-avatar">

                                {name[0]?.toUpperCase()}

                            </div>

                            <h2>Personal Information</h2>

                            <Form

                                submit={v => run("profile", v)}

                                label="Save Profile"

                                reset={false}

                            >

                                <label>

                                    Full Name

                                    <input
                                        name="name"
                                        defaultValue={name}
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
                                        value={user.role}
                                        readOnly
                                    />

                                </label>

                            </Form>

                        </article>

                    )}

                    <footer>

                        © EduSphere | Smart Learning Management System

                    </footer>

                </section>

            </main>

            {toast}

        </div>
    );
}

// =====================================
// RENDER REACT APPLICATION
// =====================================

createRoot(
    document.getElementById("root")
).render(<App />);
