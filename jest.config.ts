export default {
  displayName: "express-ts-sesion",
  testEnvironment: "node",
  transform: {
    "^.+\\.[tj]s$": ["ts-jest", { tsconfig: "./tsconfig.spec.json" }],
  },
};
