const fs = require('fs');

// https://stackoverflow.com/questions/12409299/how-to-get-current-formatted-date-dd-mm-yyyy-in-javascript-and-append-it-to-an-i
function getDate() {
  const now = new Date();
  let dd = now.getDate();
  let mm = now.getMonth() + 1; //January is 0!
  const yyyy = now.getFullYear();

  if (dd < 10) {
    dd = '0' + dd;
  }
  if (mm < 10) {
    mm = '0' + mm;
  }
  return yyyy + '-' + mm + '-' + dd;
}

function log(request) {
  const body = [];
  request.on('data', (chunk) => {
    body.push(chunk);
  }).on('end', () => {
    const string = Buffer.concat(body).toString();
    const object = JSON.parse(string);
    // if (object.environment === 'DEV') {
    //   return;
    // }
    let line = `${object.stream}: `;
    if (Array.isArray(object.message)) {
      line = object.message.reduce(
        (accumulator, currentValue) => accumulator + currentValue + '\r\n'  // eslint-disable-line prefer-template
        , line);
    } else {
      line += object.message + '\r\n'; // eslint-disable-line prefer-template
    }
    let filename = getDate() + '_';
    switch (object.stream.toLowerCase()) {
      case 'quote':
        filename += 'Quotes';
        break;
      case 'instrument':
        filename += 'Instruments';
        break;
      default:
        filename += 'Orders';
    }
    fs.writeFile(`c:/temp/QuickOrder/${filename}.log`, line, { flag: 'a' },
      (err) => {
        if (err) throw err;
        // console.log('The file has been saved!');
      });
  });
}

module.exports = log;
