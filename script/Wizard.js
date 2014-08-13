
SmartJWizard = function(configuration){
  var wizard = this;
  var conf = $.extend({
    dialog : true
  }, configuration);

  var frames = [];
  var callbackTable = [];
  var activeFrame;
  var activeFrameIndex;

  var toolbox = $.extend(this,{
    prev : prev,
    next : next,
    busy : frameBusy,
    setContent : setContent,
    error : showError,
    cancel : cancel,
    enableButtons : enableButtons,
    setFrameData : setFrameData,
    getFrameData : getFrameData,
  });

  this.show = function(options){
    var dialogOptions = {};
    $.extend(dialogOptions,options);
    if(conf.dialog){
      $( conf.container ).dialog(
        dialogOptions
      ).dialog("open");
    }
    createButtons(["Prev","Next","Cancel"]);
    wizard.gotoFrame(options.initialFrame || 0, options.initialArgs || {});
    return wizard;
  }
  this.close = function(){
    close();
    return wizard;
  }
  this.gotoFrame = function(index, frameArgs){
    notify("change", index);
    activeFrameIndex = index;
    activeFrame = frames[index];
    makeUpFrame();
    frameBusy(true);
    activeFrame.init.call(this,toolbox);
    return wizard;
  }

  init();

  function init(){
    /* Prepare frames list */
    for (var i = 0; i < conf.frames.length; i++) {
      frames.push(conf.frames[i](toolbox));
    }
    frameIndex = 0;
    activeFrame = this.frames[frameIndex];
    /* Create a container for the contents if not provided */
    if(!conf.container){
      var containerName = "wizard-container";
      conf.container = "#"+containerName;
      $("body").append(
        $("<div>").attr("id",containerName)
      );
    }
    $(conf.container).
      append(
      $("<div>").attr({
        "id" : "wizard_container",
        "class" : "wizard_container"
      })
    );
    /* Create a panel for the loading dialog */
    $(conf.container).append($("<div>").attr({
        "id" : "wizard_loading",
        "class" : "wizard_loading"
      }).append(
        $("<div>").progressbar( {
          value: false,
          text: "Loading..."
          })
      )
    );
    /* Create a panel for the errors dialog */
    $(conf.container).append($("<div>").attr({
        "id" : "wizard_error",
        "class" : "wizard_error"
      }).append(
        $("<span>").attr("id","error_message").wrap("<h2>")
      )
    );
    if(conf.dialog){
      /* Prepare the dialog */
      $( conf.container ).dialog({autoOpen:false});
    }
  }
  function prev(frameArgs){
    notify("previous");
    activeFrame.prev.call(wizard, frameArgs);
  }
  function next(frameArgs){
    notify("next");
    activeFrame.next.call(wizard, frameArgs);
  }
  function close(){
    if(activeFrame.close)
      activeFrame.close();
    if(activeFrame.finish)
      activeFrame.finish();
    notify("close");
    $( conf.container ).dialog("close");
  }
  function cancel(){
    notify("cancel");
    close();
  }
  function frameBusy(showAsBusy){
    console.log("frameBusy",showAsBusy);
    $("#error_message").hide();
    if(showAsBusy){
      enableButtons("Cancel");
      $("#wizard_container").
        addClass("Loading");
      $("#wizard_loading").
        addClass("Loading").show();
    } else {
      $("#wizard_loading").
        removeClass("Loading").hide();
      $("#wizard_container").
        removeClass("Loading");
    }
  }
  function setContent(content){
    $("#wizard_container").empty().html(content);
  }
  function makeUpFrame(){
    var frame = activeFrame;
    if(frame){
      if(frame.text)
        $(conf.container).dialog("option","title",frame.text);
      if(frame.buttons)
        createButtons(frame.buttons);
    }
  }
  function createButtons(buttonsName){
      if(typeof(enabledButtons) == "string")
         enabledButtons = [enabledButtons];
      var buttons = [];
      for (var i = 0; i < buttonsName.length; i++){
        var callBackName = buttonsName[i].toString().toLowerCase();
        var callBack =
          callBackName === "prev"? wizard.prev:
          callBackName === "next"? wizard.next:
          callBackName === "cancel"? wizard.cancel:
          callBackName === "finish"? wizard.close:
          callBackName === "close"? wizard.close:
          (function(functionName){
           return function(){
             if(activeFrame[functionName])
               activeFrame[functionName].call(this);
             else
               throw "Unhandled "+functionName+" button";
             }
          })(callBackName);

        buttons.push({
          text : buttonsName[i],
          click: callBack,
          id: "wizard-button-"+callBackName
        });
      }
      $(conf.container).dialog("option","buttons",buttons);
  }
  function enableButtons(enabledButtons){
      if(typeof(enabledButtons) == "string")
         enabledButtons = [enabledButtons];
      var buttons = $(conf.container).dialog("option","buttons");
      for (var i = 0; i < buttons.length; i++){
        var button = buttons[i];
        var disabled = enabledButtons.indexOf(button.text) == -1 &&
        enabledButtons.indexOf(button.text.toString().toLowerCase()) == -1;
        button.disabled = disabled;
      }
      $(conf.container).dialog("option","buttons",buttons);
  }
  function showError(error){
    $("#wizard_loading").hide();
    $("#wizard_container").hide();
    $("#error_message").text(error).show();
    createButtons(["Close"]);
  }
  function getFrameData(frameIndex){
    return frames[frameIndex].data;
  }
  function setFrameData(frameData){
    activeFrame.data = frameData;
  }
  function notify(eventName, eventArgs){
    var handlers = callbackTable[eventName];
    if(handlers)
      for(var handler in handlers)
        if(handlers[handler])
          handlers[handler].call(this, eventArgs);
  }
  this.on  = function(eventName, callBack){
    if(!callbackTable[eventName])
      callbackTable[eventName] = [];
    callbackTable[eventName].push(callBack);
    return wizard;
  }
}
