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

![image](https://user-images.githubusercontent.com/8555356/194173725-4caa53f7-992d-4506-86e0-208225bb453d.png)


![image](https://user-images.githubusercontent.com/8555356/194173637-f781b14e-bc5c-4c15-b141-75884bbe7b79.png)

