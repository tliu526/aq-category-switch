/*
 * Requires:
 *     psiturk.js
 *     utils.js
 */

// Initalize psiturk object
var psiTurk = new PsiTurk(uniqueId, adServerLoc, mode);


var DEBUG = false;
var mycondition = condition;  // these two variables are passed by the psiturk server process
var mycounterbalance = counterbalance;  // they tell you which condition you have been assigned to
// they are not used in the stroop code but may be useful to you

// All pages to be loaded
var pages = [
    "instructions/instruct-1.html",
    "instructions/instruct-ready.html",
    "instructions/training-switch.html",
    "instructions/category-switch.html",
    "stage.html",
    "postquestionnaire.html"
];

psiTurk.preloadPages(pages);

//set seed
Math.seedrandom('This is a seed');

var instructionPages = [ // add as a list as many pages as you like
    "instructions/instruct-1.html",
    "instructions/instruct-ready.html"
];


var AQ_Questions = ['I prefer to do things with others rather than on my own.', 'I prefer to do things the same way over and over again.', 'If I try to imagine something, I find it very easy to create a picture in my mind.', 'I frequently get so strongly absorbed in one thing that I lose sight of other things.', 'I often notice small sounds when others do not.', 'I usually notice car number plates or similar strings of information.', 'Other people frequently tell me that what I’ve said is impolite, even though I think it is polite. ', 'When I’m reading a story, I can easily imagine what the characters might look like.', 'I am fascinated by dates.', 'In a social group, I can easily keep track of several different people’s conversations.', 'I find social situations easy.', 'I tend to notice details that others do not.', 'I would rather go to a library than to a party.', 'I find making up stories easy.', 'I find myself drawn more strongly to people than to things.', 'I tend to have very strong interests, which I get upset about if I can’t pursue.', 'I enjoy social chitchat.', 'When I talk, it isn’t always easy for others to get a word in edgewise.', 'I am fascinated by numbers.', 'When I’m reading a story, I find it difficult to work out the characters’ intentions.', 'I don’t particularly enjoy reading fiction.', 'I find it hard to make new friends.', 'I notice patterns in things all the time.', 'I would rather go to the theater than to a museum.', 'It does not upset me if my daily routine is disturbed.', 'I frequently find that I don’t know how to keep a conversation going.', 'I find it easy to ‘read between the lines’ when someone is talking to me.', 'I usually concentrate more on the whole picture, rather than on the small details.', 'I am not very good at remembering phone numbers.', 'I don’t usually notice small changes in a situation or a person’s appearance.', 'I know how to tell if someone listening to me is getting bored.', 'I find it easy to do more than one thing at once.', 'When I talk on the phone, I’m not sure when it’s my turn to speak.', 'I enjoy doing things spontaneously.', 'I am often the last to understand the point of a joke.', 'I find it easy to work out what someone is thinking or feeling just by looking at their face.', 'If there is an interruption, I can switch back to what I was doing very quickly.', 'I am good at social chitchat.', 'People often tell me that I keep going on and on about the same thing.', 'When I was young, I used to enjoy playing games involving pretending with other children.', 'I like to collect information about categories of things (e.g., types of cars, birds, trains, plants).', 'I find it difficult to imagine what it would be like to be someone else.', 'I like to carefully plan any activities I participate in.', 'I enjoy social occasions.', 'I find it difficult to work out people’s intentions.', 'New situations make me anxious.', 'I enjoy meeting new people.', 'I am a good diplomat.', 'I am not very good at remembering people’s date of birth.', 'I find it very easy to play games with children that involve pretending.']

/**
   CATEGORY CONSTANTS
**/
var BOUNDARY_SIZE = 125; //pixels
var BOUNDARY_ANGLE = Math.PI / 4; //radians
var TRAIN_LEN = 20;
var TRIAL_LEN = 20;
var MAX_SIZE = 300;
var MIN_SIZE = 50;
var AQ_QUESTIONS = 50;
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
    
    var populateStimulus = function(isCatAB, len) {
	var arr = [];

	for(i = 0; i < len; i++) {
	    var size;
	    var angle;
	    var category;
	    if(isCatAB) {
		if(i%2==0) {
		    size = Math.random()*(MAX_SIZE-BOUNDARY_SIZE)+BOUNDARY_SIZE;
		    angle = Math.random()*BOUNDARY_ANGLE + BOUNDARY_ANGLE;
		    category = "A";
		}
		else {
		    if(Math.random() > 0.5) {
			//size can be anything, angle is restricted
			size = Math.random()*(MAX_SIZE-MIN_SIZE)+MIN_SIZE;
			angle = BOUNDARY_ANGLE - Math.random()*BOUNDARY_ANGLE; 
		    }
		    else {
			//angle can be anything, size is restricted
			size = Math.random()*(BOUNDARY_SIZE-MIN_SIZE)+MIN_SIZE;
			angle = Math.random()*Math.PI/2;
		    }
		    category = "B";
		}
	    }
	    else {
		if(i%2==0) {
		    size = Math.random()*(BOUNDARY_SIZE- MIN_SIZE)+MIN_SIZE;
		    angle = Math.random()*BOUNDARY_ANGLE; 
		    category = "C";
		}
		else {
		    if(Math.random() > 0.5) {
			//size can be anything, angle is restricted
			size = Math.random()*(MAX_SIZE-MIN_SIZE)+MIN_SIZE;
			angle = Math.random()*BOUNDARY_ANGLE + BOUNDARY_ANGLE;
		    }
		    else {
			//angle can be anything, size is restricted
			size = Math.random()*(MAX_SIZE - BOUNDARY_SIZE)+BOUNDARY_SIZE;
			angle = Math.random()*Math.PI/2;
		    }
		    category = "D";
		}
	    }
	    var pair = [size, angle, category];
	    arr.push(pair);
	}

	return _.shuffle(arr);
    }
    
    var trainAB = populateStimulus(true, TRAIN_LEN);
    var trialAB = populateStimulus(true, TRIAL_LEN);
    
    var trainCD = populateStimulus(false,TRAIN_LEN);
    var trialCD = populateStimulus(false,TRIAL_LEN);
    
    var stimSets = [[trainCD, trialCD],[trainAB, trialAB]];
    //RUNNING CD FIRST
    isCatAB = false;

    var curStim = stimSets.shift();
    var curSet = curStim[0];

    var next = function() {
	if (curSet.length==0) {
	    
	    if(curStim.length != 0) {
		
		curSet = curStim.shift();
		training = false;
		//show training switch screen
		psiTurk.doInstructions(
    		    ["instructions/training-switch.html"], // a list of pages you want to display in sequence
    		    function() { psiTurk.showPage("stage.html");
			       	 next();} // what you want to do when you are done with instructions
		);


	    }
	    else if(stimSets.length == 0) {
		finish();
	    }
	    else {
		curStim = stimSets.shift();
		curSet = curStim.shift();
		isCatAB = !isCatAB;
		training = true;
		psiTurk.doInstructions(
    		    ["instructions/category-switch.html"], // a list of pages you want to display in sequence
    		    function() { psiTurk.showPage("stage.html");
			       	 next();} // what you want to do when you are done with instructions
		);

	    }
	}
	else {
	    stim = curSet.shift();
	    show_stimulus( stim[0], stim[1] );
	    wordon = new Date().getTime();
	    listening = true;
	    if(isCatAB) {
		d3.select('#header').html('<h1>Is this category A or B?</h1>');
		d3.select("#query").html('<p id="prompt">Type "A" for category A and "B" for Category B.</p>');
	    }
	    else {
		d3.select('#header').html('<h1>Is this category C or D?</h1>');
		d3.select("#query").html('<p id="prompt">Type "C" for category C and "D" for Category D.</p>');
	    }
	}
    };
    
    var response_handler = function(e) {
	if (!listening) return;
	
	var keyCode = e.keyCode,
	response = "";
	
	switch (keyCode) {
	case 65:
	    // "A"
	    if(isCatAB)
		response="A";
	    break;
	case 66:
	    // "B"
	    if(isCatAB)
		response="B";
	    break;
	case 67:
	    // "C"
	    if(!isCatAB)
		response="C";
	    break;
	case 68:
	    // "D"
	    if(!isCatAB)
		response="D";
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
	    

	    var data = [phase, stim[0], stim[1], stim[2], response, hit, rt];
	    psiTurk.recordTrialData(data);
	    /*
	    psiTurk.recordTrialData({'phase': phase,
                                     'size': stim[0],
                                     'angle': stim[1],
                                     'category': stim[2],
                                     'response': response,
                                     'correct': hit,
                                     'rt': rt}
                                   );
	    */
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
	
	var x2 = 300 + Math.cos(angle) * radius;
	var y2 = 300 + Math.sin(angle) * radius;

	svgContainer.append("line")
	    .attr("x1", 300)
	    .attr("y1", 300)
	    .attr("x2", x2)
	    .attr("y2", y2)
	    .attr("stroke", "black")
	    .attr("stroke-width", 2);

	if(DEBUG)
	    d3.select("#debug").html('<p id="fb">Radius: '+radius+'\n Angle: '+ angle+ '</p>');
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
	else {
	    d3.select("#feedback").html('<p id="fb">Testing Phase.</p>');
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

    var question_number = 1;

    var error_message = "<h1>Oops!</h1><p>Something went wrong submitting your HIT. This might happen if you lose your internet connection. Press the button to resubmit.</p><button id='resubmit'>Resubmit</button>";

    record_responses = function() {
	
	//psiTurk.recordTrialData({'phase':'postquestionnaire', 'status':'submit'});

	var selectedVal = "";
        var selected = $("input[type='radio']:checked");
        if (selected.length > 0) {
            selectedVal = selected.val();
        }
        console.log(selectedVal);
	var dat = [question_number, selectedVal];
	
	psiTurk.recordTrialData(dat);
        psiTurk.recordUnstructuredData(question_number, selectedVal);

	//increment question number
	question_number++;
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
    //psiTurk.recordTrialData({'phase':'postquestionnaire', 'status':'begin'});
    var question = AQ_Questions.shift();
    d3.select('#aq_question').html('<p>'+question_number + '. '+question+'</p>');
    
    $("#next").click(function () {
	    record_responses();
	    if(question_number > AQ_QUESTIONS) {
		psiTurk.saveData({
			success: function(){
			    
			    psiTurk.completeHIT(); // when finished saving compute bonus, then quit
			    /*
			      psiTurk.computeBonus('compute_bonus', function() { 
			      
			      }); 
			    */
			}, 
			    error: prompt_resubmit});
	    }
	    
	    var question = AQ_Questions.shift();
	    d3.select('#aq_question').html('<p>'+question_number + '. ' + question + '</p>');
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
