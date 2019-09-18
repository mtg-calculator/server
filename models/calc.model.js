const db = require('../db');
const { calculateLandCombinations } = require('../utils/landMath');
const ClientFriendlyError = require('../utils/ClientFriendlyError');

exports.calculate = async ({
  deck_size: deckSize,
  achieve_chance: achieveChance,
  sources,
  on_turn: onTurn
}) => {
  if (!deckSize || !achieveChance || !sources || !onTurn) {
    throw new ClientFriendlyError('Missing Query Parameters', 400);
  }

  if (
    deckSize > 100 ||
    deckSize < 40 ||
    achieveChance > 85 ||
    achieveChance < 0 ||
    sources > onTurn ||
    sources < 0 ||
    onTurn > 10 ||
    onTurn < 1
  ) {
    throw new ClientFriendlyError(
      'Improper Query Parameters:\ndeck_size must be exactly or between 40 and 100\nachieve_chance must be exactly or between 0 and 85\nsources must be less than or equal to on_turn and greater than 0\non_turn must be exactly or between 1 and 10',
      400
    );
  }

  const deckSizeFloor = Math.floor(deckSize);
  const achieveChanceFloor = Math.floor(achieveChance);
  const sourcesFloor = Math.floor(sources);
  const onTurnFloor = Math.floor(onTurn);

  try {
    let combinations = await db.query(
      `SELECT * FROM calculations WHERE deck_size = $1 AND achieve_chance = $2 AND sources = $3 AND on_turn = $4`,
      [deckSizeFloor, achieveChanceFloor, sourcesFloor, onTurnFloor]
    );

    if (combinations.rowCount === 0) {
      combinations = calculateLandCombinations(
        deckSizeFloor,
        achieveChanceFloor,
        sourcesFloor,
        onTurnFloor
      );

      db.query(
        `INSERT INTO calculations (deck_size, achieve_chance, sources, on_turn, untapped_by_tapped) VALUES ($1, $2, $3, $4, $5);`,
        [
          deckSizeFloor,
          achieveChanceFloor,
          sourcesFloor,
          onTurnFloor,
          combinations
        ]
      );

      return combinations;
    }

    return combinations.rows[0].untapped_by_tapped;
  } catch (err) {
    console.log(err);
    throw new ClientFriendlyError('Database Error', 500);
  }
};
