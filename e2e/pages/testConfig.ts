// e2e/pages/testConfig.ts
export const testUsers = {
    admin: {
        email: process.env.TEST_ADMIN_EMAIL!,
        password: process.env.TEST_ADMIN_PASSWORD!,
    },
    instructor: {
        email: process.env.TEST_INSTRUCTOR_EMAIL!,
        password: process.env.TEST_INSTRUCTOR_PASSWORD!,
    },
    recoveryEmail: process.env.TEST_RECOVERY_EMAIL!,
};