from django.db import models
from django.conf import settings
import requests


class WordPressAccount(models.Model):
    """Stores credentials and base prompt for a WordPress site."""
    name = models.CharField(max_length=100)
    url = models.URLField()
    username = models.CharField(max_length=100)
    password = models.CharField(max_length=100)
    base_prompt = models.TextField()

    def __str__(self) -> str:
        return self.name


class ScheduledPost(models.Model):
    """Represents a scheduled topic that should be posted via n8n."""
    account = models.ForeignKey(WordPressAccount, on_delete=models.CASCADE)
    topic = models.CharField(max_length=200)
    scheduled_at = models.DateTimeField()

    def __str__(self) -> str:
        return f"{self.topic} @ {self.scheduled_at}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        webhook = getattr(settings, "N8N_WEBHOOK_URL", "")
        if webhook:
            payload = {
                "account": {
                    "url": self.account.url,
                    "username": self.account.username,
                    "password": self.account.password,
                    "base_prompt": self.account.base_prompt,
                },
                "topic": self.topic,
                "scheduled_at": self.scheduled_at.isoformat(),
            }
            try:
                requests.post(webhook, json=payload, timeout=5)
            except requests.RequestException:
                # Swallow network errors so admin can still save record
                pass
