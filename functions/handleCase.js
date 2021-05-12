exports.handler = (event, context, callback) => {    
    console.log(JSON.stringify(event));
    // Generate a random number to determine whether the support case has been resolved, then return that value along with the updated message.
    var min = 0;
    var max = 1;    
    var myCaseStatus = Math.floor(Math.random() * (max - min + 1)) + min;
    var myCaseID = event.Payload.Case;
    var myMessage = event.Payload.Message;
    console.log(`My Case status: ${myCaseStatus}`);
    if (myCaseStatus == 1) {
        // Support case has been resolved    
        myMessage = myMessage + "resolved...";
    } else if (myCaseStatus == 0) {
        // Support case is still open
        myMessage = myMessage + "unresolved...";
    } 
    var result = {Case: myCaseID, Status : myCaseStatus, Message: myMessage};
    callback(null, result); 
    // return result;
};