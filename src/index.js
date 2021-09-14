const axios = require('axios');
const bodyParser = require('body-parser');
const express = require('express');
const jwt = require('jsonwebtoken');
const path = require('path');
const config = require('./config');
const credentials = require('./credentials');
const mysql = require('mysql');
const e = require('express');

const APP_ID = config.APP_ID;
const APP_SECRET = credentials.APP_SECRET;
const PUBLIC_KEY = config.PUBLIC_KEY;
const AUTH_PROVIDER_BASE_URL = 'https://www.wix.com/oauth';
const INSTANCE_API_URL = 'https://www.wixapis.com/apps/v1';
const STORE_CATALOG_API_URL = 'https://www.wixapis.com/stores/v1';
const STORE_ORDERS_API_URL = 'https://www.wixapis.com/stores/v2';
const PAYMENTS_API_URL = 'https://cashier.wix.com/_api/payment-services-web/merchant/v2';
const ABANDONED_CART_API_URL = 'https://www.wixapis.com/stores/v1/abandonedCarts/';


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
app.set('view engine', 'pug');
app.use(express.static(path.join(__dirname, 'statics')));

//Prod Database Connection 
var pool = mysql.createPool({
  host : DB_HOST,
  user : DB_USERNAME,
  password : DB_PASSWORD,
  database : DB_NAME,
  connectionLimit : 10
  //port : 8889
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


app.post('/webhook-callback', (req, res) => {
  console.log('got webhook event from Wix!', req.body);
  console.log("===========================");
  const data = jwt.verify(req.body, PUBLIC_KEY);
  const parsedData =  JSON.parse(data.data);
  const prettyData = {...data, data: {...parsedData, data: JSON.parse(parsedData.data)}};
  console.log('webhook event data after verification:', prettyData);
  incomingWebhooks.push({body: prettyData, headers: req.headers});
  res.send(req.body);
});

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
  // *** PUT YOUR LOGIN CODE HERE *** ///
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

    var sql = `INSERT INTO appInfo (id, refreshToken, siteDisplayName) VALUES ('${instance.instance.instanceId}', '${refreshToken}', '${instance.site.siteDisplayName}')`;
    pool.query(sql, function(err, result){
      if(err) throw err;
      console.log('Record inserted into appInfo Table');
    });

    // need to post https://www.wix.com/app-oauth-installation/token-received to notif wix that we finished getting the token
    res.render('login', {  title: 'Wix Application', 
                              app_id: APP_ID,
                              site_display_name: instance.site.siteDisplayName,
                              instance_id: instance.instance.instanceId, 
                              permissions: instance.instance.permissions, 
                              token: refreshToken,
                              response: JSON.stringify(instance, null, '\t')});    

  } catch (wixError) {
    console.log("Error getting token from Wix");
    console.log({wixError});
    res.status(500);
    return;
  }});

app.get('/', (_, res) => {
  res.status(200).send('Hello Wix!')
});
  
app.get('/instance',async (req, res) => {
  
  const refreshToken = req.query.token;

  console.log("refreshToken = " + refreshToken);

  try {
    instance = await getAppInstance(refreshToken);
    res.render('instance', {  title: 'Wix Application', 
                              app_id: APP_ID,
                              site_display_name: instance.site.siteDisplayName,
                              instance_id: instance.instance.instanceId, 
                              response: JSON.stringify(instance, null, '\t')});
  } catch (wixError) {
    console.log("Error getting token from Wix");
    console.log({wixError});
    res.status(500);
    return;
  }
});

app.get('/orders',async (req, res) => {
  
  console.log(req.query);
  const refreshToken = req.query.token;
  console.log("refreshToken = " + refreshToken);

  try {
    //Get all the order information
    out = await getOrders(refreshToken);
    storeOrders = out.response;
    totalOrders = storeOrders.totalResults;
    console.log(totalOrders);

    //Get all the Abandoned Cart Information 
    abandonedCart = await getAbandonedCarts(refreshToken);
    abandonedCartList = abandonedCart.response;
    totalAbandonedCarts = abandonedCartList.totalResults;
    console.log(totalAbandonedCarts);

    instance = await getAppInstance(refreshToken);
    instanceId = instance.instance.instanceId;

    //Check if the database entry has already been made 
    var orderSql = `SELECT COUNT(*) AS isPresent FROM orderSummary WHERE instanceId = ${instanceId}`;
    pool.query(orderSql, function(err, result){
      if (err) throw err;
      if(isPresent === 1){
        var sql = `UPDATE orderSummary SET (instanceId, totalOrders, totalAbandonedCarts) VALUES ('${instanceId}', ${totalOrders}, ${totalAbandonedCarts})`;
        pool.query(sql, function(err, result){
          if(err) throw err;
          console.log('Record Updated !')
        })
      }
      else {
        var sql = `INSERT INTO orderSummary (instanceId, totalOrders, totalAbandonedCarts) VALUES ('${instanceId}', ${totalOrders}, ${totalAbandonedCarts})`;
        pool.query(sql, function(err, result){
          if(err) throw err;
          console.log('Record inserted into Order Summary !');
        });
      }
    });

    if (storeOrders) {
      res.render('orders', {  title: 'Wix Application', 
                              app_id: APP_ID,
                              total: storeOrders.totalResults,
                              response: JSON.stringify(storeOrders, null, "\t")});
    } else {
      var message;
      switch (out.code) {
        case 401: 
          message = `Got 401 - Are you sure you have a Wix Store in your site?`;
          break;
        case 403: 
          message = `Got 403 - No Permissions for orders. You can add permissions to your application in <a href="https://dev.wix.com/dc3/my-apps/${APP_ID}/workspace/permissions">Wix Developers</a>.`;
          break;
        case 404: 
          message = 'Got 404 - Check your api route';
          break;
        default:
        message = `Got ${out.code}`;
      }  
      res.status(200).send(`<html><body><pre>${message}</pre></body></html>`);
    }
  } catch (wixError) {
    console.log("Error getting token from Wix");
    console.log({wixError});
    res.status(500);
    return;
  }
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

// This is sample call to the Wix Orders API - you can find it here: https://dev.wix.com/api/wix-stores.stores-orders.html#query-orders
async function getOrders(refreshToken)
{
  try {
    const {access_token} = await getAccessToken(refreshToken);
    const body = {
      // *** PUT YOUR PARAMS HERE ***
      "query" : {"limit" : 10},
      "sort": "[{\"number\": \"desc\"}]"
    };
    const options = {
      headers: {
        authorization: access_token,
      },
    };
    const appInstance = axios.create({
      baseURL: STORE_ORDERS_API_URL,
      headers: {authorization: access_token}
    });

    const response = (await appInstance.post('orders/query', body)).data;
    return {response: response, code: 200};
  } catch (e) {
    console.log({e});
    return {code: e.response.status};
  }
};

//Get the total number of Abandoned Carts 
async function getAbandonedCarts(refreshToken)
{
  try {
    const {access_token} =  await getAccessToken(refreshToken);
    const body = {
      // *** PUT YOUR PARAMS HERE ***
      "query" : {"limit" : 10},
      "sort": "[{\"number\": \"desc\"}]"
    };
    const options = {
      headers: {
        authorization: access_token,
      },
    };
    const appInstance = axios.create({
      baseURL: ABANDONED_CART_API_URL,
      headers: {authorization: access_token}
    });

    const response = (await appInstance.post('/query', body)).data;
    return {response : response, code: 200};
  } catch (error) {
    console.log({e});
    return {code: e.response.status};
  }
}

app.listen(port, () => console.log(`My Wix Application ${APP_ID} is listening on port ${port}!`));
