#!/usr/bin/env node

const yargs = require("yargs");
const axios = require("axios");
const csvParser = require('papaparse');
const moment = require('moment');
const fs = require('fs');
const path = require('path')
const { exit } = require("process");
const apikey = "4b0dbb7999bd163d4899067216b93b96194883f18ea187bb7d26d49e85ea589a";

let flag = "";
let tokenCountList = {};
const options = yargs
    .usage("Usage: portfolio <options>")
    .option("t", { alias: "token", describe: "Provide Token name", type: "string" })
    .option("d", { alias: "date", describe: "Provide date in this format DD-MM-YYYY", type: "string" })
    .argv;

if (options.date && options.token) {
    if (moment(options.date, "DD-MM-YYYY").isValid()) {
        console.log(`Reading the csv file to get ${options.token} balance on ${options.date}...`);
        tokenCountList[options.token] = 0;
        flag = "both";
    } else {
        console.log("Please provide a valid date in DD-MM-YYYY format");
        exit();
    }
} else if (options.date && !options.token) {
    if (moment(options.date, "DD-MM-YYYY").isValid()) {
        console.log(`Reading the csv file to get balance for all tokens on ${options.date}...`);
        flag = "date";
    } else {
        console.log("Please provide a valid date in DD-MM-YYYY format");
        exit();
    }
} else if (options.token && !options.date) {
    console.log(`Reading the csv file to get token balance for ${options.token}...`);
    tokenCountList[options.token] = 0;
    flag = "one";
} else if (!options.date && !options.token && options.date != "" && options.token != "") {
    console.log("Reading the csv file to get balance for all tokens");
    tokenCountList = {};
    flag = "all";
} else exit();

let found = false;
let count = 0;
csvParser.parse(fs.createReadStream(path.join(__dirname, "../transactions.csv")), { // add path logic here
    header: true,
    worker: false,
    fastMode: true,
    dynamicTyping: true,
    chunk: (results, parser) => {
        switch (flag) {
            case "one": {
                for (let i = 0; i < results.data.length; i++) { calculateBalance(results.data[i]); }
                break;
            }
            case "all": {
                for (let i = 0; i < results.data.length; i++) {
                    if (!tokenCountList[results.data[i].token]) tokenCountList[results.data[i].token] = 0;
                    calculateBalance(results.data[i]);
                }
                break;
            }
            case "date": {
                let epochTimeMin = moment.utc(options.date, "DD-MM-YYYY").unix();
                let epochTimeMax = epochTimeMin + 86399;
                if (
                    (results.data[0].timestamp >= epochTimeMax && results.data[results.data.length - 1].timestamp <= epochTimeMin) || //if date falls inside a chunk
                    (results.data[0].timestamp >= epochTimeMax && (results.data[results.data.length - 1].timestamp >= epochTimeMin && results.data[results.data.length - 1].timestamp <= epochTimeMax)) || //if date is divided into chunks
                    ((results.data[0].timestamp <= epochTimeMax && results.data[0].timestamp >= epochTimeMin) && results.data[results.data.length - 1].timestamp <= epochTimeMin) || //if date is divided into chunks
                    ((results.data[0].timestamp <= epochTimeMax && results.data[0].timestamp >= epochTimeMin) && (results.data[results.data.length - 1].timestamp >= epochTimeMin && results.data[results.data.length - 1].timestamp <= epochTimeMax)) //if date is divided into chunks
                ) {
                    found = true;
                    count++;
                    for (let i = 0; i < results.data.length; i++) {
                        if (results.data[i].timestamp <= epochTimeMax && results.data[i].timestamp >= epochTimeMin) {
                            if (!tokenCountList[results.data[i].token]) tokenCountList[results.data[i].token] = 0;
                            calculateBalance(results.data[i]);
                        }
                    }
                } else found = false;
                if (!found && count > 0) {
                    parser.abort();
                }
                break;
            }
            case "both": {
                let epochTimeMin = moment.utc(options.date, "DD-MM-YYYY").unix();
                let epochTimeMax = epochTimeMin + 86399;
                if (
                    (results.data[0].timestamp >= epochTimeMax && results.data[results.data.length - 1].timestamp <= epochTimeMin) || //if date falls inside a chunk
                    (results.data[0].timestamp >= epochTimeMax && (results.data[results.data.length - 1].timestamp >= epochTimeMin && results.data[results.data.length - 1].timestamp <= epochTimeMax)) || //if date is divided into chunks
                    ((results.data[0].timestamp <= epochTimeMax && results.data[0].timestamp >= epochTimeMin) && results.data[results.data.length - 1].timestamp <= epochTimeMin) || //if date is divided into chunks
                    ((results.data[0].timestamp <= epochTimeMax && results.data[0].timestamp >= epochTimeMin) && (results.data[results.data.length - 1].timestamp >= epochTimeMin && results.data[results.data.length - 1].timestamp <= epochTimeMax)) //if date is divided into chunks
                ) {
                    found = true;
                    count++;
                    for (let i = 0; i < results.data.length; i++)
                        if (results.data[i].timestamp <= epochTimeMax && results.data[i].timestamp >= epochTimeMin) calculateBalance(results.data[i]);
                } else found = false;
                if (!found && count > 0) {
                    parser.abort();
                }
                break;
            }
        }
    },
    complete: () => {
        switch (flag) {
            case "one": {
                console.log("Token balance =", tokenCountList[options.token]);
                getTokenValue(options.token, tokenCountList[options.token]);
                break;
            }
            case "all": {
                console.log("Token balance =", tokenCountList);
                getAllTokenValue(tokenCountList);
                break;
            }
            case "date": {
                console.log("Token balance =", tokenCountList);
                getAllTokenHistoricalValue(tokenCountList);
                break;
            }
            case "both": {
                console.log("Token balance =", tokenCountList[options.token]);
                getTokenHistoricalValue(options.token, tokenCountList[options.token]);
                break;
            }
        }
    }
})

function calculateBalance(tokenEntry) {
    if (tokenEntry.transaction_type == "DEPOSIT") tokenCountList[tokenEntry.token] = tokenCountList[tokenEntry.token] + tokenEntry.amount;
    else if (tokenEntry.transaction_type == "WITHDRAWAL") tokenCountList[tokenEntry.token] = tokenCountList[tokenEntry.token] - tokenEntry.amount;
}

function getTokenValue(token, balance) {
    axios.get(`https://min-api.cryptocompare.com/data/price?fsym=${token}&tsyms=USD&api_key=${apikey}`, { headers: { Accept: "application/json" } })
        .then(res => {
            console.log(`Current market value for ${token} = USD`, res.data.USD);
            console.log(`Calculating your portfolio value...`);
            console.log(`Portfolio value = USD`, res.data.USD * balance);
        });
};

function getAllTokenValue(tokenCountList) {
    tokens = Object.keys(tokenCountList);
    axios.get(`https://min-api.cryptocompare.com/data/pricemulti?fsyms=${tokens}&tsyms=USD&api_key=${apikey}`, { headers: { Accept: "application/json" } })
        .then(res => {
            console.log(`Current market value for your tokens in USD =`, res.data);
            console.log(`Calculating your portfolio value per token...`);
            for (let i = 0; i < tokens.length; i++)
                console.log(`Portfolio value for ${tokens[i]} = USD`, res.data[tokens[i]].USD * tokenCountList[tokens[i]]);
        });
};

function getAllTokenHistoricalValue(tokenCountList) {
    tokens = Object.keys(tokenCountList);
    let epochTime = moment.utc(options.date, "DD-MM-YYYY").unix();
    console.log(`Calculating your portfolio value per token...`);
    for (let i = 0; i < tokens.length; i++) {
        axios.get(`https://min-api.cryptocompare.com/data/pricehistorical?fsym=${tokens[i]}&tsyms=USD&ts=${epochTime}`, { headers: { Accept: "application/json" } })
            .then(res => {
                console.log(`Current market value for ${tokens[i]} in USD on ${options.date} = USD`, res.data[tokens[i]].USD);
                console.log(`Portfolio value for ${tokens[i]} on ${options.date} = USD`, res.data[tokens[i]].USD * tokenCountList[tokens[i]]);
            });
    }
};

function getTokenHistoricalValue(token, balance) {
    let epochTime = moment.utc(options.date, "DD-MM-YYYY").unix();
    console.log(`Calculating your portfolio value per token...`);
    axios.get(`https://min-api.cryptocompare.com/data/pricehistorical?fsym=${token}&tsyms=USD&ts=${epochTime}`, { headers: { Accept: "application/json" } })
        .then(res => {
            console.log(`Current market value for ${token} in USD on ${options.date} = USD`, res.data[token].USD);
            console.log(`Portfolio value for ${token} on ${options.date} = USD`, res.data[token].USD * balance);
        });
};