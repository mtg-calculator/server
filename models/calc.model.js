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

  try {
    let combinations = await db.query(
      `SELECT * FROM calculations WHERE deck_size = $1 AND achieve_chance = $2 AND sources = $3 AND on_turn = $4`,
      [deckSize, achieveChance, sources, onTurn]
    );

    if (combinations.rowCount === 0) {
      combinations = calculateLandCombinations(
        deckSize,
        achieveChance,
        sources,
        onTurn
      );

      db.query(
        `INSERT INTO calculations (deck_size, achieve_chance, sources, on_turn, untapped_by_tapped) VALUES ($1, $2, $3, $4, $5);`,
        [deckSize, achieveChance, sources, onTurn, combinations]
      );

      return combinations;
    }

    return combinations.rows[0].untapped_by_tapped;
  } catch (err) {
    console.log(err);
    throw new ClientFriendlyError('Database Error', 500);
  }
};
