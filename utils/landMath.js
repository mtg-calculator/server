const { jStat } = require('jstat');
const { bigCombination } = require('js-combinatorics');

exports.calculateLandCombinations = (
  deckSize,
  achieveChance,
  sources,
  onTurn
) => {
  const untappedByTapped = [];
  let tapped = 0;
  let untapped = 1;
  let currentChance = 0;
  let lastUntapped = Infinity;
  const achieveChanceDecimal = achieveChance / 100;

  while (tapped <= deckSize / 2 && untapped > 0) {
    untapped = 0;
    currentChance = calculateChance(
      deckSize,
      sources,
      onTurn,
      tapped,
      untapped
    );

    while (currentChance < achieveChanceDecimal) {
      untapped++;
      currentChance = calculateChance(
        deckSize,
        sources,
        onTurn,
        tapped,
        untapped
      );
    }

    if (tapped + untapped <= deckSize / 2 && untapped < lastUntapped) {
      untappedByTapped[tapped] = untapped;
    }

    tapped++;
    lastUntapped = untapped;
  }

  return untappedByTapped;
};

function calculateChance(deckSize, sources, onTurn, tapped, untapped) {
  const events = [];
  let chanceFromUntapped = 0;
  let chanceFromTapped = 0;

  /**
   * go through every combination of tapped/untapped land that gets correct
   * available sources for the turn in question
   */
  for (let i = 0; i <= sources; i++) {
    chanceFromUntapped = hypgeomUpperCumulativeProbability(
      deckSize,
      untapped,
      7 + parseInt(onTurn) - 1,
      sources - i
    );

    chanceFromTapped = hypgeomUpperCumulativeProbability(
      deckSize,
      tapped,
      7 + parseInt(onTurn) - 2,
      i
    );

    events[i] = chanceFromTapped * chanceFromUntapped;
  }

  // handle edge case where only all untapped lands can satisfy this requirement
  if (sources === onTurn) {
    events[sources] = 0;
  }

  return unionIndependent(events);
}

function hypgeomUpperCumulativeProbability(
  deckSize,
  deckSuccesses,
  sampleSize,
  sampleSuccesses
) {
  return (
    1 -
    (jStat.hypgeom.cdf(sampleSuccesses, deckSize, deckSuccesses, sampleSize) -
      jStat.hypgeom.pdf(sampleSuccesses, deckSize, deckSuccesses, sampleSize))
  );
}

function unionIndependent(events) {
  let sum = 0;
  let product = 1;
  let sign = 1;

  for (let i = 1; i <= events.length; i++) {
    const eventCombos = bigCombination(events, i).toArray();
    for (let j = 0; j < eventCombos.length; j++) {
      const term = eventCombos[j];
      for (let k = 0; k < term.length; k++) {
        product *= term[k];
      }
      sum += product * sign;
      product = 1;
    }

    sign *= -1;
  }

  return sum;
}
