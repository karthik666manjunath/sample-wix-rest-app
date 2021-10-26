// This is sample call to the Wix Orders API - you can find it here: https://dev.wix.com/api/wix-stores.stores-orders.html#query-orders
module.exports = async function getOrders(refreshToken)
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