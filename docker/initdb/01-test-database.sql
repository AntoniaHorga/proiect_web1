-- Runs once, on the container's first start. Separate database for the integration
-- tests (npm run test:db), so they never touch the development data.
CREATE DATABASE budget_test;
