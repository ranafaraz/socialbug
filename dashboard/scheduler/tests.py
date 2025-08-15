from django.test import TestCase, override_settings
from django.utils import timezone
from unittest.mock import patch

from .models import WordPressAccount, ScheduledPost


class SchedulerTests(TestCase):
    def test_account_str(self):
        account = WordPressAccount.objects.create(
            name="blog",
            url="https://example.com",
            username="user",
            password="pass",
            base_prompt="Write about",
        )
        self.assertEqual(str(account), "blog")

    @override_settings(N8N_WEBHOOK_URL="http://example.com/webhook")
    @patch("scheduler.models.requests.post")
    def test_scheduled_post_triggers_webhook(self, mock_post):
        account = WordPressAccount.objects.create(
            name="blog",
            url="https://example.com",
            username="user",
            password="pass",
            base_prompt="Write about",
        )
        ScheduledPost.objects.create(
            account=account,
            topic="AI",
            scheduled_at=timezone.now(),
        )
        mock_post.assert_called_once()
        args, kwargs = mock_post.call_args
        self.assertEqual(kwargs["json"]["topic"], "AI")
