import { Application, RouteHandler } from '../src/index';

const app = new Application();

const homeHandler: RouteHandler = (req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Welcome to the home page!');
};

const userHandler: RouteHandler = (req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ id: 1, name: 'John Doe' }));
};

app.get('/', homeHandler);
app.get('/user', userHandler);

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
