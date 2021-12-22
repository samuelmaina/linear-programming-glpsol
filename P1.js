const util = require("util");
const exec = util.promisify(require("child_process").exec);

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const lpFile = "optimal.lp";
const solution = "solution.txt";

const MAX_COMMODITIES_PER_ARC = 165;

exports.types = {
  factory: "factory",
  market: "market",
  quarry: "quarry",
};

const types = this.types;

const resources = {
  gold: "golds",
  diamonds: "diamonds",
  jewelleries: "jewelleries",
};

const sources = {
  energy: "energy",
};

const effeciency = "efficiency";
const createFile = async (lpFile, content) => {
  try {
    await fs.promises.writeFile(lpFile, content);
  } catch (error) {
    console.log(error);
  }
};

const findMaxInFile = (solutionTextFile, cb) => {
  const filePath = path.resolve(solutionTextFile);
  // Creating a readable stream from file
  // readline module reads line by line
  // but from a readable stream only.
  const file = readline.createInterface({
    input: fs.createReadStream(filePath),
    solution: process.stdout,
    terminal: false,
  });

  // Printing the content of file line by
  // line to console by listening on the
  // line event which will triggered
  // whenever a new line is read from
  // the stream

  file.on("line", (line) => {
    if (line.includes("Objective")) {
      cb(line.match(/(\d+)/)[1]);
    }
    if (line.includes("PRIMAL SOLUTION IS INFEASIBLE")) {
      cb("LP not solvable.");
    }
  });
};

//the connection array consist of the connection in this nodes. array [0,1] represent an
//arc from 0 to 1
//         3---------------7
//        / \             /  \
//      /    \           6----8
//     /       \       /      |
//    0 -- 2----4----5        |
//    \    /           \      |
//     \  /              9    |
//      \/              /  \  |
//       1------------10-----11

const connections = [
  [0, 1],
  [0, 2],
  [0, 3],
  [1, 2],
  [1, 10],
  [2, 4],
  [3, 4],
  [3, 7],
  [4, 5],
  [5, 6],
  [5, 9],
  [6, 7],
  [6, 8],
  [7, 8],
  [8, 11],
  [9, 11],
  [9, 10],
  [10, 11],
];

const MAX_ENERGY = 850;

const solver = (arrangement = []) => {
  //This is the default configuration of the nodes in the graph.
  //the arrangement array (that is supplied as  a parameter to the function) will have
  //the types that will go into the node. The types will matched to the graph according to its
  //index in the arrangement array. For example if the first values of the arrangement array has factory as the
  //the first element, factory will be assigned to the node 0 in the graph.

  //the objective is to maximimize the ammount that will be sold for all the markets.
  let obj = "";

  let firstFound = true;
  let totalRevenue;
  connections.forEach((arc, index) => {
    const destination = arc[1];
    //check if the destination is a market
    if (arrangement[destination] === types.market) {
      totalRevenue = totalRevenueForMarketAtIndex(index);
      //for the first, there won't be addition of + sign.
      if (firstFound) {
        obj += totalRevenue;
        firstFound = false;
        return;
      }
      obj += ` + ${totalRevenue} `;
    }
  });

  //if there is no market(s) in the  arrangement, give a dummy string for the obj.
  if (obj.length === 0) {
    obj += " gold0";
  }
  let constrains = "\nSubject To \n";

  let resourcesConstrains = "";

  connections.forEach((arc, index) => {
    resourcesConstrains += resourceConstrainForArcAtNodes(index);
  });

  constrains += resourcesConstrains;
  let energyConstains = "";

  const quarries = [];
  const factories = [];

  arrangement.forEach((node, index) => {
    if (node === types.quarry) {
      quarries.push(index);
      return;
    }
    if (node === types.factory) {
      factories.push(index);
      return;
    }
  });
  let quarryConstrain;
  let factoryContrain;

  if (quarries.length > 0) {
    quarryConstrain = constructEffeciencyFunction(quarries, "100");
    energyConstains += quarryConstrain;
  }
  if (quarries.length > 0 && factories.length > 0) {
    energyConstains += " + ";
  }
  if (factories.length > 0) {
    factoryContrain = constructEffeciencyFunction(factories, "300");
    energyConstains += factoryContrain;
  }

  if (quarries.length > 0 || factories.length > 0) {
    energyConstains += ` = ${MAX_ENERGY}\n`;
  }

  constrains += energyConstains;

  let productionConstrains = "";

  connections.forEach((arc, index) => {
    productionConstrains += productionConstrainAtArc(arc, index, arrangement);
  });

  constrains += productionConstrains;
  let bounds = "\nBounds \n";
  connections.forEach((arc, index) => {
    const to = arrangement[arc[1]];
    if (to === types.market) {
      bounds += `${resources.gold + index} >= 0 \n${
        resources.diamonds + index
      } => 0 \n${resources.jewelleries + index} = 0 \n`;
      return;
    }
    bounds += `${resources.gold + index} >= 0 \n${
      resources.diamonds + index
    } >= 0 \n${resources.jewelleries + index} >= 0 \n`;
  });

  for (let index = 0; index <= 11; index++) {
    bounds += `${effeciency + index} >= 0 \n${effeciency + index} <=1\n`;
  }

  const final = "Maximize \n" + obj + constrains + bounds + "\nEnd";

  return final;
};

function productionConstrainAtArc(arc, index, arrangement) {
  let constrain = "";
  let destination = arc[1];

  if (destination === 11) {
    //the node 11 does not have any outside nodes so there won't be any processing
    //maybe selling(if it is a market). If it is market, it will work just fine since
    //there not case for the market constrain.
    return "";
  }
  const outEdges = [];
  connections.forEach((edge, edgeIndex) => {
    if (edge[0] === destination) {
      outEdges.push(edgeIndex);
    }
  });

  let effc = effeciency + destination;

  let firstFound = true;

  switch (arrangement[destination]) {
    case types.quarry:
      let allGold = "",
        allDiamonds = "";
      for (const outPath of outEdges) {
        let gold = resources.gold + outPath;
        let diamonds = resources.diamonds + outPath;
        if (firstFound) {
          allGold += gold;
          allDiamonds += diamonds;
          firstFound = false;
          continue;
        }
        allGold += ` + ${gold}`;
        allDiamonds += ` + ${diamonds}`;
      }

      allGold += ` - 200 ${effc} - ${resources.gold + index}  = 0 \n`;
      allDiamonds += ` - 75 ${effc} -  ${resources.diamonds + index}  = 0 \n`;

      //ensure that resources are used by not all of them are used( ensured by the < sign)
      constrain += allGold + allDiamonds;
      break;

    case types.factory:
      let golds = "",
        factoryDiamonds = "",
        factJewelleries = "";
      for (const outPath of outEdges) {
        let gold = resources.gold + outPath;
        let diamonds = resources.diamonds + outPath;
        let jewelleries = resources.jewelleries + outPath;
        if (firstFound) {
          golds += gold;
          factoryDiamonds += diamonds;
          factJewelleries += jewelleries;
          firstFound = false;
          continue;
        }
        golds += ` + ${gold}`;
        factoryDiamonds += ` + ${diamonds}`;
        factJewelleries += ` + ${jewelleries}`;
      }
      //ensure that resources are used by not all of them are used( ensured by the < sign)
      //ensure that resources are used by not all of them are used( ensured by the < sign)
      golds += ` -  ${resources.gold + index}  + 70  ${effc} = 0 \n`;
      factoryDiamonds += ` -  ${
        resources.diamonds + index
      } + 20  ${effc}  = 0 \n`;
      factJewelleries += ` -  ${
        resources.jewelleries + index
      } - 60  ${effc}= 0 \n`;
      constrain += golds + factoryDiamonds + factJewelleries;
      break;
    case types.market:
      let marketGold = "",
        marketDiamonds = "",
        marketJewelleries = "";
      for (const outPath of outEdges) {
        let gold = resources.gold + outPath;
        let diamonds = resources.diamonds + outPath;
        let jewelleries = resources.jewelleries + outPath;
        if (firstFound) {
          marketGold += gold;
          marketDiamonds += diamonds;
          marketJewelleries += jewelleries;
          firstFound = false;
          continue;
        }
        marketGold += ` + ${gold}`;
        marketDiamonds += ` + ${diamonds}`;
        marketJewelleries += ` + ${jewelleries}`;
      }

      //ensure that resources are used by not all of them are used( ensured by the < sign)
      marketGold += ` - ${resources.gold + index} < 0 \n`;
      marketDiamonds += ` - ${resources.diamonds + index} < 0 \n`;

      marketJewelleries += ` - ${resources.jewelleries + index} = 0 \n`;
      constrain += marketGold + marketDiamonds + marketJewelleries;

      break;

    default:
      break;
  }
  return constrain;
}

function constructEffeciencyFunction(arr, usage) {
  let constrain = "";

  let first = true;

  for (const index of arr) {
    const c = `${usage} ${effeciency + index}`;
    if (first) {
      constrain += c;
      first = false;
      continue;
    }
    constrain += ` + ${c}`;
  }
  return constrain;
}

function totalRevenueForMarketAtIndex(index) {
  return `150 ${resources.gold + index} + 200 ${
    resources.diamonds + index
  } + 1000 ${resources.jewelleries + index}`;
}

function resourceConstrainForArcAtNodes(index) {
  return ` ${resources.gold + index} + ${resources.diamonds + index} + ${
    resources.jewelleries + index
  } <= ${MAX_COMMODITIES_PER_ARC}\n`;
}

async function ls() {
  const solver = `glpsol --lp optimal.lp -o solution.txt `;

  //execute through the terminal.
  await exec(solver);
}

module.exports = async (arrangement) => {
  const lpContent = solver(arrangement);
  await createFile(lpFile, lpContent);
  await ls();
  return new Promise((resolve, reject) => {
    try {
      const cb = (value) => {
        resolve(value);
      };
      findMaxInFile(solution, cb);
    } catch (error) {
      reject(error);
    }
  });
};
