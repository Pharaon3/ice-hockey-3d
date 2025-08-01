var socket;

var currentState = 0
var isLimitedCov = false;

var updated_uts1 = 0, updated_uts = 0
var currentTime, matchStartDate;
var ptime, setTimer, stopTime = 0
var setTimer1 = true;

var topLeft = 160,
  topPosition = 136
var pitchX = 634,
  pitchY = 222
var w1 = pitchX / 2,
  w2 = 480 / 2,
  hp = pitchY
var x1 = 0,
  y1 = hp / 2,
  x2 = 0,
  y2 = hp / 2
var xb = 0,
  yb = 0
var t, L, H, ll, hh, h1, k
var x = 0,
  y = mapY(0, hp / 2),
  x_1 = 0,
  y_1 = mapY(0, hp / 2),
  x_b = 0,
  y_b = mapY(0, hp / 2)
var ballRadius = 15

x_1_1 = mapX(x1, y1)
y_1_1 = mapY(x1, y1)
x_1_2 = mapX(x2, y2)
y_1_2 = mapY(x2, y2)

var time,
  timeInterval = 10
var lineX = [
  mapX(0, hp / 2) + w2 + topLeft,
  mapX(0, hp / 2) + w2 + topLeft,
  mapX(0, hp / 2) + w2 + topLeft,
  mapX(0, hp / 2) + w2 + topLeft,
]
var lineY = [
  mapY(0, hp / 2) + topPosition,
  mapY(0, hp / 2) + topPosition,
  mapY(0, hp / 2) + topPosition,
  mapY(0, hp / 2) + topPosition,
]

var timeFlag // 0: not set, 1: set
var currentTeam
var rectId, currentRectId // 0: none, 1: homeSafe, 2: homeAttack, 3: homeDangerousAttack, -3: awaySafe, -2: awayAttack, -1: awayDangerousAttack;
var timeSet

var isGoal

function countdown() {
  var interval = setInterval(function () {
    changeScreenSize()
    if(isGoal){
      isGoal ++
      if(isGoal > 10000 / timeInterval) isGoal = 0
      setCenterFrame('Goal', teamNames[gameState[currentState]['team']])
    }
    else {
      const currentDate = new Date;
      updated_uts += timeInterval / 1000
      if (setTimer) currentTime = updated_uts
      else currentTime = stopTime

      if (matchStartDate) {
        var seconds = Math.floor((matchStartDate - currentDate.getTime()) / 1000)
        var second = seconds % 60
        var minutes = Math.floor(seconds / 60)
        var minute = minutes % 60
        var hours = Math.floor(minutes / 60)
        var hour = hours % 24
        var days = Math.floor(hours / 24)
        setCenterFrame('Not Started', days + 'D ' + hour + 'H ' + minute + 'M ' + second + 'S')
      }

      if (isLimitedCov) {
        setCenterFrame('Limited Coverage', homeScore + ' - ' + awayScore)
      }
      //every 10ms
      ttt++;
      if (currentState == 0) {
        if (gameState.length > 0) {
          stepInitialize()
        }
      } else {
        if (Math.floor(ttt) % 50 == 0) {
          stepInitialize()
        }
        t += 1 / 51
        ballPosition()
        drawRect()
        displayState()
        if (x2 == x1 && y2 == y1) {
          bounceBall()
        } else {
          if (gameState[currentState]['type']) {
            bounceBall();
          } else {
            kickBall()
          }
        }
        drawTrack()
        showState()
      }

      if(gameState.length && gameState[currentState]['type'] == 'timeout'){
        setTimer = false
        setCenterFrame('Time Out', teamNames[gameState[currentState]['team']])
      }
      if(gameState.length && gameState[currentState]['type'] == "tv_timeout_start"){
        setTimer = false
        setCenterFrame('TV Time Out', homeScore + ' - ' + awayScore)
      }
      time -= timeInterval;
      if(setTimer1) currentTime = time
      else currentTime = getDataTime
      let thisSecond = Math.floor(currentTime / 1000);
      var minute = Math.floor(thisSecond / 60);
      var second = thisSecond % 60;
      document.getElementById('time').textContent = max(Math.floor(minute / 10), 0) + '' + max(0, (minute % 10)) + ':' + max(0, Math.floor(second / 10)) + '' + max(0, (second % 10));
    }
  }, timeInterval)
}
function load() {
  xb = x1 + w1
  ttt = 0
  yb = y1
  t = 0.005
  time = 0
  playMode = 0
  tmpV = true
  exceeded = true
  timeFlag = 0
  rectId = 0
  currentRectId = 0
  homeScore = 0
  awayScore = 0
  timeSet = 0;
  isGoal = 0

  const urlParams = new URLSearchParams(window.location.search);
  const eventId = Number(urlParams.get('eventId'));

  //getMatchJsonData()
  countdown()

  socket = new WebSocket("wss://gamecast.betdata.pro:8443");
  socket.onopen = function (e) {
    //socket.send(JSON.stringify({r:"authenticate", a:{key:"*******"}}));
    socket.send(JSON.stringify({ r: "subscribe_event", a: { id: eventId } }));
  };

  socket.onmessage = function (e) {
    var data = JSON.parse(e.data);

    if (data.r == 'event') {
      // New function added for websocket. Call it.
      handleEventData(data.d);
    }
  };
  document.getElementById('link').setAttribute('href', '../hockey-2d/index.html?eventId=' + eventId)
}
function bounceBall() {
  if(!setTimer)return
  tt = t
  x_1 = mapX(x, y)
  y_1 = ((y * y) / hp + y) / 2
  document
    .getElementById('ball')
    .setAttribute('x', mapX(x, y) + w2 - ballRadius / 2 + topLeft)
  document
    .getElementById('ball')
    .setAttribute(
      'y',
      mapY(x, y) - ballRadius / 2 + topPosition
    )
  document.getElementById('ball').setAttribute('width', ballRadius)
  document.getElementById('ball_shadow').setAttribute('cx', mapX(x, y) + w2 + topLeft)
  document.getElementById('ball_shadow').setAttribute('cy', mapY(x, y) + topPosition)
  document.getElementById('ball_shadow').setAttribute('rx', 10 * (tt + 1))
  document.getElementById('ball_shadow').setAttribute('ry', 4 * (tt + 1))
}
function ballPosition() {
  x = x1 + (x2 - x1) * t
  y = y1 + (y2 - y1) * t
  x_b = mapX(x, y)
  y_b = mapY(x, y)
}
function kickBall() {
  document
    .getElementById('ball')
    .setAttribute('x', mapX(x, y) + w2 - ballRadius / 2 + topLeft)
  document
    .getElementById('ball')
    .setAttribute('y', mapY(x, y) - ballRadius / 2 + topPosition)
  document.getElementById('ball').setAttribute('width', ballRadius)
  document.getElementById('ball_shadow').setAttribute('cx', mapX(x, y) + w2 + topLeft)
  document.getElementById('ball_shadow').setAttribute('cy', mapY(x, y) + topPosition)
  document.getElementById('ball_shadow').setAttribute('rx', 10)
  document.getElementById('ball_shadow').setAttribute('ry', 4)
}
function drawTrack() {
  x_l = x_1_1 + (x_1_2 - x_1_1) * t
  y_l = y_1_1 + (y_1_2 - y_1_1) * t
  document.getElementById('ballLine1').setAttribute('x1', lineX[0])
  document.getElementById('ballLine1').setAttribute('y1', lineY[0])
  document.getElementById('ballLine1').setAttribute('x2', x_l + w2 + topLeft)
  document.getElementById('ballLine1').setAttribute('y2', y_l + topPosition)

  document.getElementById('ballLine2').setAttribute('x1', lineX[1])
  document.getElementById('ballLine2').setAttribute('y1', lineY[1])
  document.getElementById('ballLine2').setAttribute('x2', lineX[0])
  document.getElementById('ballLine2').setAttribute('y2', lineY[0])

  document.getElementById('ballLine3').setAttribute('x1', lineX[2])
  document.getElementById('ballLine3').setAttribute('y1', lineY[2])
  document.getElementById('ballLine3').setAttribute('x2', lineX[1])
  document.getElementById('ballLine3').setAttribute('y2', lineY[1])

  document.getElementById('ballLine4').setAttribute('x1', lineX[3])
  document.getElementById('ballLine4').setAttribute('y1', lineY[3])
  document.getElementById('ballLine4').setAttribute('x2', lineX[2])
  document.getElementById('ballLine4').setAttribute('y2', lineY[2])

  document.getElementById('TractDot1').setAttribute('cx', lineX[0])
  document.getElementById('TractDot1').setAttribute('cy', lineY[0])
  document.getElementById('TractDot2').setAttribute('cx', lineX[1])
  document.getElementById('TractDot2').setAttribute('cy', lineY[1])
  document.getElementById('TractDot3').setAttribute('cx', lineX[2])
  document.getElementById('TractDot3').setAttribute('cy', lineY[2])
}
function resetTrack() {
  lineX[3] = x_1_1 + w2 + topLeft
  lineX[2] = x_1_1 + w2 + topLeft
  lineX[1] = x_1_1 + w2 + topLeft
  lineX[0] = x_1_1 + w2 + topLeft
  lineY[3] = y_1_1 + topPosition
  lineY[2] = y_1_1 + topPosition
  lineY[1] = y_1_1 + topPosition
  lineY[0] = y_1_1 + topPosition
}
function stepInitialize() {
  // For setting time
  if (timeFlag == 0) {
    if (currentState > 0) {
      if (gameState[currentState]['seconds'] > -1) {
        // time = gameState[currentState]['seconds'] * 1000
        time = getDataTime
        timeFlag = 1
      }
    }
  }
  // For initializing ball position
  t = 0
  x1 = x2
  y1 = y2
  if (currentState < gameState.length - 1) {
    currentState = max(currentState + 1, gameState.length - 10)
    time = getDataTime
    if(gameState[currentState]['seconds'] > 0){
      // time = gameState[currentState]['seconds'] * 1000
      if(gameState[currentState]['type'] == 'periodscore') setTimer = 0;
    }
    if (gameState[currentState]['X'] > -1) {
      x2 = ((gameState[currentState]['X'] - 50) * w1) / 50
      y2 = (gameState[currentState]['Y'] * hp) / 100
      if (gameState[currentState]['type']) {
        x1 = x2
        y1 = y2
        x_1_1 = mapX(x1, y1)
        y_1_1 = mapY(x1, y1)
        x_1_2 = mapX(x2, y2)
        y_1_2 = mapY(x2, y2)
        resetTrack()
      } else {
        x_1_1 = mapX(x1, y1)
        y_1_1 = mapY(x1, y1)
        x_1_2 = mapX(x2, y2)
        y_1_2 = mapY(x2, y2)
        lineX[3] = lineX[2]
        lineY[3] = lineY[2]
        lineX[2] = lineX[1]
        lineY[2] = lineY[1]
        lineX[1] = lineX[0]
        lineY[1] = lineY[0]
        lineX[0] = x_1_1 + w2 + topLeft
        lineY[0] = y_1_1 + topPosition
      }
    } else {
      x2 = x1
      y2 = y1
      x_1_1 = mapX(x1, y1)
      y_1_1 = mapY(x1, y1)
      x_1_2 = mapX(x2, y2)
      y_1_2 = mapY(x2, y2)
      resetTrack()
    }
  } else {
    x1 = x2
    y1 = y2
    x_1_1 = mapX(x1, y1)
    y_1_1 = mapY(x1, y1)
    x_1_2 = mapX(x2, y2)
    y_1_2 = mapY(x2, y2)
  }
  // For setting currentTeam
  if (gameState[currentState]['team'] != currentTeam) {
    currentTeam = gameState[currentState]['team']
    resetTrack()
  }
  rectId = currentRectId
  if (gameState[currentState]['type'] == 'goal') isGoal = 1
  else isGoal = 0;
}
function drawRect() {
  rt = t * 2
  if (rt > 1) rt = 1
  if (gameState[currentState]['team'] == 'home') {
    document.getElementById('awayStatePolygon').style.fill = 'url(#none)'
    document.getElementById('homeStatePolygon').style.fill =
      'url(#homeSafe)'
    if ((x2 * 50) / w1 + 50 < 50) {
      if (rectId == 0 || rectId == 1) {
        document.getElementById('homeStatePolygon').points[1].x = 320
        document.getElementById('homeStatePolygon').points[2].x = 400
        document.getElementById('homeStatePolygon').points[3].x = 292
      }
      if (rectId == 2) {
        document.getElementById('homeStatePolygon').points[1].x =
          400 + (320 - 400) * rt
        document.getElementById('homeStatePolygon').points[2].x =
          450 + (400 - 450) * rt
        document.getElementById('homeStatePolygon').points[3].x =
          400 + (292 - 400) * rt
      }
      if (rectId == 3) {
        document.getElementById('homeStatePolygon').points[1].x =
          480 + (320 - 480) * rt
        document.getElementById('homeStatePolygon').points[2].x =
          550 + (400 - 550) * rt
        document.getElementById('homeStatePolygon').points[3].x =
          508 + (292 - 508) * rt
      }
      if (rectId < 0) {
        document.getElementById('homeStatePolygon').points[1].x =
          160 + (320 - 160) * rt
        document.getElementById('homeStatePolygon').points[2].x =
          130 + (400 - 130) * rt
        document.getElementById('homeStatePolygon').points[3].x =
          83 + (292 - 83) * rt
      }
      currentRectId = 1
    } else if ((x2 * 50) / w1 + 50 < 75) {
      document.getElementById('homeStatePolygon').style.fill =
        'url(#homeAttack)'
      currentRectId = 2
      if (rectId == 0 || rectId == 2) {
        document.getElementById('homeStatePolygon').points[1].x = 400
        document.getElementById('homeStatePolygon').points[2].x = 450
        document.getElementById('homeStatePolygon').points[3].x = 400
      }
      if (rectId == 1) {
        document.getElementById('homeStatePolygon').points[1].x =
          320 + (400 - 320) * rt
        document.getElementById('homeStatePolygon').points[2].x =
          400 + (450 - 400) * rt
        document.getElementById('homeStatePolygon').points[3].x =
          292 + (400 - 292) * rt
      }
      if (rectId == 3) {
        document.getElementById('homeStatePolygon').points[1].x =
          480 + (400 - 480) * rt
        document.getElementById('homeStatePolygon').points[2].x =
          550 + (450 - 550) * rt
        document.getElementById('homeStatePolygon').points[3].x =
          508 + (400 - 508) * rt
      }
      if (rectId < 0) {
        document.getElementById('homeStatePolygon').points[1].x =
          160 + (400 - 160) * rt
        document.getElementById('homeStatePolygon').points[2].x =
          130 + (450 - 130) * rt
        document.getElementById('homeStatePolygon').points[3].x =
          83 + (400 - 83) * rt
      }
    } else {
      currentRectId = 3
      if (rectId == 0 || rectId == 3) {
        document.getElementById('homeStatePolygon').style.fill =
          'url(#homeDangerousAttack)'
        document.getElementById('homeStatePolygon').points[1].x = 480
        document.getElementById('homeStatePolygon').points[2].x = 550
        document.getElementById('homeStatePolygon').points[3].x = 508
      }
      if (rectId == 1) {
        document.getElementById('homeStatePolygon').style.fill =
          'url(#homeDangerousAttack)'
        document.getElementById('homeStatePolygon').points[1].x =
          320 + (480 - 320) * rt
        document.getElementById('homeStatePolygon').points[2].x =
          400 + (550 - 400) * rt
        document.getElementById('homeStatePolygon').points[3].x =
          292 + (508 - 292) * rt
      }
      if (rectId == 2) {
        document.getElementById('homeStatePolygon').style.fill =
          'url(#homeDangerousAttack)'
        document.getElementById('homeStatePolygon').points[1].x =
          400 + (480 - 400) * rt
        document.getElementById('homeStatePolygon').points[2].x =
          450 + (550 - 450) * rt
        document.getElementById('homeStatePolygon').points[3].x =
          400 + (508 - 400) * rt
      }
      if (rectId < 0) {
        document.getElementById('homeStatePolygon').style.fill =
          'url(#homeDangerousAttack)'
        document.getElementById('homeStatePolygon').points[1].x =
          160 + (480 - 160) * rt
        document.getElementById('homeStatePolygon').points[2].x =
          130 + (550 - 130) * rt
        document.getElementById('homeStatePolygon').points[3].x =
          83 + (508 - 83) * rt
      }
    }
  } else {
    document.getElementById('homeStatePolygon').style.fill = 'url(#none)'
    if ((x2 * 50) / w1 + 50 < 25) {
      currentRectId = -1
      if (rectId == 0 || rectId == -1) {
        document.getElementById('awayStatePolygon').style.fill =
          'url(#awayDangerousAttack)'
        document.getElementById('awayStatePolygon').points[1].x = 320
        document.getElementById('awayStatePolygon').points[0].x = 250
        document.getElementById('awayStatePolygon').points[4].x = 292
      }
      if (rectId == -2) {
        document.getElementById('awayStatePolygon').style.fill =
          'url(#awayDangerousAttack)'
        document.getElementById('awayStatePolygon').points[1].x =
          400 + (320 - 400) * rt
        document.getElementById('awayStatePolygon').points[0].x =
          350 + (250 - 350) * rt
        document.getElementById('awayStatePolygon').points[4].x =
          400 + (292 - 400) * rt
      }
      if (rectId == -3) {
        document.getElementById('awayStatePolygon').style.fill =
          'url(#awayDangerousAttack)'
        document.getElementById('awayStatePolygon').points[1].x =
          480 + (320 - 480) * rt
        document.getElementById('awayStatePolygon').points[0].x =
          400 + (250 - 400) * rt
        document.getElementById('awayStatePolygon').points[4].x =
          508 + (292 - 508) * rt
      }
      if (rectId > 0) {
        document.getElementById('awayStatePolygon').style.fill =
          'url(#awayDangerousAttack)'
        document.getElementById('awayStatePolygon').points[1].x =
          640 + (320 - 640) * rt
        document.getElementById('awayStatePolygon').points[0].x =
          670 + (250 - 670) * rt
        document.getElementById('awayStatePolygon').points[4].x =
          717 + (292 - 717) * rt
      }
    } else if ((x2 * 50) / w1 + 50 < 50) {
      currentRectId = -2
      if (rectId == 0 || rectId == -2) {
        document.getElementById('awayStatePolygon').style.fill =
          'url(#awayAttack)'
        document.getElementById('awayStatePolygon').points[1].x = 400
        document.getElementById('awayStatePolygon').points[0].x = 350
        document.getElementById('awayStatePolygon').points[4].x = 400
      }
      if (rectId == -1) {
        document.getElementById('awayStatePolygon').style.fill =
          'url(#awayAttack)'
        document.getElementById('awayStatePolygon').points[1].x =
          320 + (400 - 320) * rt
        document.getElementById('awayStatePolygon').points[0].x =
          250 + (350 - 250) * rt
        document.getElementById('awayStatePolygon').points[4].x =
          292 + (400 - 292) * rt
      }
      if (rectId == -3) {
        document.getElementById('awayStatePolygon').style.fill =
          'url(#awayAttack)'
        document.getElementById('awayStatePolygon').points[1].x =
          480 + (400 - 480) * rt
        document.getElementById('awayStatePolygon').points[0].x =
          400 + (350 - 400) * rt
        document.getElementById('awayStatePolygon').points[4].x =
          508 + (400 - 508) * rt
      }
      if (rectId > 0) {
        document.getElementById('awayStatePolygon').style.fill =
          'url(#awayAttack)'
        document.getElementById('awayStatePolygon').points[1].x =
          640 + (400 - 640) * rt
        document.getElementById('awayStatePolygon').points[0].x =
          670 + (350 - 670) * rt
        document.getElementById('awayStatePolygon').points[4].x =
          717 + (400 - 717) * rt
      }
    } else {
      currentRectId = -3
      if (rectId == 0 || rectId == -3) {
        document.getElementById('awayStatePolygon').style.fill =
          'url(#awaySafe)'
        document.getElementById('awayStatePolygon').points[1].x = 480
        document.getElementById('awayStatePolygon').points[0].x = 400
        document.getElementById('awayStatePolygon').points[4].x = 508
      }
      if (rectId == -2) {
        document.getElementById('awayStatePolygon').style.fill =
          'url(#awaySafe)'
        document.getElementById('awayStatePolygon').points[1].x =
          400 + (480 - 400) * rt
        document.getElementById('awayStatePolygon').points[0].x =
          350 + (400 - 350) * rt
        document.getElementById('awayStatePolygon').points[4].x =
          400 + (508 - 400) * rt
      }
      if (rectId == -1) {
        document.getElementById('awayStatePolygon').style.fill =
          'url(#awaySafe)'
        document.getElementById('awayStatePolygon').points[1].x =
          320 + (480 - 320) * rt
        document.getElementById('awayStatePolygon').points[0].x =
          250 + (400 - 250) * rt
        document.getElementById('awayStatePolygon').points[4].x =
          292 + (508 - 292) * rt
      }
      if (rectId > 0) {
        document.getElementById('awayStatePolygon').style.fill =
          'url(#awaySafe)'
        document.getElementById('awayStatePolygon').points[1].x =
          640 + (480 - 640) * rt
        document.getElementById('awayStatePolygon').points[0].x =
          670 + (400 - 670) * rt
        document.getElementById('awayStatePolygon').points[4].x =
          717 + (508 - 717) * rt
      }
    }
  }
}
function showState() {
  document.getElementById('actionBoard').setAttribute('width', 0)
  document.getElementById('actionBoard').setAttribute('height', 0)
  document.getElementById('stateBoardLine').setAttribute('stroke-opacity', 0)
  document.getElementById('ballState').textContent = ''
  document.getElementById('holder').textContent = ''

  // Goal
  document.getElementById('score-fade-out').setAttribute('opacity', 0);

  // Substitution
  document.getElementById('substitutionOut').setAttribute('fill-opacity', 0)
  document.getElementById('substitutionIn').setAttribute('fill-opacity', 0)
  document.getElementById('substitutionOutPlayer').textContent = ''
  document.getElementById('substitutionInPlayer').textContent = ''

  document.getElementById('bottom_text').textContent = ''
  document.getElementById('center_rect').setAttribute('fill-opacity', 0)
  document.getElementById('center_text').textContent = ''
  document.getElementById('offsideRect').points[0].x = 232
  document.getElementById('offsideRect').points[1].x = 718
  document.getElementById('offsideRect').points[2].x = 830
  document.getElementById('offsideRect').points[3].x = 120
  document.getElementById('offsideRect').setAttribute('fill-opacity', 0)
  document.getElementById('awayKickPolygon').style.fill = 'url(#none)'
  document.getElementById('homeKickPolygon').style.fill = 'url(#none)'


  if (gameState[currentState]['type']) {
    remove()
    if (gameState[currentState]['team']) showAction()
    if (gameState[currentState]['name'] == 'Yellow card') {
      setCenterFrame(gameState[currentState]['name'], teamNames[gameState[currentState]['team']])
    }
    if (gameState[currentState]['name'] == 'Red card') {
      setCenterFrame(gameState[currentState]['name'], teamNames[gameState[currentState]['team']])
    }
    if (gameState[currentState]['type'] == 'goal') {
      setCenterFrame('Goal', teamNames[gameState[currentState]['team']])
    }
    if (gameState[currentState]['type'] == 'substitution') {
      document.getElementById('substitutionOut').setAttribute('fill-opacity', 0.5)
      document.getElementById('substitutionIn').setAttribute('fill-opacity', 0.5)
      if (gameState[currentState]['playerin']['name']) document.getElementById('substitutionInPlayer').textContent = gameState[currentState]['playerin']['name']
      if (gameState[currentState]['playerout']['name']) document.getElementById('substitutionOutPlayer').textContent = gameState[currentState]['playerout']['name']
    }
    if (gameState[currentState]['type'] == 'throwin') {
      showAction()
      if (gameState[currentState]['team'] == 'home') {
        document.getElementById('homeKickPolygon').style.fill = 'url(#homeKick)'
        if (y2 < hp * 0.3 && x2 > w1 * 0.6) document.getElementById('homeKickPolygon').style.fill = 'url(#homeTopKick)'
        if (y2 > hp * 0.7 && x2 > w1 * 0.6) document.getElementById('homeKickPolygon').style.fill = 'url(#homeBottomKick)'
        document.getElementById('homeKickPolygon').points[0].x =
          x_b + w2 + topLeft
        document.getElementById('homeKickPolygon').points[0].y = y_b + topPosition
        center_text = capitalizeWords(gameState[currentState]['name'].split(" ")).join('')
        document.getElementById('homeState').textContent = center_text
      } else {
        document.getElementById('awayKickPolygon').style.fill = 'url(#awayKick)'
        if (y2 < hp * 0.3 && x2 < - w1 * 0.3) document.getElementById('awayKickPolygon').style.fill = 'url(#awayTopKick)'
        if (y2 > hp * 0.7 && x2 < - w1 * 0.3) document.getElementById('awayKickPolygon').style.fill = 'url(#awayBottomKick)'
        document.getElementById('awayKickPolygon').points[0].x =
          x_b + w2 + topLeft
        document.getElementById('awayKickPolygon').points[0].y = y_b + topPosition
        center_text = capitalizeWords(gameState[currentState]['name'].split(" ")).join('')
        document.getElementById('awayState').textContent = center_text
      }
    }
    if (gameState[currentState]['type'] == 'freekick') {
      showAction()
      if (gameState[currentState]['team'] == 'home') {
        document.getElementById('homeKickPolygon').style.fill = 'url(#homeKick)'
        if (y2 < hp * 0.3 && x2 > w1 * 0.6) document.getElementById('homeKickPolygon').style.fill = 'url(#homeTopKick)'
        if (y2 > hp * 0.7 && x2 > w1 * 0.6) document.getElementById('homeKickPolygon').style.fill = 'url(#homeBottomKick)'
        document.getElementById('homeKickPolygon').points[0].x =
          x_b + w2 + topLeft
        document.getElementById('homeKickPolygon').points[0].y = y_b + topPosition
        document.getElementById('homeState').textContent = gameState[currentState]['name']
      } else {
        document.getElementById('awayKickPolygon').style.fill = 'url(#awayKick)'
        if (y2 < hp * 0.3 && x2 < - w1 * 0.3) document.getElementById('awayKickPolygon').style.fill = 'url(#awayTopKick)'
        if (y2 > hp * 0.7 && x2 < - w1 * 0.3) document.getElementById('awayKickPolygon').style.fill = 'url(#awayBottomKick)'
        document.getElementById('awayKickPolygon').points[0].x =
          x_b + w2 + topLeft
        document.getElementById('awayKickPolygon').points[0].y = y_b + topPosition
        center_text = capitalizeWords(gameState[currentState]['name'].split(" ")).join('')
        document.getElementById('awayState').textContent = center_text
      }
    }
    if (gameState[currentState]['type'] == 'shotofftarget') {
      showAction()
      if (gameState[currentState]['team'] == 'home') {
        document.getElementById('homeKickPolygon').style.fill = 'url(#homeKick)'
        if (y2 < hp * 0.3 && x2 > w1 * 0.6) document.getElementById('homeKickPolygon').style.fill = 'url(#homeTopKick)'
        if (y2 > hp * 0.7 && x2 > w1 * 0.6) document.getElementById('homeKickPolygon').style.fill = 'url(#homeBottomKick)'
        document.getElementById('homeKickPolygon').points[0].x =
          mapX(x, y) + w2 + topLeft
        document.getElementById('homeKickPolygon').points[0].y = mapY(x, y) + topPosition
        document.getElementById('homeState').textContent = gameState[currentState]['name']
      } else {
        document.getElementById('awayKickPolygon').style.fill = 'url(#awayKick)'
        if (y2 < hp * 0.3 && x2 < - w1 * 0.3) document.getElementById('awayKickPolygon').style.fill = 'url(#awayTopKick)'
        if (y2 > hp * 0.7 && x2 < - w1 * 0.3) document.getElementById('awayKickPolygon').style.fill = 'url(#awayBottomKick)'
        document.getElementById('awayKickPolygon').points[0].x =
          x_b + w2 + topLeft
        document.getElementById('awayKickPolygon').points[0].y = y_b + topPosition
        center_text = capitalizeWords(gameState[currentState]['name'].split(" ")).join('')
        document.getElementById('awayState').textContent = center_text
      }
    }
    if (gameState[currentState]['type'] == 'shotontarget') {
      showAction()
      if (gameState[currentState]['team'] == 'home') {
        document.getElementById('homeKickPolygon').style.fill = 'url(#homeKick)'
        if (y2 < hp * 0.3 && x2 > w1 * 0.6) document.getElementById('homeKickPolygon').style.fill = 'url(#homeTopKick)'
        if (y2 > hp * 0.7 && x2 > w1 * 0.6) document.getElementById('homeKickPolygon').style.fill = 'url(#homeBottomKick)'
        document.getElementById('homeKickPolygon').points[0].x =
          x_b + w2 + topLeft
        document.getElementById('homeKickPolygon').points[0].y = y_b + topPosition
        document.getElementById('homeState').textContent = gameState[currentState]['name']
      } else {
        document.getElementById('awayKickPolygon').style.fill = 'url(#awayKick)'
        if (y2 < hp * 0.3 && x2 < - w1 * 0.3) document.getElementById('awayKickPolygon').style.fill = 'url(#awayTopKick)'
        if (y2 > hp * 0.7 && x2 < - w1 * 0.3) document.getElementById('awayKickPolygon').style.fill = 'url(#awayBottomKick)'
        document.getElementById('awayKickPolygon').points[0].x =
          x_b + w2 + topLeft
        document.getElementById('awayKickPolygon').points[0].y = y_b + topPosition
        center_text = capitalizeWords(gameState[currentState]['name'].split(" ")).join('')
        document.getElementById('awayState').textContent = center_text
      }
    }
    if (gameState[currentState]['type'] == 'goal_kick') {
      showAction()
      if (gameState[currentState]['team'] == 'home') {
        document.getElementById('homeKickPolygon').style.fill = 'url(#homeKick)'
        if (y2 < hp * 0.3 && x2 > w1 * 0.6) document.getElementById('homeKickPolygon').style.fill = 'url(#homeTopKick)'
        if (y2 > hp * 0.7 && x2 > w1 * 0.6) document.getElementById('homeKickPolygon').style.fill = 'url(#homeBottomKick)'
        document.getElementById('homeKickPolygon').points[0].x =
          x_b + w2 + topLeft
        document.getElementById('homeKickPolygon').points[0].y = y_b + topPosition
        document.getElementById('homeState').textContent = gameState[currentState]['name']
      } else {
        document.getElementById('awayKickPolygon').style.fill = 'url(#awayKick)'
        if (y2 < hp * 0.3 && x2 < - w1 * 0.3) document.getElementById('awayKickPolygon').style.fill = 'url(#awayTopKick)'
        if (y2 > hp * 0.7 && x2 < - w1 * 0.3) document.getElementById('awayKickPolygon').style.fill = 'url(#awayBottomKick)'
        document.getElementById('awayKickPolygon').points[0].x =
          x_b + w2 + topLeft
        document.getElementById('awayKickPolygon').points[0].y = y_b + topPosition
        center_text = capitalizeWords(gameState[currentState]['name'].split(" ")).join('')
        document.getElementById('awayState').textContent = center_text
      }
    }
    if (gameState[currentState]['type'] == 'match_ended') {
      setCenterFrame('Match End', homeScore + ':' + awayScore)
    }
    if (gameState[currentState]['type'] == 'periodstart') {
      // 
    }
    if (gameState[currentState]['type'] == 'periodscore') {
      if (gameState[currentState]['name'] == '1st half') {
        setCenterFrame('Halftime', homeScore + ':' + awayScore)
      }
    }
    if (gameState[currentState]['type'] == 'corner') {
      showAction()
    }
    if (gameState[currentState]['type'] == 'offside') {
      showAction()
      if (gameState[currentState]['team'] == 'home') {
        document.getElementById('offsideRect').points[1].x = ((x2 * 50) / w1 + 50) * (718 - 232) / 100 + 232
        document.getElementById('offsideRect').points[2].x = ((x2 * 50) / w1 + 50) * (830 - 120) / 100 + 120
        document.getElementById('offsideRect').setAttribute('fill-opacity', 0.5)
      }
      else {
        document.getElementById('offsideRect').points[0].x = ((x2 * 50) / w1 + 50) * (718 - 232) / 100 + 232
        document.getElementById('offsideRect').points[3].x = ((x2 * 50) / w1 + 50) * (830 - 120) / 100 + 120
        document.getElementById('offsideRect').setAttribute('fill-opacity', 0.5)
      }
    }
    if (gameState[currentState]['type'] == 'injurytimeshown') {
      document.getElementById('center_rect').setAttribute('fill-opacity', 0.3)
      document.getElementById('center_text').textContent = 'Injury time: ' + gameState[currentState]['minutes'] + 'mins'
    }
    if (gameState[currentState]['type'] == 'injury') {
      setCenterFrame('injury', teamNames[gameState[currentState]['team']])
    }
  }
  else {
    // document.getElementById('homeStateLabels').style.display = 'block'
    // document.getElementById('awayStateLabels').style.display = 'block'
  }
}
function remove() {
  document.getElementById('homeStatePolygon').style.fill = 'url(#none)'
  document.getElementById('awayStatePolygon').style.fill = 'url(#none)'
  document.getElementById('homeKickPolygon').style.fill = 'url(#none)'
  document.getElementById('awayKickPolygon').style.fill = 'url(#none)'
  document.getElementById('homeStateLabels').style.display = 'none'
  document.getElementById('awayStateLabels').style.display = 'none'

  document.getElementById('cardBoard').setAttribute('width', 0)
  document.getElementById('cardBoard').setAttribute('height', 0)
  document.getElementById('cardBoard').setAttribute('x', 10)
  document.getElementById('cardBoard').setAttribute('y', 10)
  document.getElementById('cardBoard').style.fill = 'url(#f00)'
}
function max(a, b) {
  if (a > b) return a;
  return b;
}
function mapX(x11, y11) {
  x_11 = ((w2 + ((w1 - w2) * y11) / hp) * x11) / w1
  return x_11
}
function mapY(x11, y11) {
  y_11 = ((y11 * y11) / hp + 1.5 * y11) / 2.5
  return y_11
}
function showAction() {
  center_text = capitalizeWords(gameState[currentState]['name'].split(" ")).join('')
  document.getElementById('ballState').textContent = center_text
  document.getElementById('holder').textContent = teamNames[gameState[currentState]['team']].toUpperCase()
  var rectWidth = document.getElementById('ballState').getBBox().width;
  rectWidth = max(rectWidth, document.getElementById('holder').getBBox().width) + 20
  document.getElementById('actionBoard').setAttribute('width', rectWidth)
  document.getElementById('actionBoard').setAttribute('height', 50)
  document.getElementById('actionBoard').setAttribute('x', x_b + w2 + topLeft - rectWidth - 10)
  document.getElementById('actionBoard').setAttribute('y', y_b + topPosition - 50 - 10)
  document.getElementById('holder').setAttribute('text-anchor', 'end')
  document.getElementById('ballState').setAttribute('text-anchor', 'end')
  document.getElementById('holder').setAttribute('x', x_b + w2 + topLeft - 20)
  document.getElementById('holder').setAttribute('y', y_b + topPosition - 12 - 5)
  document.getElementById('ballState').setAttribute('x', x_b + w2 + topLeft - 20)
  document.getElementById('ballState').setAttribute('y', y_b + topPosition - 37 - 5)
  document.getElementById('stateBoardLine').setAttribute('stroke-opacity', 0.9)
  document.getElementById('stateBoardLine').setAttribute('x1', x_b + w2 + topLeft - 15)
  document.getElementById('stateBoardLine').setAttribute('x2', x_b + w2 + topLeft - 15)
  document.getElementById('stateBoardLine').setAttribute('y1', y_b + topPosition - 50 - 5)
  document.getElementById('stateBoardLine').setAttribute('y2', y_b + topPosition - 15)
  if (gameState[currentState]['team'] == 'away') {
    document.getElementById('actionBoard').setAttribute('x', x_b + w2 + topLeft + 10)
    document.getElementById('holder').setAttribute('text-anchor', 'start')
    document.getElementById('ballState').setAttribute('text-anchor', 'start')
    document.getElementById('holder').setAttribute('x', x_b + w2 + topLeft + 20)
    document.getElementById('ballState').setAttribute('x', x_b + w2 + topLeft + 20)
    document.getElementById('stateBoardLine').setAttribute('stroke-opacity', 0.9)
    document.getElementById('stateBoardLine').setAttribute('x1', x_b + w2 + topLeft + 15)
    document.getElementById('stateBoardLine').setAttribute('x2', x_b + w2 + topLeft + 15)
  }
}
function displayState() {
  if (gameState[currentState]['team'] == 'home') {
    var statePositionX, statePositionY
    document.getElementById('homeStateLabels').style.display = 'block'
    document.getElementById('awayStateLabels').style.display = 'none'
    document.getElementById('homeName').textContent = teamNames['home'].toUpperCase()
    if ((y2 * 100) / hp < 30) {
      statePositionY = 300
    } else if ((y2 * 100) / hp < 70) {
      statePositionY = 250
    } else {
      statePositionY = 300
    }
    if ((x2 * 50) / w1 + 50 < 50) {
      document.getElementById('homeState').textContent = 'Puck Safe'
      statePositionX = 250
    } else if ((x2 * 50) / w1 + 50 < 75) {
      document.getElementById('homeState').textContent = 'Attacking'
      statePositionX = 440
    } else {
      document.getElementById('homeState').textContent = 'Dangerous Attack'
      statePositionX = 560
    }
    document.getElementById('homeStateLabels').setAttribute('transform', 'translate(' + statePositionX + ',' + statePositionY + ')');
    document.getElementById('homeStateBoard').setAttribute('width', max(document.getElementById('homeName').getBBox().width, document.getElementById('homeState').getBBox().width) + 70);
    document.getElementById('homeStateBoard').setAttribute('x', - max(document.getElementById('homeName').getBBox().width, document.getElementById('homeState').getBBox().width) - 70);
  }
  else {
    var statePositionX, statePositionY
    document.getElementById('homeStateLabels').style.display = 'none'
    document.getElementById('awayStateLabels').style.display = 'block'
    document.getElementById('awayName').textContent = teamNames['away'].toUpperCase()
    if ((y2 * 100) / hp < 30) {
      statePositionY = 300
    } else if ((y2 * 100) / hp < 70) {
      statePositionY = 250
    } else {
      statePositionY = 300
    }
    if ((x2 * 50) / w1 + 50 < 25) {
      document.getElementById('awayState').textContent = 'Dangerous Attack'
      statePositionX = 200
    } else if ((x2 * 50) / w1 + 50 < 50) {
      document.getElementById('awayState').textContent = 'Attacking'
      statePositionX = 400
    } else {
      document.getElementById('awayState').textContent = 'Puck Safe'
      statePositionX = 550
    }
    document.getElementById('awayStateLabels').setAttribute('transform', 'translate(' + statePositionX + ',' + statePositionY + ')');
    document.getElementById('awayStateBoard').setAttribute('width', max(document.getElementById('awayName').getBBox().width, document.getElementById('awayState').getBBox().width) + 70);
  }
}
function capitalizeWords(arr) {
  return arr.map(word => {
    const firstLetter = word.charAt(0).toUpperCase();
    const rest = word.slice(1).toLowerCase();

    return firstLetter + rest;
  });
}
function setCenterFrame(title, content) {
  document.getElementById('ballState').textContent = ''
  document.getElementById('actionBoard').setAttribute('height', 0)
  document.getElementById('stateBoardLine').setAttribute('stroke-opacity', 0)
  document.getElementById('center_rect').setAttribute('fill-opacity', 0.5)
  center_text = capitalizeWords(title.split(" ")).join(' ')
  document.getElementById('center_text').textContent = center_text
  titleWidth = document.getElementById('center_text').getBBox().width + 40
  document.getElementById('center_rect').setAttribute('height', 140)
  document.getElementById('bottom_text').textContent = content
  document.getElementById('ball').setAttribute('x', 100000)
  document.getElementById('ball').setAttribute('y', 100000)
  document.getElementById('ball_shadow').setAttribute('cx', 100000)
  document.getElementById('ball_shadow').setAttribute('cy', 100000)
  document.getElementById('center_rect').setAttribute('width', max(290, titleWidth))
  document.getElementById('center_rect').setAttribute('x', 400 - max(290, titleWidth) / 2)
}
function setSideFrame() {
  // body...
}
function setStateFrame() {
  // body...
}

function capitalizeWords(arr) {
  return arr.map(word => {
    const firstLetter = word.charAt(0).toUpperCase();
    const rest = word.slice(1).toLowerCase();

    return firstLetter + rest;
  });
}


// Get Data
var dob = 0
var gameState = new Array()
var lastEvents = new Array()
var awayteamname, hometeamname
var homeScore, awayScore
var teamNames = new Array()
const equals = (a, b) => JSON.stringify(a) === JSON.stringify(b)

// New function added for websocket.
function handleEventData(data) {

  /*
    data.info   => (matchinfo)
    data.match    => match (match_timelinedelta)
    data.events   => events (match_timelinedelta)
  */


  if (data.info) {
    handleInfoData(data);
  }

  var match = data['match']

  if (match) {
    if (match['coverage']['lmtsupport'] < 3 && match['p'] < 10 && match['p'] > 0) {
      isLimitedCov = true
    }
    else isLimitedCov = false

    setTimer = true
    if(match['p'] == 31) setTimer = false
    if(match['p'] == 32) setTimer = false
    if(match['p'] == 0) setTimer = false
    periodlength = match['periodlength']
    getDataTime = match['timeinfo']['remaining'] * 1000
    setTimer1 = match['timeinfo']['running']

    // Team Name Setting
    var teams = match['teams']
    var hometeam = teams['home']
    if (hometeam['name']) hometeamname = hometeam['name']
    var awayteam = teams['away']
    if (awayteam['name']) awayteamname = awayteam['name']
    teamNames['home'] = hometeamname;
    teamNames['away'] = awayteamname;
    // hometeamname = 'This team name is longer than 16 characters'
    if (hometeamname.length > 16) {
      teamNames['home'] = hometeamname.substr(0, 13) + '...';
    }
    if (awayteamname.length > 16) {
      teamNames['away'] = awayteamname.substr(0, 13) + '...';
    }
    document.getElementById('homeTeamName').textContent = teamNames['home']
    document.getElementById('awayTeamName').textContent = teamNames['away']
    document.getElementById('fade_homeTeamName').textContent = teamNames['home']
    document.getElementById('fade_awayTeamName').textContent = teamNames['away']
    document.getElementById('period').textContent = match['status']['name']

    center_text = capitalizeWords(match['status']['name'].split(" ")).join(' ')
    document.getElementById('period').textContent = center_text
    // if (match['status']['name'] == 'Halftime') stopTime = 45 * 60;
    if (match['status']['name'] == 'Not started') {
      stopTime = 0 * 60;
      document.getElementById('period').textContent = ''
      document.getElementById('time').textContent = ''
    }
    if (match['status']['name'] == 'Ended') stopTime = 90 * 60;

    // Score Setting
    var result = match['result']
    if (result['home']) homeScore = result['home']
    if (result['away']) awayScore = result['away']
    document.getElementById('score').textContent = homeScore + ' - ' + awayScore
    document.getElementById('fade_score').textContent = homeScore + ' - ' + awayScore

    if (match['matchstatus'] == 'result') { //Match End
      setCenterFrame('Match End', homeScore + ' : ' + awayScore)
    }

    if (match['status']['name'] == 'Not started') { //Match End
      const currentDate = new Date;
      upCommingTime = currentDate.getTime() / 1000 - match['updated_uts']
      // var seconds = Math.floor(updated_uts / 1000)
      var seconds = Math.floor(upCommingTime)
      var minute = Math.floor(seconds / 60)
      var second = seconds % 60
      // var date = new Date(match['_dt']['date'] + '4:52:48 PM UTC');
      var matchDate = match['_dt']['date'].split("/")
      var date = new Date(matchDate[1] + '/' + matchDate[0] + '/20' + matchDate[2] + ' ' + match['_dt']['time'] + ':00 UTC')

      matchStartDate = date.getTime()
    }

    if (match['p'] == 31) {
      setTimer = false
      setCenterFrame('End of 1st Period', homeScore + ' - ' + awayScore)
    }
    if (match['p'] == 32) {
      setTimer = false
      setCenterFrame('End of 2nd Period', homeScore + ' - ' + awayScore)
    }
    if (match['p'] == 33) {
      setTimer = false
      setCenterFrame('End of 3rd Period', homeScore + ' - ' + awayScore)
    }
    if (match['p'] == 34) {
      setTimer = false
      setCenterFrame('End of 4th Period', homeScore + ' - ' + awayScore)
    }
    if (match['p'] == 0) {
      setTimer = false
      setCenterFrame('Match End', homeScore + ' - ' + awayScore)
    }
  }

  var events = data['events'] || {};

  var newEvents = new Array()
  Object.values(events).forEach((event) => {
    if (event['seconds'] > 0 && timeSet == 0) {
      time = event['seconds'] * 1000 - match['p'] * 60 * match['periodlength'] * 1000;
      timeSet = 1;
    }
    if (
      event['type'] != 'possession' &&
      event['type'] != 'matchsituation' &&
      event['type'] != 'coordinates' &&
      event['type'] != 'ballcoordinates' &&
      event['type'] != 'goal_kick' &&
      event['type'] != 'corner' &&
      event['type'] != 'timeinfo' &&
      event['type'] != 'timerunning' &&
      event['type'] != 'possible_event'
    ) {
      newEvents.push(event)
    }
    if (event['type'] == 'corner') {
      if (event['side'] == 'left') {
        if (event['team'] == 'home') {
          var events1 = event;
          events1['X'] = 100
          events1['Y'] = 0
          newEvents.push(events1)
        }
        if (event['team'] == 'away') {
          var events1 = event;
          events1['X'] = 0
          events1['Y'] = 100
          newEvents.push(events1)
        }
      } else if (event['side'] == 'right') {
        if (event['team'] == 'home') {
          var events1 = event;
          events1['X'] = 100
          events1['Y'] = 100
          newEvents.push(events1)
        }
        if (event['team'] == 'away') {
          var events1 = event;
          events1['X'] = 0
          events1['Y'] = 0
          newEvents.push(events1)
        }
      } else
        newEvents.push(event)
    }
    if (event['type'] == 'goal_kick') {
      if (event['team'] == 'home') {
        var events1 = event;
        events1['X'] = 5
        events1['Y'] = 50
        newEvents.push(events1)
      } else if (event['team'] == 'away') {
        var events1 = event;
        events1['X'] = 95
        events1['Y'] = 50
        newEvents.push(events1)
      } else
        newEvents.push(event)
    }
    if (event['type'] == 'ballcoordinates') {
      var coordinates = event['coordinates']
      var tmpCoordinate = new Array()
      coordinates
        .slice()
        .reverse()
        .forEach((item) => {
          newEvents.push(item)
        })
    }
  })
  newEvents.forEach((newEvent) => {
    var flag = 1
    lastEvents.forEach((lastEvent) => {
      if (equals(newEvent, lastEvent)) flag = 0
    })
    if (flag == 1) {
      gameState.push(newEvent)
    }
  })
  lastEvents = newEvents
}

function handleInfoData(data) {
  var data1 = data.info;
  var jerseys = data1['jerseys']
  homePlayerColor = jerseys['home']['player']['base']
  awayPlayerColor = jerseys['away']['player']['base']
  homePlayerStripesColor = jerseys['home']['player']['stripes']
  awayPlayerStripesColor = jerseys['away']['player']['stripes']
  homePlayerSleeveColor = jerseys['home']['player']['sleeve']
  awayPlayerSleeveColor = jerseys['away']['player']['sleeve']
  homePlayerLongSleeveColor = jerseys['home']['player']['sleevelong']
  awayPlayerLongSleeveColor = jerseys['away']['player']['sleevelong']
  document.getElementById('homePlayerBase').setAttribute('fill', '#' + homePlayerColor);
  document.getElementById('awayPlayerBase').setAttribute('fill', '#' + awayPlayerColor);
  // document.getElementById('fade_homePlayerBase').setAttribute('fill', '#' + homePlayerColor);
  // document.getElementById('fade_awayPlayerBase').setAttribute('fill', '#' + awayPlayerColor);
  document.getElementById('state_homePlayerBase').setAttribute('fill', '#' + homePlayerColor);
  document.getElementById('state_awayPlayerBase').setAttribute('fill', '#' + awayPlayerColor);
  if (homePlayerSleeveColor) {
    document.getElementById('homePlayerLeftSleeve').setAttribute('fill', '#' + homePlayerSleeveColor);
    document.getElementById('homePlayerRightSleeve').setAttribute('fill', '#' + homePlayerSleeveColor);
    // document.getElementById('fade_homePlayerLeftSleeve').setAttribute('fill', '#' + homePlayerSleeveColor);
    // document.getElementById('fade_homePlayerRightSleeve').setAttribute('fill', '#' + homePlayerSleeveColor);
    document.getElementById('state_homePlayerLeftSleeve').setAttribute('fill', '#' + homePlayerSleeveColor);
    document.getElementById('state_homePlayerRightSleeve').setAttribute('fill', '#' + homePlayerSleeveColor);
  } else {
    document.getElementById('homePlayerLeftSleeve').setAttribute('fill', '#' + homePlayerColor);
    document.getElementById('homePlayerRightSleeve').setAttribute('fill', '#' + homePlayerColor);
    // document.getElementById('fade_homePlayerLeftSleeve').setAttribute('fill', '#' + homePlayerColor);
    // document.getElementById('fade_homePlayerRightSleeve').setAttribute('fill', '#' + homePlayerColor);
    // document.getElementById('state_homePlayerLeftSleeve').setAttribute('fill', '#' + homePlayerColor);
    // document.getElementById('state_homePlayerRightSleeve').setAttribute('fill', '#' + homePlayerColor);
  }
  if (awayPlayerSleeveColor) {
    document.getElementById('awayPlayerLeftSleeve').setAttribute('fill', '#' + awayPlayerSleeveColor);
    document.getElementById('awayPlayerRightSleeve').setAttribute('fill', '#' + awayPlayerSleeveColor);
    // document.getElementById('fade_awayPlayerLeftSleeve').setAttribute('fill', '#' + awayPlayerSleeveColor);
    // document.getElementById('fade_awayPlayerRightSleeve').setAttribute('fill', '#' + awayPlayerSleeveColor);
    document.getElementById('state_awayPlayerLeftSleeve').setAttribute('fill', '#' + awayPlayerSleeveColor);
    document.getElementById('state_awayPlayerRightSleeve').setAttribute('fill', '#' + awayPlayerSleeveColor);
  } else {
    document.getElementById('awayPlayerLeftSleeve').setAttribute('fill', '#' + awayPlayerColor);
    document.getElementById('awayPlayerRightSleeve').setAttribute('fill', '#' + awayPlayerColor);
    // document.getElementById('fade_awayPlayerLeftSleeve').setAttribute('fill', '#' + awayPlayerColor);
    // document.getElementById('fade_awayPlayerRightSleeve').setAttribute('fill', '#' + awayPlayerColor);
    document.getElementById('state_awayPlayerLeftSleeve').setAttribute('fill', '#' + awayPlayerColor);
    document.getElementById('state_awayPlayerRightSleeve').setAttribute('fill', '#' + awayPlayerColor);
  }
  if (homePlayerLongSleeveColor) {
    document.getElementById('homePlayerLeftLongSleeve').setAttribute('fill', '#' + homePlayerLongSleeveColor);
    document.getElementById('homePlayerRightLongSleeve').setAttribute('fill', '#' + homePlayerLongSleeveColor);
    // document.getElementById('fade_homePlayerLeftLongSleeve').setAttribute('fill', '#' + homePlayerLongSleeveColor);
    // document.getElementById('fade_homePlayerRightLongSleeve').setAttribute('fill', '#' + homePlayerLongSleeveColor);
    document.getElementById('state_homePlayerLeftLongSleeve').setAttribute('fill', '#' + homePlayerLongSleeveColor);
    document.getElementById('state_homePlayerRightLongSleeve').setAttribute('fill', '#' + homePlayerLongSleeveColor);
  } else {
    document.getElementById('homePlayerLeftLongSleeve').setAttribute('fill', '#' + homePlayerColor);
    document.getElementById('homePlayerRightLongSleeve').setAttribute('fill', '#' + homePlayerColor);
    // document.getElementById('fade_homePlayerLeftLongSleeve').setAttribute('fill', '#' + homePlayerColor);
    // document.getElementById('fade_homePlayerRightLongSleeve').setAttribute('fill', '#' + homePlayerColor);
    document.getElementById('state_homePlayerLeftLongSleeve').setAttribute('fill', '#' + homePlayerColor);
    document.getElementById('state_homePlayerRightLongSleeve').setAttribute('fill', '#' + homePlayerColor);
  }
  if (awayPlayerLongSleeveColor) {
    document.getElementById('awayPlayerLeftLongSleeve').setAttribute('fill', '#' + awayPlayerLongSleeveColor);
    document.getElementById('awayPlayerRightLongSleeve').setAttribute('fill', '#' + awayPlayerLongSleeveColor);
    // document.getElementById('fade_awayPlayerLeftLongSleeve').setAttribute('fill', '#' + awayPlayerLongSleeveColor);
    // document.getElementById('fade_awayPlayerRightLongSleeve').setAttribute('fill', '#' + awayPlayerLongSleeveColor);
    document.getElementById('state_awayPlayerLeftLongSleeve').setAttribute('fill', '#' + awayPlayerLongSleeveColor);
    document.getElementById('state_awayPlayerRightLongSleeve').setAttribute('fill', '#' + awayPlayerLongSleeveColor);
  } else {
    document.getElementById('awayPlayerLeftLongSleeve').setAttribute('fill', '#' + awayPlayerColor);
    document.getElementById('awayPlayerRightLongSleeve').setAttribute('fill', '#' + awayPlayerColor);
    // document.getElementById('fade_awayPlayerLeftLongSleeve').setAttribute('fill', '#' + awayPlayerColor);
    // document.getElementById('fade_awayPlayerRightLongSleeve').setAttribute('fill', '#' + awayPlayerColor);
    document.getElementById('state_awayPlayerLeftLongSleeve').setAttribute('fill', '#' + awayPlayerColor);
    document.getElementById('state_awayPlayerRightLongSleeve').setAttribute('fill', '#' + awayPlayerColor);
  }
  if (homePlayerStripesColor) {
    // document.getElementById('homeStripes').setAttribute('fill', '#' + homePlayerStripesColor);
    // document.getElementById('fade_homeStripes').setAttribute('fill', '#' + homePlayerStripesColor);
    // document.getElementById('state_homeStripes').setAttribute('fill', '#' + homePlayerStripesColor);
  } else {
    // document.getElementById('homeStripes').setAttribute('fill', '#' + homePlayerColor);
    // document.getElementById('fade_homeStripes').setAttribute('fill', '#' + homePlayerColor);
    // document.getElementById('state_homeStripes').setAttribute('fill', '#' + homePlayerColor);
  }
  if (awayPlayerStripesColor) {
    // document.getElementById('awayStripes').setAttribute('fill', '#' + awayPlayerStripesColor);
    // document.getElementById('fade_awayStripes').setAttribute('fill', '#' + awayPlayerStripesColor);
    // document.getElementById('state_awayStripes').setAttribute('fill', '#' + awayPlayerStripesColor);
  } else {
    // document.getElementById('awayStripes').setAttribute('fill', '#' + awayPlayerColor);
    // document.getElementById('fade_awayStripes').setAttribute('fill', '#' + awayPlayerColor);
    // document.getElementById('state_awayStripes').setAttribute('fill', '#' + awayPlayerColor);
  }
}
function min(minArg1, minArg2) {
  if (minArg1 < minArg2) return minArg1
  return minArg2
}
function changeScreenSize() {
  screenHeight = window.innerHeight
  screenWidth = window.innerWidth
  scale = min(screenWidth / 800, screenHeight / 404);

  document.getElementById('scale').setAttribute('transform', 'scale(' + scale + ')')
  document.getElementById('svg').setAttribute('width', 800 * scale)
  document.getElementById('svg').setAttribute('height', 404 * scale)
}