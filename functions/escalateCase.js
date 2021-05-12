exports.handler = (event, context, callback) => {  
    console.log(JSON.stringify(event));  
    // Escalate the support case 
    var myCaseID = event.Case;    
    var myCaseStatus = event.Payload.Status;    
    var myMessage = event.Payload.Message + "escalating.";    
    var result = {Case: myCaseID, Status : myCaseStatus, Message: myMessage};
    callback(null, result);
    // return result;
};