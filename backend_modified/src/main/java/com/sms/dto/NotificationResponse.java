package com.sms.dto;

import java.util.Map;

public class NotificationResponse {

    private String title;
    private String message;
    private String type;
    private String link;
    private Map<String, Object> meta;
    private String emailSubject;
    private String emailBody;

    public NotificationResponse() {}

    public NotificationResponse(String title, String message, String link, String type, Map<String, Object> meta,
                                String emailSubject, String emailBody) {
        this.title = title;
        this.message = message;
        this.type = type;
        this.link = link;
        this.meta = meta;
        this.emailSubject = emailSubject;
        this.emailBody = emailBody;
    }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getLink() { return link; }
    public void setLink(String link) { this.link = link; }

    public Map<String, Object> getMeta() { return meta; }
    public void setMeta(Map<String, Object> meta) { this.meta = meta; }

    public String getEmailSubject() { return emailSubject; }
    public void setEmailSubject(String emailSubject) { this.emailSubject = emailSubject; }

    public String getEmailBody() { return emailBody; }
    public void setEmailBody(String emailBody) { this.emailBody = emailBody; }
}
