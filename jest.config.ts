export default {
  coverageProvider: "v8",
  globals: {
    "ts-jest": {
      compiler: "ttypescript",
    },
  },
  preset: "ts-jest",
  setupFiles: ["<rootDir>/auto-mock.ts"],
  testEnvironment: "node",
  testMatch: ["**/test/**/*.[jt]s?(x)"],
};
