exports.handler = (event, context, callback) => {
    console.log(JSON.stringify(event));
    // Create a support case using the input as the case ID, then return a confirmation message   
    var myCaseID = event.inputCaseID;
    var myMessage = "Case " + myCaseID + ": opened...";
    var result = { Case: myCaseID, Message: myMessage };
    callback(null, result);
    // return result;
};