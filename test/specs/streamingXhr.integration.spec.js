/* Tests the streaming xhr without stubbing anything. Really just a test that 
*  we've got the interface of the in-browser XHR object pinned down  */

describe('streaming xhr integration (real http)', function() {
 
 
   it('can ajax in a small known file',  function() {
     
      // in practice, since we're running on an internal network and this is a small file,
      // we'll probably only get one callback         
      streamingXhr(                         
         eventBus.fire, eventBus.on
      )(  
         'GET', 
         '/static/json/smallestPossible.json',
         null // this is a GET, no data to send);
      ); 
      
      waitForRequestToComplete();            

      runs(function(){
         expect(contentReceived).toEqual('{}'); 
      });  
   })
              
   it('can ajax in a very large file without missing any',  function() {
   
  
      // in practice, since we're running on an internal network and this is a small file,
      // we'll probably only get one callback         
      streamingXhr(                         
         eventBus.fire, eventBus.on
      )(
         'GET', 
         '/static/json/twentyThousandRecords.json',
         null // this is a GET, no data to send      
      );
      
      waitForRequestToComplete();            

      runs(function(){
         var parsedResult;
      
         expect(function(){

            parsedResult = JSON.parse(contentReceived);
            
         }).not.toThrow();
         
         // as per the name, should have 20,000 records in that file:                     
         expect(parsedResult.result.length).toEqual(20000);
      });  
   })
   
   it('can ajax in a streaming file without missing any',  function(queue) {
   
   
      // in practice, since we're running on an internal network and this is a small file,
      // we'll probably only get one callback         
      streamingXhr(                       
         eventBus.fire, eventBus.on
      )(
         'GET', 
         cacheBustUrl('/stream/tenSlowNumbers'),
         null // this is a GET, no data to send      
      );
      
      waitForRequestToComplete();            

      runs(function(){
         // should have given valid json;
         var parsedResult;
         
         expect(function(){

            parsedResult = JSON.parse(contentReceived);
            
         }).not.toThrow();
         
         // as per the name, should have ten numbers in that file:
         expect(parsedResult).toEqual([0,1,2,3,4,5,6,7,8,9]);
      });              
   })
   
   it('can make a post request',  function(queue) {
   
      var payload = {'thisWill':'bePosted','andShould':'be','echoed':'back'};
   
      // in practice, since we're running on an internal network and this is a small file,
      // we'll probably only get one callback         
      streamingXhr(                        
         eventBus.fire, eventBus.on
      )(
        'POST',
         cacheBustUrl('/stream/echoback.json'),
         payload       
      );
      
      waitForRequestToComplete();            

      runs(function(){
         expect(function(){

            parsedResult = JSON.parse(contentReceived);
            
         }).not.toThrow();
                              
         expect(parsedResult).toEqual(payload);
      });
     
   })
   
   it('can make a put request',  function(queue) {
   
      var payload = {'thisWill':'bePosted','andShould':'be','echoed':'back'};
   
      // in practice, since we're running on an internal network and this is a small file,
      // we'll probably only get one callback         
      streamingXhr(
         eventBus.fire, eventBus.on
      )(
         'PUT',
         cacheBustUrl('/stream/echoback.json'),
         payload       
      );
      
      waitForRequestToComplete();            

      runs(function(){
         expect(function(){

            parsedResult = JSON.parse(contentReceived);
            
         }).not.toThrow();
                              
         expect(parsedResult).toEqual(payload);
      });
     
   })   
          
   // this test is only activated for non-IE browsers and IE 10 or newer.
   // old and rubbish browsers buffer the xhr response meaning that this 
   // will never pass. But for good browsers it is good to have an integration
   // test to confirm that we're getting it right.           
   if( !internetExplorer || internetExplorer >= 10 ) {          
      it('gives multiple callbacks when loading a streaming resource',  function(queue) {
                              
         streamingXhr(                           
            eventBus.fire, eventBus.on
         )(
            'GET', 
            cacheBustUrl('/stream/tenSlowNumbers'),
            null // this is a get: no data to send         
         );                     
         
         waitForRequestToComplete();      
   
         runs(function(){
                                   
            // realistically, should have had 10 or 20, but this isn't deterministic so
            // 3 is enough to indicate the results didn't all arrive in one big blob.
            expect(numberOfProgressCallbacks).toBeGreaterThan(3);
         });      
      })
   }
   
   it('does not call back with zero-length data',  function(queue) {
         
      eventBus.on(HTTP_PROGRESS_EVENT,
          function(nextDrip){            
             expect(nextDrip.length).not.toEqual(0);                                                                                     
          }
      );          
         
      // since this is a large file, even serving locally we're going to get multiple callbacks:       
      streamingXhr(              
         eventBus.fire, eventBus.on
      )(
         'GET', 
         '/static/json/twentyThousandRecords.json',
         null // this is a GET: no data to send      
      );         

      waitForRequestToComplete()
      
      runs(function(){})   
   })              


   var requestCompleteListener,
       contentReceived,
       numberOfProgressCallbacks,
       eventBus;
   
   function waitForRequestToComplete(){
      waitsFor(function(){     
         return requestCompleteListener.called;      
      }, 'streaming xhr to complete', ASYNC_TEST_TIMEOUT);   
   }
   
   beforeEach(function(){
      contentReceived = '';      
      numberOfProgressCallbacks = 0;
      requestCompleteListener = sinon.stub();
      eventBus = pubSub();
      
      eventBus.on(HTTP_PROGRESS_EVENT, function(nextDrip){
         numberOfProgressCallbacks ++;
         contentReceived += nextDrip;                                                                                     
      });
      
      eventBus.on(HTTP_DONE_EVENT, requestCompleteListener);
   });
      
   function cacheBustUrl(url) {
      var now = Date.now? Date.now() : new Date().valueOf();
   
      return url + '/cacheBusted/' + now + '.txt';
   }

});