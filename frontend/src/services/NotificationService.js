import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

class NotificationService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.connecting = false;  // Track connection in progress
    this.messageCallbacks = [];
    this.subscriptions = [];
    this.connectionPromise = null;  // Track pending connection
  }

  connect(username, onMessageReceived) {
    // Add callback to the list
    if (onMessageReceived && !this.messageCallbacks.includes(onMessageReceived)) {
      this.messageCallbacks.push(onMessageReceived);
      console.log(' Callback registered, total callbacks:', this.messageCallbacks.length);
    }

    // If already connected, just return immediately
    if (this.connected && this.client) {
      console.log('Already connected to WebSocket');
      return Promise.resolve();
    }

    // If connection is already in progress, return existing promise
    if (this.connecting && this.connectionPromise) {
      console.log('Connection already in progress, waiting...');
      return this.connectionPromise;
    }

    // Mark as connecting
    this.connecting = true;

    // Create a promise for this connection attempt
    this.connectionPromise = new Promise((resolve) => {
      try {
        // Create new client
        const WS_URL = process.env.REACT_APP_WS_URL || 'http://localhost/ws';
        const socket = new SockJS(WS_URL);

        this.client = new Client({
          webSocketFactory: () => socket,
          reconnectDelay: 5000,
          heartbeatIncoming: 4000,
          heartbeatOutgoing: 4000,
          onConnect: () => {
            console.log(' Connected to WebSocket');
            this.connected = true;
            this.connecting = false;
            this._subscribeToTopics(username);
            resolve();
          },
          onStompError: (frame) => {
            console.error(' STOMP error:', frame);
            this.connected = false;
            this.connecting = false;
            resolve();  // Resolve even on error to unblock UI
          },
        });

        // Activate connection asynchronously
        setTimeout(() => {
          try {
            if (this.client) {
              this.client.activate();
            }
          } catch (err) {
            console.error('Error activating WebSocket:', err);
            this.connected = false;
            this.connecting = false;
            resolve();
          }
        }, 0);

        // Timeout after 10 seconds to prevent indefinite blocking
        setTimeout(() => {
          if (this.connecting) {
            console.warn('WebSocket connection timeout - continuing without notifications');
            this.connecting = false;
            resolve();
          }
        }, 10000);
      } catch (error) {
        console.warn('Failed to initialize WebSocket:', error);
        this.connected = false;
        this.connecting = false;
        resolve();
      }
    });

    return this.connectionPromise;
  }

  _subscribeToTopics(username) {
    if (!this.client) return;

    // Subscribe to user-specific notifications (student submissions)
    const userSub = this.client.subscribe(`/queue/user-${username}`, (message) => {
      const notification = JSON.parse(message.body);
      console.log(' Received user-specific notification:', notification);
      // Call ALL registered callbacks
      this.messageCallbacks.forEach(cb => {
        try {
          cb(notification);
        } catch (e) {
          console.error('Error in notification callback:', e);
        }
      });
    });
    this.subscriptions.push(userSub);

    // Subscribe to general notifications
    const generalSub = this.client.subscribe('/topic/notifications', (message) => {
      const notification = JSON.parse(message.body);
      console.log(' Received general notification:', notification);
      // Call ALL registered callbacks
      this.messageCallbacks.forEach(cb => {
        try {
          cb(notification);
        } catch (e) {
          console.error('Error in notification callback:', e);
        }
      });
    });
    this.subscriptions.push(generalSub);

    // Subscribe to quiz updates (all users)
    const quizSub = this.client.subscribe('/topic/quizzes', (message) => {
      const notification = JSON.parse(message.body);
      console.log(' Received quiz notification:', notification);
      // Call ALL registered callbacks
      this.messageCallbacks.forEach(cb => {
        try {
          cb(notification);
        } catch (e) {
          console.error('Error in notification callback:', e);
        }
      });
    });
    this.subscriptions.push(quizSub);

    // Subscribe to admin notifications (grading updates for admins/teachers)
    const adminSub = this.client.subscribe('/topic/admin-notifications', (message) => {
      const notification = JSON.parse(message.body);
      console.log(' Received admin notification:', notification);
      // Call ALL registered callbacks
      this.messageCallbacks.forEach(cb => {
        try {
          cb(notification);
        } catch (e) {
          console.error('Error in notification callback:', e);
        }
      });
    });
    this.subscriptions.push(adminSub);

    console.log('All subscriptions active for user: ' + username);
  }

  disconnect() {
    console.log('Disconnecting WebSocket...');
    this.connecting = false;
    this.connected = false;
    
    // Unsubscribe from all topics
    this.subscriptions.forEach(sub => {
      try {
        sub.unsubscribe();
      } catch (e) {
        console.error('Error unsubscribing:', e);
      }
    });
    this.subscriptions = [];
    
    // Clear callbacks for clean slate
    this.messageCallbacks = [];
    
    // Deactivate client
    if (this.client) {
      try {
        this.client.deactivate();
      } catch (e) {
        console.error('Error deactivating client:', e);
      }
      this.client = null;
    }
    
    this.connectionPromise = null;
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

