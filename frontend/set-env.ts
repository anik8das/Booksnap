import { writeFile } from 'fs';
// Configure Angular `environment.ts` file path
const targetPath = './src/environments/environment.ts';
// Load node modules
const colors = require('colors');
require('dotenv').load();
// `environment.ts` file structure
const envConfigFile = `export const environment = {
    projectId: '${process.env['projectId']}',
    appId: '${process.env['appId']}',
    storageBucket: '${process.env['storageBucket']}',
    apiKey: '${process.env['apiKey']}',
    authDomain: '${process.env['authDomain']}',
    messagingSenderId: '${process.env['messagingSenderId']}',
    measurementId: '${process.env['measurementId']}',
};
`;
console.log(
  colors.magenta(
    'The file `environment.ts` will be written with the following content: \n'
  )
);
console.log(colors.grey(envConfigFile));
writeFile(targetPath, envConfigFile, function (err) {
  if (err) {
    throw console.error(err);
  } else {
    console.log(
      colors.magenta(
        `Angular environment.ts file generated correctly at ${targetPath} \n`
      )
    );
  }
});
