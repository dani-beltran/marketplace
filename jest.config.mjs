// jest.config.mjs
import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: "./",
});

const E2eApiConfig = {
  testPathIgnorePatterns: ["/node_modules/", "/.next/"],
  testEnvironment: "node",
  testMatch: ["<rootDir>/src/e2e/api/**/*.test.ts"],
};

const isE2E = process.env.E2E === "true";
const overwriteConfig = isE2E ? E2eApiConfig : {};

// Add any custom config to be passed to Jest
/** @type {import('jest').Config} */
const config = {
  // Add more setup options before each test is run
  // setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ["/node_modules/", "/.next/", "/src/e2e/api/"],
  testEnvironment: "jest-environment-jsdom",
  ...overwriteConfig,
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config);
