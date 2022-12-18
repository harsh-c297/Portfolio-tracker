# Portfolio tracker

This script reads the CSV file and returns the portfolio values for your cryptocurrencies.
The CSV file has the following columns

- timestamp: Integer number of seconds since the Epoch
- transaction_type: Either a DEPOSIT or a WITHDRAWAL
- token: The token symbol
- amount: The amount transacted

## Installation

Open a command terminal and use the following command to install the script

```bash
npm install -g .
```

## Usage

You can query your portfolio value as:
- Given no parameters, return the latest portfolio value per token in USD
```bash
portfolio
```
- Given a token, return the latest portfolio value for that token in USD
```bash
portfolio -t <token_name>
```
- Given a date, return the portfolio value per token in USD on that date
```bash
portfolio -d <date>
```
- Given a date and a token, return the portfolio value of that token in USD on that date
```bash
portfolio -t <token_name> -d <date>
```
- For help
```bash
portfolio --help
```

## Uninstallation

Open a command terminal and use the following command to uninstall the script

```bash
npm uninstall -g portfolio-tracker
```

## Notes

This script uses following libraries:
- yargs - to parse command line arguments
- axios - to make http calls
- papaparse - to parse csv file
- moment - to convert dates into unix timestamps

Exchange rates for tokens are fetched from **cryptocompare**.

This script takes user inputs as command line arguments and based on those arguments returns the portfolio value. 
Papaparse parses the CSV file in chunks which is faster than reading the file line by line. While parsing, based on passed arguments, token balance is calculated. After parsing token values are fetched from **cryptocompare** and portfolio value is calculated.