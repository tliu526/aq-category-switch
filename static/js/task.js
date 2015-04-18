/*
 * Requires:
 *     psiturk.js
 *     utils.js
 */

// Initalize psiturk object
var psiTurk = new PsiTurk(uniqueId, adServerLoc, mode);

var mycondition = condition;  // these two variables are passed by the psiturk server process
var mycounterbalance = counterbalance;  // they tell you which condition you have been assigned to
// they are not used in the stroop code but may be useful to you

// All pages to be loaded
var pages = [
	"instructions/instruct-1.html",
	"instructions/instruct-2.html",
	"instructions/instruct-3.html",
	"instructions/instruct-ready.html",
	"stage.html",
	"postquestionnaire.html"
];

psiTurk.preloadPages(pages);

var instructionPages = [ // add as a list as many pages as you like
	"instructions/instruct-1.html",
	"instructions/instruct-2.html",
	"instructions/instruct-3.html",
	"instructions/instruct-ready.html"
];

/**
CATEGORY CONSTANTS
**/
var BOUNDARY_SIZE = 100; //pixels
var BOUNDARY_ANGLE = Math.pi / 2; //radians


/********************
* HTML manipulation
*
* All HTML files in the templates directory are requested 
* from the server when the PsiTurk object is created above. We
* need code to get those pages from the PsiTurk object and 
* insert them into the document.
*
********************/

/********************
* CATEGORY TEST       *
********************/
var CategoryExperiment = function() {
    
    var wordon, // time word is presented
    listening = false;
    
    var training = true;
    var correct = true;
    
    // Stimuli for a basic Stroop experiment
    var stims = [
	["SHIP", "red", "unrelated"],
	["MONKEY", "green", "unrelated"],
	["ZAMBONI", "blue", "unrelated"],
	["RED", "red", "congruent"],
	["GREEN", "green", "congruent"],
			["BLUE", "blue", "congruent"],
	["GREEN", "red", "incongruent"],
	["BLUE", "green", "incongruent"],
	["RED", "blue", "incongruent"]
    ];
    
    stims = _.shuffle(stims);
    
    var next = function() {
	if (stims.length===0) {
	    finish();
	}
	else {
	    stim = stims.shift();
	    show_stimulus( stim[0], stim[1] );
	    wordon = new Date().getTime();
	    listening = true;
	    d3.select("#query").html('<p id="prompt">Type "R" for Red, "B" for blue, "G" for green.</p>');
	}
    };
    
    var response_handler = function(e) {
	if (!listening) return;
	
	var keyCode = e.keyCode,
	response;
	
	switch (keyCode) {
	case 82:
	    // "R"
	    response="red";
	    break;
	case 71:
	    // "G"
	    response="green";
	    break;
	case 66:
	    // "B"
	    response="blue";
	    break;
	default:
	    response = "";
	    break;
	}
	if (response.length>0) {
	    listening = false;
	    var hit = response == stim[1];
	    var rt = new Date().getTime() - wordon;
	    
	    psiTurk.recordTrialData({'phase':"TEST",
                                     'word':stim[0],
                                     'color':stim[1],
                                     'relation':stim[2],
                                     'response':response,
                                     'hit':hit,
                                     'rt':rt}
                                   );
	    remove_word();
	    display_feedback();
	    next();
	}
    };
    
    var finish = function() {
	$("body").unbind("keydown", response_handler); // Unbind keys
	currentview = new Questionnaire();
    };
    
    var show_stimulus = function(text, color) {

	var rad = 50;

	var svgContainer = 
	    d3.select("#stim")
	    .append("svg")
	    .attr("width", 500)
	    .attr("height", 500)
	    .attr("id", "circle-line");

	svgContainer.append("circle")
	    .attr("cx", 250)
	    .attr("stroke", "black")
	    .attr("stroke-width", "2")
	    .attr("cy", 250)
	    .attr("r", rad)
	    .style("fill", "none");
	
	var rand_angle = Math.random()*90;
	var x2 = 250 + Math.sin(rand_angle) * rad;
	var y2 = 250 + Math.cos(rand_angle) * rad;

	svgContainer.append("line")
	    .attr("x1", 250)
	    .attr("y1", 250)
	    .attr("x2", x2)
	    .attr("y2", y2)
	    .attr("stroke", "black")
	    .attr("stroke-width", 2);
    };
    
    var remove_word = function() {
	d3.select("#circle-line").remove();
    };
    
    var display_feedback = function() {
	if(training) {
	    if(correct) {
		d3.select("#feedback").html('<p id="fb">Correct!</p>');
	    }
	    else {
		d3.select("#feedback").html('<p id="fb">Incorrect!</p>');
	    }
	}
    }

    //The "main" method of our experiment (JS...ugh)
    // Load the stage.html snippet into the body of the page
    psiTurk.showPage('stage.html');
    
    // Register the response handler that is defined above to handle any
    // key down events.
    $("body").focus().keydown(response_handler); 
    
    // Start the test
    next();
};

/****************
* Questionnaire *
****************/

var Questionnaire = function() {

	var error_message = "<h1>Oops!</h1><p>Something went wrong submitting your HIT. This might happen if you lose your internet connection. Press the button to resubmit.</p><button id='resubmit'>Resubmit</button>";

	record_responses = function() {

		psiTurk.recordTrialData({'phase':'postquestionnaire', 'status':'submit'});

		$('textarea').each( function(i, val) {
			psiTurk.recordUnstructuredData(this.id, this.value);
		});
		$('select').each( function(i, val) {
			psiTurk.recordUnstructuredData(this.id, this.value);		
		});

	};

	prompt_resubmit = function() {
		replaceBody(error_message);
		$("#resubmit").click(resubmit);
	};

	resubmit = function() {
		replaceBody("<h1>Trying to resubmit...</h1>");
		reprompt = setTimeout(prompt_resubmit, 10000);
		
		psiTurk.saveData({
			success: function() {
			    clearInterval(reprompt); 
                psiTurk.computeBonus('compute_bonus', function(){finish()}); 
			}, 
			error: prompt_resubmit
		});
	};

	// Load the questionnaire snippet 
	psiTurk.showPage('postquestionnaire.html');
	psiTurk.recordTrialData({'phase':'postquestionnaire', 'status':'begin'});
	
	$("#next").click(function () {
	    record_responses();
	    psiTurk.saveData({
            success: function(){
                psiTurk.computeBonus('compute_bonus', function() { 
                	psiTurk.completeHIT(); // when finished saving compute bonus, the quit
                }); 
            }, 
            error: prompt_resubmit});
	});
    
	
};

/***********
* Functions
***********/
function getRandom(min, max) {
    return Math.random() * (max - min) + min;
}

//returns bool of whether given dimensions are in category A or not
function isCategoryA(size, angle) {

}

// Task object to keep track of the current phase
var currentview;

/*******************
 * Run Task
 ******************/
$(window).load( function(){
    psiTurk.doInstructions(
    	instructionPages, // a list of pages you want to display in sequence
    	function() { currentview = new CategoryExperiment(); } // what you want to do when you are done with instructions
    );
});
