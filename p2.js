const P1 = require("./P1");

//Put the types to avoid errors and get the benefits of autocompletion
const types = ["quarry", "factory", "market"];

//an object to hold the max value and the configuration(s) that lead to
//the max value.
let max = {
  currentMax: 0.0,
  //incase there are more than one arrangements that produce the max value
  arrangements: [],
};
