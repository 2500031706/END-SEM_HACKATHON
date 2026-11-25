
export const initialData = {
    courses: [
        {
            id: 1,
            title: "Java Programming",
            instructor: "Computer Science Faculty",
            category: "Programming",
            description: "Learn classes, objects, inheritance and modern Java.",
            progress: 75
        },
        {
            id: 2,
            title: "Artificial Intelligence & ML",
            instructor: "AI Faculty",
            category: "Data Science",
            description: "Explore search, regression and machine learning.",
            progress: 100
        },
        {
            id: 3,
            title: "Internet of Things",
            instructor: "Embedded Systems Faculty",
            category: "Electronics",
            description: "Build applications with sensors and microcontrollers.",
            progress: 40
        }
    ],

    assignments: [
        {
            id: 1,
            course: 1,
            title: "Object-Oriented Programming",
            due: "2026-12-10"
        },
        {
            id: 2,
            course: 2,
            title: "Regression Analysis",
            due: "2026-12-12"
        }
    ],

    quizzes: [
        {
            id: 1,
            course: 1,
            question: "Which keyword is used for class inheritance in Java?",
            options: [
                "implements",
                "extends",
                "import",
                "static"
            ],
            answer: 1
        },
        {
            id: 2,
            course: 2,
            question: "Which algorithm is used for clustering?",
            options: [
                "Linear regression",
                "K-means",
                "Binary search",
                "Bubble sort"
            ],
            answer: 1
        }
    ],

    submissions: [],
    attempts: [],

    posts: [
        {
            id: 1,
            author: "Faculty",
            text: "Welcome to EduSphere! Introduce yourself and share your learning goals."
        }
    ],

    enrolled: {},
    completed: {},
    names: {}
};

// Load data from Local Storage

export function load(key, fallback) {
    try {
        const value = localStorage.getItem(key);

        return value ? JSON.parse(value) : fallback;
    } catch {
        return fallback;
    }
}

// Save data to Local Storage

export function save(key, value) {
    try {
        localStorage.setItem(
            key,
            JSON.stringify(value)
        );
    } catch {
        // Storage may be unavailable
    }
}

// Generate unique ID

export const uid = () => Date.now() + Math.random();
