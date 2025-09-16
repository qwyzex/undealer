// Card model
class Card {
  final int value; // 2-14 (14 = Ace)
  final String suit; // "H", "D", "C", "S"
  Card(this.value, this.suit);
}

// Hand evaluation result
class HandResult {
  final int rank; // 1-10
  final List<int> tiebreaker;
  HandResult(this.rank, this.tiebreaker);
}

/////////////////////////////////////////////////////////////// HAND EVALUATION

bool checkStraight(List<int> values) {
  if (values.length < 5) return false;

  // Clone and add Ace as 1 if present
  List<int> vals = List.from(values);
  if (vals.contains(14)) vals.add(1);

  vals.sort((b, a) => a.compareTo(b)); // descending

  int run = 1;
  for (int i = 0; i < vals.length - 1; i++) {
    if (vals[i] == vals[i + 1]) continue;
    if (vals[i] - 1 == vals[i + 1]) {
      run++;
      if (run >= 5) return true;
    } else {
      run = 1;
    }
  }
  return false;
}

int? getValueWithCount(Map<int, int> counts, int count) {
  for (var entry in counts.entries) {
    if (entry.value == count) return entry.key;
  }
  return null;
}

int countPairs(Map<int, int> counts) {
  return counts.values.where((c) => c == 2).length;
}

bool hasNOfAKind(Map<int, int> counts, int n) {
  return counts.values.any((c) => c == n);
}

List<int> getValuesWithCount(Map<int, int> counts, int count) {
  return counts.entries
      .where((e) => e.value == count)
      .map((e) => e.key)
      .toList()
    ..sort((b, a) => a.compareTo(b));
}

////////////////////////////////////////////////////////////// EVALUATE 5-CARD HAND

HandResult evaluateHand(List<Card> cards) {
  List<Card> sorted = List.from(cards)..sort((b, a) => a.value.compareTo(b.value));

  Map<int, int> valueCounts = {};
  Map<String, int> suitCounts = {};
  for (var c in sorted) {
    valueCounts[c.value] = (valueCounts[c.value] ?? 0) + 1;
    suitCounts[c.suit] = (suitCounts[c.suit] ?? 0) + 1;
  }

  List<int> values = valueCounts.keys.toList()..sort((b, a) => a.compareTo(b));
  bool isFlush = suitCounts.values.any((c) => c == 5);
  bool isStraight = checkStraight(values);

  // Royal Flush
  if (isFlush && isStraight && values.contains(14)) {
    return HandResult(10, [14]);
  }
  // Straight Flush
  if (isFlush && isStraight) {
    return HandResult(9, [values.first]);
  }
  // Four of a Kind
  if (hasNOfAKind(valueCounts, 4)) {
    int quad = getValueWithCount(valueCounts, 4)!;
    List<int> kicker = values.where((v) => v != quad).toList();
    return HandResult(8, [quad, ...kicker]);
  }
  // Full House
  if (hasNOfAKind(valueCounts, 3) && hasNOfAKind(valueCounts, 2)) {
    int triple = getValueWithCount(valueCounts, 3)!;
    int pair = getValueWithCount(valueCounts, 2)!;
    return HandResult(7, [triple, pair]);
  }
  // Flush
  if (isFlush) {
    return HandResult(6, values);
  }
  // Straight
  if (isStraight) {
    return HandResult(5, [values.first]);
  }
  // Three of a Kind
  if (hasNOfAKind(valueCounts, 3)) {
    int triple = getValueWithCount(valueCounts, 3)!;
    List<int> kickers = values.where((v) => v != triple).toList();
    return HandResult(4, [triple, ...kickers]);
  }
  // Two Pair
  if (countPairs(valueCounts) == 2) {
    List<int> pairs = getValuesWithCount(valueCounts, 2);
    List<int> kicker = values.where((v) => !pairs.contains(v)).toList();
    return HandResult(3, [...pairs, ...kicker]);
  }
  // One Pair
  if (countPairs(valueCounts) == 1) {
    int pair = getValueWithCount(valueCounts, 2)!;
    List<int> kickers = values.where((v) => v != pair).toList();
    return HandResult(2, [pair, ...kickers]);
  }
  // High Card
  return HandResult(1, values);
}

////////////////////////////////////////////////////////////// BO7

List<List<T>> combinations<T>(List<T> arr, int k) {
  List<List<T>> result = [];

  void helper(int start, List<T> combo) {
    if (combo.length == k) {
      result.add(List.from(combo));
      return;
    }
    for (int i = start; i < arr.length; i++) {
      helper(i + 1, [...combo, arr[i]]);
    }
  }

  helper(0, []);
  return result;
}

int compareHands(HandResult h1, HandResult h2) {
  if (h1.rank != h2.rank) return h1.rank - h2.rank;
  for (int i = 0; i < h1.tiebreaker.length || i < h2.tiebreaker.length; i++) {
    int a = (i < h1.tiebreaker.length) ? h1.tiebreaker[i] : 0;
    int b = (i < h2.tiebreaker.length) ? h2.tiebreaker[i] : 0;
    if (a != b) return a - b;
  }
  return 0;
}

HandResult bestOfSeven(List<Card> cards) {
  HandResult? best;
  for (var combo in combinations(cards, 5)) {
    HandResult evaluated = evaluateHand(combo);
    if (best == null || compareHands(evaluated, best) > 0) {
      best = evaluated;
    }
  }
  return best!;
}

////////////////////////////////////////////////////////////// DETERMINE TABLE WINNER

class Player {
  final String id;
  final List<Card> cards;
  Player(this.id, this.cards);
}

List<Player> determineWinner(List<Player> players, List<Card> community) {
  List<Map<String, dynamic>> results = [];

  for (var player in players) {
    List<Card> allCards = [...player.cards, ...community];
    HandResult best = bestOfSeven(allCards);

    results.add({
      'player': player,
      'best': best,
    });
  }

  results.sort((a, b) {
    HandResult ha = a['best'];
    HandResult hb = b['best'];
    if (ha.rank != hb.rank) return hb.rank - ha.rank;
    for (int i = 0; i < ha.tiebreaker.length || i < hb.tiebreaker.length; i++) {
      int va = (i < ha.tiebreaker.length) ? ha.tiebreaker[i] : 0;
      int vb = (i < hb.tiebreaker.length) ? hb.tiebreaker[i] : 0;
      if (va != vb) return vb - va;
    }
    return 0;
  });

  List<Player> winners = [results.first['player']];
  for (int i = 1; i < results.length; i++) {
    HandResult hi = results[i]['best'];
    HandResult h0 = results[0]['best'];
    if (compareHands(hi, h0) == 0) {
      winners.add(results[i]['player']);
    } else {
      break;
    }
  }

  return winners;
}
