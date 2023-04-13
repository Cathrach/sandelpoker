// request URLs
const URL_POKER_DEAL = "casino_poker/poker_deal";
const URL_POKER_DRAW = "casino_poker/poker_draw";
const URL_DOUBLEUP_START = "casino_poker/poker_double_start";
const URL_DOUBLEUP_RESULT = "casino_poker/poker_double_result";
const URL_DOUBLEUP_RETIRE = "casino_poker/poker_double_retire";

// card ranks and suits
const JOKER_SUIT = 98;
const RANKS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const STR_RANKS = ["Ace", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const SUITS = [0, 1, 2, 3];
const STR_SUITS = ["Spades", "Hearts", "Diamonds", "Clubs"];

// constants for winning hands
const ACE_HIGH = 13;
const ROYAL_STRAIGHT_FLUSH = 250;
const FIVE_OF_A_KIND = 60;
const STRAIGHT_FLUSH = 25;
const FOUR_OF_A_KIND = 20;
const FULL_HOUSE = 10;
const FLUSH = 4;
const STRAIGHT = 3;
const THREE_OF_A_KIND = 1;
const TWO_PAIR = 1;
const LOSE = 0;

// helper functions on arrays

// get all subsets of an array (this returns an array of arrays because I am only doing this for subsets of a length 5 array)
function allSubsets(arr) {
    const subsets = [[]];

    for (const x of arr) {
	var length = subsets.length
	for (var i = 0; i < length; i++) {
	    subsets.push(subsets[i].concat([x]));
	}
    }
    return subsets;
}

// get all subsets of a certain size of an arry
// this is a generator because it is used on a 48-card deck...
function* lengthSubsets(arr, len, start = 0) {
    if (start >= arr.length || len < 1) {
	yield [];
    } else {
	while (start <= arr.length - len) {
	    var first = arr[start];
	    for (subset of lengthSubsets(arr, len - 1, start + 1)) {
		// i think push is faster than unshift, not sure
		subset.push(first);
		yield subset;
	    }
	    start++;
	}
    }
}

// check if an array of arrays contains an array
function arr2DHasArr(arr2d, arr) {
    return arr2d.some(a => a.every((v, i) => v == arr[i]));
}

// sum a 2D array by column or row (I don't think I ended up using these)
function sumByColumn(arr, col) {
    var sum = 0;
    for (const row of arr) {
	sum += row[col];
    }
    return sum;
}

function sumByRow(arr, row) {
    var sum = 0;
    for (const i of arr[row]) {
	sum += i;
    }
    return sum;
}

// check if two arrays of numbers are equal by comparing each number
function numArrEqual(arr1, arr2) {
    var arr1length = arr1.length;
    var arr2length = arr2.length;
    if (arr1length != arr2length) {
	return false;
    }
    for (var i = 0; i < arr1.length; i++) {
	if (arr1[i] != arr2[i]) {
	    return false;
	}
    }
    return true;
}

// helper for sorting arrays of numbers
function compareNumbers(a, b) {
    return a - b;
}

// sum over a 1D array of numbers
function sumArr(arr) {
    var sum = 0;
    for (const x of arr) {
	sum += x;
    }
    return sum;
}

// helper functions for cards

// turns a GBF "card", which is a string of the form suit_rank, into [suit, rank]
function parseCard(gbf_card) {
    var cardSplit = gbf_card.split("_");
    var rank = parseInt(cardSplit[1]);
    var suit = parseInt(cardSplit[0]);
    // because these are array indices starting at 0
    return [suit - 1, rank - 1];
}

// the initial deck is a 53-card array of arrays, each array represents suit + rank
function initialDeck() {
    var deck = Array(53).fill(0);
    for (var i = 0; i < 52; i++) {
	deck[i] = [~~(i/13), i % 13];
    }
    deck[52] = [JOKER_SUIT, JOKER_SUIT];
    return deck;
}

// remove drawn cards from a 53-card starting deck, return new deck
function deckWithCardsRemoved(cardList) {
    var deck = initialDeck();
    return deck.filter(card => !arr2DHasArr(cardList, card));
}

// Ace can be either 0 or 13 for straights...
function convertAceHigh(num) {
    if (num == 0) {
	return 13;
    } else {
	return num;
    }
}

// convert [suit, rank] to something human-readable
function cardToString(card) {
    if (card[0] == JOKER_SUIT) {
	return "Joker";
    }
    return STR_RANKS[card[1]] + " of " + STR_SUITS[card[0]];
}

// helper for checking 3 of a kind, etc.
// returns each rank with its multiplicity, though we only use the multiplicity
function getMultiplicities(cardList) {
    distinctRanks = {};
    for (const card of cardList) {
	var rank = card[1];
	distinctRanks[rank] = (distinctRanks[rank] || 0) + 1;
    }
    return distinctRanks;
}

// given sorted non-joker cards, whether we have a joker, and multiplicities, determine if we have a straight
// return -1 if not or the high card
function isStraightHigh(nonJokerRanks, hasJoker, allDistinct) {
    var spread = nonJokerRanks[nonJokerRanks.length - 1] - nonJokerRanks[0];
    var high = nonJokerRanks[nonJokerRanks.length - 1];
    if (spread == 4 && allDistinct) {
	return high;
    } else if (spread == 3 && hasJoker) {
	return Math.min(ACE_HIGH, high + 1);
    } else {
	return -1;
    }
}

function typeOfHand(cardList) {
    // check if all the cards are of the same suit
    var hasJoker = cardList.some(x => x[0] == JOKER_SUIT);
    var nonJokers = cardList.filter(x => x[0] != JOKER_SUIT);
    var hasAce = cardList.some(x => x[1] == 0);

    var suit = nonJokers[0][0]
    var allSameSuit = nonJokers.every(card => card[0] == suit);

    var mults = Object.values(getMultiplicities(nonJokers));
    var allDistinct = mults.slice(0, 4).every(x => x == 1);
    
    // and if, when sorted, their lowest rank is
    var isStraight = false;
    var straightHighCard = -1;
    
    // we check both ace low and ace high
    var nonJokerRanks = nonJokers.map(card => card[1]);
    nonJokerRanks.sort(compareNumbers);
    straightHighCard = isStraightHigh(nonJokerRanks, hasJoker, allDistinct);
    if (straightHighCard != -1) {
	isStraight = true;
    }

    // also check ace high straight 
    if (hasAce) {
	var nonJokerAceRanks = nonJokerRanks.map(rank => convertAceHigh(rank));
	nonJokerAceRanks.sort(compareNumbers);
	var aceHigh = isStraightHigh(nonJokerAceRanks, hasJoker, allDistinct);
	if (aceHigh == ACE_HIGH) {
	    isStraight = true;
	    straightHighCard = ACE_HIGH;
	}
    }

    // this covers all possibilities with non-repeating cards
    if (isStraight && allSameSuit && straightHighCard == ACE_HIGH) {
	return ROYAL_STRAIGHT_FLUSH;
    } else if (isStraight && allSameSuit) {
	return STRAIGHT_FLUSH;
    } else if (allSameSuit) {
	return FLUSH;
    } else if (isStraight) {
	return STRAIGHT;
    }

    // next check repeating cards
    mults.sort(compareNumbers);

    // if [1, 1, 1, 2] or [1, 1, 1, 1, 1], bad.
    if (numArrEqual(mults, [1, 1, 1, 2]) || mults.slice(0, 4).every(x => x == 1)) {
	return LOSE;
    }
    if (hasJoker) {
	if (mults[mults.length - 1] == 4) {
	    return FIVE_OF_A_KIND;
	}
	if (mults[mults.length - 1] == 3) {
	    return FOUR_OF_A_KIND;
	}
	if (numArrEqual(mults, [2, 2])) {
	    return FULL_HOUSE;
	}
	if (numArrEqual(mults, [1, 1, 2])) {
	    return THREE_OF_A_KIND;
	}
    }
    if (mults[mults.length - 1] == 4) {
	return FOUR_OF_A_KIND;
    }
    if (numArrEqual(mults, [2, 3])) {
	return FULL_HOUSE;
    }
    if (mults[mults.length - 1] == 3) {
	return THREE_OF_A_KIND;
    }
    if (numArrEqual(mults, [1, 2, 2])) {
	return TWO_PAIR;
    }
    return LOSE;
}

function binomCoeff(n, k) {
    var denom = 1;
    var num = 1;
    var numToMultiply = Math.min(k, n - k);
    for (var i = 0; i < numToMultiply; i++) {
	denom *= (numToMultiply - i);
	num *= (n - i);
    }
    return num / denom;
}

function calculateProbabilities(cardList) {
    // for each subset of the card list
    // calculate probability of getting each hand

    parsedCards = cardList.map(x => parseCard(x));

    // remove the 5 drawn cards from the rest of the deck
    var deck = deckWithCardsRemoved(parsedCards);
    // var deckHasJoker = !(parsedCards.every(x => x[0] != JOKER_SUIT));

    var winRates = {};

    for (const kept_subset of allSubsets(parsedCards)) {
    	// remove all cards from the deck
	var totalDraws = binomCoeff(deck.length, 5 - kept_subset.length);
	var wins = 0;
	var chips = 0;
	for (const draw of lengthSubsets(deck, 5 - kept_subset.length)) {
	    var totalDraw = kept_subset.concat(draw);
	    var win = typeOfHand(totalDraw);
	    if (win > 0) {
		wins += 1;
		chips += win;
	    }
	}
	winRates[JSON.stringify(kept_subset)] = [ wins / totalDraws, chips / totalDraws];
    }
    
    return winRates;
    
}

function round(num, decs) {
    strnum = num.toString();
    if (strnum.indexOf(".") != -1) {
	return strnum.slice(0, (strnum.indexOf(".")) + decs + 1);
    } else {
	return strnum;
    }
}

function initialHLDeck() {
    return Array(13).fill(4);
}


chrome.devtools.panels.create("Sandel Poker", null, "/html/sandelpoker_panel.html", function(extensionPanel){

    var highestProbKeep;
    var highestProbProb;
    var highestProbEV;
    var highestEVKeep;
    var highestEVProb;
    var highestEVEV;
    var probHigherCard;
    var probDrawSameCard;
    var probLowerCard;
    var hlDeck = Array(13).fill(4);
    var hlCards = 52;
    var firstHLTurn = true;
    
    extensionPanel.onShown.addListener(function(panelWindow) {

	highestProbKeep = panelWindow.document.getElementById("highestProbKeep");
	highestProbProb = panelWindow.document.getElementById("highestProbProb");
	highestProbEV = panelWindow.document.getElementById("highestProbEV");
	highestEVKeep = panelWindow.document.getElementById("highestEVKeep");
	highestEVProb = panelWindow.document.getElementById("highestEVProb");
	highestEVEV = panelWindow.document.getElementById("highestEVEV");
	probHigherCard = panelWindow.document.getElementById('probHigherCard');
        probLowerCard = panelWindow.document.getElementById('probLowerCard');
        probDrawSameCard = panelWindow.document.getElementById('probDrawSameCard');

	chrome.devtools.network.onRequestFinished.addListener(function(request) {
	    processRequest(request);
	});
    });
    

    function processRequest(request) {
	request.getContent((body) => {
	    if (request && request.request) {
		if (request.request.url.includes(URL_POKER_DEAL)) {
		    // chrome.extension.getBackgroundPage().console.log("dealt cards");
		    var responseBodyJson = JSON.parse(body);
		    var cardList = Object.values(responseBodyJson.card_list);
		    
		    var probs = calculateProbabilities(cardList);
		    
		    // now fill the HTML
		    var highestProb = 0;
		    var highestProbSubset = [];
		    var highestEV = 0;
		    var highestEVSubset = [];
		    for (const subset of Object.keys(probs)) {
			if (probs[subset][0] > highestProb) {
			    highestProbSubset = subset;
			    highestProb = probs[subset][0];
			} else if (probs[subset][0] == highestProb && probs[subset][1] > probs[highestProbSubset][1]) {
			    highestProbSubset = subset;
			}
			if (probs[subset][1] > highestEV) {
			    highestEVSubset = subset;
			    highestEV = probs[subset][1];
			} else if (probs[subset][1] == highestEV && probs[subset][0] > probs[highestEVSubset][0]) {
			    highestEVSubset = subset;
			}
		    }

		    highestProbKeep.value = String(JSON.parse(highestProbSubset).map(x => cardToString(x)));
		    highestProbProb.value = String(round(probs[highestProbSubset][0] * 100, 2));
		    highestProbEV.value = String(round(probs[highestProbSubset][1] * 1000, 2));

		    highestEVKeep.value = String(JSON.parse(highestEVSubset).map(x => cardToString(x)));
		    highestEVProb.value = String(round(probs[highestEVSubset][0] * 100, 2));
		    highestEVEV.value = String(round(probs[highestEVSubset][1] * 1000, 2));
		    
		} else if (request.request.url.includes(URL_POKER_DRAW)) {
		    highestProbKeep.value = "";
		    highestProbProb.value = "";
		    highestProbEV.value = "";
		    highestEVKeep.value = "";
		    highestEVProb.value = "";
		    highestEVEV.value = "";
		} else if (request.request.url.includes(URL_DOUBLEUP_START)) {
		    if (firstHLTurn) {
			// apparently this is triggered every time we play
			var responseBodyJson = JSON.parse(body);
			var card_first = parseCard(responseBodyJson.card_first);
			// remove the card
			// note that ace has rank 0, but we consider it to be #12 in the HL version
			if (card_first[1] == 0) {
			    card_first[1] = 12;
			} else {
			    card_first[1] = card_first[1] - 1;
			}
			var rank = card_first[1];
			// "remove" the card
			hlDeck[rank] -= 1;
			hlCards -= 1;
			var tieProb = hlDeck[rank] / hlCards;
			var higherProb = sumArr(hlDeck.slice(rank + 1)) / hlCards;
			var lowerProb = sumArr(hlDeck.slice(0, rank)) / hlCards;

			probHigherCard.value = round(higherProb * 100, 2);
			probLowerCard.value = round(lowerProb * 100, 2);
			probDrawSameCard.value = round(tieProb * 100, 2);

			firstHLTurn = false;
		    }
		} else if (request.request.url.includes(URL_DOUBLEUP_RETIRE)) {
		    hlDeck = Array(13).fill(4);
		    hlCards = 52;
		    probHigherCard.value = "";
		    probLowerCard.value = "";
		    probDrawSameCard.value = "";
		    firstHLTurn = true;
		} else if (request.request.url.includes(URL_DOUBLEUP_RESULT)) {
		    var responseBodyJson = JSON.parse(body);
		    var result = responseBodyJson.result;
		    if (!firstHLTurn) {
			var card_second = parseCard(responseBodyJson.card_second);
			// remove the card
			// note that ace has rank 0, but we consider it to be #12 in the HL version
			if (card_second[1] == 0) {
			    card_second[1] = 12;
			} else {
			    card_second[1] = card_second[1] - 1;
			}
			var rank = card_second[1];
			// "remove" the card
			hlDeck[rank] -= 1;
			hlCards -= 1;
			var tieProb = hlDeck[rank] / hlCards;
			var higherProb = sumArr(hlDeck.slice(rank + 1)) / hlCards;
			var lowerProb = sumArr(hlDeck.slice(0, rank)) / hlCards;

			probHigherCard.value = round(higherProb * 100, 2);
			probLowerCard.value = round(lowerProb * 100, 2);
			probDrawSameCard.value = round(tieProb * 100, 2);
		    }
		    
		    if (result && result == "lose") {
			hlDeck = Array(13).fill(4);
			hlCards = 52;
			probHigherCard.value = "";
			probLowerCard.value = "";
			probDrawSameCard.value = "";
			firstHLTurn = true;
		    }
		}
	    }
	});
    }
});
