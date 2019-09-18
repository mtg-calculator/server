const calculator = require('../models/calc.model');

exports.getCalculation = (request, response, next) => {
  try {
    const calculation = calculator.calculate();
    return response.status(200).send(calculation);
  } catch (err) {
    next(err);
  }
};
