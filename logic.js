///
///////
/////////////////////////////////////////////////////////////// HAND EVALUATION

function checkStraight(values) {
    if (values.length < 5) return false;

    // Clone and add Ace as 1 if present
    let vals = [...values];
    if (vals.includes(14)) vals.push(1);

    // Sort descending
    vals.sort((a, b) => b - a);

    // Scan for consecutive runs of 5
    let run = 1;
    for (let i = 0; i < vals.length - 1; i++) {
        if (vals[i] === vals[i + 1]) continue; // skip duplicates
        if (vals[i] - 1 === vals[i + 1]) {
            run++;
            if (run >= 5) return true;
        } else {
            run = 1;
        }
    }
    return false;
}

function getValueWithCount(valueCounts, count) {
    return parseInt(Object.keys(valueCounts).find((v) => valueCounts[v] === count));
}

function countPairs(valueCounts) {
    return Object.values(valueCounts).filter((count) => count === 2).length;
}

function hasNOfAKind(valueCounts, n) {
    return Object.values(valueCounts).some((count) => count === n);
}

function getValuesWithCount(valueCounts, count) {
    return Object.keys(valueCounts)
        .filter((v) => valueCounts[v] === count)
        .map(Number)
        .sort((a, b) => b - a);
}

////////////////////////////////////////////////////////////// EVALUATE 5-CARD HAND

function evaluateHand(cards) {
    // 1. Sort cards by value
    let sorted = [...cards].sort((a, b) => b.value - a.value);

    // 2. Build frequency maps
    let valueCounts = {};
    let suitCounts = {};
    for (let c of sorted) {
        valueCounts[c.value] = (valueCounts[c.value] || 0) + 1;
        suitCounts[c.suit] = (suitCounts[c.suit] || 0) + 1;
    }

    let values = Object.keys(valueCounts)
        .map(Number)
        .sort((a, b) => b - a);
    let isFlush = Object.values(suitCounts).some((count) => count === 5);
    let isStraight = checkStraight(values);

    // 3. Check combinations in order
    if (isFlush && isStraight && values[0] === 14) {
        return { rank: 10, tiebreaker: [14] }; // Royal Flush
    }
    if (isFlush && isStraight) {
        return { rank: 9, tiebreaker: [values[0]] }; // Straight Flush
    }
    if (hasNOfAKind(valueCounts, 4)) {
        let quad = getValueWithCount(valueCounts, 4);
        let kicker = values.filter((v) => v !== quad);
        return { rank: 8, tiebreaker: [quad, ...kicker] };
    }
    if (hasNOfAKind(valueCounts, 3) && hasNOfAKind(valueCounts, 2)) {
        let triple = getValueWithCount(valueCounts, 3);
        let pair = getValueWithCount(valueCounts, 2);
        return { rank: 7, tiebreaker: [triple, pair] };
    }
    if (isFlush) {
        return { rank: 6, tiebreaker: values };
    }
    if (isStraight) {
        return { rank: 5, tiebreaker: [values[0]] };
    }
    if (hasNOfAKind(valueCounts, 3)) {
        let triple = getValueWithCount(valueCounts, 3);
        let kickers = values.filter((v) => v !== triple);
        return { rank: 4, tiebreaker: [triple, ...kickers] };
    }
    if (countPairs(valueCounts) === 2) {
        let pairs = getValuesWithCount(valueCounts, 2);
        let kicker = values.filter((v) => !pairs.includes(v));
        return { rank: 3, tiebreaker: [...pairs, ...kicker] };
    }
    if (countPairs(valueCounts) === 1) {
        let pair = getValueWithCount(valueCounts, 2);
        let kickers = values.filter((v) => v !== pair);
        return { rank: 2, tiebreaker: [pair, ...kickers] };
    }
    return { rank: 1, tiebreaker: values }; // High card
}

////////////////////////////////////////////////////////////// BO7

// Generate all combinations of k elements from arr
function combinations(arr, k) {
    let result = [];

    function helper(start, combo) {
        if (combo.length === k) {
            result.push(combo);
            return;
        }
        for (let i = start; i < arr.length; i++) {
            helper(i + 1, [...combo, arr[i]]);
        }
    }

    helper(0, []);
    return result;
}

// Compare two evaluated hands
function compareHands(h1, h2) {
    if (h1.rank !== h2.rank) return h1.rank - h2.rank;
    for (let i = 0; i < Math.max(h1.tiebreaker.length, h2.tiebreaker.length); i++) {
        let a = h1.tiebreaker[i] || 0;
        let b = h2.tiebreaker[i] || 0;
        if (a !== b) return a - b;
    }
    return 0; // completely equal
}

// Given 7 cards, return the best hand
function bestOfSeven(cards) {
    let best = null;

    for (let combo of combinations(cards, 5)) {
        let evaluated = evaluateHand(combo);
        if (!best || compareHands(evaluated, best) > 0) {
            best = evaluated;
        }
    }

    return best;
}

////////////////////////////////////////////////////////////// DETERMINE TABLE WINNER

function determineWinner(players, community) {
    let results = [];

    // Step 1: evaluate each player's best hand
    for (let player of players) {
        let allCards = [...player.cards, ...community];
        let best = bestOfSeven(allCards);

        results.push({
            player: player.id,
            best: best,
        });
    }

    // Step 2: sort results by best hand strength
    results.sort((a, b) => {
        if (a.best.rank !== b.best.rank) {
            return b.best.rank - a.best.rank; // higher rank first
        }
        // tie → compare tiebreakers
        for (
            let i = 0;
            i < Math.max(a.best.tiebreaker.length, b.best.tiebreaker.length);
            i++
        ) {
            let va = a.best.tiebreaker[i] || 0;
            let vb = b.best.tiebreaker[i] || 0;
            if (va !== vb) return vb - va;
        }
        return 0; // complete tie
    });

    // Step 3: check for ties at the top
    let winners = [results[0]];
    for (let i = 1; i < results.length; i++) {
        if (compareHands(results[i].best, results[0].best) === 0) {
            winners.push(results[i]);
        } else {
            break;
        }
    }

    return winners;
}

////////////////////////////////////////////////////////////// EXAMPLE USAGE

let players = [
    {
        id: "Player A",
        cards: [
            { value: 14, suit: "H" },
            { value: 13, suit: "H" },
        ],
    },
    {
        id: "Player B",
        cards: [
            { value: 9, suit: "C" },
            { value: 9, suit: "D" },
        ],
    },
    {
        id: "Player C",
        cards: [
            { value: 2, suit: "S" },
            { value: 3, suit: "S" },
        ],
    },
];

let community = [
    { value: 12, suit: "H" }, // Q♥
    { value: 11, suit: "H" }, // J♥
    { value: 10, suit: "H" }, // T♥
    { value: 5, suit: "C" }, // 5♣
    { value: 2, suit: "D" }, // 2♦
];

let winners = determineWinner(players, community);
console.log("Winner(s):", winners);

////////////////////////////////////////////////////////////// TESTING

console.log(
    bestOfSeven([
        { value: 14, suit: "H" }, // A♣
        { value: 13, suit: "H" }, // K♣
        { value: 12, suit: "H" }, // Q♣
        { value: 11, suit: "H" }, // J♣
        { value: 10, suit: "H" }, // 10♣
        { value: 9, suit: "D" }, // 9♦
        { value: 8, suit: "S" }, // 8♠
    ])
);

console.log(
    evaluateHand([
        { value: 14, suit: "H" }, // A♣
        { value: 2, suit: "D" }, // 2♦
        { value: 3, suit: "H" }, // 3♥
        { value: 4, suit: "S" }, // 4♠
        { value: 5, suit: "C" }, // 5♣
    ])
);
