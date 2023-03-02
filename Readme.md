# Channel Adapter  
  
A Channel Adapter is a "bridge" between the system's Message Broker (SNS) and the applications subscribed to it (EventHandler via iPubSub).  
  
Channel Adapter is suppose to act as an extension and an encapsulation of SNS to its SDK and who uses it (EventHandler2).   
  
Channel Adapter SDK implements EventHandler2's iPubSub.  
  
**Message flow**:
The CA is subscribed to an SNS topic.  
Every notification from SNS is being sent to SDK.  
Every Event from SDK is sent to CA and then published to SNS  

SNS --> (Notification) --> Channel Adapter --> (Event) --> SDK --> (Event) --> EventHandler

The CA is running two Koa web applications, one on each port. one to receive SNS notifications and another to receive Events from SDK.  
The SDK is running a single Koa web applications, to receive Events from CA.  
  
The CA accepts SNS notifications on /v1/sns/  
The CA accepts Events from SDK on /v1/event/  
The SDK accepts Events from CA on /v1/event/  
  
The CA is only aware of Events - not Context!  
  
**Channel Adapter Runner**  
  
The Channel Adapter Runner is launching two web applications (described above) and routes the POST requests to the Channel Adapter class, which contains the logic of sending Events and Notifications from SNS to SDK and vice versa.  
  
**SNS Test integrations**  
  
Testing Channel Adapter against SNS is problematic, as it requires the CA to have a publicly exposed HTTP endpoint - so it can not be run with our CI.  
I have asked Bezeq to route all incoming traffic to port 56432 to my (Amir) Mac, which allowed me to develop and test against SNS in a comfortable way.  
  
**Other notes**  
  
* A connection from SNS to CA is kept a live until the Event Handler closes it, thus done processing it.  
* If the Event Handler fails, a 500 response is sent to SNS to trigger its retry mechanism.  
* If the Event Handler succeeds in processing the Event (which probably means it published another event), the EH will respond with 200 and CA will respond with 200 to SNS thus complete an SNS notification consumption.  
* Communication between CA and SDK is HTTP as well.   
* Channel Adapter is expected to run along with an Event Handler in the same ECS Service. Each one is expected to have its own container with a port open between the two.