// TODO: Update APP_ID with your application ID (can be found in in Wix Developers under Workspace/OAuth)
const APP_ID = 'a329c956-2459-4d7f-9977-5bc1dbd1173e';

// TODO: Update PUBLIC_KEY with your public Key (can be found under Workspace/Webhooks/Public-Key)
const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEArk470EYrYZCAiGUhxoX8
X7Km+Bs/bXX8NygqzlR1Rzc0F+94RbkHuLdIVd/9OMQ6gj/Tl9eLfzCH+IbJbpOb
IRGk7C4RjungureOVzyroUICZe7RQU8o/ZxR8n1mTF/rcR+G/8111g2CuBDZbBhP
jEv/Wr7ozjnUWjTxaa+0bP2DveFn0+3hRKwGhDUmVunrM+ympI2kjO0kmV1AsL6u
t7B+7G4LqB2isDCaB4J6FJHJTqA93s99DgkaSlzNWkMbf4P8aPj7GxvU81mYk9pm
wJDHEqiVWY6HxYOCX0vxwiK7DUhYJKsEwJAZQJwI+E81AnCpBF27Ou1yMhFk/fMN
WwIDAQAB
-----END PUBLIC KEY-----`;

//Get the Database Connection Details
const DB_HOST = 'localhost';
const DB_USERNAME = 'root';
const DB_PASSWORD = '';
const DB_NAME = 'santheReviews';

exports.APP_ID = APP_ID;
exports.PUBLIC_KEY = PUBLIC_KEY;

exports.DB_HOST = DB_HOST;
exports.DB_USERNAME = DB_USERNAME;
exports.DB_PASSWORD = DB_PASSWORD;
exports.DB_NAME = DB_NAME;

