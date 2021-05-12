exports.handler = (event, context, callback) => { 
    console.log(JSON.stringify(event));
    // Close the support case    
    var myCaseStatus = event.Status;    
    var myCaseID = event.Payload.Case;    
    var myMessage = event.Payload.Message + "closed.";    
    var result = {Case: myCaseID, Status : myCaseStatus, Message: myMessage};
    callback(null, result);
    // return result;
};