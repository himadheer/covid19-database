const express = require("express");
const { open } = require("sqlite");
const path = require("path");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

let database = null;

const dbpath = path.join(__dirname, "covid19India.db");

const intializeDbAndServer = async () => {
  try {
    database = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server is running with https://localhost:3000/");
    });
  } catch (e) {
    console.log(`Db error : ${e.message}`);
    process.exit(1);
  }
};

intializeDbAndServer();

// API 1- for getting states

const convert = (obj) => {
  return {
    stateId: obj.state_id,
    stateName: obj.state_name,
    population: obj.population,
  };
};

app.get("/states/", async (request, response) => {
  const getStatesQuery = `
               SELECT
                 *
                FROM
                 state
                 `;

  const states = await database.all(getStatesQuery);
  response.send(
    states.map((state) => {
      return convert(state);
    })
  );
});

//API -2 for getting specific state

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
              SELECT
                 *
               FROM
                  state
               WHERE
                  state_id = ${stateId}`;

  const state = await database.get(getStateQuery);
  response.send(convert(state));
});

//API -4  getting specific district

const convertDistrict = (obj) => {
  return {
    districtId: obj.district_id,
    districtName: obj.district_name,
    stateId: obj.state_id,
    cases: obj.cases,
    cured: obj.cured,
    active: obj.active,
    deaths: obj.deaths,
  };
};

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getStateQuery = `
              SELECT
                 *
               FROM
                  district
               WHERE
                  district_id = ${districtId}`;

  const district = await database.get(getStateQuery);
  response.send(convertDistrict(district));
});

//API -7 for getting statics of specific state

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;

  const query = `
            SELECT
              sum(cases) as totalCases,
              sum(cured) as totalCured,
              sum(active) as totalActive,
              sum(deaths) as totalDeaths 
            FROM
               district 
            WHERE
               state_id = ${stateId} 
            GROUP BY
                state_id; `;

  const district = await database.get(query);
  response.send(district);
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;

  const Query = `
              SELECT
                 state_name
               FROM
                 state inner join district on state.state_id = district.state_id 
                WHERE
                   district_id = ${districtId}             
                                             
                 `;
  const state = await database.get(Query);
  response.send({
    stateName: state.state_name,
  });
});

// API - 3 for creating district

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;

  const createDistrictQuery = `
               INSERT INTO
                  district
                   (district_name, state_id, cases, cured, active, deaths)
                VALUES('${districtName}',${stateId},${cases},${cured},${active},${deaths})`;

  await database.run(createDistrictQuery);
  response.send("District Successfully Added");
});

// API -6 for updating specific district

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;

  const { districtName, stateId, cases, cured, active, deaths } = request.body;

  const updateDistrictQuery = `
            UPDATE
              district
            SET 
              district_name = '${districtName}',
              state_id = ${stateId},
              cases = ${cases},
              cured = ${cured},
              active = ${active},
              deaths = ${deaths}
             WHERE
               district_id = ${districtId} `;

  await database.run(updateDistrictQuery);
  response.send("District Details Updated");
});

// ApI -5 for deleting specific district

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getStateQuery = `
              DELETE 
               FROM
                  district
               WHERE
                  district_id = ${districtId}`;

  await database.get(getStateQuery);
  response.send("District Removed");
});

module.exports = app;
