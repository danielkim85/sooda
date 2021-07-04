let pStart = {y:0};
let pStop = {y:0};
let topEle, bottomEle, windowHeight, isTop, bottomEleHeight;

$(window).resize(function(){
  windowHeight = undefined;
});

function swipeStart(topEle_,e) {
  if (typeof e['targetTouches'] !== "undefined"){
    let touch = e.targetTouches[0];
    pStart.y = touch.screenY;
  } else {
    pStart.y = e.screenY;
  }
  if(!topEle) {
    topEle = topEle_;
  }
  isTop = topEle.position().top === 0;
}

function swipeEnd(bottomEle_,topOffset,callback,e){
  if (typeof e['changedTouches'] !== "undefined"){
    let touch = e.changedTouches[0];
    pStop.y = touch.screenY;
  } else {
    pStop.y = e.screenY;
  }
  swipeCheck(bottomEle_,topOffset,callback);
}

function swipeCheck(bottomEle_,topOffset,callback){
  let changeY = pStart.y - pStop.y;
  if(!windowHeight) {
    windowHeight = $(window).height();
  }
  if(!bottomEle) {
    bottomEle = bottomEle_;
  }
  if(!bottomEleHeight) {
    bottomEleHeight = bottomEle.height();
  }

  if (isTop && changeY < -100) {
    callback(true);
  }
  else if(bottomEle.offset().top - topOffset.height() + bottomEle.outerHeight(true) - windowHeight <= bottomEleHeight) {
    callback(false);
  }
  isTop = false;
}
