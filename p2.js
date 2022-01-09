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

const findOverallMax = async () => {
  try {
    for (const type1 of types) {
      for (const type2 of types) {
        for (const type3 of types) {
          for (const type4 of types) {
            for (const type5 of types) {
              for (const type6 of types) {
                for (const type7 of types) {
                  for (const type8 of types) {
                    for (const type9 of types) {
                      for (const type10 of types) {
                        for (const type11 of types) {
                          for (const type12 of types) {
                            const arrangement = [
                              type1,
                              type2,
                              type3,
                              type4,
                              type5,
                              type6,
                              type7,
                              type8,
                              type9,
                              type10,
                              type11,
                              type12,
                            ];
                            const foundMax = await P1(arrangement);
                            counter++;
                            if (Number(foundMax) > Number(max.currentMax)) {
                              max.currentMax = foundMax;
                              max.arrangements = [arrangement];
                            } else if (
                              Number(foundMax) === Number(max.currentMax)
                            ) {
                              max.arrangements.push(arrangement);
                            }
                            console.log(counter);
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
};
