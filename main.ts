import createApp from './core';
const options = { hostname: "localhost", port: 3000 };

const app = createApp();

app.use((request, next) => {
  console.log(`from middleware: ${request.url}`)
  next();
});
app.get("/", (res) => {
  res.respond({body: "Home Page!"})
});
app.get("/deno", (res) => {
  res.respond({body: "Deno Page!"})
});

console.log(`Running on: ${options.hostname}:${options.port}`);

app.listen(options)
