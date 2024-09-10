module.exports = {
  transform: {
    "^.+\\.(ts|tsx)$": ["ts-jest", {tsconfig: "test/tsconfig.json"}]
  },
  moduleFileExtensions: ['ts', 'js'],
  testMatch: ['**/*.spec.(ts)'],
  testEnvironment: 'node'
}
