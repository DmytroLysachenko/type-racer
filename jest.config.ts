// jest.config.ts
import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env
  dir: "./",
});

const customJestConfig = {
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  collectCoverageFrom: [
    "lib/game/**/*.{ts,tsx}",
    "lib/hooks/**/*.{ts,tsx}",
    "components/**/*.{ts,tsx}",
    "app/api/**/*.{ts,tsx}",
  ],
  coverageThreshold: {
    "./lib/game/": {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 85,
    },
  },
  // Map "@/..." to project root so imports resolve in tests
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  testMatch: ["**/__tests__/**/*.(test).(ts|tsx)", "**/?(*.)+(test).(ts|tsx)"],
};

export default createJestConfig(customJestConfig);
