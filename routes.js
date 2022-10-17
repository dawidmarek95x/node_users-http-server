const fs = require("fs").promises;

const requestHandler = async (req, res) => {
  const url = req.url;
  const method = req.method;

  if (url === "/") {
    res.setHeader('Content-Type', 'text/html');
    res.write(`
      <html>
        <head>
          <title>Users Server</title>
        </head>
        <body>
          <main>
            <section>
              <p>
                Welcome to the Node.js server!
              </p>
              <form action="/create-user" method="post">
                <input type="text" name="username" />
                <button type="submit">Send</button>
              </form>
            </section>
          </main>
        </body>
      </html>
    `);
    return res.end();
  }

  if (url === "/users") {
    let users;

    try {
      const store = await fs.readFile("store.json");
      const parsedStore = JSON.parse(store);
      users = parsedStore.users;
    } catch (error) {
      users = [];
    }

    const usersToAdd = users
      .map((user) => `<li>${user}</li>`)
      .sort((a,b) => a.localeCompare(b))
      .join('');
    res.setHeader('Content-Type', 'text/html');
    res.write(`
      <html>
        <head>
          <title>Users Server</title>
        </head>
        <body>
          <main>
            <section>
              <h2>Users</h2>
              <ul>
                ${usersToAdd}
              </ul>
            </section>
          </main>
        </body>
      </html>
    `);
    return res.end();
  }

  if (url === "/create-user" && method === "POST") {
    const body = [];

    req.on("data", (chunk) => {
      body.unshift(chunk);
    });

    return req.on("end", async () => {
      const parsedBody = Buffer.concat(body).toString();
      const message = parsedBody.split("=")[1];

      let newStore;

      try {
        await fs.readFile("store.json");
        const store = await fs.readFile("store.json");
        const parsedStore = JSON.parse(store);
        newStore = JSON.stringify({
          ...parsedStore,
          users: [message, ...parsedStore.users],
        });
        await fs.writeFile("store.json", newStore);
      } catch (error) {
        try {
          newStore = JSON.stringify({users: [message]});
          await fs.writeFile("store.json", newStore);
        } catch (error) {
          return console.log(`The user ${message} has not been added.`);
        }
      }

      console.log(`The user ${message} has been added.`);
      res.statusCode = 302;
      res.setHeader("Location", "/");
      return res.end();
    });
  }
};

module.exports = requestHandler;
