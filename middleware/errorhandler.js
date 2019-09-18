const errorHandler = (err, request, response, next) =>
  response.status(500).send('Server Error');

module.exports = errorHandler;
