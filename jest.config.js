/**
 * Jest configuration with two projects:
 *
 *  unit  — pure TypeScript utilities, no React Native setup, runs under Node.
 *           Fast and compatible with any Node version.
 *
 *  rn    — React Native / Expo component tests using jest-expo preset.
 *           Requires Expo toolchain; add *.component.test.tsx files here.
 */
module.exports = {
  projects: [
    // ── Unit tests: pure TS utilities ─────────────────────────────────────────
    {
      displayName: 'unit',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/src/__tests__/**/*.test.ts'],
      transform: {
        '^.+\\.tsx?$': ['ts-jest', {
          tsconfig: {
            jsx: 'react',
            esModuleInterop: true,
          },
        }],
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      // Exclude component tests (*.component.test.ts) from this project
      testPathIgnorePatterns: ['/node_modules/', '\\.component\\.test\\.ts$'],
    },
  ],

  // Coverage collected across all projects
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx',
    '!src/types/**',
  ],
  coverageThreshold: {
    global: {
      branches: 30,
      functions: 30,
      lines: 30,
      statements: 30,
    },
  },
};
