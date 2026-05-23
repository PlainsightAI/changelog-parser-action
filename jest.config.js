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
    // marked v18's default resolution is ESM (package.json `main`/`module`
    // both point at lib/marked.esm.js) and ts-jest with CJS output can't
    // load it directly. Route the bare import to the UMD build shipped in
    // the package so Jest gets a CJS-compatible entry — verify the UMD
    // path still exists if bumping marked.
    '^.+\\.m?js$': ['ts-jest', { useESM: false }]
  },
  moduleNameMapper: {
    // Force the UMD build of marked for Jest. Production bundling via ncc
    // already produces a single CJS file, so this only affects tests.
    '^marked$': '<rootDir>/node_modules/marked/lib/marked.umd.js'
  },
  verbose: true
}
