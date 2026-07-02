const {validateEmailAddress, validatePhoneNumber, validatePassword, validateFullName} = require('./utils/security.js');

console.log('=== Email Validation Tests ===');
console.log('Valid email:', validateEmailAddress('user@example.com')); 
console.log('Invalid email (too short):', validateEmailAddress('test@te.c'));
console.log('Invalid email (no @):', validateEmailAddress('test.com'));
console.log('Temp email (mailinator):', validateEmailAddress('test@mailinator.com'));

console.log('\n=== Phone Validation Tests ===');
console.log('Valid phone (9876543210):', validatePhoneNumber('9876543210'));
console.log('Invalid phone (9 digits):', validatePhoneNumber('987654321'));
console.log('Invalid phone (11 digits):', validatePhoneNumber('98765432109'));
console.log('Invalid phone (starts with 5):', validatePhoneNumber('5876543210'));
console.log('Phone with spaces (handled):', validatePhoneNumber('9876 543 210'));

console.log('\n=== Name Validation Tests ===');
console.log('Valid name (John Doe):', validateFullName('John Doe'));
console.log('Invalid name (1 char):', validateFullName('J'));
console.log('Invalid name (with numbers):', validateFullName('John123'));

console.log('\n=== Password Validation Tests ===');
console.log('Strong password:', validatePassword('Test@1234'));
console.log('Weak (no uppercase):', validatePassword('test@1234'));
console.log('Weak (7 chars):', validatePassword('Test@123'));
