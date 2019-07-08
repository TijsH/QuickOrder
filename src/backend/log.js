const fs = require('fs');
const { DateTime } = require('luxon');

function log(request) {
  const body = [];
  request.on('data', (chunk) => {
    body.push(chunk);
  }).on('end', () => {
    const string = Buffer.concat(body).toString();
    const object = JSON.parse(string);
    const now =DateTime.local(undefined);
    const date = now.toFormat('yyyy-MM-dd');
    const dateTime = now.toFormat('yyyy-MM-dd HH:mm:ss.SSS');
    // if (object.environment === 'DEV') {
    //   return;
    // }
    let line = `${dateTime}: ${object.action}: `;
    if (Array.isArray(object.message)) {
      line = object.message.reduce(
        (accumulator, currentValue) => accumulator + currentValue + '\r\n'  // eslint-disable-line prefer-template
        , line);
    } else {
      line += object.message + '\r\n'; // eslint-disable-line prefer-template
    }

    const filename = `${date}_${object.logFile}`;
    fs.writeFile(`C:/work/projects/Zartras/QuickOrderLogs/${filename}.log`, line, { flag: 'a' },
      (err) => {
        if (err) throw err;
        // console.log('The file has been saved!');
      });
  });
}

module.exports = log;
