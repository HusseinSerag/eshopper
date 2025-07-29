import { DatabaseProvider } from './index';

if (!process.env.DATABASE_URL) {
  throw Error('Please set the database URL');
}
const database = new DatabaseProvider(process.env.DATABASE_URL);
database
  .connect()
  .then(() => {
    console.log('Connected to DB');
    return database.getPrisma().$runCommandRaw({
      listCollections: 1,
    });
  })
  .then((result: any) => {
    const collectionNames = result.cursor.firstBatch.map(
      (collection: any) => collection.name
    );

    // Drop each collection

    return Promise.all(
      collectionNames.map((name: any) =>
        database.getPrisma().$runCommandRaw({
          drop: name,
        })
      )
    );
  })
  .then(() => {
    console.log('Successfully dropped collections');
    return database.disconnect();
  })
  .then(() => {
    console.log('Successfully disconnected from DB');
  })
  .catch(console.error);
