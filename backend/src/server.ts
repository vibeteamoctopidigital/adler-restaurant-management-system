import { startServer } from "./app";

import { connectToDatabase, prisma } from "./config/db";


(async () => {
 
  await connectToDatabase();

  await startServer();

    
})();
