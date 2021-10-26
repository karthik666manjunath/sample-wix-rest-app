// TODO: Update APP_ID with your application ID (can be found in in Wix Developers under Workspace/OAuth)
const APP_ID = 'c3f2f8b4-bea5-46b2-9637-b01cf9ed4656';

// TODO: Update PUBLIC_KEY with your public Key (can be found under Workspace/Webhooks/Public-Key)
const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAjB5aWpoF37I1mwH0M+RG
Nc55CF8Ax1S64sTWDf5lVEGjzKS5313C/YQAJZTVKMpALKcQauC1UejNS3txxHR/
n9pLw9Zw+TGW0M+b84CP3eVthPf94hHrOnbux6ienhRnmHGkPtTKTJcZLiy+taCm
Kb5p6295/n7GdH/o4/xorUzA7EkLz1OnRBC9tS13ux1ZycDH7F8I+UMdNxh0f6n3
55nQpEMsaCaz1/Wd79XDmhMGap1bGPUWGAud0MVHlOjG2cl6A7this/NurYpBcqb
I5z234NNEQEYtyc7o20A6I0WG4mcy+mbaSe0NMRmJlhWjwCZtzDLEFxY3zuLSpnY
ywIDAQAB
-----END PUBLIC KEY-----`;

//Get the Database Connection Details
const DB_HOST = 'localhost';
const DB_USERNAME = 'root';
const DB_PASSWORD = '';
const DB_NAME = 'rocketReviews';

exports.APP_ID = APP_ID;
exports.PUBLIC_KEY = PUBLIC_KEY;

exports.DB_HOST = DB_HOST;
exports.DB_USERNAME = DB_USERNAME;
exports.DB_PASSWORD = DB_PASSWORD;
exports.DB_NAME = DB_NAME;

