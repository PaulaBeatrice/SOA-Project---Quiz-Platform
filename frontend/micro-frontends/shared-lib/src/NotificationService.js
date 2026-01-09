import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

class NotificationService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.messageCallbacks = [];
    this.subscriptions = [];
  }

  connect(username, onMessageReceived) {
    try {
      if (onMessageReceived && !this.messageCallbacks.includes(onMessageReceived)) {
        this.messageCallbacks.push(onMessageReceived);
        console.log('✓ Callback registered, total callbacks:', this.messageCallbacks.length);
      }

      if (this.client && this.connected) {
        console.log('Already connected to WebSocket');
        return;
      }

      if (this.client && !this.connected) {
        console.log('Client exists but not connected, reactivating...');
        this.client.activate();
        return;
      }

      const socket = new SockJS('http://localhost:8084/ws');

      this.client = new Client({
        webSocketFactory: () => socket,
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
      });

      this.client.onConnect = () => {
        console.log(' Connected to WebSocket');
        this.connected = true;
        this._subscribeToTopics(username);
      };

      this.client.onStompError = (frame) => {
        console.error(' STOMP error:', frame);
        this.connected = false;
      };

      this.client.activate();
    } catch (error) {
      console.warn('Failed to connect to notification service:', error);
      this.connected = false;
    }
  }

  _subscribeToTopics(username) {
    if (!this.client) return;

    const userSub = this.client.subscribe(`/queue/user-${username}`, (message) => {
      const notification = JSON.parse(message.body);
      this.messageCallbacks.forEach(cb => {
        try {
          cb(notification);
        } catch (e) {
          console.error('Error in notification callback:', e);
        }
      });
    });
    this.subscriptions.push(userSub);

    const generalSub = this.client.subscribe('/topic/notifications', (message) => {
      const notification = JSON.parse(message.body);
      this.messageCallbacks.forEach(cb => {
        try {
          cb(notification);
        } catch (e) {
          console.error('Error in notification callback:', e);
        }
      });
    });
    this.subscriptions.push(generalSub);

    const quizSub = this.client.subscribe('/topic/quizzes', (message) => {
      const notification = JSON.parse(message.body);
      this.messageCallbacks.forEach(cb => {
        try {
          cb(notification);
        } catch (e) {
          console.error('Error in notification callback:', e);
        }
      });
    });
    this.subscriptions.push(quizSub);

    console.log(' All subscriptions active for user: ' + username);
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.connected = false;
    }
  }

  sendMessage(destination, message) {
    if (this.client && this.connected) {
      this.client.publish({
        destination,
        body: JSON.stringify(message),
      });
    }
  }
}

export default new NotificationService();
