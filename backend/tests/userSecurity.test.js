const test = require('node:test');
const assert = require('node:assert/strict');
const User = require('../models/User');
const {
  sanitizeInput,
  validateFullName,
  validateEmailAddress,
  validatePassword,
  validatePhoneNumber,
  validateRole,
} = require('../utils/security');

test('recordFailedLogin locks the account after repeated failures', async () => {
  const user = new User({
    name: 'Test User',
    email: 'lock@example.com',
    password: 'Abcd1234!',
  });

  user.save = async () => Promise.resolve();

  await user.recordFailedLogin();
  await user.recordFailedLogin();
  await user.recordFailedLogin();
  await user.recordFailedLogin();
  await user.recordFailedLogin();

  assert.equal(user.failedLoginAttempts, 0);
  assert.ok(user.lockUntil instanceof Date);
  assert.equal(user.isLocked(), true);
});

test('markEmailVerified records verification state', async () => {
  const user = new User({
    name: 'Email User',
    email: 'verify@example.com',
    password: 'Abcd1234!',
  });

  user.save = async () => Promise.resolve();

  await user.markEmailVerified();

  assert.equal(user.isEmailVerified, true);
  assert.ok(user.emailVerifiedAt instanceof Date);
  assert.equal(user.emailVerificationTokenHash, null);
  assert.equal(user.emailVerificationExpiresAt, null);
});

test('sanitizes and validates user input for auth flows', () => {
  assert.equal(sanitizeInput('<script>alert(1)</script> John'), 'John');
  assert.equal(validateFullName('John Doe'), null);
  assert.equal(validateFullName('John123'), 'Name can only contain letters and spaces');
  assert.equal(validateEmailAddress('user@mailinator.com'), 'Temporary or invalid email domains are not allowed');
  assert.equal(validateEmailAddress('user@example.com'), null);
  assert.equal(validatePassword('Password1!'), null);
  assert.equal(validatePassword('password123'), 'Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character');
  assert.equal(validatePhoneNumber('+1234567890'), null);
  assert.equal(validatePhoneNumber('abc123'), 'Phone number must contain only digits and be between 8 and 15 characters long');
  assert.equal(validateRole('admin'), null);
  assert.equal(validateRole('superuser'), 'Invalid role');
});
