module.exports = {
  clearMocks: true,
  moduleFileExtensions: ['js', 'ts'],
  coverageProvider: 'v8',
  coverageDirectory: 'build/coverage',
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  testRunner: 'jest-circus/runner',
  transform: {
    '^.+\\.ts$': 'ts-jest',
    // marked ships ESM-only from v5; ts-jest with CJS output can't load it
    // directly. Pin a CJS build for tests by routing the bare import to the
    // CJS entrypoint shipped in the package.
    '^.+\\.m?js$': ['ts-jest', { useESM: false }]
  },
  moduleNameMapper: {
    // Force the CJS build of marked for Jest. Production bundling via ncc
    // already produces a single CJS file, so this only affects tests.
    '^marked$': '<rootDir>/node_modules/marked/lib/marked.umd.js'
  },
  verbose: true
}
