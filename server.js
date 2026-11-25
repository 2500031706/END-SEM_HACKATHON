
import express from "express";
import { DatabaseSync } from "node:sqlite";
import { registerAdminRoutes } from "./admin.js";

import {
    randomBytes,
    randomUUID,
    scryptSync,
    timingSafeEqual,
    createHash
} from "node:crypto";

import { initialData } from "./src/data.js";

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.disable("x-powered-by");
app.use(express.json({ limit: "64kb" }));

// =====================================
// SQLITE DATABASE
// =====================================

const db = new DatabaseSync("edusphere.sqlite");

db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
        email TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        expires INTEGER NOT NULL,
        FOREIGN KEY(email) REFERENCES users(email)
    );

    CREATE TABLE IF NOT EXISTS academic_data (
        id INTEGER PRIMARY KEY,
        data TEXT NOT NULL
    );
`);

db.prepare(`
    INSERT OR IGNORE INTO academic_data
    VALUES (1, ?)
`).run(JSON.stringify(initialData));

// =====================================
// INPUT VALIDATION
// =====================================

function fail(message, status = 400) {
    throw Object.assign(
        new Error(message),
        { status }
    );
}

function text(value, max = 200) {

    if (typeof value !== "string") {
        fail("Invalid input");
    }

    const result = value.trim();

    if (!result || result.length > max) {
        fail("Invalid input length");
    }

    return result;
}

function emailAddress(value) {

    const email = text(value).toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        fail("Enter a valid email address");
    }

    return email;
}

// =====================================
// PASSWORD HASHING
// =====================================

function hashPassword(password) {

    const salt = randomBytes(16).toString("hex");

    const hash = scryptSync(
        password,
        salt,
        64
    ).toString("hex");

    return salt + ":" + hash;
}

function verifyPassword(password, stored) {

    const [salt, hash] = stored.split(":");

    return timingSafeEqual(
        Buffer.from(hash, "hex"),
        scryptSync(password, salt, 64)
    );
}

// =====================================
// USER ACCOUNT CREATION
// =====================================

function createUser(name, email, password, role) {

    name = text(name, 100);
    email = emailAddress(email);

    if (
        typeof password !== "string" ||
        password.length < 8 ||
        password.length > 128
    ) {
        fail("Password must contain 8 to 128 characters");
    }

    const existing = db.prepare(`
        SELECT email FROM users
        WHERE email = ?
    `).get(email);

    if (existing) {
        fail("Email already registered", 409);
    }

    db.prepare(`
        INSERT INTO users
        VALUES (?, ?, ?, ?)
    `).run(
        email,
        name,
        hashPassword(password),
        role
    );

    return {
        email,
        name,
        role
    };
}

// =====================================
// DEFAULT ADMIN AND FACULTY ACCOUNTS
// =====================================

function seedAccount(name, email, password, role) {

    if (!email || !password) return;

    email = emailAddress(email);

    const existing = db.prepare(`
        SELECT role FROM users
        WHERE email = ?
    `).get(email);

    if (!existing) {

        createUser(
            name,
            email,
            password,
            role
        );

        console.log(role + " account created");

    } else if (existing.role !== role) {

        throw new Error("Account role mismatch");

    }
}

seedAccount(
    "Administrator",
    process.env.ADMIN_EMAIL,
    process.env.ADMIN_PASSWORD,
    "Admin"
);

seedAccount(
    "Faculty",
    process.env.FACULTY_EMAIL,
    process.env.FACULTY_PASSWORD,
    "Faculty"
);

// =====================================
// SESSION MANAGEMENT
// =====================================

const cookieOptions = {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.COOKIE_SECURE === "true",
    path: "/"
};

function tokenHash(token) {

    return createHash("sha256")
        .update(token)
        .digest("hex");
}

function getToken(req) {

    return req.headers.cookie
        ?.match(
            /(?:^|;\s*)edu_session=([a-f0-9]{64})(?:;|$)/
        )?.[1];
}

function startSession(req, res, email) {

    const previous = getToken(req);

    if (previous) {

        db.prepare(`
            DELETE FROM sessions
            WHERE token = ?
        `).run(tokenHash(previous));

    }

    const token = randomBytes(32).toString("hex");

    const duration = 7 * 24 * 60 * 60 * 1000;

    db.prepare(`
        DELETE FROM sessions
        WHERE expires <= ?
    `).run(Date.now());

    db.prepare(`
        INSERT INTO sessions
        VALUES (?, ?, ?)
    `).run(
        tokenHash(token),
        email,
        Date.now() + duration
    );

    res.cookie("edu_session", token, {
        ...cookieOptions,
        maxAge: duration
    });
}

// =====================================
// AUTHENTICATION
// =====================================

function authenticate(req, res, next) {

    const token = getToken(req);

    if (!token) {

        return res.status(401).json({
            error: "Please sign in"
        });

    }

    const user = db.prepare(`
        SELECT
            users.email,
            users.name,
            users.role
        FROM users

        JOIN sessions
        ON sessions.email = users.email

        WHERE sessions.token = ?
        AND sessions.expires > ?

    `).get(
        tokenHash(token),
        Date.now()
    );

    if (!user) {

        return res.status(401).json({
            error: "Session expired"
        });

    }

    req.user = user;

    next();
}

// =====================================
// API REQUEST PROTECTION
// =====================================

app.use("/api", (req, res, next) => {

    res.setHeader(
        "Cache-Control",
        "no-store"
    );

    if (
        req.method !== "GET" &&
        req.get("X-EduSphere") !== "1"
    ) {

        return res.status(403).json({
            error: "Invalid request"
        });

    }

    next();
});

// =====================================
// LOGIN ATTEMPT LIMIT
// =====================================

const loginAttempts = new Map();

function limitLogin(req, res, next) {

    const now = Date.now();

    for (const [key, item] of loginAttempts) {

        if (item.expires <= now) {

            loginAttempts.delete(key);

        }
    }

    const item = loginAttempts.get(req.ip) || {

        count: 0,

        expires: now + 15 * 60 * 1000

    };

    if (item.count >= 20) {

        return res.status(429).json({
            error: "Too many attempts. Try again later."
        });

    }

    item.count++;

    loginAttempts.set(
        req.ip,
        item
    );

    next();
}

// =====================================
// STUDENT REGISTRATION
// =====================================

app.post(
    "/api/register",
    limitLogin,
    (req, res) => {

        const {
            name,
            email,
            password
        } = req.body;

        const user = createUser(
            name,
            email,
            password,
            "Student"
        );

        startSession(
            req,
            res,
            user.email
        );

        res.json(user);
    }
);

// =====================================
// LOGIN
// =====================================

app.post(
    "/api/login",
    limitLogin,
    (req, res) => {

        const email = emailAddress(
            req.body.email
        );

        const password = req.body.password;

        const user = db.prepare(`
            SELECT * FROM users
            WHERE email = ?
        `).get(email);

        if (
            !user ||
            typeof password !== "string" ||
            password.length > 128 ||
            !verifyPassword(
                password,
                user.password
            )
        ) {

            fail(
                "Invalid email or password",
                401
            );

        }

        startSession(
            req,
            res,
            email
        );

        res.json({
            email: user.email,
            name: user.name,
            role: user.role
        });

    }
);

// =====================================
// LOGOUT
// =====================================

app.post("/api/logout", (req, res) => {

    const token = getToken(req);

    if (token) {

        db.prepare(`
            DELETE FROM sessions
            WHERE token = ?
        `).run(tokenHash(token));

    }

    res.clearCookie(
        "edu_session",
        cookieOptions
    );

    res.json({
        success: true
    });
});

// =====================================
// DATABASE FUNCTIONS
// =====================================

function readData() {

    return JSON.parse(

        db.prepare(`
            SELECT data
            FROM academic_data
            WHERE id = 1
        `).get().data

    );
}

function writeData(data) {

    db.prepare(`
        UPDATE academic_data
        SET data = ?
        WHERE id = 1
    `).run(JSON.stringify(data));

}

function requireRole(user, ...roles) {

    if (!roles.includes(user.role)) {

        fail(
            "Access denied",
            403
        );

    }
}

function findItem(items, id) {

    const item = items.find(
        x => String(x.id) === String(id)
    );

    if (!item) {

        fail(
            "Item not found",
            404
        );

    }

    return item;
}

function checkEnrollment(data, email, id) {

    const enrolled =
        data.enrolled[email] || [];

    if (!enrolled.includes(id)) {

        fail(
            "Enroll in the course first",
            403
        );

    }
}

// =====================================
// DASHBOARD DATA
// =====================================

app.get(
    "/api/state",
    authenticate,
    (req, res) => {

        const d = readData();
        const u = req.user;

        if (u.role === "Student") {

            const enrolled =
                d.enrolled[u.email] || [];

            return res.json({

                user: u,

                data: {

                    courses: d.courses,

                    assignments: d.assignments.filter(
                        a => enrolled.includes(a.course)
                    ),

                    quizzes: d.quizzes.filter(
                        q => enrolled.includes(q.course)
                    ).map(
                        ({ answer, ...q }) => q
                    ),

                    submissions: d.submissions.filter(
                        s => s.email === u.email
                    ),

                    attempts: d.attempts.filter(
                        a => a.email === u.email
                    ),

                    posts: d.posts,

                    enrolled: {
                        [u.email]: enrolled
                    },

                    completed: {
                        [u.email]:
                            d.completed[u.email] || {}
                    }
                }
            });
        }

        res.json({
            user: u,
            data: d
        });

    }
);

// =====================================
// LMS OPERATIONS
// =====================================

app.post(
    "/api/action",
    authenticate,
    (req, res) => {

        const b = req.body;
        const u = req.user;
        const d = readData();
        const email = u.email;

        let message = "Changes saved";

        switch (b.action) {

            // COURSE ENROLLMENT

            case "enroll": {

                requireRole(u, "Student");

                const c = findItem(
                    d.courses,
                    b.id
                );

                d.enrolled[email] = [
                    ...new Set([
                        ...(d.enrolled[email] || []),
                        c.id
                    ])
                ];

                message = "Course enrolled!";

                break;
            }

            // LEARNING PROGRESS

            case "learn": {

                requireRole(u, "Student");

                const c = findItem(
                    d.courses,
                    b.id
                );

                checkEnrollment(
                    d,
                    email,
                    c.id
                );

                d.completed[email] ||= {};

                d.completed[email][c.id] =
                    Math.min(
                        100,
                        (d.completed[email][c.id] || 0) + 25
                    );

                message = "Progress updated!";

                break;
            }

            // CREATE COURSE

            case "course": {

                requireRole(
                    u,
                    "Faculty",
                    "Admin"
                );

                d.courses.push({

                    id: randomUUID(),

                    title: text(b.title),

                    category: text(b.category),

                    description: text(
                        b.description,
                        5000
                    ),

                    instructor: u.name
                });

                message = "Course published!";

                break;
            }

            // CREATE ASSIGNMENT

            case "assignment": {

                requireRole(
                    u,
                    "Faculty",
                    "Admin"
                );

                const course = findItem(
                    d.courses,
                    b.course
                );

                const due = text(b.due);

                if (!/^\d{4}-\d{2}-\d{2}$/.test(due)) {

                    fail("Invalid date");

                }

                d.assignments.push({

                    id: randomUUID(),

                    course: course.id,

                    title: text(b.title),

                    due
                });

                message = "Assignment published!";

                break;
            }

            // SUBMIT ASSIGNMENT

            case "submit": {

                requireRole(u, "Student");

                const a = findItem(
                    d.assignments,
                    b.id
                );

                checkEnrollment(
                    d,
                    email,
                    a.course
                );

                d.submissions = d.submissions.filter(

                    s => !(
                        s.id === a.id &&
                        s.email === email
                    )

                );

                d.submissions.push({

                    id: a.id,

                    email,

                    content: text(
                        b.answer,
                        10000
                    ),

                    grade: null
                });

                message = "Assignment submitted!";

                break;
            }

            // FACULTY GRADING

            case "grade": {

                requireRole(
                    u,
                    "Faculty",
                    "Admin"
                );

                const s = d.submissions.find(

                    x =>
                        String(x.id) === String(b.id) &&
                        x.email === b.email

                );

                if (!s) {

                    fail(
                        "Submission not found",
                        404
                    );

                }

                const grade = Number(b.grade);

                if (
                    b.grade === "" ||
                    b.grade == null ||
                    !Number.isInteger(grade) ||
                    grade < 0 ||
                    grade > 100
                ) {

                    fail("Enter marks between 0 and 100");

                }

                s.grade = grade;

                message = "Grade saved!";

                break;
            }

            // CREATE QUIZ

            case "quiz": {

                requireRole(
                    u,
                    "Faculty",
                    "Admin"
                );

                const course = findItem(
                    d.courses,
                    b.course
                );

                const answer = Number(b.correct);

                if (
                    b.correct == null ||
                    b.correct === "" ||
                    !Number.isInteger(answer) ||
                    answer < 0 ||
                    answer > 3
                ) {

                    fail("Invalid correct answer");

                }

                d.quizzes.push({

                    id: randomUUID(),

                    course: course.id,

                    question: text(
                        b.question,
                        1000
                    ),

                    options: [
                        b.a,
                        b.b,
                        b.c,
                        b.d
                    ].map(
                        x => text(x, 500)
                    ),

                    answer
                });

                message = "Quiz published!";

                break;
            }

            // ATTEMPT QUIZ

            case "attempt": {

                requireRole(u, "Student");

                const q = findItem(
                    d.quizzes,
                    b.id
                );

                checkEnrollment(
                    d,
                    email,
                    q.course
                );

                const option = Number(b.option);

                if (
                    b.option == null ||
                    b.option === "" ||
                    !Number.isInteger(option) ||
                    option < 0 ||
                    option >= q.options.length
                ) {

                    fail("Select a valid answer");

                }

                const correct =
                    option === q.answer;

                d.attempts = d.attempts.filter(

                    a => !(
                        a.id === q.id &&
                        a.email === email
                    )

                );

                d.attempts.push({

                    id: q.id,

                    email,

                    score: correct ? 100 : 0

                });

                message = correct

                    ? "Correct answer!"

                    : "Incorrect answer. Try again.";

                break;
            }

            // DISCUSSION FORUM

            case "post": {

                d.posts.push({

                    id: randomUUID(),

                    author: u.name,

                    text: text(
                        b.message,
                        5000
                    )

                });

                message = "Discussion posted!";

                break;
            }

            // UPDATE PROFILE

            case "profile": {

                const name = text(
                    b.name,
                    100
                );

                db.prepare(`
                    UPDATE users
                    SET name = ?
                    WHERE email = ?
                `).run(
                    name,
                    email
                );

                message = "Profile updated!";

                break;
            }

            default:

                fail("Unknown action");

        }

        writeData(d);

        res.json({
            message
        });

    }
);

// =====================================
// NEW ADMIN DASHBOARD CONNECTION
// =====================================

registerAdminRoutes(app, {

    db,

    authenticate,

    createUser,

    readData

});

// =====================================
// SERVER STATUS
// =====================================

app.get("/", (req, res) => {

    res.send(
        "EduSphere Backend is Running"
    );

});

// =====================================
// UNKNOWN API ROUTES
// =====================================

app.use((req, res) => {

    res.status(404).json({

        error: "Route not found"

    });

});

// =====================================
// ERROR HANDLING
// =====================================

app.use((err, req, res, next) => {

    const status = err.status || 500;

    if (status >= 500) {

        console.error(err);

    }

    res.status(status).json({

        error: status >= 500

            ? "Internal server error"

            : err.message

    });

});

// =====================================
// START BACKEND SERVER
// =====================================

app.listen(PORT, "127.0.0.1", () => {

    console.log(
        "================================="
    );

    console.log(
        "EduSphere Backend Started"
    );

    console.log(
        `Server: http://127.0.0.1:${PORT}`
    );

    console.log(
        "SQLite Database Connected"
    );

    console.log(
        "Admin Dashboard API Connected"
    );

    console.log(
        "================================="
    );

});
