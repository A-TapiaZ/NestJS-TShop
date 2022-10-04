export const EnvConfiguration = () => ({
  port: +process.env.PORT || 3000,
  hostApi: process.env.HOST_API || 'http://localhost:3000/api',
  jwtSecret: process.env.JWT_SECRET || 'SecretText',
});
