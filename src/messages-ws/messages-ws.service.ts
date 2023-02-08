import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Socket } from 'socket.io';
import { Repository } from 'typeorm';
import { User } from '../auth/entities/user.entity';

interface ConnectedClients {
  [id: string]: {
    socket: Socket;
    user: User;
  };
}

@Injectable()
export class MessagesWsService {
  //Podriamos almacenar los id de los clientes en una DB, pero al ser tan volatil, lo vamos a mantener en memoria
  private connectedClients: ConnectedClients = {};

  /**
   *
   */
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async registerClient(client: Socket, userId: string) {
    const user = await this.userRepository.findOneBy({ id: userId });

    if (!user) throw new Error('User not found');
    if (!user.isActive) throw new Error('User not active');

    this.removeClientsDuplicated(user);

    this.connectedClients[client.id] = {
      socket: client,
      user,
    };
  }

  removeClient(clientId: string) {
    delete this.connectedClients[clientId];
  }

  getClientsOnline(): string[] {
    return Object.keys(this.connectedClients);
  }

  getUserFullName(socketId: string) {
    return this.connectedClients[socketId].user.fullName;
  }

  private removeClientsDuplicated(user: User) {
    console.log(this.connectedClients);

    for (const client of Object.keys(this.connectedClients)) {
      console.log(this.connectedClients[client].user.id);
      console.log(user.id);

      if (this.connectedClients[client].user.id === user.id) {
        //Esta fue mi solucion en un ppio pero esta mal, ya que pense en el arrray como un array, no como un array de conexiones. Por lo que esta mal
        // delete this.connectedClients[client];

        this.connectedClients[client].socket.disconnect();
        break;
      }
    }
  }
}
