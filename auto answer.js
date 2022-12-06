var button = document.getElementById("answers_button");
var remainingQuestions = [];

function httpGet(url, callback, headers=[], method="GET", content=null) {
  var request = new XMLHttpRequest();
  request.addEventListener("load", callback);
  request.open(method, url, true);
  for (const header of headers) {
    request.setRequestHeader(header[0], header[1]);
  }
  request.send(content);
}

function init() {
  button.value = "Liqticc on Top!";
  getCSRF();
}

function getCSRF() {
  var csrfURL = "https://edpuzzle.com/api/v3/csrf";
  httpGet(csrfURL, function(){
    var data = JSON.parse(this.responseText);
    var csrf = data.CSRFToken;
    button.value = "Trying to Inject. . ."
    getAttempt(csrf, document.assignment);
  });
}

function getAttempt(csrf, assignment) {
  var id = assignment.teacherAssignments[0]._id;
  var attemptURL = "https://edpuzzle.com/api/v3/assignments/"+id+"/attempt";
  httpGet(attemptURL, function(){
    var data = JSON.parse(this.responseText);
    button.value = "Injecting. . !"
    skipVideo(csrf, data);
  });
}

function skipVideo(csrf, attempt) {
  var id = attempt._id;
  var teacher_assignment_id = attempt.teacherAssignmentId;
  var referrer = "https://edpuzzle.com/assignments/"+teacher_assignment_id+"/watch";;
  var url2 = "https://edpuzzle.com/api/v4/media_attempts/"+id+"/watch";

  var content = {"timeIntervalNumber": 10};
  var headers = [
    ['accept', 'application/json, text/plain, */*'],
    ['accept_language', 'en-US,en;q=0.9'],
    ['content-type', 'application/json'],
    ['x-csrf-token', csrf],
    ['x-edpuzzle-referrer', referrer],
    ['x-edpuzzle-web-version', opener.__EDPUZZLE_DATA__.version]
  ];
  
  httpGet(url2, function(){
    var attemptId = attempt._id;
    for (let i=0; i<document.questions.length; i++) {
      let question = questions[i];
      if (question.type != "multiple-choice") {continue;}
      
      if (remainingQuestions.length == 0) {
        remainingQuestions.push([question]);
      }
      else if (remainingQuestions[remainingQuestions.length-1][0].time == question.time) {
        remainingQuestions[remainingQuestions.length-1].push(question);
      }
      else {
        remainingQuestions.push([question]);
      }
    }
    if (remainingQuestions.length > 0) {
      var total = remainingQuestions.length
      button.value = `Posting answers... (1/${total})`;
      postAnswers(csrf, document.assignment, remainingQuestions, attemptId, total);
    }
  }, headers, "POST", JSON.stringify(content));
}

function postAnswers(csrf, assignment, questions, attemptId, total) {
  var id = assignment.teacherAssignments[0]._id;
  var referrer = "https://edpuzzle.com/assignments/"+id+"/watch";
  var answersURL = "https://edpuzzle.com/api/v3/attempts/"+attemptId+"/answers";

  var content = {answers: []};
  var now = new Date().toISOString();
  var questionsPart = questions.shift();
  for (let i=0; i<questionsPart.length; i++) {
    let question = questionsPart[i];
    let correctChoices = [];
    for (let j=0; j<question.choices.length; j++) {
      let choice = question.choices[j];
      if (choice.isCorrect) {
        correctChoices.push(choice._id)
      }
    }
    content.answers.push({
      "questionId": question._id,
      "choices": correctChoices,
      "type": "multiple-choice",
    });
  }
  
  var headers = [
    ['accept', 'application/json, text/plain, */*'],
    ['accept_language', 'en-US,en;q=0.9'],
    ['content-type', 'application/json'],
    ['x-csrf-token', csrf],
    ['x-edpuzzle-referrer', referrer],
    ['x-edpuzzle-web-version', opener.__EDPUZZLE_DATA__.version]
  ];
  httpGet(answersURL, function() {
    if (questions.length > 0) {
      button.value = `Getting their IP lol (${total-questions.length+1}/${total})`;
      postAnswers(csrf, assignment, questions, attemptId, total);
    }
    else {
      button.value = "Doxxed the Kiddies. ..";
      opener.location.reload();
    }
  }, headers, "POST", JSON.stringify(content));
}

init();
