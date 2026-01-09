package org.example.notification.listener;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class NotificationListener {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @RabbitListener(queues = "notifications")
    public void handleNotification(byte[] message) {
        try {
            String messageStr = new String(message, "UTF-8");
            Map<String, Object> notification = objectMapper.readValue(messageStr, Map.class);

            String type = (String) notification.get("type");
            System.out.println(" Received notification: " + type + " - " + notification);

            if (type == null) {
                type = "DEFAULT";
            }

            switch (type) {
                case "QUIZ_CREATED":
                    System.out.println(" Broadcasting QUIZ_CREATED to /topic/quizzes");
                    messagingTemplate.convertAndSend("/topic/quizzes", notification);
                    break;
                case "QUIZ_UPDATED":
                    System.out.println(" Broadcasting QUIZ_UPDATED to /topic/quizzes");
                    messagingTemplate.convertAndSend("/topic/quizzes", notification);
                    break;
                case "QUIZ_DELETED":
                    System.out.println(" Broadcasting QUIZ_DELETED to /topic/quizzes");
                    messagingTemplate.convertAndSend("/topic/quizzes", notification);
                    break;
                case "SUBMISSION_GRADED":
                    // Send to student
                    if (notification.containsKey("userId")) {
                        Long userId = ((Number) notification.get("userId")).longValue();
                        System.out.println("Sending SUBMISSION_GRADED to /queue/user-" + userId);
                        messagingTemplate.convertAndSend("/queue/user-" + userId, notification);
                    }
                    System.out.println("Broadcasting SUBMISSION_GRADED to /topic/admin-notifications");
                    messagingTemplate.convertAndSend("/topic/admin-notifications", notification);
                    break;
                default:
                    System.out.println("Broadcasting to /topic/notifications");
                    messagingTemplate.convertAndSend("/topic/notifications", notification);
            }
        } catch (Exception e) {
            System.err.println("Error processing notification: " + e.getMessage());
            e.printStackTrace();
        }
    }
}

