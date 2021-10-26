//Get the name of the business
let businessName = '';
module.exports = async function getBusinessName(instanceId)
{
  return new Promise(function(resolve, reject){
    var businessNameSql = `SELECT businessName from appInfo WHERE instanceId = ${instanceId}`;
    pool.query(businessNameSql, async function(err, result){
      try {
        if(typeof result[0].businessName !== 'undefined'){
          resolve(businessName = await result[0].businessName);
        }
      } catch (error) {
        resolve(businessName = ' ');
        console.log("Business Name Undefined");
      }
    });
  });
}

exports.businessName = businessName;