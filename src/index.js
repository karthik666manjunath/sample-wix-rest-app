const axios = require('axios');
const bodyParser = require('body-parser');
const express = require('express');
const jwt = require('jsonwebtoken');
const path = require('path');
const config = require('./config');
const credentials = require('./credentials');
const mysql = require('mysql');

//Import functions from other files
const ordersInfo = require('./modules/orders');
const businessName = require('./modules/commons');

//WIX 
const APP_ID = config.APP_ID;
const APP_SECRET = credentials.APP_SECRET;
const PUBLIC_KEY = config.PUBLIC_KEY;
const AUTH_PROVIDER_BASE_URL = 'https://www.wix.com/oauth';
const INSTANCE_API_URL = 'https://www.wixapis.com/apps/v1';
const STORE_CATALOG_API_URL = 'https://www.wixapis.com/stores/v1';
const STORE_ORDERS_API_URL = 'https://www.wixapis.com/stores/v2';

//DB Details
const DB_HOST = config.DB_HOST;
const DB_USERNAME = config.DB_USERNAME;
const DB_PASSWORD = config.DB_PASSWORD;
const DB_NAME = config.DB_NAME;

const app = express();
const port = process.env.PORT || 5000;
const incomingWebhooks = [];

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.text());
app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'statics')));

//Prod Database Connection 
var pool = mysql.createPool({
  host : DB_HOST,
  user : DB_USERNAME,
  password : DB_PASSWORD,
  database : DB_NAME,
  connectionLimit : 10
});

function getTokensFromWix (authCode) {
  return axios.post(`${AUTH_PROVIDER_BASE_URL}/access`, {
    code: authCode,
    client_secret: APP_SECRET,
    client_id: APP_ID,
    grant_type: "authorization_code",
  }).then((resp) => resp.data);
}

function getAccessToken (refreshToken) {
  return axios.post(`${AUTH_PROVIDER_BASE_URL}/access`, {
    refresh_token: refreshToken,
    client_secret: APP_SECRET,
    client_id: APP_ID,
    grant_type: "refresh_token",
  }).then((resp) => resp.data);
}

app.get('/signup', (req, res) => {
  // This route  is called before the user is asked to provide consent
  // Configure the `Redirect URL` in  Wix Developers to point here
  // *** PUT YOUR SIGNUP CODE HERE *** ///
  console.log("got a call from Wix for signup");
  console.log("==============================");

  const permissionRequestUrl = 'https://www.wix.com/app-oauth-installation/consent';
  const appId = APP_ID;
  const redirectUrl = `https://${req.get('host')}/login`;
  const token = req.query.token;
  var url = `${permissionRequestUrl}?token=${token}&appId=${appId}&redirectUrl=${redirectUrl}`

  console.log("redirecting to " + url);
  console.log("=============================");
  res.redirect(url);
});

app.get('/login',async (req, res) => {
  // This route  is called once the user finished installing your application and Wix redirects them to your application's site (here).
  // Configure the `App URL` in the Wix Developers to point here
  console.log("got a call from Wix for login");
  console.log("=============================");

  const authorizationCode = req.query.code;

  console.log("authorizationCode = " + authorizationCode);

  let refreshToken, accessToken;
  try {
    console.log("getting Tokens From Wix ");
    console.log("=======================");
    const data = await getTokensFromWix(authorizationCode);

    refreshToken = data.refresh_token;
    accessToken = data.access_token;

    console.log("refreshToken = " + refreshToken);
    console.log("accessToken = " + accessToken);
    console.log("=============================");

    instance = await getAppInstance(refreshToken);

    console.log("api call to instance returned: ");
    console.log(instance);

    // TODO: Save the instanceId and tokens for future API calls
    console.log("=============================");
    console.log(`User's site instanceId: ${instance.instance.instanceId}`);
    console.log("=============================");

    var sql = `INSERT INTO appInfo (instanceId, refreshToken, siteDisplayName) VALUES ('${instance.instance.instanceId}', '${refreshToken}', '${instance.site.siteDisplayName}')`;
    pool.query(sql, function(err, result){
      if(err) throw err;
      console.log('Record inserted into appInfo Table');
    });

    res.redirect(`https://www.wix.com/_api/site-apps/v1/site-apps/token-received??access_token=${accessToken}`)    

  } catch (wixError) {
    console.log("Error getting token from Wix");
    console.log({wixError});
    res.status(500);
    return;
  }});

app.get('/', (_, res) => {

  res.render('index', {
    businessName: businessName
  })
});
  
// this is sample call to Wix instance API - you can find it here: https://dev.wix.com/api/app-management.app-instance.html#get-app-instance
async function getAppInstance(refreshToken)
{
  try {
    console.log('getAppInstance with refreshToken = '+refreshToken);
    console.log("==============================");
    const {access_token} = await getAccessToken(refreshToken);
    console.log('accessToken = ' + access_token);

    const body = {
      // *** PUT YOUR PARAMS HERE ***
    };
    const options = {
      headers: {
        authorization: access_token,
      },
    };
    const appInstance = axios.create({
      baseURL: INSTANCE_API_URL,
      headers: {authorization: access_token}
    });
    const instance = (await appInstance.get('instance', body)).data;

    return instance;
  } catch (e) {
    console.log('error in getAppInstance');
    console.log({e});
    return;
  }
};

//GET Functions
app.get('/orders',async (req, res) => {
  
  console.log(req.query);
  const refreshToken = req.query.token;
  console.log("refreshToken = " + refreshToken);

  try {
    ordersInfo = getOrders(refreshToken);
  } catch (wixError) {
    console.log("Error getting token from Wix");
    console.log({wixError});
    res.status(500);
    return;
  }
});

app.listen(port, () => console.log(`My Wix Application ${APP_ID} is listening on port ${port}!`));
