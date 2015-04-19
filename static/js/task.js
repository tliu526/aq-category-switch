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

//set seed
//Math.seedrandom('This is a seed');

var instructionPages = [ // add as a list as many pages as you like
	"instructions/instruct-1.html",
	"instructions/instruct-ready.html"
];

/**
CATEGORY CONSTANTS
**/
var BOUNDARY_SIZE = 150; //pixels
var BOUNDARY_ANGLE = -1* Math.PI / 4; //radians
var STIM_LEN = 30
var MAX_SIZE = 300

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
    var isCatAB = true;
    var training = true;
    
    // Stimuli for a basic Stroop experiment

    var populateStimulus = function() {
	var arr = [];

	for(i = 0; i < STIM_LEN; i++) {
	    var size = Math.random()*MAX_SIZE;
	    var angle = Math.random()*-1*Math.PI/2;
	    var category;
	    if(isCatAB) {
		if(isCategoryA(size,angle)) {
		    category = "A";
		}
		else {
		    category = "B";
		}
	    }
	    else {
		if(isCategoryC(size,angle)) {
		    category = "C";
		}
		else {
		    category = "D";
		}
	    }
	    var pair = [size, angle, category];
	    arr.push(pair);
	}

	return arr;
    }
    
    var stims = populateStimulus();
    
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
	    if(isCatAB) 
		d3.select("#query").html('<p id="prompt">Type "A" for category A and "B" for Category B.</p>');
	    else
		d3.select("#query").html('<p id="prompt">Type "C" for category C and "D" for Category D.</p>');
	}
    };
    
    var response_handler = function(e) {
	if (!listening) return;
	
	var keyCode = e.keyCode,
	response;
	
	switch (keyCode) {
	case 65:
	    // "A"
	    response="A";
	    break;
	case 66:
	    // "B"
	    response="B";
	    break;
	default:
	    response = "";
	    break;
	}

	if (response.length>0) {
	    listening = false;
	    var hit = response == stim[2];

	    display_feedback(hit);
	    var rt = new Date().getTime() - wordon;

	    var phase;
	    if(training) {
		phase = "TRAINING";
	    }
	    else {
		phase = "TEST";
	    }
	    
	    psiTurk.recordTrialData({'phase': phase,
                                     'size': stim[0],
                                     'angle': stim[1],
                                     'category': stim[2],
                                     'response': response,
                                     'correct': hit,
                                     'rt': rt}
                                   );
	    remove_word();
	    next();
	}
    };
    
    var finish = function() {
	$("body").unbind("keydown", response_handler); // Unbind keys
	currentview = new Questionnaire();
    };
    
    var show_stimulus = function(radius, angle) {

	var svgContainer = 
	    d3.select("#stim")
	    .append("svg")
	    .attr("width", 600)
	    .attr("height", 600)
	    .attr("id", "circle-line");

	svgContainer.append("circle")
	    .attr("cx", 300)
	    .attr("stroke", "black")
	    .attr("stroke-width", "2")
	    .attr("cy", 300)
	    .attr("r", radius)
	    .style("fill", "none");
	
	var rand_angle = Math.random()*-1*Math.PI/2;
	var x2 = 300 + Math.cos(angle) * radius;
	var y2 = 300 + Math.sin(angle) * radius;

	svgContainer.append("line")
	    .attr("x1", 300)
	    .attr("y1", 300)
	    .attr("x2", x2)
	    .attr("y2", y2)
	    .attr("stroke", "black")
	    .attr("stroke-width", 2);
    };
    
    var remove_word = function() {
	d3.select("#circle-line").remove();
    };

    //returns bool of whether given dimensions are in category A or not
    function isCategoryA(size, angle) {
	return (size > BOUNDARY_SIZE && angle > BOUNDARY_ANGLE);
    }

    //returns bool of whether given dimensions are in category C or not
    function isCategoryC(size, angle) {
	return (size < BOUNDARY_SIZE && angle < BOUNDARY_ANGLE);
    }
    
    var display_feedback = function(correct) {
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
