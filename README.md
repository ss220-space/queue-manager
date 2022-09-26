# SS220 Queue Engine

4-piece system that allows to enqueue and limit players on all of our game servers uninvasive way:
- Iptables Daemon
- Game Lobby Server
- Queue Backend
- Queue Frontend

### Iptables Daemon
Built with Rust and use iptables wrapper. It connects to queue backend via websockets;

### Game Lobby Server
Only contains browser to authenticate players and open frontend;

### Queue Backend
Built with Nest.JS. Technologies used:
- Prisma ORM
- Webhook server
- Redis as temporary DB for queue and servers stats
- JWT for auth
- EventEmitter for internal events
- SSE for pushing stats
- RxJS for observables,

### Queue Frontend
Built with Next.JS.
