import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NewMessageDto } from './dto/new-message.dto';
import { MessagesWsService } from './messages-ws.service';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from 'src/auth/interfaces';

@WebSocketGateway({ cors: true })
export class MessagesWsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  //Este es un decorador de nest el cual contiene la informacion de todos los clientes, en otras palabras es como una instancia administradora que lo contiene todo. Lo usamos por ejemplo para emitir mensajes a todos los clientes, sin tener que especificar el client.id.
  @WebSocketServer() wss: Server;

  constructor(
    private readonly messagesWsService: MessagesWsService,
    private readonly jwtService: JwtService,
  ) {}

  //Este metodo se crea cuando hacemos la implementacion en la clase
  async handleConnection(client: Socket, ...args: any[]) {
    let payload: JwtPayload;
    const token = client.handshake.headers.authentication as string;

    try {
      payload = this.jwtService.verify(token);
      await this.messagesWsService.registerClient(client, payload.id);
    } catch (error) {
      //Este es un metodo que me permite desconectar la instancia de un cliente, en este caso lo usamos para desconectar un cliente cuyo token no supera la verficacion.
      client.disconnect();
      return;
    }

    // console.log('Client connected', client.id);

    //Emitimos a todos los clientes
    this.wss.emit('clients-updated', this.messagesWsService.getClientsOnline());
  }

  //Este metodo se crea cuando hacemos la implementacion en la clase
  handleDisconnect(client: Socket) {
    // console.log('Client disconnected', client.id);
    this.messagesWsService.removeClient(client.id);
    this.wss.emit('clients-updated', this.messagesWsService.getClientsOnline());
  }

  // Por medio de este decorador escuchamos los eventos que emiten los clientes, sería como el metodo .on en el cliente con el cual escuchamos el servidor.
  //Este decorador nos da acceso al cliente y al payload que emite.
  @SubscribeMessage('message-sent-client')
  //Para este caso creamos un dto para definir el payload, pero este dto solo es visual, ya que no sabemos como hacer para "forzar" que el payload tenga la estructura que estamos definiendo.
  handleMessageFromClient(client: Socket, payload: NewMessageDto) {
    // console.log(client.id, payload);
    //Emite unicamente al cliente.
    // client.emit('messages-from-server', {
    //   fullName: 'Soy yo',
    //   message: payload.message || 'no-message!!',
    // });

    //Emitir a todos, menos al cliente inicial
    // client.broadcast.emit('messages-from-server', {
    //   fullName: 'soy yo',
    //   message: payload.message || 'no-message',
    // });

    //Emitir a todos sin excepcion
    this.wss.emit('messages-from-server', {
      fullName: this.messagesWsService.getUserFullName(client.id),
      message: payload.message || 'no-message',
    });
  }
}
