exports.handler = (event, context, callback) => {    
    console.log(JSON.stringify(event));
    // Assign the support case and update the status message    
    var myCaseID = event.Payload.Case;    
    var myMessage = event.Payload.Message + "assigned...";    
    var result = {Case: myCaseID, Message: myMessage};
    callback(null, result);
    // return result;
};