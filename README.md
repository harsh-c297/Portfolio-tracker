# Portfolio tracker

This script reads the CSV file and returns the portfolio values for your cryptocurrencies.

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


