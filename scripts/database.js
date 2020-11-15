const database = require('../database');

const action = process.argv[2];
switch (action) {
  case 'sync':
    for (const key in database) {
      const model = database[key];
      model.sync();
    }
    break;
  case 'drop':
    for (const key in database) {
      const model = database[key];
      model.drop();
    }
    break;
}
