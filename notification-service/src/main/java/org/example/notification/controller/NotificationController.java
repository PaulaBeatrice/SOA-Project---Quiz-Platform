package org.example.notification.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class NotificationController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @PostMapping("/notifications/send")
    public void sendNotification(@RequestBody Map<String, Object> notification) {
        String topic = (String) notification.getOrDefault("topic", "/topic/notifications");
        messagingTemplate.convertAndSend(topic, notification);
    }
}

