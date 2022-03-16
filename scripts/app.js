const axios = require("axios");
const cheerio = require("cheerio");
const fsp = require("fs/promises");
const json2csv = require("json2csv");

const url = "https://en.wikipedia.org/wiki/Road_safety_in_Europe";
const wantedColumns = [
  "Country",
  "Area (thousands of km2)",
  "Population in 2018",
  "GDP per capita in 2018",
  "Population density (inhabitants per km2) in 2017",
  "Vehicle ownership (per thousand inhabitants) in 2016",
  "Total Road Deaths in 2018",
  "Road deaths per Million Inhabitants in 2018",
  "Year",
];

const loadData = async () => {
  const headers = [];
  const result = [];
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    $("table.sortable")
      .find("tr")
      .each((row, elem) => {
        if (row === 0) {
          $(elem)
            .find("th")
            .each((idx, elem) => {
              let header = $(elem).text().trim();

              console.info(`Key ${idx}`, header);
              header = header.replace("\n", " ");
              if (header.endsWith("]")) {
                header = header.substr(0, header.length - 4);
              }
              headers.push(header);
            });
          return;
        }
        const details = {};
        $(elem)
          .find("td,th")
          .each((idx, elem) => {
            let value = $(elem).text().trim();
            const key = headers[idx];
            if (wantedColumns.includes(key)) {
              //remove commas from numbers if current key is not country
              if (key !== "Country") {
                value = value.replace(/\,/g, "");
                value = parseInt(value);
              }
              details[key] = value;
              details["Year"] = "2018";
            }
          });
        result.push(details);
      });
    return result.sort(compare);
  } catch (err) {
    console.log(err);
  }
};
function compare(a, b) {
  const sortFieldName = "Road deaths per Million Inhabitants in 2018";
  if (a[sortFieldName] < b[sortFieldName]) {
    return -1;
  }
  if (a[sortFieldName] > b[sortFieldName]) {
    return 1;
  }
  return 0;
}

const saveToCsvFile = async (data) => {
  const j2cp = new json2csv.Parser();
  const csv = j2cp.parse(data);
  await fsp.writeFile("./breakdown.csv", csv, { encoding: "utf-8" });
};

loadData().then(saveToCsvFile);
