// Test setup file
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test_jwt_secret_key_for_placement_tests";

// Increase timeout for DB operations
jest.setTimeout(30000);
