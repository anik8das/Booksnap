const { writeFile } = require('fs');
const { argv } = require('yargs');

// read environment variables from .env file
require('dotenv').config();

const targetPaths = [
  './src/environments/environment.ts',
  './src/environments/environment.development.ts',
];

// we have access to our environment variables
// in the process.env object thanks to dotenv
const environmentFileContent = `
export const environment = {
    firebase: {
      projectId: "${process.env['projectId']}",
      appId: "${process.env['appId']}",
      storageBucket: "${process.env['storageBucket']}",
      apiKey: "${process.env['apiKey']}",
      authDomain: "${process.env['authDomain']}",
      messagingSenderId: "${process.env['messagingSenderId']}",
      measurementId: "${process.env['measurementId']}",
    },
  };  
`;

// write the content to the respective file
targetPaths.forEach((targetPath) => {
  writeFile(targetPath, environmentFileContent, function (err: any) {
    if (err) {
      console.log(err);
    }
    console.log(`Wrote variables to ${targetPath}`);
  });
});
