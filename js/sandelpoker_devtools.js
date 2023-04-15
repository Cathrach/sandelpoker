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
function isStraightHigh(nonJokerRanks, hasJoker) {
    var spread = nonJokerRanks[nonJokerRanks.length - 1] - nonJokerRanks[0];
    var high = nonJokerRanks[nonJokerRanks.length - 1];
    if (spread == 4) {
	return high;
    } else if (spread == 3 && hasJoker) {
	return Math.min(ACE_HIGH, high + 1);
    } else {
	return -1;
    }
}

function typeOfHand(cardList) {
    if (cardList.length < 3) {
	return LOSE;
    }
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
    if (allDistinct && cardList.length == 5) {
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
    }
    if (cardList.length == 5) {
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
    }

    // next check repeating cards
    mults.sort(compareNumbers);

    // if [1, 1, 1, 2] or [1, 1, 1, 1, 1], bad.
    if (mults.slice(0, 3).every(x => x == 1)) {
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
	if (mults[mults.length - 1] == 2) {
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
    if (numArrEqual(mults, [1, 2, 2]) || numArrEqual(mults, [2, 2])) {
	return TWO_PAIR;
    }
    return LOSE;
}

function binomCoeff(n, k) {
    if (k > n) {
	return 0;
    }
    var denom = 1;
    var num = 1;
    var numToMultiply = Math.min(k, n - k);
    for (var i = 0; i < numToMultiply; i++) {
	denom *= (numToMultiply - i);
	num *= (n - i);
    }
    return num / denom;
}

function isInRoyalStraight(rank) {
    return (rank == 0 || (rank >= 9 && rank <= 12));
}

// if we keep no cards, we should just manually count the possibilities
// also if the required card is not a joker (I'm too lazy to also do the Joker case, sorry)
function countHands(deck, requiredCard = -1) {
    // count multiplicities of ranks and suits
    var rankCounts = Array(13).fill(0);
    var suitCounts = Array(4).fill(0);
    for (var card of deck) {
	suitCounts[card[0]] += 1;
	rankCounts[card[1]] += 1;
    }
    var hasJoker = deck.some(x => x[0] == JOKER_SUIT);
    var fives = 0;
    var fours = 0;
    var fh = 0;
    var threes = 0;
    var pairs = 0;
    var rsf = 0;
    var sf = 0;
    var straights = 0;
    var flushes = 0;

    // required card stuff
    var requiredSuit = -1;
    var requiredRank = -1;
    if (requiredCard != -1) {
	requiredSuit = requiredCard[0];
	requiredRank = requiredCard[1];
    }

    // count five of a kinds
    if (hasJoker) {
	if (requiredCard != -1) {
	    if (rankCounts[requiredRank] == 3) {
		fives = 1;
	    }
	} else {
	    fives = rankCounts.filter(x => x == 4).length;
	}
    }
    // count four of a kinds
    for (const r1 of RANKS) {
	for (var r2 = r1 + 1; r2 < RANKS.length; r2++) {
	    var rank1 = rankCounts[r1];
	    var rank2 = rankCounts[r2];
	    if (requiredCard != -1) {
		var required = 0;
		var notRequired = 0;
		if (r1 == requiredRank) {
		    required = rank1;
		    notRequired = rank2;
		} else if (r2 == requiredRank) {
		    required = rank2;
		    notRequired = rank1;
		} else {
		    // if neither rank is required, we shuold just skip this case
		    continue;
		}
		// required card in the 4 + required card in the 1
		fours += binomCoeff(required, 3) * notRequired + binomCoeff(notRequired, 4);
		if (hasJoker) {
		    fours += binomCoeff(required, 2) * notRequired + binomCoeff(notRequired, 3);
		}
	    } else {
		fours += binomCoeff(rank1, 4) * rank2 + rank1 * binomCoeff(rank2, 4);
		if (hasJoker) {
		    fours += binomCoeff(rank1, 3) * rank2 + rank1 * binomCoeff(rank2, 3);
		}
	    }
	}
    }
    // count full houses
    // without joker, choose two ranks and one to be 3, one to be 2
    for (const r1 of RANKS) {
	for (var r2 = r1 + 1; r2 < RANKS.length; r2++) {
	    var rank1 = rankCounts[r1];
	    var rank2 = rankCounts[r2];
	    // if required
	    if (requiredCard != -1) {
		var required = 0;
		var notRequired = 0;
		if (r1 == requiredRank) {
		    required = rank1;
		    notRequired = rank2;
		} else if (r2 == requiredRank) {
		    required = rank2;
		    notRequired = rank1;
		} else {
		    continue;
		}
		// required in the 3 + required in the 2
		fh += binomCoeff(required, 2) * binomCoeff(notRequired, 2) + binomCoeff(notRequired, 3) * required;
		if (hasJoker) {
		    fh += required * binomCoeff(notRequired, 2);
		}
	    } else {
		fh += binomCoeff(rank1, 3) * binomCoeff(rank2, 2) + binomCoeff(rank1, 2) * binomCoeff(rank2, 3);
		// with joker, both are 2
		if (hasJoker) {
		    fh += binomCoeff(rank1, 2) * binomCoeff(rank2, 2);
		}
	    }
	}
    }
    
    // count three of a kinds
    // without joker, 3, 1, 1
    // with joker, 2, 1, 1 (technically this would also count as a two pair, so no two pair occurs with jokers)
    for (const r1 of RANKS) {
	for (var r2 = r1 + 1; r2 < RANKS.length; r2++) {
	    for (var r3 = r2 + 1; r3 < RANKS.length; r3++) {
		var rank1 = rankCounts[r1];
		var rank2 = rankCounts[r2];
		var rank3 = rankCounts[r3];
		if (requiredCard != -1) {
		    var required = 0;
		    var notRequired = []; // these are indistinguishable
		    if (r1 == requiredRank) {
			required = rank1;
			notRequired = [rank2, rank3];
		    } else if (r2 == requiredRank) {
			required = rank2;
			notRequired = [rank1, rank3];
		    } else if (r3 == requiredRank){
			required = rank3;
			notRequired = [rank1, rank2];
		    } else {
			continue;
		    }
		    // required is 3
		    threes += binomCoeff(required, 2) * notRequired[0] * notRequired[1];
		    // required is 1
		    threes += binomCoeff(notRequired[0], 3) * notRequired[1] + binomCoeff(notRequired[1], 3) * notRequired[0];
		    if (hasJoker) {
			threes += required * notRequired[0] * notRequired[1];
			threes += binomCoeff(notRequired[0], 2) * notRequired[1] + binomCoeff(notRequired[1], 2) * notRequired[0];
		    }
		} else {
		    threes += binomCoeff(rank1, 3) * rank2 * rank3 + rank1 * binomCoeff(rank2, 3) * rank3 + rank1 * rank2 * binomCoeff(rank3, 3);
		    if (hasJoker) {
			threes += binomCoeff(rank1, 2) * rank2 * rank3 + rank1 * binomCoeff(rank2, 2) * rank3 + rank1 * rank2 * binomCoeff(rank3, 2);
		    }
		}
	    }
	}
    }
    
    // count two pairs: 2, 2, 1 (no Joker)
    for (const r1 of RANKS) {
	for (var r2 = r1 + 1; r2 < RANKS.length; r2++) {
	    for (var r3 = r2 + 1; r3 < RANKS.length; r3++) {
		var rank1 = rankCounts[r1];
		var rank2 = rankCounts[r2];
		var rank3 = rankCounts[r3];

		if (requiredCard != -1) {
		    var required = 0;
		    var notRequired = []; // these are indistinguishable
		    if (r1 == requiredRank) {
			required = rank1;
			notRequired = [rank2, rank3];
		    } else if (r2 == requiredRank) {
			required = rank2;
			notRequired = [rank1, rank3];
		    } else if (r3 == requiredRank){
			required = rank3;
			notRequired = [rank1, rank2];
		    } else {
			continue;
		    }
		    // required is 2
		    pairs += required * (binomCoeff(notRequired[0], 2) * notRequired[1] + binomCoeff(notRequired[1], 2) * notRequired[0]);
		    // required is 1
		    pairs += binomCoeff(notRequired[0], 2) * binomCoeff(notRequired[1], 2);
		} else {
		    pairs += binomCoeff(rank1, 2) * binomCoeff(rank2, 2) * rank3 + binomCoeff(rank1, 2) * rank2 * binomCoeff(rank3, 2) + rank1 * binomCoeff(rank2, 2) * binomCoeff(rank3, 2);
		}
	    }
	}
    }

    // count royal straight flushes
    // for this, we need the original deck
    for (const suit of SUITS) {
	// check if 10-A are present, or, if joker, at least 4 or present
	var num10toA = deck.filter(card => card[0] == suit && isInRoyalStraight(card[1])).length;
	if (requiredCard != -1) {
	    if (requiredSuit != suit || !isInRoyalStraight(requiredRank)) {
		continue;
	    }
	    if (num10toA == 4) {
		rsf += 1;
	    }
	    if (hasJoker) {
		rsf += binomCoeff(num10toA, 3);
	    }
	} else {
	if (num10toA == 5) {
	    rsf += 1;
	}
	if (hasJoker) {
	    rsf += binomCoeff(num10toA, 4);
	}
	}
    }
    // count straight flushes
    // for each suit, for each high card from 5 to K, check if we can make a straight
    // jokers: 2,3,4,5 J will count for both 5 high and 6 high. so there is nontrivial overlap between 5 high and 6 high w/joker
    // count everything normally, then subtract one copy of 2-5, etc., 10-K (this is counted in royal straight flush)
    for (const suit of SUITS) {
	for (const highCard of [4, 5, 6, 7, 8, 9, 10, 11, 12]) {
	    var numCardsInRange = deck.filter(card => card[0] == suit && card[1] <= highCard && card[1] >= highCard - 4).length;
	    var hasFourStraight = deck.filter(card => card[0] == suit && card[1] <= highCard && card[1] >= highCard - 3).length;
	    if (requiredCard != -1) {
		if (requiredSuit != suit || requiredRank > highCard || requiredRank < highCard - 4) {
		    continue;
		}
		// the required card is the 5th
		if (numCardsInRange == 4) {
		    sf += 1;
		}
		if (hasJoker) {
		    sf += binomCoeff(numCardsInRange, 3);
		}
		// subtract: we already know that the kept cardi s in the range, so we add it to hasFourStraight if needed
		// we should not subtract when the required is the low card, though
		if (requiredRank != highCard - 4) {
		    // then required is in the straight, but it's not the low card
		    hasFourStraight += 1;
		if (hasFourStraight == 4) {
		    sf -= 1;
		}
		}
	    } else {
	    if (numCardsInRange == 5) {
		sf += 1;
	    }
	    if (hasJoker) {
		sf += binomCoeff(numCardsInRange, 4);
	    }
	    // now subtract one copy of 2-5, etc., 10-K
	    if (hasFourStraight == 4) {
		sf -= 1;
	    }
	    }
	}
    }
    
    // count straights
    // count the straights including flushes, then subtract the straight flushes
    for (const highCard of [4, 5, 6, 7, 8, 9, 10, 11, 12, 13]) {
	var cardRange = Array(5);
	for (var i = 0; i < 5; i++) {
	    if (highCard == 13 && i == 4) {
		cardRange[i] = 0;
	    } else {
		cardRange[i] = highCard - (4 - i);
	    }
	}
	// skip if required card not in range
	if (requiredCard != -1 && !cardRange.some(x => x == requiredRank)) {
	    continue;
	}
	// nonjoker: just multiply how many choices we have for each rank
	var straightsWithHigh = 1;
	for (const rank of cardRange) {
	    if (requiredCard != -1 && rank == requiredRank) {
		// do nothing, because the only card of this rank we could put is the required card
	    } else {
		straightsWithHigh *= rankCounts[rank];
	    }
	}
	straights += straightsWithHigh;
	// joker: we only need 4 of the 5 ranks. so for every subset of length 4...
	// if we have a required card, we only need 3 of the 5 ranks, but ignoring the required card. The last card is the required card.
	if (hasJoker) {
	    var cardRangeIterator;
	    if (requiredCard != -1) {
		cardRangeIterator = lengthSubsets(cardRange.filter(x => x != requiredRank), 3);
	    } else {
		cardRangeIterator = lengthSubsets(cardRange, 4);
	    }
	    for (const subset of cardRangeIterator) {
		var jokerStraightsWithHigh = 1;
		for (const rank of subset) {
		    jokerStraightsWithHigh *= rankCounts[rank];
		}
		straights += jokerStraightsWithHigh;
	    }
	    // now subtract the ones using hC - 3 to hC (except for 13) because they're counted twice
	    // if we have a required card, we know that the range must contain the required card
	    // the ones containing the required card as the non-low card are overcounted
	    if (highCard != 13) {
		// if we have a required but it's highCard - 4, skip this overcounting, since this can only happen once
		if (requiredCard != -1 && requiredRank == highCard - 4) {
		    continue;
		}
		var overcounted = 1;
		var subset = cardRange.slice(1, 5);
		if (requiredCard != -1 && requiredCard != highCard - 4) {
		    // required card is in cards 2-5, so it's fixed, we must take it out of the card range
		    subset = cardRange.slice(1, 5).filter(x => x != requiredRank);
		}
		
		for (const rank of subset) {
		    overcounted *= rankCounts[rank];
		}
		straights -= overcounted;
	    }
	}
    }
    straights -= (sf + rsf);
    
    // count flushes
    // again, we count arbitrary flushes, then subtract the straigth flushes and the royal straight flushes
    for (const suit of SUITS) {
	if (requiredCard != -1) {
	    // ignore if incorrect suit
	    if (requiredSuit != suit) {
		continue;
	    }
	    // otherwise, choose 4 or 3 other cards
	    flushes += binomCoeff(suitCounts[suit], 4);
	    if (hasJoker) {
		flushes += binomCoeff(suitCounts[suit], 3);
	    }
	} else {
	flushes += binomCoeff(suitCounts[suit], 5);
	if (hasJoker) {
	    flushes += binomCoeff(suitCounts[suit], 4);
	}
	}
    }
    flushes -= (sf + rsf);

    // the total wins
    var totalWins = fives + fours + fh + threes + pairs + rsf + sf + straights + flushes;
    var totalChips = fives * FIVE_OF_A_KIND + fours * FOUR_OF_A_KIND + fh * FULL_HOUSE + threes * THREE_OF_A_KIND + pairs * TWO_PAIR + rsf * ROYAL_STRAIGHT_FLUSH + sf * STRAIGHT_FLUSH + straights * STRAIGHT + flushes * FLUSH;

    var totalDraws;
    if (requiredCard != -1) {
	totalDraws = binomCoeff(deck.length, 4);
    } else {
	totalDraws = binomCoeff(deck.length, 5);
    }
    return [totalWins / totalDraws, totalChips / totalDraws];
}


function calculateProbabilities(cardList) {
    // for each subset of the card list
    // calculate probability of getting each hand

    parsedCards = cardList.map(x => parseCard(x));
    var handHasJoker = parsedCards.some(x => x[0] == JOKER_SUIT);

    // remove the 5 drawn cards from the rest of the deck
    var deck = deckWithCardsRemoved(parsedCards);

    var winRates = {};

    // if the hand is a win, we only need to check subsets that win
    var handIsWin = (typeOfHand(parsedCards) != LOSE)

    // if the hand has a pair, we should almost always keep the pair. 
    // an exception is if you have 4/5 cards for a straight flush. So we should only check subsets of two or more
    var mults = Object.values(getMultiplicities(parsedCards));
    var hasPair = mults.some(x => x == 2);

    for (const kept_subset of allSubsets(parsedCards)) {
	// if we have a Joker in our hand, we better keep it! Ignore any subsets that don't use Joker
	if (handHasJoker && !(kept_subset.some(x => x[0] == JOKER_SUIT))) {
	    continue;
	}
	// if hand is a win, only check subsets that win
	if (handIsWin && typeOfHand(kept_subset) == LOSE) {
	    continue;
	}
	if (hasPair && kept_subset.length < 2) {
	    continue;
	}

    	// remove all cards from the deck
	var totalDraws = binomCoeff(deck.length, 5 - kept_subset.length);
	var wins = 0;
	var chips = 0;
	// if the subset is empty, we can compute directly
	if (kept_subset.length == 0) {
	    var countedResult = countHands(deck);
	    winRates[JSON.stringify(kept_subset)] = countedResult;
	} else if (kept_subset.length == 1 && !handHasJoker) {
	    // computing things WITH the joker is too annoying
	    var countedResult = countHands(deck, kept_subset[0]);
	    winRates[JSON.stringify(kept_subset)] = countedResult;
	} else {
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
