export function registerAdminRoutes(app, dependencies) {

    const {
        db,
        authenticate,
        createUser,
        readData
    } = dependencies;

    // ADMIN ACCESS VERIFICATION

    function adminOnly(req, res, next) {

        if (req.user.role !== "Admin") {

            return res.status(403).json({
                error: "Administrator access required"
            });
        }

        next();
    }

    // ADMIN DASHBOARD STATISTICS

    app.get(
        "/api/admin/dashboard",
        authenticate,
        adminOnly,
        (req, res) => {

            const users = db.prepare(`
                SELECT email, name, role
                FROM users
                ORDER BY name
            `).all();

            const data = readData();

            res.json({

                totalUsers: users.length,

                students: users.filter(
                    u => u.role === "Student"
                ).length,

                faculty: users.filter(
                    u => u.role === "Faculty"
                ).length,

                admins: users.filter(
                    u => u.role === "Admin"
                ).length,

                courses: data.courses.length,

                assignments: data.assignments.length,

                quizzes: data.quizzes.length,

                submissions: data.submissions.length,

                users
            });
        }
    );

    // GET ALL USERS

    app.get(
        "/api/admin/users",
        authenticate,
        adminOnly,
        (req, res) => {

            const users = db.prepare(`
                SELECT email, name, role
                FROM users
                ORDER BY name
            `).all();

            res.json(users);
        }
    );

    // CREATE FACULTY ACCOUNT

    app.post(
        "/api/admin/faculty",
        authenticate,
        adminOnly,
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
                "Faculty"
            );

            res.status(201).json({
                message: "Faculty account created!",
                user
            });
        }
    );

}